---
title: Obsidian 的 Things 主题，和它那一堆 Checkbox 语法糖
description: 一个把 Things 3 质感搬进 Obsidian 的主题，最实用的部分不是配色，而是被它扩到二十几种状态的 checkbox。
pubDate: 2026-05-16
tags:
  - Obsidian
  - 主题
  - 笔记
  - 工具
---

Obsidian 的主题市场里挑得眼花的时候，[Things](https://github.com/colineckert/obsidian-things) 是少数让我装上之后没再换回去的那个。作者 Colin Eckert 想做的事情很明确：把 Cultured Code 那款叫 Things 3 的任务管理 App 的视觉气质搬进 Obsidian——配色、字距、圆角、按钮的圆润感，都往那个方向靠。

![Things 主题在 Obsidian 中的整体外观](https://github.com/colineckert/obsidian-things/raw/main/assets/main-demo.png)

## 看起来是什么样

主题在 Obsidian 1.0 之后做了一次比较彻底的重做，现在跑在原生设计语言上，外加一层 Things 的色板。落到具体观感是这些：

- **配色**：低饱和的中性灰加暖色强调，亮色像奶白纸，暗色不黑得反光
- **字体**：代码用 JetBrains Mono 带连字（`!=`、`=>` 会变成单字符）
- **代码块**：Atom 风格高亮，自带行号
- **标签**：渲染成胶囊状的 pill，密集打标签时不再像一串井号
- **图片**：嵌入图自带卡片化的圆角和阴影，不再是裸贴
- **移动端**：右下角多了一个浮动按钮，单手切预览/编辑

如果你在用 [Style Settings](https://github.com/mgmeyers/obsidian-style-settings) 插件，加粗、斜体、高亮、引用块的强调色都可以单独调。不装 Style Settings 也能用，只是少了这层个性化开关。

## 真正的甜头是 Checkbox

很多 Obsidian 主题在 callout 块上做花样，Things 走的是另一条路：**callout 维持原生样式不动，但把 checkbox 的状态扩展到了离谱的程度**。

原生 Markdown 只有 `[ ]` 和 `[x]` 两种。Things 在方括号里塞一个字符就能切到不同的图标和颜色，相当于把任务列表当成了富语义的标记系统：

```markdown
## 基础
- [ ] to-do
- [/] incomplete
- [x] done
- [-] canceled
- [>] forwarded
- [<] scheduling

## 扩展
- [?] question
- [!] important
- [*] star
- ["] quote
- [l] location
- [b] bookmark
- [i] information
- [S] savings
- [I] idea
- [p] pros
- [c] cons
- [f] fire
- [k] key
- [w] win
- [u] up
- [d] down
- [D] draft pull request
- [P] open pull request
- [M] merged pull request
```

![Things 主题下扩展 checkbox 状态的渲染效果](https://github.com/colineckert/obsidian-things/raw/main/assets/checkbox-styles.png)

不需要装任何额外插件——纯靠 CSS 在 `data-task` 属性上做选择器，写完直接生效。

实际用下来比想象中顺手的几个：

- `[?]` 和 `[!]` 适合做读书笔记里"待回头查的疑点"和"作者重点强调的论断"
- `[>]` 适合把一条 todo 推到明天而不删掉，自己能看清是延期不是放弃
- `[D]` `[P]` `[M]` 三个 PR 状态用来追代码评审进度，比建一个看板省事

需要注意：这套写法是 **Things 主题专属**，换成别的主题这些方括号里的字符就退化成普通文本。如果你的笔记会在多人之间或多种渲染器之间流转（比如导出成标准 GFM），就别太依赖它。

## 装它

走官方市场最省事：

1. 设置 → Appearance → Themes → Manage
2. 搜 "Things"，点 Use

手动装的话，把仓库里的 `theme.css` 拷到 vault 的 `.obsidian/themes/` 目录下，**重命名为 `Things.css`**（不重命名会和市场版同名冲突），然后在主题下拉里选 Things。

## 一点保留意见

主题这种东西很主观，列两点我自己感到的不便，免得你装完才发现：

- **JetBrains Mono 连字**喜欢的人会很喜欢，但 `==`、`=>` 在长代码里被合成单字符之后，肉眼对齐和光标定位会偶尔卡一下，介意的话可以在 Obsidian 设置里把字体换回 Menlo
- **暖色强调**在白底下挺好看，黑底下偏橙的那一档我个人觉得有点过亮，长期看代码会想把饱和度调低半档（Style Settings 里能改）

但 checkbox 那套语法糖是真值得装一次试试，哪怕只为了在长 todo 列表里看到二十几种小图标错落分布的视觉爽感。

---

_灵感来自 [colineckert/obsidian-things](https://github.com/colineckert/obsidian-things)，作者 Colin Eckert。_
