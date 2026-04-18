# Astro 博客脚手架与 Cloudflare Pages 部署 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/home/pha/project/blog` 初始化 Astro minimal 项目，部署到 Cloudflare Pages，并 push 源码到 GitHub `MarchPhantasia/blog`。

**Architecture:** Astro 静态 SSG + TypeScript strict + pnpm。部署用 wrangler CLI（CLOUDFLARE_API_TOKEN 已配置）。GitHub 仓库仅作源码备份，不参与部署链路。

**Tech Stack:** Astro (minimal template), TypeScript strict, pnpm, wrangler 4.x, git

**Spec:** `/home/pha/project/blog/docs/superpowers/specs/2026-04-18-astro-blog-scaffold-design.md`

**前置条件确认（执行前一次性核查）:**
- 工作目录: `/home/pha/project/blog`
- 当前内容: 仅有 `docs/superpowers/specs/2026-04-18-astro-blog-scaffold-design.md` 与 `docs/superpowers/plans/`（本计划）
- 环境变量: `CLOUDFLARE_API_TOKEN` 已设置（验证：`wrangler whoami` 返回 logged in）
- 已知值（不要再次询问用户）:
  - GitHub 仓库 URL: `https://github.com/MarchPhantasia/blog`
  - GitHub PAT: 已在对话中提供（值见对话上下文，**不在本文档落盘**）
  - Cloudflare 项目名: `blog`
  - 默认分支: `main`
  - Node 版本: `24`（实测 v24.13.1）

---

## Task 1: 初始化 Astro minimal 项目

**Files:**
- Create: `/home/pha/project/blog/package.json`
- Create: `/home/pha/project/blog/astro.config.mjs`
- Create: `/home/pha/project/blog/tsconfig.json`
- Create: `/home/pha/project/blog/src/pages/index.astro`
- Create: `/home/pha/project/blog/public/favicon.svg`
- Create: `/home/pha/project/blog/pnpm-lock.yaml`

**前置说明:** 目录非空（已有 `docs/`），需要 `--yes` 跳过 "directory not empty" 提示。`--no-git` 因为 git init 在 Task 4 单独处理。

- [ ] **Step 1: 备份 docs/ 防意外覆盖（保险措施）**

```bash
cd /home/pha/project/blog
cp -r docs /tmp/blog-docs-backup-$(date +%s)
ls /tmp/blog-docs-backup-*
```

Expected: 列出新建的备份目录，里面包含 `superpowers/specs/...md`

- [ ] **Step 2: 运行 pnpm create astro**

```bash
cd /home/pha/project/blog
pnpm create astro@latest . --template minimal --typescript strict --install --no-git --yes --skip-houston
```

Expected: 命令成功结束，输出 "Liftoff confirmed" 或类似成功提示。`package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`, `public/favicon.svg`, `pnpm-lock.yaml`, `node_modules/` 均生成。

**如果失败**（例如 create-astro 拒绝非空目录）: 先 `mv docs /tmp/blog-docs-tmp`，重跑命令成功后 `mv /tmp/blog-docs-tmp docs`。

- [ ] **Step 3: 确认 docs/ 仍存在且 spec 完好**

```bash
ls /home/pha/project/blog/docs/superpowers/specs/
cat /home/pha/project/blog/docs/superpowers/specs/2026-04-18-astro-blog-scaffold-design.md | head -3
```

Expected: spec 文件还在，第一行 `# Astro 博客脚手架与 Cloudflare Pages 部署`。

- [ ] **Step 4: 确认 tsconfig 是 strict**

```bash
cat /home/pha/project/blog/tsconfig.json
```

Expected: 包含 `"extends": "astro/tsconfigs/strict"`。如果不是 strict，编辑替换为 strict。

- [ ] **Step 5: 验证开发服务器能启动（短暂）**

```bash
cd /home/pha/project/blog
timeout 8 pnpm dev 2>&1 | head -20 || true
```

Expected: 输出包含 `Local    http://localhost:4321/` 字样。timeout 到达后命令被终止是正常的。

---

## Task 2: 添加配置文件（.node-version, .gitignore 调整, README）

**Files:**
- Create: `/home/pha/project/blog/.node-version`
- Modify: `/home/pha/project/blog/.gitignore`
- Create: `/home/pha/project/blog/README.md`

- [ ] **Step 1: 创建 .node-version**

写入文件 `/home/pha/project/blog/.node-version`，内容：
```
24
```

- [ ] **Step 2: 检查 Astro 默认 .gitignore**

```bash
cat /home/pha/project/blog/.gitignore
```

Expected: 包含 `node_modules`, `dist`, `.astro` 等。

- [ ] **Step 3: 追加 .wrangler 和 .env 到 .gitignore（如不存在）**

```bash
cd /home/pha/project/blog
grep -q '^\.wrangler' .gitignore || echo '.wrangler/' >> .gitignore
grep -q '^\.env$' .gitignore || echo '.env' >> .gitignore
grep -q '^\.dev\.vars' .gitignore || echo '.dev.vars' >> .gitignore
cat .gitignore
```

Expected: 输出的 .gitignore 包含上述三项。

- [ ] **Step 4: 创建 README.md**

写入文件 `/home/pha/project/blog/README.md`：

```markdown
# blog

Personal blog built with [Astro](https://astro.build), deployed to Cloudflare Pages.

## Local development

```bash
pnpm install
pnpm dev          # http://localhost:4321
```

## Build

```bash
pnpm build        # outputs to dist/
pnpm preview      # preview the production build locally
```

## Deploy

Manual deploy to Cloudflare Pages (requires `CLOUDFLARE_API_TOKEN` in env):

```bash
pnpm build
wrangler pages deploy dist --project-name blog --branch main
```

## Project layout

- `src/pages/`     — route files
- `src/layouts/`   — page layouts (TBD)
- `src/components/` — reusable components (TBD)
- `public/`        — static assets served as-is
- `docs/superpowers/` — design specs and implementation plans
```

- [ ] **Step 5: 在 astro.config.mjs 留 site 字段占位注释**

读取 `/home/pha/project/blog/astro.config.mjs`，在 `defineConfig({})` 内或附近添加注释：

```javascript
// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // site: 'https://blog.pages.dev',  // fill in after first deploy
});
```

如果原文件已经有内容，仅追加 `site` 注释行；不破坏现有结构。

---

## Task 3: 验证本地构建并部署到 Cloudflare Pages

**Files:** （无文件改动，仅命令）

- [ ] **Step 1: 验证 pnpm build 成功**

```bash
cd /home/pha/project/blog
pnpm build 2>&1 | tail -20
```

Expected: 末尾输出 `Complete!` 或类似成功标志，无 error。

- [ ] **Step 2: 验证 dist/index.html 存在且非空**

```bash
ls -lh /home/pha/project/blog/dist/index.html
head -5 /home/pha/project/blog/dist/index.html
```

Expected: 文件存在，head 显示 HTML 内容（包含 `<!DOCTYPE html>` 或 `<html`）。

- [ ] **Step 3: 创建 Cloudflare Pages 项目（非交互）**

```bash
cd /home/pha/project/blog
wrangler pages project create blog --production-branch main 2>&1 | tail -10
```

Expected: 输出 `Successfully created the 'blog' project.` 或类似。

**如果项目名 `blog` 已存在**（输出含 "already exists" 或 8000007 错误码）: 跳过此步即可，直接进入 Step 4 部署到现有项目。

**如果是其他冲突**（账户里有同名项目但不属于本次任务）: 改用 `blog-marchphantasia` 作为项目名，并把后续所有 `--project-name blog` 替换为 `--project-name blog-marchphantasia`，同时记录新项目名。

- [ ] **Step 4: 部署 dist/ 到 Cloudflare Pages**

```bash
cd /home/pha/project/blog
wrangler pages deploy dist --project-name blog --branch main 2>&1 | tail -20
```

Expected: 输出包含 `✨  Deployment complete! Take a peek over at https://<hash>.blog.pages.dev` 以及 alias `https://blog.pages.dev`。**记录这两个 URL**。

- [ ] **Step 5: 验证部署后页面可访问**

```bash
curl -sI https://blog.pages.dev | head -3
```

Expected: 第一行 `HTTP/2 200`。如果返回 404，等 30 秒重试一次（CDN 传播）。

---

## Task 4: Git 初始化与首次 commit

**Files:** （创建 `.git/` 目录）

- [ ] **Step 1: 初始化 git 仓库**

```bash
cd /home/pha/project/blog
git init -b main
git config user.name 2>/dev/null || git config --global --get user.name
git config user.email 2>/dev/null || git config --global --get user.email
```

Expected: `Initialized empty Git repository in /home/pha/project/blog/.git/`。最后两条命令应输出已配置的 user.name 和 user.email。

**如果 user.name / user.email 未配置**: 询问用户并 `git config user.name "..."` / `git config user.email "..."`（仅在本仓库设置）。

- [ ] **Step 2: 检查 git status 确认没有意外文件**

```bash
cd /home/pha/project/blog
git status --short | head -30
```

Expected: 列出待添加文件，包含 `astro.config.mjs`、`package.json`、`pnpm-lock.yaml`、`src/`、`public/`、`tsconfig.json`、`.gitignore`、`.node-version`、`README.md`、`docs/`。**不应**出现 `node_modules/`、`dist/`、`.astro/`、`.wrangler/`。

如果出现意外文件（如 `.env`、`node_modules/`），停止并修正 .gitignore。

- [ ] **Step 3: 添加并提交所有文件**

```bash
cd /home/pha/project/blog
git add .
git commit -m "$(cat <<'EOF'
chore: initial Astro minimal scaffold + Cloudflare Pages deploy

- Astro minimal template with TypeScript strict
- pnpm as package manager, Node 24 via .node-version
- README documenting dev/build/deploy workflow
- Design spec and implementation plan under docs/superpowers/
EOF
)"
```

Expected: commit 成功，输出含文件数和插入行数。

- [ ] **Step 4: 验证 commit**

```bash
cd /home/pha/project/blog
git log --oneline -1
git show --stat HEAD | head -15
```

Expected: 最新 commit 显示，包含上述消息和提交的文件统计。

---

## Task 5: 添加 GitHub remote 并 push

**Files:** （修改 `.git/config`）

**注意:** 本任务会**一次性**使用对话中已暴露的 GITHUB_TOKEN。push 完成后立即清除 remote 中的 token，并在最终步骤提醒用户轮换 PAT。

- [ ] **Step 1: 用内联 token 的 URL push（一次性）**

获取 GITHUB_TOKEN 值（来自对话上下文，以 `github_pat_11BGS67TA0F9...` 开头）。**Bash tool 直接执行此命令时 token 会出现在命令文本中——无法避免，因 PAT 已暴露故反正必须轮换。**

```bash
cd /home/pha/project/blog
git push https://x-access-token:<TOKEN_VALUE_FROM_CONTEXT>@github.com/MarchPhantasia/blog.git main 2>&1 | tail -10
```

Expected: 输出包含 `* [new branch]      main -> main` 和 `To https://github.com/MarchPhantasia/blog.git`。

**如果失败原因为 "repository not empty"**: 用户在 GitHub 创建仓库时勾选了初始化（README/license）。让用户去 GitHub 删除仓库重建空仓库，或者改用 `git pull --rebase https://...@github.com/MarchPhantasia/blog.git main` 然后再 push。

**如果失败原因为 401/403**: PAT 权限不足或已被 GitHub 自动撤销（GitHub 检测到 token 暴露在 commit/对话中可能自动 revoke）。停止任务，让用户重新创建 PAT。

- [ ] **Step 2: 添加干净的 remote URL（不含 token）**

```bash
cd /home/pha/project/blog
git remote add origin https://github.com/MarchPhantasia/blog.git 2>&1 || git remote set-url origin https://github.com/MarchPhantasia/blog.git
git remote -v
```

Expected: 输出两行，均为 `origin  https://github.com/MarchPhantasia/blog.git (fetch/push)`，**不含 token**。

- [ ] **Step 3: 让 main 分支跟踪 origin/main**

```bash
cd /home/pha/project/blog
git fetch origin 2>&1 | tail -3
git branch --set-upstream-to=origin/main main
git status -sb | head -2
```

Expected: status 显示 `## main...origin/main`。

- [ ] **Step 4: 验证 .git/config 中无 token 残留**

```bash
cd /home/pha/project/blog
grep -E 'x-access-token|github_pat_' .git/config && echo "WARNING: token leaked in .git/config" || echo "OK: no token in .git/config"
```

Expected: `OK: no token in .git/config`。如果 WARNING，立即编辑 `.git/config` 删除该行并重设 remote URL。

---

## Task 6: 最终验证 + 安全收尾

**Files:** （无文件改动，仅核对验收标准）

- [ ] **Step 1: 验收清单核对**

```bash
cd /home/pha/project/blog
echo "=== Local dev ==="
ls package.json astro.config.mjs tsconfig.json src/pages/index.astro && echo "OK: scaffold files exist"

echo "=== Build artifact ==="
[ -f dist/index.html ] && echo "OK: dist/index.html exists" || echo "FAIL"

echo "=== Cloudflare deployment ==="
curl -sI https://blog.pages.dev | head -1

echo "=== Git ==="
git log --oneline -1
git remote -v
git status -sb | head -1

echo "=== No token leak ==="
grep -rE 'github_pat_|cfut_' .git/config 2>/dev/null && echo "FAIL: token leaked" || echo "OK"
```

Expected:
- All scaffold files exist
- dist/index.html exists
- HTTP/2 200 from blog.pages.dev
- 1 commit on main
- origin remote = `https://github.com/MarchPhantasia/blog.git`（无 token）
- working tree clean
- no token leak

- [ ] **Step 2: 验证 GitHub 仓库可见**

```bash
curl -sI https://github.com/MarchPhantasia/blog | head -1
```

Expected: `HTTP/2 200`。

- [ ] **Step 3: 输出最终清单给用户**

向用户输出文本（不写入文件）：

```
✓ 本地项目: /home/pha/project/blog
✓ Cloudflare Pages: https://blog.pages.dev
✓ GitHub 仓库: https://github.com/MarchPhantasia/blog
✓ 后续部署命令: pnpm build && wrangler pages deploy dist --project-name blog --branch main

⚠️  立即轮换以下已暴露的 token:
   1. CLOUDFLARE_API_TOKEN — Cloudflare dashboard → My Profile → API Tokens
   2. GitHub PAT (github_pat_11BGS67TA0F9...) — GitHub Settings → Developer settings → Personal access tokens

后续推荐改用 SSH key 给 GitHub remote，避免长期依赖 PAT。
```

---

## Self-Review

**1. Spec coverage:**
- ✅ 决策汇总（Astro minimal, pnpm, strict, SSG, wrangler, GitHub backup）→ Task 1, 2, 3, 5
- ✅ 目录结构（src/pages, public, docs, .node-version, .gitignore, README, astro.config.mjs）→ Task 1, 2
- ✅ 流水线 1 部署 (wrangler) → Task 3
- ✅ 流水线 2 GitHub 备份 → Task 4, 5
- ✅ 错误处理（项目名占用、空仓库要求、Node 版本、build 失败）→ Task 3 Step 3, Task 5 Step 1, Task 2 Step 1
- ✅ 验收标准（dev/build/deploy/200/git/无 token）→ Task 6 Step 1
- ✅ 安全提醒（轮换 tokens）→ Task 6 Step 3

**2. Placeholder scan:** No "TBD/TODO/implement later" in actionable steps. README 中保留的 "(TBD)" 是计划内的内容占位，spec 已声明博客页面后续单独做。

**3. Type/value consistency:** 项目名 `blog` 全文一致；分支名 `main` 全文一致；GitHub URL `MarchPhantasia/blog` 全文一致；Node 版本 `24` 一致。
