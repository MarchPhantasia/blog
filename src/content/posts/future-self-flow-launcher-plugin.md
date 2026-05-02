---
title: 给 Flow Launcher 写一个不靠通知的提醒
description: 不弹气泡，不响，只在你下次打开 launcher 那一刻浮现的延时提醒——记两个关键决定和几个工程坑。
pubDate: 2026-05-02
tags:
  - Flow Launcher
  - Python
  - 插件
  - 行为设计
  - TDD
draft: false
---

我对系统级通知早就没什么耐心了。要么在我专注时打断我，要么在我没看屏幕时滚走。对真正重要的提醒，我总希望能有一个「温和但不会错过」的中间态。

这次写的插件叫 Future Self，意思简单：在 Flow Launcher 里给未来的自己留一句话。它不弹气泡，不响，不进通知中心——只在你下次主动打开 launcher 那一刻，在结果区顶端浮现一行：

> ⏰ 来自 17 分钟前的你：记得交报告

打开 launcher 的瞬间，大脑刚刚切完任务、最清醒、对外界最敏感。那是植入提醒的黄金时机。

## Flow Launcher 插件的本质

Flow Launcher 的官方插件支持 C#/F#、Python、JavaScript/TypeScript。其中 Python 走的是 JSON-RPC：你的脚本被 launcher 启动一个子进程，launcher 把用户输入当 JSON 发到你的 stdin，你把结果列表当 JSON 写回 stdout。

最小的元数据写在 `plugin.json` 里：

```json
{
    "ID": "87a6c094-12e7-4ab1-901f-0281a6ab812e",
    "ActionKeyword": "*",
    "Name": "Future Self",
    "Language": "python",
    "ExecuteFileName": "main.py"
}
```

`ID` 是插件身份（写死，绝不要改），`ActionKeyword` 控制 launcher 什么时候调你——这一项是这次最关键的设计决策。

## 决定一：把 ActionKeyword 设为 `"*"`

通常你会写 `"ActionKeyword": "fs"`，意味着用户必须先输 `fs` 才会调你的 query。这样很安全，但有个根本问题：用户已经分心去输别的东西时，你根本看不到。

`"*"` 是一个特殊值，意为「任何输入都先经过我」。Flow Launcher 的官方文档不太强调这个开关，但它正是某些系统级插件（Everything、剪贴板）能「无前缀工作」的来源。

代价是性能（后面会讲），收益是产品逻辑闭环——任何对 launcher 的查询，都能在结果区插一条「你之前给自己留过这个」。

代码里我用一个软前缀做路由：

```python
def query(self, q):
    q = q.strip()
    if q == "" or q.lower().startswith("fs"):
        # 管理路径：fs done / fs list / fs +30m hello
        ...
    else:
        # 浮现路径：仅当存在到期 reminder 时插入一条
        due = self._store.due_reminders(now)
        if due:
            return render_due_only(due, now)
        return []
```

`fs` 不是 Flow Launcher 认识的关键字——它是我们代码自己识别的「虚拟前缀」。这样一个 plugin 同时承担两个角色：管理面板 + 全局浮现。

## 决定二：「来自 X 时间前的你」

这层是产品和工程一起用力的薄但关键的一层。技术上它就是 `timedelta → str` 的映射，工程上甚至不到 30 行代码。但是把「提醒」重塑为「过去自己写的一封信」，在心理上是另一种东西——你不会反感来自更早一点的自己的话，而你会反感系统通知。

```python
def format_delta(now, past):
    delta = now - past
    secs = int(delta.total_seconds())

    if secs < 60:
        return "刚刚的你"
    if secs < 3600:
        return f"{secs // 60} 分钟前的你"

    same_day = past.date() == now.date()
    if same_day:
        return f"{secs // 3600} 小时前的你"

    days_ago = (now.date() - past.date()).days
    if days_ago == 1:
        if past.hour >= 18:
            return "昨晚的你"
        # ...
```

故意没用 "X minutes ago" 这种工程师腔的英文，而是中文里「昨晚的你」「周二上午的你」「4 月 25 日的你」。这个判断稍微多了点 if-else，但每个分支都对应一种具体的人类时间感觉。

## 性能 — 全局插件每次按键都跑你的代码

把 ActionKeyword 设成 `"*"` 的代价立刻能感受到：用户每按一个字符，launcher 就会调用你的 query 一次。如果你的 query 花 50 ms，体验已经卡了。

我做了三件事保护它。

**冷路径优先短路。** 绝大多数查询是没有 due reminder 的——直接 `return []`。

**store mtime 缓存。** 每次 query 调 `store.load()` 看似要读盘，但 store 内部记着上次读的 mtime，文件没变就直接返回内存版本：

```python
def load(self):
    if not self.path.exists():
        ...
        return
    mtime = self.path.stat().st_mtime
    if self._loaded_mtime is not None and mtime == self._loaded_mtime:
        return  # cache hit
    ...
```

**写操作仅在用户动作时触发。** 浮现展示不写盘，只有 `done` / `cancel` / `snooze` 这三个动作才落 JSON。这样高频路径完全是只读。

测下来 query 主路径在没有 due 时，绝大多数耗时来自 Python 进程启动本身，我们的代码只占微秒级。

## 持久化 — 原子写 + 损坏回滚

存储用一个 JSON 文件：`data/reminders.json`。Flow Launcher 是单实例，一般不会并发写，但程序崩溃在写到一半的可能性总在。所以保存时：

```python
fd, tmp_path = tempfile.mkstemp(prefix="reminders.json.tmp", dir=str(self.path.parent))
try:
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, self.path)
except Exception:
    try: os.unlink(tmp_path)
    except OSError: pass
    raise
```

写到同目录下的临时文件，再 `os.replace` 原子替换。`os.replace` 在同一文件系统上是 POSIX/Windows 都保证原子性的——要么完整生效，要么完整不生效，不会留半个文件。

如果用户（或别的工具）真的把 JSON 弄坏了，load 时不能就这么崩——会把整个插件干掉。所以加了一层 quarantine：

```python
try:
    data = json.load(f)
except (json.JSONDecodeError, OSError) as e:
    ts = datetime.now().strftime("%Y%m%dT%H%M%S")
    target = self.path.with_name(f"reminders.corrupted-{ts}.json")
    self.path.rename(target)
    self._reminders = {}
    self.last_load_warning = f"reminders.json was corrupted ({e}); 已备份并重置"
    return
```

坏文件被改名为 `reminders.corrupted-<时间戳>.json` 留档，新建空 store，在结果区顶端给一条警告条目。用户看见警告，数据没丢（还在备份里），功能继续可用。

## 主入口就是要「不出事」

`main.py` 是唯一直接 `import flowlauncher` 的文件。它故意写得很薄：建 store、转发 query / context_menu、跑用户动作、外面包一层 try/except 兜底。

```python
def query(self, q=""):
    try:
        now = datetime.now()
        self._store.load()
        ...
    except Exception as e:
        return [{"Title": "Future Self 出错了", "SubTitle": str(e)[:200], ...}]
```

异常抛出去会让整个插件挂掉，launcher 会弹一个生硬的错误。改成在结果区显示一条柔和的「出错了」更不打断手感。

所有真正的逻辑——时间解析、命令路由、状态机、渲染——都在 `plugin/` 下的纯 Python 模块，不依赖 SDK。这样可以在 Linux 上 pytest 跑全套（80+ 个用例），不用启 Flow Launcher。这一层 thin adapter / fat core 的分法值这个钱。

## 装好之后

最后产出 27 KB 的一个 zip，解压到 `%APPDATA%\FlowLauncher\Plugins\` 重启 launcher 就能用。命令大致：

```text
fs +30m 记得交报告
fs 21:00 关电脑
fs tomorrow 9:00 跑步
fs done / cancel / snooze 5m
fs history / stats
```

留过一阵之后再次打开 launcher，顶端会出现一行——这次不是产品在打扰你，而是 17 分钟前的你想起了一件事。

整个项目的核心新意其实就一句：launcher 是认知最清醒的「任务切换时刻」，比系统通知更适合做温柔的提醒。这一句话决定了 ActionKeyword 设 `"*"`，决定了「来自 X 时间前的你」的措辞，也决定了不去写后台进程和系统托盘。技术上它是个小项目，结构上它是一种对通知机制的隐形批评。

---

_代码、设计与实现脚本：[github.com/MarchPhantasia/Flow.Launcher.Plugin.FutureSelf](https://github.com/MarchPhantasia/Flow.Launcher.Plugin.FutureSelf)。开发过程中和 Claude 协作，完整的 spec 与实施计划在仓库 `docs/superpowers/` 下，可对照过程读。_
