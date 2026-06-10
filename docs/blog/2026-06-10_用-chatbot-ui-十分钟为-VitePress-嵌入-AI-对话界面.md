---
title: 用 @chatbotui/agent-chatbot-ui 十分钟为 VitePress 博客接入 AI 对话界面
date: 2026-06-10
description: 如何在现有 VitePress 站点里零门槛嵌入一个完整的 AI Agent 对话浮窗，不需要改路由、不需要动构建配置，只要三步。
cover: https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&q=80
tags:
 - AI
 - Vue
 - VitePress
 - Chatbot
---

## 🎯 核心主题：访客只能读、不能聊——一个静态博客接入 AI 对话的十分钟方案

---

### 🟢 S (Situation) - 稳定的前度平衡

> *站点跑了半年，文章一篇接一篇，简历随时可查，一切岁月静好。*

博客搭在 VitePress 上，CI 一推送就自动部署，路由干净，样式统一。另一边，Agent 后端早就上线了——SSE 流、思维链、HITL 表单、工具调用卡片，完整链路都已就绪。

只是这两件事之间，**从来没有连起来过**。

访客看完文章，想聊合作、问方案、探讨 AI 落地路径——手指停在屏幕前，然后去翻邮箱地址。AI Agent 的能力在那里，却完全触达不到用户。

---

### 🔴 C (Complication) - 平衡的剧烈打破

> *"只能看、不能聊"——对做 AI 和产品的人来说，这个标签比代码 bug 还刺眼。*

手动撸一个对话 UI 没那么难，但要做到生产级别，问题开始叠加：

- SSE 流式接收，断线重连，心跳保活
- 流式打字效果 + Markdown 渲染 + 代码高亮
- 思维链折叠展示
- 工具调用卡片（Skill / MCP / RAG）
- HITL 表单挂起 + 用户确认提交
- 浮窗 / 全屏双模式适配
- 暗色模式跟随

每一条拎出来都能写一周。而更大的顾虑是：**这是 VitePress**，改动必须极度保守——不能动路由，不能改 CI/CD，不能破坏现有的构建流程。

---

### 🔵 Q (Question) - 悬而未决的致命一问

> 如何在不动 VitePress 现有架构的前提下，用最少代码接入一个完整功能的 AI Agent 对话界面？

---

### 🟣 A (Answer) - 最终的破局解法

> 核心只有两层：**一个全局配置 + 一个自定义 Layout**。剩下的，组件内部全部兜底了。

#### 破局技术栈

**`window.__CHAT_CONFIG__`** — 告诉前端组件后端 SSE 地址在哪：

```ts
window.__CHAT_CONFIG__ = {
  endpoint: 'https://your-agent-api.com/chat',
  title: "Let's Talk",
  subtitle: 'Start the conversation',
}
```

**VitePress 自定义 Layout** — 把对话框当成一个独立页面嵌入，路由、CI/CD 完全不动：

```vue
<script setup lang="ts">
import { useChat, MarkdownBubble } from '../chatbot-raw'

const {
  messages, inputValue, loading, messagesRef,
  sendMessage, resumeHitl, scrollToBottom,
} = useChat()

watch(messages, () => nextTick(scrollToBottom), { deep: true })

function handleSlotFill(id: string, values: Record<string, any>) {
  resumeHitl({ action: 'submit_slots', taskId: id, filledSlots: values })
}
</script>

<template>
  <div class="lets-talk-page">
    <aside class="sidebar">话题引导 + 快速入口</aside>
    <main class="chat-shell">
      <div class="messages" ref="messagesRef">
        <div v-for="msg in messages" :key="msg.id" :class="msg.role">
          <MarkdownBubble
            v-if="msg.role === 'assistant'"
            :content="msg.content"
            :streaming="!msg.done"
            :think-content="msg.thinkContent"
            :tool-calls="msg.toolCalls"
            :slot-fill-request="msg.slotFillRequest"
            @hitl-slot-fill="handleSlotFill"
          />
          <div v-else>{{ msg.content }}</div>
        </div>
      </div>
      <div class="input-area">
        <input v-model="inputValue" :disabled="loading"
          @keydown.enter="sendMessage" />
        <button :disabled="loading" @click="sendMessage">发送</button>
      </div>
    </main>
  </div>
</template>
```

```yaml
# docs/lets-talk.md
---
layout: lets-talk
---
```

#### 接入效果

导航栏多了 **Let's Talk** 入口，访客点进去——流式打字、思维链折叠、HITL 表单挂起、人机介入确认，全部自动工作。

侧边栏还留了「查看简历」和「浏览文章」的快速链接，聊天结束后无缝跳转回内容消费路径。

#### 十分钟里做了什么

| 耗时 | 做的事 |
|------|--------|
| ~2 分钟 | `npm install` + `window.__CHAT_CONFIG__` |
| ~3 分钟 | 创建 chatbot 桥接模块（绕 SSR + 路径别名） |
| ~3 分钟 | 写自定义 Layout，绑定 `useChat` + `MarkdownBubble` |
| ~2 分钟 | VitePress SSR 配置放行 ant-design |

剩下的——流式打字、思维链、工具调用卡片、HITL 表单——组件内部已经全部兜底。如果你的后端已经实现了 [SSE 流式接口](https://zljie.com/blog/2026-05-29_SSE流式响应后端踩坑报告/)，接入这个前端基本上不需要额外适配。
