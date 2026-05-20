---
title: VitePress + GitHub Pages 搭建过程中的常见问题与解决
date: 2026-05-20
description: 复盘使用 VitePress + ant-design-x-vue 搭建个人站点的全过程，记录在配置 GitHub Actions 部署、SSR 构建优化、路径别名修复等环节中遇到的问题与解决方案。
---

# VitePress + GitHub Pages 搭建过程中的常见问题与解决

Published: May 20, 2026

## 背景

今天我们用 VitePress 搭建了一个个人站点，包含简历、博客和 AI 对话功能。项目结构如下：

```
zljie/
├── docs/
│   ├── index.md              # 首页
│   ├── cv.md                 # 简历页
│   ├── chat.md               # AI 对话页
│   ├── blog/
│   │   ├── getting-started.md
│   │   └── ant-design-x-vue-ssr-integration.md
│   └── .vitepress/
│       ├── config.mts        # VitePress 配置
│       └── theme/
│           ├── index.ts      # 主题入口
│           └── layouts/
│               ├── Home.vue
│               ├── Chat.vue
│               ├── FloatChat.vue
│               └── useChat.ts
└── .github/workflows/deploy.yml  # GitHub Actions
```

整个过程看似简单，但每一步都有一些细节需要处理。以下是我们遇到的所有问题及其解决思路。

## 问题一：GitHub Pages 部署路径问题

### 现象

GitHub Pages 支持两种部署方式：

- **用户/组织站点**：`https://username.github.io/`（仓库名必须是 `username.github.io`）
- **项目站点**：`https://username.github.io/repo-name/`

对于项目站点，所有静态资源的路径都必须带上 `/repo-name/` 前缀，否则在访问时会出现 404。

### 解决

在 `docs/.vitepress/config.mts` 中配置 `base`：

```typescript
export default defineConfig({
  base: '/zljie/',
  // ...
})
```

`base` 会影响以下内容：

- 构建产物中所有静态资源的引用路径
- 路由的 base 路径
- Vite 内部资源的解析路径

> **注意**：`base` 必须以斜杠开头和结尾（如 `'/repo-name/'`），且不要手动修改 `dist` 目录中的文件——VitePress 构建时会自动注入正确的路径。

## 问题二：SSR 构建阶段报错 `window is not defined`

### 现象

项目引入了 `ant-design-x-vue` 后，执行 `vitepress build` 时在 SSR 阶段直接报错：

```
ReferenceError: window is not defined
```

这是因为 VitePress 默认以 SSR 模式构建页面，Node.js 环境中不存在 `window`、`document` 等浏览器全局对象，而 ant-design-x-vue 的某些模块在导入时直接访问了这些 API。

### 解决

详见另一篇文章 [ant-design-x-vue 在 VitePress SSR 环境中的集成实践](./ant-design-x-vue-ssr-integration)，其中记录了三种解决方案。本项目采用了异步组件 + `ssr: false` 的方案：

```typescript
// docs/.vitepress/theme/index.ts
import { defineAsyncComponent } from 'vue'

const FloatChat = defineAsyncComponent({
  loader: () => import('./layouts/FloatChat.vue'),
  ssr: false,
})
```

核心思路是：让这些依赖浏览器 API 的 UI 组件完全跳过服务端渲染，只在客户端加载。

## 问题三：`../_util/type` 无法解析

### 现象

在 Vite SSR 构建阶段，还遇到了另一个错误：

```
Cannot resolve "../_util/type" from "node_modules/ant-design-vue/es/_util/type.js"
```

这是因为 Node.js 的模块解析规则默认要求 `.js` 后缀，而某些包在导出时省略了文件扩展名，Vite 在 SSR 环境中无法补全。

### 解决

在 `docs/.vitepress/config.mts` 的 `vite.resolve.alias` 中添加别名规则：

```typescript
export default defineConfig({
  vite: {
    resolve: {
      alias: {
        '../_util/type': '../_util/type.js',
      },
    },
  },
})
```

不过这种方式只能解决单个路径的别名。更通用的做法是通过 `vite.ssr.noExternal` 让 Vite 在打包 SSR bundle 时保留这些第三方包的代码，这样 Vite 可以用自身的模块解析逻辑（支持省略扩展名）来处理它们：

```typescript
export default defineConfig({
  vite: {
    ssr: {
      noExternal: ['ant-design-x-vue', 'ant-design-vue'],
    },
  },
})
```

`noExternal` 和 `alias` 可以同时使用，前者解决打包策略问题，后者解决特定的路径解析问题。

## 问题四：GitHub Actions 权限不足导致部署失败

### 现象

GitHub Actions 的 `deploy-pages` 步骤报错：

```
Error: Resource not accessible by integration
```

这是因为 GitHub Actions 默认权限不包含 Pages 写入权限。

### 解决

在 workflow 文件的根级别显式声明权限：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

- `pages: write` — 允许部署到 GitHub Pages
- `id-token: write` — 允许 OIDC 令牌交换，用于验证身份

这三个权限是 GitHub Pages 部署的最小必要权限组合。

## 问题五：ant-design-x-vue 组件无法全局注册

### 现象

在 `enhanceApp` 中尝试注册 ant-design-x-vue 的所有组件：

```typescript
import * as AntdXComponents from 'ant-design-x-vue'

enhanceApp({ app }) {
  for (const [name, component] of Object.entries(AntdXComponents)) {
    app.component(name, component as any)
  }
}
```

构建时没有任何报错，但组件在模板中无法渲染，控制台也没有 Vue 的警告。

### 排查过程

1. 检查 `ant-design-x-vue` 的导出结构，确认模块确实包含了 `Bubble`、`Sender`、`Welcome` 等组件
2. 尝试手动 import 具体组件而非批量注册，可以正常工作
3. 发现问题原因：批量 `Object.entries` 注册时，命名空间导出的顺序和结构可能与 Vue 期望的不一致

### 解决

确保全局注册时使用的是组件导出而非命名空间导出。在 `docs/.vitepress/theme/index.ts` 中：

```typescript
import {
  Bubble,
  Sender,
  Welcome,
} from 'ant-design-x-vue'

enhanceApp({ app }) {
  app.component('Bubble', Bubble)
  app.component('Sender', Sender)
  app.component('Welcome', Welcome)
}
```

或者，如果确定命名空间导出有效，可以打印注册结果确认：

```typescript
for (const [name, component] of Object.entries(AntdXComponents)) {
  if (name !== 'default') {
    app.component(name, component as any)
  }
}
```

> **经验**：批量注册第三方库的命名空间导出时，最好先确认导出结构是否符合 Vue 的组件注册规范。如果不确定，直接列出需要用到的组件更稳妥。

## 问题六：动态配置在 SSR 和客户端之间的传递

### 现象

在 VitePress 中，需要在页面加载时传递一些动态配置（如 API 端点）给客户端组件。最自然的方式是使用 `window.__CONFIG__`：

```javascript
// 在页面中
window.__CHAT_CONFIG__ = {
  endpoint: '/api/chat',
}
```

但如果直接在 Vue 组件的 `<script setup>` 中访问 `window`，在 SSR 环境下会因为 `window is not defined` 而崩溃。

### 解决

有两种方式：

**方式一：在组件中使用环境检测**

```typescript
// 在 composable 中
function getChatConfig() {
  if (typeof window !== 'undefined') {
    return window.__CHAT_CONFIG__
  }
  return {}
}
```

**方式二：通过 VitePress 的 `head` 配置注入**

在 `config.mts` 中通过 `head` 注入全局脚本，这样脚本会在客户端执行，且完全绕开 SSR：

```typescript
head: [
  [
    'script',
    {},
    `window.__CHAT_CONFIG__ = { endpoint: '${CHAT_ENDPOINT}' };`,
  ],
],
```

> 推荐使用方式二，因为 VitePress 的 `head` 配置会在页面 HTML 生成时注入到 `<head>` 标签中，在所有 Vue 组件加载之前执行，不会产生 SSR 兼容性问题。

## 总结

这次搭建过程中遇到的问题可以分为三类：

1. **部署层** — GitHub Pages 的路径前缀、GitHub Actions 的权限配置
2. **构建层** — SSR 构建中的浏览器 API 访问、模块路径解析、打包策略
3. **组件层** — 第三方组件的注册方式、动态配置的传递

这些问题虽然都不复杂，但在实际项目中很容易被忽视。建议在项目初期就把 CI/CD 跑通，再逐步引入第三方依赖，这样能更早发现构建层面的问题。
