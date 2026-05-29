---
title: VitePress 嵌入 ant-design-x-vue 悬浮聊天的踩坑全记录
date: 2026-05-29
description: 从组件选型到 CI/CD 部署，把 ant-design-x-vue 做成悬浮 Chat Widget 并送上 GitHub Pages的全流程拆解
cover: https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&q=80
tags:
 - VitePress
 - ant-design-x-vue
 - Vue3
 - GitHub Actions
 - ChatUI
---

## 🎯 核心主题：VitePress 嵌入 ant-design-x-vue 悬浮 Chat Widget：五轮踩坑与终极方案

### 🟢 S (Situation) - 稳定的前度平衡

> *用 3 句话交代原本平稳的现状。*

一切从"我要做一个个人站点"开始。VitePress 搭好了首页、CV 页、博客页，ant-design-x-vue 的 `Bubble`、`Sender`、`Welcome` 组件文档看了三遍，代码写完了，样式调好了，mock reply 跑得通。本地 `pnpm docs:dev` 一看，页面加载正常，样式完美，组件渲染无报错。万事俱备，只欠东风——**上线 GitHub Pages**。

### 🔴 C (Complication) - 平衡的剧烈打破

> *撕开痛苦的口子，描述突然发生的变量或致命痛点。*

东风没来。GitHub Pages 部署上去后，悬浮组件消失了。一查 CI，日志全是红：**pnpm/action-setup@v4 没指定版本，直接 panic**。修完 CI，首页渲染的是旧版 README，不是 Vue 组件。改完 source 指向 GitHub Actions，第二次 push 依然静默——Pages 压根没更新。

而这只是第一层。更深的水在代码里：

**第一坑：VitePress 的 Layout 路由玄学**

文档说 frontmatter 里写 `layout: chat`，Theme Layout 里做路由判断就能切换。结果首页的 Hero + slot 全丢了，组件不渲染。真相是：**`index.md` 里塞满了原生 HTML div，VitePress 根本没机会渲染 Layout 的 slot**。

**第二坑：ant-design-x-vue 的 Sender 没有事件，只有 prop**

`@send` 和 `@submit` 绑了，发送按钮点了十次没反应。翻源码才找到：`Sender` 组件只有 `update:value` 这一个 emit，根本不存在 `send` 和 `submit` 事件。正确用法是 **`:on-submit="sendMessage"`** —— 一个 prop 回调，不是 Vue 事件。

**第三坑：VitePress SSR + ant-design-vue 的 ESM 解析雪崩**

`pnpm docs:build` 本地跑不过：`Cannot find module '../_util/type'`。`ant-design-vue@4` 的 ESM 导出里，路径少了一个 `.js` 后缀。需要在 VitePress 的 `config.mts` 里加两行 resolve alias hack：

```typescript
vite: {
  ssr: {
    noExternal: ['ant-design-x-vue', 'ant-design-vue'],
  },
  resolve: {
    alias: {
      '../_util/type': '../_util/type.js',
    },
  },
},
```

**第四坑：VitePress Theme Layout 的 slot 在 SSR 下不工作**

好不容易用 `<template #hero>` 把 `FloatChat` 塞进 Layout，首页 HTML 里依然空空如也。因为 SSR 阶段 `index.md` 的 frontmatter 是 `layout: home`，但 `Home.vue` 的 `#hero` slot 里是空的——所有内容都在 markdown 里硬编码着，根本没走到 Vue 组件层。

### 🔵 Q (Question) - 悬而未决的致命一问

> *精炼成一句话，直击技术核心。*

**如何在 VitePress 中正确集成 ant-design-x-vue，并让它以悬浮 Widget 形态出现在所有页面，同时确保 CI/CD 自动构建发布？**

### 🟣 A (Answer) - 最终的破局解法

> *亮出最终架构或技术方案，证明它是当下最优解。*

**方案一：VitePress Theme Layout 全局注入**

不再依赖 frontmatter 路由。把 `FloatChat` 从各 Layout 的 slot 里抽出来，放到 `theme/index.ts` 的 `Layout` 函数里统一注入：

```typescript
// docs/.vitepress/theme/index.ts
import FloatChat from './layouts/FloatChat.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { frontmatter } = useData()
    let inner: any
    if (frontmatter.value.layout === 'chat') {
      inner = h(ChatLayout, null, {})
    } else if (frontmatter.value.layout === 'home') {
      inner = h(HomeLayout, null, {})
    } else {
      inner = h(DefaultTheme.Layout, null, {})
    }
    // FloatChat 全局注入，所有页面都有悬浮按钮
    return [inner, h(FloatChat)]
  },
}
```

`FloatChat` 使用 Vue 3 的 `<Teleport to="body">`，用 Transition 做弹出/收起动画，SSR 阶段不渲染面板，只渲染 FAB 按钮，完美适配。

**方案二：ant-design-x-vue Sender 正确用法**

```vue
<!-- 错误：监听了不存在的事件 -->
<Sender @send="sendMessage" @submit="sendMessage" />

<!-- 正确：传入 prop 回调函数 -->
<Sender :on-submit="sendMessage" />
```

**方案三：GitHub Actions CI/CD 完整配置**

```yaml
# .github/workflows/deploy.yml
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 9   # 必须显式指定，否则会 panic
```

**最终效果：**

- 悬浮按钮固定出现在所有页面右下角
- 点击展开完整 AI 对话面板（Bubble + Sender + Welcome）
- 支持拖拽定位、未读角标、打字动画
- 支持切换 mock reply / 真实 Agent API
- 每次 push 到 main，CI 自动构建并发布到 GitHub Pages

**收效：** 从"组件不渲染"到"全球可访问"，耗时 5 轮调试，所有问题均可复现、均可解释。

---

## 相关代码

完整源码可在 [zljie/zljie.github.io](https://github.com/zljie/zljie.github.io) 查看：

- `docs/.vitepress/theme/index.ts` — Theme 入口 + 全局组件注入
- `docs/.vitepress/theme/layouts/FloatChat.vue` — 悬浮聊天组件
- `docs/.vitepress/config.mts` — VitePress 配置（含 SSR ESM hack）
- `.github/workflows/deploy.yml` — GitHub Actions CI/CD

*踩坑是成长的最快路径。*
