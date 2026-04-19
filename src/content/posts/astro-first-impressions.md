---
title: Astro 6 搭站初印象
description: 用 Astro 重做博客的几点观察——静态输出、内容集合、岛屿架构，以及为什么最终没装 React。
pubDate: 2026-04-17
tags:
  - Astro
  - 前端
  - 博客
---

断断续续用过 Jekyll、Hexo、Hugo、Next.js 做博客，这次选了 [Astro](https://astro.build) 6。写了几天下来，有几个点想记一下。

## 选 Astro 的理由

最朴素的那条：**它默认不发任何 JS 到浏览器**。

一个纯内容站，大多数页面其实只需要 HTML + CSS。Astro 的 `.astro` 组件模型把"构建期组装 HTML"做成了默认，需要交互的地方再用 `client:*` 指令挂载岛屿——比如主题切换按钮、TOC 高亮——其他一切都是静态的 `<div>`。

对比之下，Next.js 哪怕你写的是 SSG，也得带上 React 运行时、router、hydration 脚本。一个博客首页首次加载能轻松到 200KB+ JS。Astro 的同等页面可以做到 0 字节 JS。

## 踩到的几个小坑

### 1. Content Collections 的 loader API

Astro 6 砍掉了旧的 `type: 'content'` 写法，改为显式 `loader`：

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});
```

`z.coerce.date()` 比 `z.date()` 好用 —— Markdown frontmatter 里的 `2026-04-17` 是字符串，`coerce` 版本会自动转。

### 2. Tailwind v4 的整合方式变了

官方 `@astrojs/tailwind` 集成是给 v3 用的。v4 推荐 `@tailwindcss/vite`，一条插件搞定：

```js
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: { plugins: [tailwindcss()] },
});
```

然后 `global.css` 顶部 `@import "tailwindcss";`，**不再需要** `tailwind.config.js`——主题用 `@theme {}` 块在 CSS 里声明。

### 3. 暗色模式要防闪烁

做 SSG 的一个通用难题：HTML 在服务端渲染时不知道用户的主题偏好，客户端 JS 运行前会短暂展示默认主题，然后切换 —— 肉眼可见的"闪一下"。

标准解法是把切换逻辑**内联到 `<head>` 开头**：

```html
<script is:inline>
  const s = localStorage.getItem('theme');
  const d = s === 'dark' ||
    (!s && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', d);
</script>
```

`is:inline` 告诉 Astro "别打包这段、就原封不动塞进 HTML"。Astro 默认会把 `<script>` 处理成模块放到页末，那就晚了。

## 为什么没装 React

一开始想用 React 写一个带搜索框的标签云，立刻想通——这些东西用原生 JS 写起来代码量差不多，但打包体积差了两个数量级。博客的交互小到一只手数得过来：

- 主题切换（5 行 JS）
- 移动端菜单展开（10 行 JS）
- TOC 滚动高亮（15 行 JS with `IntersectionObserver`）

这些场景 React 带来的心智节省**小于**它带来的体积代价。

等以后真需要一个复杂组件（可视化图表、富文本编辑器），再单独开一个岛屿装 React，顶多影响那一个页面。Astro 的分岛能力让"要不要装框架"这个决策可以推迟到实际需要时。

## 小结

Astro 不是革命，而是把一个朴素的道理做到了好用：**大部分页面不需要 JS，就别发 JS**。博客恰好是这类场景的典型。

对我来说，选它不是因为它"最好"，而是因为它**最贴合博客的本质**。
