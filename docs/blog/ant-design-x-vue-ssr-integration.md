---
title: ant-design-x-vue 在 VitePress SSR 环境中的集成实践
date: 2026-05-20
description: 分享如何在一个 VitePress SSR 项目中成功集成 ant-design-x-vue AI 对话组件库，并解决服务端渲染的兼容性问题。
---

# ant-design-x-vue 在 VitePress SSR 环境中的集成实践

Published: May 20, 2026

## 背景

VitePress 是一个基于 Vite 和 Vue 3 的静态站点生成器，默认以 SSR（Server-Side Rendering）模式构建。这意味着页面在服务器端完成初始渲染，然后发送到客户端。这种模式对 SEO 友好、首屏加载快，但也带来了一些挑战——尤其是当我们需要引入依赖浏览器特有 API 的第三方组件库时。

今天，我将分享如何在一个 VitePress 项目中成功集成 [ant-design-x-vue](https://github.com/ant-design/ant-design-x-vue)，这是一个功能丰富的 AI 对话 UI 组件库，提供了开箱即用的 `Bubble`、`Sender`、`Welcome` 等组件。

## 核心问题：SSR 与浏览器 API 的冲突

当我们尝试直接在 VitePress 中使用 ant-design-x-vue 组件时，会遇到一个典型的问题：组件内部可能依赖 `window`、`document`、`navigator` 等浏览器全局对象，而在 Node.js 服务端环境中，这些对象是不存在的。

即使组件本身没有直接使用这些 API，组件库在打包时可能会引入一些与服务端环境不兼容的代码，导致以下错误：

```
ReferenceError: window is not defined
```

或

```
document is not defined
```

VitePress 的构建流程会尝试在 SSR 模式下渲染所有 Vue 组件，任何对浏览器 API 的调用都会导致构建失败。

## 解决方案：异步组件 + SSR 禁用

经过探索，我们找到了一个优雅且实用的解决方案：**将使用 ant-design-x-vue 的组件声明为异步组件，并明确禁用 SSR**。

### 方案原理

Vue 3 提供了 `defineAsyncComponent` API，用于定义异步组件。这个 API 接受一个配置对象，其中包含 `ssr: false` 选项。当设置这个选项后，VitePress 在服务端渲染时会完全跳过这个组件的渲染，只在客户端完成挂载后才加载和渲染它。

这样做有几个好处：

1. **构建成功** - 服务端不再尝试渲染包含浏览器 API 依赖的组件
2. **功能完整** - 客户端加载后，组件功能完全可用
3. **用户体验** - 对于需要交互的 UI 组件（如聊天界面），禁用 SSR 几乎没有负面影响

### 关键代码实现

#### 1. 在主题入口文件中配置异步组件

在 `.vitepress/theme/index.ts` 中：

```typescript
import { h } from 'vue'
import { useData } from 'vitepress'
import { defineAsyncComponent } from 'vue'
import DefaultTheme from 'vitepress/theme'

// 将需要 ant-design-x-vue 的组件声明为异步组件，禁用 SSR
const FloatChat = defineAsyncComponent({
  loader: () => import('./layouts/FloatChat.vue'),
  ssr: false,
})

export default {
  extends: DefaultTheme,

  Layout: () => {
    const { frontmatter } = useData()
    let inner: any
    if (frontmatter.value.layout === 'chat') {
      inner = h(ChatLayout, null, {})
    } else {
      inner = h(DefaultTheme.Layout, null, {})
    }
    // 将 FloatChat 作为布局的第二个子元素渲染
    return [inner, h(FloatChat)]
  },

  enhanceApp({ app }) {
    // 注册 ant-design-x-vue 全局组件
    for (const [name, component] of Object.entries(AntdXComponents)) {
      app.component(name, component as any)
    }
  },
}
```

#### 2. 全局注册 ant-design-x-vue 组件

在 `enhanceApp` 钩子中，我们需要全局注册 ant-design-x-vue 的所有组件，这样在 Vue 模板中就可以直接使用它们，而无需每次都手动导入：

```typescript
import * as AntdXComponents from 'ant-design-x-vue'

// 在 enhanceApp 中注册
for (const [name, component] of Object.entries(AntdXComponents)) {
  app.component(name, component as any)
}
```

#### 3. 封装聊天逻辑为 Composable

为了保持代码整洁，我们将聊天相关的逻辑封装到一个独立的 composable 中：

```typescript
// useChat.ts
import { ref, nextTick } from 'vue'

declare global {
  interface Window {
    __CHAT_CONFIG__?: {
      endpoint: string
      title?: string
      subtitle?: string
    }
  }
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
}

export function useChat() {
  const messages = ref<ChatMessage[]>([])
  const inputValue = ref('')
  const loading = ref(false)
  const messagesRef = ref<HTMLElement>()

  function scrollToBottom() {
    nextTick(() => {
      if (messagesRef.value) {
        messagesRef.value.scrollTop = messagesRef.value.scrollHeight
      }
    })
  }

  async function sendMessage() {
    const text = inputValue.value.trim()
    if (!text || loading.value) return

    inputValue.value = ''
    messages.value.push({ id: Date.now(), role: 'user', content: text })
    loading.value = true

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await response.json()
      messages.value.push({
        id: Date.now(),
        role: 'assistant',
        content: data.response || JSON.stringify(data),
      })
    } catch {
      messages.value.push({
        id: Date.now(),
        role: 'assistant',
        content: 'Error: Could not reach backend',
      })
    }

    loading.value = false
    scrollToBottom()
  }

  return { messages, inputValue, loading, messagesRef, sendMessage, scrollToBottom }
}
```

#### 4. 创建 FloatChat 悬浮聊天气泡组件

```vue
<template>
  <Teleport to="body">
    <Transition name="chat-popup">
      <div v-if="isOpen" class="float-chat">
        <div class="float-header">
          <img class="float-avatar" src="..." alt="AI" />
          <div>
            <div class="float-title">{{ config.title || 'AI Assistant' }}</div>
            <div class="float-subtitle">{{ config.subtitle }}</div>
          </div>
          <button class="float-close" @click="isOpen = false">✕</button>
        </div>

        <div class="float-messages" ref="messagesRef">
          <Welcome v-if="messages.length === 0" :user="welcomeUser" />
          <template v-for="msg in messages" :key="msg.id">
            <div class="message-row" :class="msg.role">
              <Bubble :content="msg.content" :role="msg.role" />
            </div>
          </template>
          <div v-if="loading" class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>

        <div class="float-input">
          <Sender
            :value="inputValue"
            @update:value="(v: string) => inputValue = v"
            @send="sendMessage"
          />
        </div>
      </div>
    </Transition>

    <button v-if="!isOpen" class="float-fab" @click="isOpen = true">
      💬
    </button>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Bubble, Sender, Welcome } from 'ant-design-x-vue'
import { useChat } from './useChat'

const config = computed(() => window.__CHAT_CONFIG__ || {})
const isOpen = ref(false)
const { messages, inputValue, loading, messagesRef, sendMessage } = useChat()
</script>
```

## 备选方案

除了异步组件 + SSR 禁用之外，还有两种思路可供选择，各有其适用场景。

### 方案 B：`<ClientOnly>` 包裹

VitePress 提供了一个内置的 `<ClientOnly>` 组件，作用与 `ssr: false` 完全一致——它在服务端直接跳过渲染，只在客户端挂载后渲染。这是最直观的写法：

```vue
<template>
  <DefaultTheme.Layout>
    <ClientOnly>
      <FloatChat />
    </ClientOnly>
  </DefaultTheme.Layout>
</template>
```

或者在 Markdown 页面中直接使用：

```md
<ClientOnly>
  <FloatChat />
</ClientOnly>
```

**优点**：语义清晰，一眼就能看出这个组件不会 SSR，无需理解 `defineAsyncComponent` 的概念。

**缺点**：`<ClientOnly>` 本身没有提供 props 来精细控制加载行为（如 loading 状态、占位符）。对于 UI 组件这不是问题，但如果需要更细致的交互控制，方案 A 更合适。

### 方案 C：`vite.ssr.noExternal` 配置

如果 SSR 构建失败的原因不是组件使用了浏览器 API，而是 Vite 在打包 SSR bundle 时将第三方包错误地 externalize（保持为 `require()` 调用），导致 Node.js 无法解析，那么可以在 `.vitepress/config.mts` 中强制将包保留在 SSR bundle 内：

```typescript
// .vitepress/config.mts
import { defineConfig } from 'vitepress'

export default defineConfig({
  vite: {
    ssr: {
      noExternal: ['ant-design-x-vue'],
    },
  },
})
```

这会告诉 Vite：将 `ant-design-x-vue` 打包进 SSR 的 chunk，而不是将其 externalize 保留为运行时 `require()`。这样如果组件内部有环境检测逻辑（如 `typeof window !== 'undefined'`），打包后的代码会包含这些分支，服务端运行到对应代码时不会直接崩溃。

**优点**：不改代码，只改配置，适合排查打包策略引起的问题。

**缺点**：如果组件本身就无法在 Node.js 环境运行（如直接访问 `window` 而没有任何环境判断），这个方案无效。而且强制打包会增加 SSR bundle 体积，影响构建速度。还需要注意：如果 `ant-design-x-vue` 本身或其依赖中有大量 SSR 不兼容代码，可能会引入新的问题。

### 三种方案对比

| 维度 | 方案 A：异步组件 | 方案 B：`<ClientOnly>` | 方案 C：配置化 |
|------|----------------|----------------------|--------------|
| 原理 | Vue API 级别跳过 SSR | VitePress 组件级别跳过 SSR | Vite 构建策略调整 |
| 改动量 | 少量代码 | 无代码（模板层面） | 仅配置 |
| 控制粒度 | 可自定义 loading / error | 无精细控制 | 整体包级别 |
| SSR bundle 影响 | 无（完全不打包） | 无（完全不打包） | 可能增大 SSR bundle |
| 适用场景 | 通用，推荐 | 简单组件 | 打包策略问题 |

本项目最终采用了**方案 A（异步组件 + `ssr: false`）**，因为它既能在布局层面精确控制 FloatChat 的渲染位置，又不依赖页面模板层面的标记，同时 Vue 的异步组件机制提供了内置的 loading 和 error 处理能力。

## 其他注意事项

### 1. 组件级别的 SSR 处理

`ssr: false` 只能在组件级别使用，不能在 composable 或工具函数中使用。如果你的 composable 中使用了浏览器 API，需要确保这些调用只在客户端执行：

```typescript
// 正确做法：在 composable 中延迟访问 window
function getConfig() {
  if (typeof window !== 'undefined') {
    return window.__CONFIG__
  }
  return null
}
```

### 2. Teleport 与 SSR

`FloatChat` 组件中使用了 `<Teleport to="body">`。Vue 3 的 Teleport 在 SSR 环境下有一些特殊处理，但在我们的场景中，由于整个组件禁用了 SSR，这个问题不会出现。如果你需要在 SSR 环境下使用 Teleport，请参考 Vue 3 官方文档的相关说明。

### 3. 动态配置

我们的实现中使用了 `window.__CHAT_CONFIG__` 来传递配置。这是一个在客户端才能访问的全局变量。在 VitePress 中，你可以通过在页面中注入脚本来设置这个配置：

```javascript
// 在页面或布局中
<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  window.__CHAT_CONFIG__ = {
    endpoint: '/api/chat',
    title: 'My AI Assistant',
    subtitle: 'Ask me anything'
  }
})
</script>
```

## 总结

通过将依赖 ant-design-x-vue 的组件声明为异步组件并禁用 SSR，我们成功解决了在 VitePress（SSR 环境）中集成 AI 对话 UI 的问题。这个方案：

- **简单有效** - 只需几行代码即可解决
- **无副作用** - 不影响其他组件的 SSR
- **易于维护** - 代码结构清晰，易于理解和扩展

如果你也在为 VitePress 或其他 SSR 框架集成类似组件库，希望这篇复盘能给你一些参考。
