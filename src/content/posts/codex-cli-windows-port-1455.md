---
title: "Codex CLI 在 Windows 上登不上 ChatGPT：1455 端口被保留了"
description: 10013 看起来像权限问题，其实是 Windows 把 1455 划给了 Hyper-V。一份可行的修法，附两条绕过路径。
pubDate: 2026-04-20
tags:
  - Codex CLI
  - Windows
  - ChatGPT
  - OAuth
  - 故障排查
---

用过 Codex CLI 的人大概都见过那个二选一：Sign in with ChatGPT 还是 Continue using API key。在 macOS 和 Linux 上基本一按就过；在 Windows 上偶尔会卡在 `os error 10013`。这个错看起来像权限问题——即便用管理员起 PowerShell 也一样——但实际上是 Windows 的网络栈把一段端口"划走了"。

## 先对一下症状

如果命中下面这几点，大概率是同一个问题：

- CLI 里选 ChatGPT 登录，浏览器弹一下回来就报：
  ```text
  An attempt was made to access a socket in a way forbidden
  by its access permissions (os error 10013)
  ```
- 在 PowerShell 里查一下：
  ```powershell
  netsh interface ipv4 show excludedportrange protocol=tcp
  ```
  返回里有一段类似 `1435–1534` 的区间——**1455 正好落在里面**。
- 即使以管理员身份运行 Codex，仍然报同一个错。

## 为什么会这样

Codex CLI 的 ChatGPT 登录走的是浏览器 OAuth。具体流程是：Codex 在本机起一个 HTTP 监听，地址写死在 `http://127.0.0.1:1455`，浏览器完成授权之后把 token 回调到这里。

问题出在 Windows 的**动态排除端口区间**（excluded port ranges）。Hyper-V、WSL2、部分 VPN 的 NAT 组件会向内核申请一段连续端口留给自己用；一旦 1455 被包在这段区间里，任何进程尝试 `bind()` 都会被拒——返回 `WSAEACCES`，在 Rust/Go 这边就是 `os error 10013`。

> 管理员权限救不了这个。保留区间是内核级的，不是权限控制。

而且——这是第一个坑——不能反手把 1455 自己加到排除范围去"占住"它。那样做的效果是永远不能 bind，机制正好是反过来的。

## 最省事的出路：跳过回调，直接用 API key

如果手头有 OpenAI API key，这个问题可以整个绕开。Codex CLI 支持显式指定认证方式：

```powershell
$Env:OPENAI_API_KEY = "sk-xxxxxxxx"
codex --config preferred_auth_method="apikey"
```

要持久化的话：

```powershell
setx OPENAI_API_KEY "sk-xxxxxxxx"
```

之后再起 Codex 就不会去碰 1455。这条路适合：只是想先跑起来、或者不打算走 ChatGPT 订阅额度的人。

## 如果非要走 ChatGPT 登录

### 路线 A：借一台机器登完，把 `auth.json` 拷过来

Codex 登录成功后把 token 放在：

```text
%USERPROFILE%\.codex\auth.json
```

在任何一台 `localhost:1455` 能正常绑定的机器上完成登录（同事的 Mac、家里的笔记本都行），把这个文件拷到有问题的机器同一路径下即可。这个办法不需要碰任何系统服务，代价只是多跑一台机器。

### 路线 B：临时放出 1455，登完再收回

不想折腾第二台机器，就只能临时让出端口区间。动态排除区间是几个 NAT / 虚拟化服务在跑起来时注册的；关掉它们，区间就被释放。

**这几条命令都要在管理员 PowerShell 里跑**，并且会**短暂影响 Docker / WSL2 / VPN 的网络**，确认好再动：

```powershell
net stop winnat
net stop hns
# 如果机器上有 Hyper-V VM，这一条会把它们一并停掉
net stop vmms
```

然后验证一下 1455 不再被保留：

```powershell
netsh interface ipv4 show excludedportrange protocol=tcp
```

`1435–1534` 这段（或类似包含 1455 的区间）消失或范围变了，就可以立刻回到 Codex 跑登录流程，走完浏览器回调。

登完再把服务起回来：

```powershell
net start hns
net start winnat
net start vmms
```

想先自测 1455 能不能绑住，可以单独跑一小段：

```powershell
$listener = [System.Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 1455)
$listener.Start(); "ok"; $listener.Stop()
```

打出 `ok` 就说明内核那一层放行了。

### 最后的核选项：先关 Hyper-V

上面两步都搞不定，可以在下次重启时临时关掉 Hyper-V：

```powershell
bcdedit /set hypervisorlaunchtype off   # 关闭 Hyper-V，需要重启
bcdedit /set hypervisorlaunchtype auto  # 恢复，同样需要重启
```

这个办法很重——Docker Desktop / WSL2 都会失效——但对于"登完一次就不再用"的场景足够了。token 拿到手之后再把 Hyper-V 起回来。

## 几个容易踩的坑

- **不要手动把 1455 加到排除范围。** 这个动作和直觉相反，加进去的效果是永远 bind 不上。
- **管理员权限不管用。** 排除区间在内核，权限无关。
- **杀毒 / 防火墙 / VPN 也可能挡本地 listener。** 如果释放完端口仍然 bind 不了，往这几个方向查。
- **动态区间会变。** 今天是 `1435–1534`，重装 Docker 或换 VPN 之后可能漂到别处；但只要 1455 在里面，结果都一样。

## 一条检查清单

登录走完之后，按顺序确认：

1. `netsh interface ipv4 show excludedportrange protocol=tcp` — 所有区间都不包含 1455。
2. 浏览器回调打到 `http://localhost:1455/...`，页面提示已返回 CLI。
3. `%USERPROFILE%\.codex\auth.json` 已生成。

三条都通过就稳了。一旦 token 存进 `auth.json`，之后再起 Codex 就不会再去碰那个端口——也就是说整个修复是"一次性"的，之后 Hyper-V / WSL2 随便开，都不影响。

---

_灵感来自 [Reddit 上的一篇排障帖](https://www.reddit.com/r/codex_tips/comments/1n0szue/fix_codex_cli_sign_in_with_chatgpt_fails_on/)，作者 u/Amazing_Somewhere690。_
