---
title: Getting Started with VitePress
date: 2026-05-20
description: Learn how to build a personal site with VitePress, Vue components, and ant-design-x-vue.
---

# Getting Started with VitePress

Published: May 20, 2026

## Introduction

VitePress is a static site generator powered by Vite and Vue 3. It's designed for building fast documentation sites and blogs.

In this article, we'll walk through setting up a personal portfolio site with:

- VitePress for static generation
- Vue 3 components for custom layouts
- ant-design-x-vue for an embedded AI chat UI

## Setup

First, install VitePress and its dependencies:

```bash
npm add -D vitepress vue
npm install ant-design-x-vue
```

## Project Structure

```
docs/
├── .vitepress/
│   ├── config.mts
│   └── theme/
│       ├── index.ts
│       ├── layouts/
│       │   ├── Home.vue
│       │   └── Chat.vue
│       └── styles/
│           └── custom.css
├── index.md
├── cv.md
├── chat.md
└── blog/
    └── getting-started.md
```

## Custom Layouts

VitePress allows you to create custom layouts by extending the default theme. In `.vitepress/theme/index.ts`, you can conditionally render different layouts based on frontmatter:

```typescript
import { h } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import HomeLayout from './layouts/Home.vue'
import ChatLayout from './layouts/Chat.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { frontmatter } = useData()
    if (frontmatter.layout === 'chat') {
      return h(ChatLayout, null, {})
    }
    if (frontmatter.layout === 'home') {
      return h(HomeLayout, null, {})
    }
    return h(DefaultTheme.Layout, null, {})
  },
}
```

## Integrating ant-design-x-vue

Register ant-design-x-vue components globally in `enhanceApp`:

```typescript
import * as AntdXComponents from 'ant-design-x-vue'

export default {
  enhanceApp({ app }) {
    for (const [name, component] of Object.entries(AntdXComponents)) {
      app.component(name, component)
    }
  },
}
```

To avoid SSR build issues, load the floating chat component asynchronously with `ssr: false`:

```typescript
import { defineAsyncComponent } from 'vue'
import DefaultTheme from 'vitepress/theme'

const FloatChat = defineAsyncComponent({
  loader: () => import('./layouts/FloatChat.vue'),
  ssr: false,
})
```

## Running the Site

```bash
pnpm docs:dev
```

Visit `http://localhost:5173` to see your site in action.

## Conclusion

VitePress is a powerful and flexible tool for building personal sites. Combined with Vue 3's component system and ant-design-x-vue, you can create rich, interactive experiences with minimal configuration.
