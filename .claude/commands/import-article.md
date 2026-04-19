---
description: 从一篇外部文章 URL 生成一篇深度重写的博客草稿（Chinese, editorial voice）
argument-hint: <url>
allowed-tools: Bash, WebFetch, Read, Write, Edit, Grep, Glob
---

# /import-article — 从外部文章生成博文草稿

输入：`$ARGUMENTS` 是一篇外部文章的 URL（通常是技术/解决问题类文章）。
目标：抓下原文 → 深度重写（中文、编辑型语气）→ 作为 `draft: true` 写入 `src/content/posts/<slug>.md` → 等用户 review → 发布。

执行时严格按下面的步骤走，**不要**跳过任何一步，尤其是第 2 步"规划并等用户点头"。

---

## Step 1 · 抓取原文

1. 先尝试 `WebFetch`（可以直接让它提取 title/作者/正文主要段落/代码块/图片 URL）
2. 如果 WebFetch 失败或返回不完整（比如是 JS 渲染的站），退而用 Bash：
   `curl -sL -A "Mozilla/5.0" -m 15 "<url>" -o /tmp/import-src.html`
   再用 Python 的 `HTMLParser` 或简单 grep 抽取正文
3. 需要抓到的信息：
   - **原文标题**（做署名用，不做本文标题）
   - **原作者**（如果页面上有明显署名）
   - **发布日期 / 更新日期**（可选）
   - **正文结构**：章节小标题、段落、列表、引用块
   - **代码块**：保留原始语言标注（`js` / `python` / `bash` 等）
   - **图片清单**：每张记录 `原始 URL` + `alt 文本（若无自己写一句中文描述）`
   - **外链**：挑 2–4 个有价值的（官方文档、参考论文、关键工具首页），丢掉那些指向源站自家其他文章的链接

## Step 2 · 规划 · 等用户点头（不要直接写文件）

在对话里输出一份结构化清单（不写入磁盘）：

```
原文:   <原文标题>
作者:   <原作者 或 未署名>
字数:   ~<估算>
核心观点 (2-4 条):
  - ...
  - ...
打算用的 slug: <kebab-case>
打算用的 tags (3-5 个): #... #...
图片 (N 张):
  1. https://... — <描述>
  2. ...
代码块 (M 段): <语言分布>
```

然后**明确向用户确认**："这份规划 OK 吗？要调整 slug / tags / 裁掉哪些段落，或者补/换哪些图？"

用户点头后才进入 Step 3。用户有补充或反对时，调整清单再问一次。

## Step 3 · 深度重写

**声音对齐**：参考 `src/content/posts/` 下已有的三篇（`hello-world.md`、`design-notes.md`、`astro-first-impressions.md`）。要点：
- 中文为主，技术术语保留英文原词
- 段落短，句子干净，少用感叹号和夸张修辞
- 小标题用 `##`（二级），更细用 `###`；不要一上来就 `#`
- 引用块 `>` 用于真正值得突出的一两句话，不要用来包段落
- 列表用来列东西，不要用列表写连贯推理

**改写边界**：
- **不许**逐段翻译 —— 吸收观点后用自己的话重述，整篇与原文的逐字重叠率保持 ≤ 30%
- **不许**照搬原文标题 —— 用更贴近本站风格的新标题（可以短一些、更克制）
- 代码块可以原样保留（代码不属于文风，且细节必须准确）
- 图片用原始 URL 直接引用：`![<中文 alt>](https://original-url)`，**不**下载到 public/
- 保留 2–4 条原文引用的权威外链
- 长度：原文 500 字以上时，重写后字数控制在原文的 60%–120%

## Step 4 · 写入草稿

路径：`src/content/posts/<slug>.md`
**必须**以 `draft: true` 写入（生产构建会过滤 draft，用户没点头前不会上线）。

frontmatter 模板：

```yaml
---
title: <重写后的标题>
description: <一句话描述，≤ 80 字>
pubDate: <今天的日期 YYYY-MM-DD>
tags:
  - <tag1>
  - <tag2>
draft: true
---
```

正文末尾，空一行 `---` 后加一行精神性署名（深度重写的体面做法，不喧宾夺主）：

```markdown
---

_灵感来自 [<原文标题>](<原文 URL>)<如果作者可查: "，作者 <name>">。_
```

## Step 5 · 报告

草稿落盘后，告诉用户：
- 文件路径
- 最终标题 / 标签
- 预估阅读时长：可以用 `node -e 'import("./src/lib/reading-time.ts").then(m=>...)'`，或简单手算（中文 380 字/分 + 英文 220 词/分）
- 图片数量，并提醒："原文图可能某天失效，如需用你的图床短链替换，现在告诉我具体哪张换成什么 URL"
- 下一步：请 review Markdown；确认后说"发布"进入 Step 6，或者直接给修改反馈

## Step 6 · 用户说"发布"后

1. 去掉 `draft: true` 那一行（或改成 `draft: false`）
2. `pnpm build` — 必须成功；失败就修，不要强推
3. `wrangler pages deploy dist --project-name blog-marchphantasia --branch main --commit-dirty=true` — 记录下 deployment URL
4. `git add src/content/posts/<slug>.md && git commit -m "post: <title>"` + `git push origin main`
5. 报告：
   - 线上地址：`https://blog-marchphantasia.pages.dev/posts/<slug>/`
   - commit hash

## 原则（违反即停）

- **不要**逐字复制原文任何连续超过 2 句的段落
- **不要**照搬原文标题
- **不要**下载图片到 public/；始终用远程 URL
- **不要**在 Step 2 自作主张地往下写；必须等用户点头
- **不要**跳过 `pnpm build` 直接部署
- 如果抓取失败、图片全挂、或原文是付费墙，报告给用户并停下来
