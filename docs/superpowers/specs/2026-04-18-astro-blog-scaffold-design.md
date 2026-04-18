# Astro 博客脚手架与 Cloudflare Pages 部署

## 目标

在 `/home/pha/project/blog` 创建 Astro minimal 项目脚手架，并通过 wrangler CLI 部署到 Cloudflare Pages。GitHub 仓库 `MarchPhantasia/blog` 仅作源码备份，不参与部署链路。

具体的博客页面结构（Content Collections、布局、样式、RSS 等）**不在本次范围内**，留待后续单独 brainstorming。

## 决策汇总

| 项 | 选择 | 理由 |
|---|---|---|
| 框架 | Astro (minimal 模板) | 最少预设，便于后续按需添加 |
| 包管理器 | pnpm | 已安装；磁盘高效；社区主流 |
| 语言 | TypeScript strict | 早期定型避免后期重构 |
| 渲染模式 | 静态 SSG | 博客经典选择，构建快、CDN 缓存高效，无需 adapter |
| 部署平台 | Cloudflare Pages | 用户选择 |
| 部署机制 | wrangler CLI 手动部署 | 服务器环境无法走 OAuth 浏览器回调；wrangler 已通过 `CLOUDFLARE_API_TOKEN` 认证 |
| 源码托管 | GitHub 公开仓库 `MarchPhantasia/blog` | 仅作备份，不接入 Cloudflare Git 集成（避免浏览器授权步骤） |
| Node 版本 | v24（当前环境版本），`.node-version` 锁定 | 保证本地与未来 CI 一致 |

## 架构

### 目录结构（脚手架完成后）

```
/home/pha/project/blog/
├── src/
│   ├── pages/
│   │   └── index.astro          # 占位首页（"Hello, blog scaffold ready"）
│   ├── layouts/                 # 空目录，留待后续
│   └── components/              # 空目录，留待后续
├── public/
│   └── favicon.svg              # Astro 默认
├── docs/
│   └── superpowers/
│       └── specs/               # 本设计文档所在
├── astro.config.mjs             # site 字段先留空
├── tsconfig.json                # extends "astro/tsconfigs/strict"
├── package.json
├── pnpm-lock.yaml
├── .gitignore                   # node_modules, dist, .astro, .wrangler 等
├── .node-version                # 锁定 Node 版本
└── README.md                    # 开发/构建/部署速查
```

### 两条独立流水线

#### 流水线 1：部署（wrangler 手动触发）

```
本地源码
   │
   │ pnpm build
   ▼
dist/  (静态 HTML/CSS/JS)
   │
   │ wrangler pages deploy dist --project-name blog
   ▼
Cloudflare Pages → https://blog.pages.dev
```

- 首次运行 wrangler 会询问是否创建名为 `blog` 的 Pages 项目，选 yes
- 部署使用环境变量 `CLOUDFLARE_API_TOKEN` 认证（已配置）
- 后续每次内容更新：`pnpm build && wrangler pages deploy dist --project-name blog`

#### 流水线 2：源码备份（git → GitHub）

```
本地 .git
   │
   │ git push https://x-access-token:$TOKEN@github.com/MarchPhantasia/blog.git main
   ▼
github.com/MarchPhantasia/blog
```

- token 通过 URL 内联传递，**不写入 `.git/config`**
- push 完成后 remote 重置为不含 token 的形式：`https://github.com/MarchPhantasia/blog.git`
- 后续用户自行配置 SSH key 或 credential helper 维护 push

## 数据流（本次脚手架阶段）

1. `pnpm create astro@latest` 在 `/home/pha/project/blog` 用 minimal 模板初始化（TypeScript strict、不安装额外集成）
2. 写入/调整 `.gitignore`、`.node-version`、`README.md`、`astro.config.mjs`
3. `pnpm install` 确保依赖到位
4. `pnpm build` 验证构建成功（产出 `dist/`）
5. `wrangler pages deploy dist --project-name blog` 创建项目并发布
6. `git init` + 首次 commit（含 spec、源码、`pnpm-lock.yaml`）
7. 添加 GitHub remote 并 push（token 内联，push 后清理）
8. 输出：Cloudflare 域名 + GitHub 仓库链接

## 错误处理与边界

| 风险 | 处理 |
|---|---|
| Cloudflare 项目名 `blog` 已被占用 | wrangler 会报错，让用户改名（如 `blog-marchphantasia`）后重试 |
| wrangler 提示需要选择 production branch | 选 `main` |
| GitHub push 因仓库非空被拒 | 仓库应为完全空的（无 README/license），用户在浏览器创建时不要勾选初始化选项 |
| GITHUB_TOKEN 已暴露在对话中 | 文档中明确：完成后立即在 GitHub 撤销该 PAT |
| Node 版本与 Astro 不兼容 | `.node-version` 写入 `24`（当前环境实测可用），与本地一致 |
| `astro build` 报错 | 不进入部署流程；先排查（最可能是依赖冲突或 TypeScript 错误） |

## 测试 / 验证

本次脚手架阶段不涉及单元测试。完成的判定标准：

- [ ] `pnpm dev` 启动本地服务器，浏览器访问占位页面正常
- [ ] `pnpm build` 无错误，`dist/index.html` 存在
- [ ] `wrangler pages deploy` 成功，返回 `*.pages.dev` URL
- [ ] 该 URL 用 `curl -I` 返回 200
- [ ] GitHub 仓库 `MarchPhantasia/blog` 的 main 分支可见 commit
- [ ] `.git/config` 中 remote URL **不含** token

## 显式不做（YAGNI）

- 博客文章 Content Collections 结构
- 列表页 / 详情页 / 标签页布局
- 样式方案（Tailwind / UnoCSS / 纯 CSS）
- RSS、sitemap 集成
- MDX 支持
- 暗色模式
- 评论系统
- 自定义域名绑定
- GitHub Actions CI/CD（自动部署）
- SSH key 配置（用户后续自理）

以上每一项都应在后续单独的 brainstorming → spec → plan → 实施循环中处理。

## 安全提醒（执行阶段必须告知用户）

1. **轮换 `CLOUDFLARE_API_TOKEN`**：已暴露在对话中，完成后到 Cloudflare dashboard 撤销重建
2. **轮换 `GITHUB_TOKEN`（PAT）**：已暴露在对话中，完成后到 GitHub Settings → Developer settings 撤销重建
3. **建议**：为 GitHub 配置 SSH key，避免长期依赖 PAT
