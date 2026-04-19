export const SITE = {
  name: '存书阁',
  nameEn: 'Scriptorium',
  author: 'MarchPhantasia',
  authorEn: 'MarchPhantasia',
  slogan: '为长期表达，留下清晰的版面。',
  description: '技术笔记 · 生活随记 · 长期表达',
  bio: '一个热爱工程与书写的开发者。在这里收纳代码、阅读、旅途，以及那些值得慢下来整理的想法。',
  url: 'https://blog-marchphantasia.pages.dev',
  locale: 'zh-CN',
  postsPerPage: 20,
  ogImage: '/og-default.svg',
  social: [
    { name: 'GitHub', href: 'https://github.com/MarchPhantasia', icon: 'github' },
    { name: 'Email', href: 'mailto:hello@example.com', icon: 'mail' },
    { name: 'RSS', href: '/rss.xml', icon: 'rss' },
  ],
  nav: [
    { href: '/', zh: '首页', en: 'Home' },
    { href: '/posts', zh: '文章', en: 'Posts' },
    { href: '/tags', zh: '标签', en: 'Tags' },
    { href: '/about', zh: '关于', en: 'About' },
  ],
} as const;

export type NavItem = (typeof SITE.nav)[number];
export type SocialItem = (typeof SITE.social)[number];
