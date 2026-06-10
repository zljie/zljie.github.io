# Agent Chatbot UI — Quickstart

快速将 AI Agent 对话界面接入到任意 Vue 3 前端项目中，支持**全屏模式**和**浮窗模式**两种集成方案。

---

## 目录

- [环境准备](#环境准备)
- [安装](#安装)
- [配置后端地址](#配置后端地址)
- [方案一：全屏模式](#方案一全屏模式)
- [方案二：浮窗模式](#方案二浮窗模式)
- [useChat 核心 API](#usechat-核心-api)
- [HITL（人工介入）](#hitl人工介入)
- [会话日志](#会话日志)
- [SSE 事件类型参考](#sse-事件类型参考)
- [后端接入说明](#后端接入说明)
- [常见问题](#常见问题)

---

## 环境准备

本库为 **Vue 3** 组件库，要求：

| 依赖 | 版本要求 |
|------|----------|
| Vue | `^3.5.0` |
| ant-design-vue | `^4.0.0` |
| ant-design-x-vue | `^1.6.0` |
| marked | `>=9.0.0` |

> **注意**：`ant-design-vue` 和 `ant-design-x-vue` 为 peer dependencies，需自行安装。

---

## 安装

```bash
npm install @chatbotui/agent-chatbot-ui
```

或使用其他包管理器：

```bash
yarn add @chatbotui/agent-chatbot-ui
pnpm add @chatbotui/agent-chatbot-ui
```

> 确保同时安装了 peer dependencies：
> ```bash
> npm install vue ant-design-vue@^4.0.0 ant-design-x-vue@^1.6.0 marked@^9.0.0
> ```

---

## 配置后端地址

在应用入口（`main.ts` 或 `main.js`）中，导入配置模块即可完成初始化。**这一步是必须的**，否则组件不知道该把消息发送到哪个后端地址。

### 方式一：通过 `window.__CHAT_CONFIG__` 配置（推荐）

在 Vue 应用初始化之前，设置全局配置对象：

```ts
// main.ts
import { createApp } from 'vue'
import { defaultConfig } from '@chatbotui/agent-chatbot-ui'

// 在 createApp 之前设置，否则样式变量可能不生效
window.__CHAT_CONFIG__ = {
  endpoint: 'https://your-agent-api.com/chat',   // 必填：SSE 后端地址
  title: 'AI 助手',                               // 可选：聊天页面标题
  subtitle: 'Powered by Agent Chatbot UI',        // 可选：副标题
}

import App from './App.vue'
createApp(App).mount('#app')
```

### 方式二：环境变量（构建时配置）

在 `.env` 或 `.env.production` 文件中设置：

```bash
VITE_CHAT_ENDPOINT=https://your-agent-api.com/chat
VITE_CHAT_TITLE=AI 助手
VITE_CHART_SUBTITLE=Powered by Agent Chatbot UI
```

环境变量会作为默认值注入 `window.__CHAT_CONFIG__`，**运行时配置优先级高于环境变量**。

---

## 方案一：全屏模式

全屏模式使用 `<Chat>` 组件，提供完整的对话界面，包含侧边栏（场景演示 + 历史会话）、欢迎页、快速入口、消息列表和输入框。

### 基础接入

```vue
<template>
  <Chat />
</template>

<script setup lang="ts">
import { Chat } from '@chatbotui/agent-chatbot-ui'
</script>
```

### 完整示例（Vue 单文件组件）

```vue
<!-- src/components/AgentChat.vue -->
<template>
  <div style="height: 100vh;">
    <Chat />
  </div>
</template>

<script setup lang="ts">
import { Chat } from '@chatbotui/agent-chatbot-ui'
</script>
```

```vue
<!-- src/App.vue -->
<template>
  <AgentChat />
</template>

<script setup lang="ts">
import AgentChat from './components/AgentChat.vue'
import '@chatbotui/agent-chatbot-ui/src/config.ts'
</script>
```

> 导入 `config.ts` 的目的是注册全局 CSS 变量（主题色、背景色等），确保样式正常显示。

### 全屏模式内置功能

| 功能 | 说明 |
|------|------|
| 侧边栏 | 包含 Demo 场景演示（Skill Calling / RAG / Think Mode / 5-Step Agent / Multi-turn）和用户会话列表 |
| 欢迎页 | 首次打开时显示 AI 头像、副标题和快速入口按钮 |
| 消息渲染 | 支持 Markdown 语法、代码高亮、思维链折叠、工具调用卡片 |
| 会话日志 | 点击右上角 📋 按钮查看当前会话的完整请求/响应日志，支持导出 JSON / Markdown |
| 暗色模式 | 自动跟随 `html[data-theme="dark"]` 切换 |

---

## 方案二：浮窗模式

浮窗模式使用 `<FloatChat>` 组件，以可拖拽的悬浮气泡形式嵌入页面，不影响原有业务布局，适合作为全局 AI 助手入口。

### 基础接入

```vue
<template>
  <!-- FloatChat 默认通过 Teleport 挂载到 body，不影响页面布局 -->
  <FloatChat />
</template>

<script setup lang="ts">
import { FloatChat } from '@chatbotui/agent-chatbot-ui'
</script>
```

### 完整示例

```vue
<!-- src/App.vue -->
<template>
  <div class="main-content">
    <!-- 你的业务页面内容 -->
    <h1>欢迎使用企业管理系统</h1>
    <p>点击右下角按钮开始对话</p>
  </div>

  <!-- 浮窗聊天组件，放在模板末尾 -->
  <FloatChat />
</template>

<script setup lang="ts">
import { FloatChat } from '@chatbotui/agent-chatbot-ui'
import '@chatbotui/agent-chatbot-ui/src/config.ts'
</script>

<style>
.main-content {
  padding: 40px;
}
</style>
```

### 浮窗模式特性

| 特性 | 说明 |
|------|------|
| 固定位置 | 默认显示在页面右下角（`bottom: 100px; right: 24px`） |
| 可拖拽 | 拖拽顶部栏可在屏幕内自由移动位置 |
| 未读计数 | 关闭浮窗时收到新消息，会在浮窗按钮上显示未读数角标 |
| 过渡动画 | 展开/收起有流畅的缩放和透明度动画 |
| Teleport 挂载 | 始终挂载到 `<body>`，不受父级 `overflow: hidden` 等样式影响 |

### 自定义浮窗样式

浮窗组件内部使用 CSS 变量，可通过覆盖 CSS 变量来自定义颜色：

```vue
<template>
  <FloatChat />
</template>

<script setup lang="ts">
import { FloatChat } from '@chatbotui/agent-chatbot-ui'
</script>

<style>
/* 自定义浮窗主题色 */
:root {
  --vp-c-brand-1: #10b981;   /* 浮窗顶部背景色（绿色系） */
}
</style>
```

---

## useChat 核心 API

`useChat` 是本库的核心 composable，负责 SSE 流式通信、HITL 状态管理和消息状态维护。可与任意 UI 组合使用。

### 函数签名

```ts
const {
  messages,        // Ref<ChatMessage[]>   — 对话消息列表
  inputValue,      // Ref<string>          — 当前输入框内容
  loading,         // Ref<boolean>         — 是否正在等待响应
  messagesRef,     // Ref<HTMLElement | null> — 消息列表 DOM 引用（用于自动滚动）
  sendMessage,     // () => Promise<void>  — 发送当前 inputValue 作为用户消息
  continueTask,    // (text: string) => Promise<void> — 发送跟进消息（多轮对话）
  resumeHitl,      // (params: HitlResumeParams) => Promise<void> — 从 HITL 断点恢复
  currentSessionId, // Ref<string | null>  — 当前会话 ID
  hitlState,       // Ref<HitlRuntimeState> — 当前 HITL 任务状态
  hitlLoading,     // Ref<boolean>         — 是否正在处理 HITL 操作
  scrollToBottom,  // () => void           — 滚动到消息底部
  setMessages,     // (msgs: ChatMessage[]) => void — 初始化/替换消息列表
  clearMessages,   // () => void           — 清空所有消息
} = useChat(initialMessages?: ChatMessage[])
```

### 基本用法

```ts
import { useChat } from '@chatbotui/agent-chatbot-ui'

const {
  messages,
  inputValue,
  loading,
  messagesRef,
  sendMessage,
} = useChat()

// 在模板中绑定：
// <div ref="messagesRef">...</div>
// <input v-model="inputValue" @keydown.enter="sendMessage" />
// <button :disabled="loading" @click="sendMessage">发送</button>
```

### 传入初始消息

```ts
const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: 'user',
    content: '帮我查一下采购需求',
  },
  {
    id: 2,
    role: 'assistant',
    content: '好的，请问您想查询哪类采购需求？',
    done: true,
  },
]

const { messages, setMessages } = useChat(initialMessages)
```

### 自动滚动到底部

`messagesRef` 是消息列表的 DOM 引用，配合 `nextTick` 使用：

```ts
import { nextTick } from 'vue'

watch(messages, async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
})
```

---

## HITL（人工介入）

HITL（Human-in-the-Loop）允许 Agent 在执行关键操作前暂停，等待人工确认或补充信息。本库支持多种 HITL 交互类型。

### HITL 交互类型

| 类型 | 说明 | 后端 SSE 事件 |
|------|------|--------------|
| **confirm_request** | 高风险操作确认（风险等级 low/medium/high） | `confirm_request` |
| **slot_fill_request** | 槽位填充（用户填写表单字段） | `slot_fill` / `slot_fill_request` |
| **approval_request** | 多级审批请求 | `approval_request` |
| **interaction** | 任务完成后的操作选项选择 | `interaction` |

### slot_fill_request（槽位填充请求）

槽位填充用于需要用户补充表单字段的场景，例如补充订单号、选择类型、输入备注等。

#### SSE 事件格式

**支持两种格式：**

**格式一：标准 SSE 格式**
```
event: slot_fill_request
data: {"id": "TASK-001", "title": "补充订单信息", "message": "请补充以下信息以继续处理", "slots": [...], "required": true}
```

**格式二：紧凑格式（Tab 分隔）**
```
slot_fill_request	{"id": "TASK-001", "title": "补充订单信息", "message": "请补充以下信息以继续处理", "slots": [...], "required": true}
```

#### slot_fill_request 数据结构

```json
{
  "id": "TASK-001",
  "title": "补充订单信息",
  "message": "请补充以下信息以继续处理",
  "slots": [
    {
      "name": "orderId",
      "label": "订单号",
      "type": "text",
      "required": true,
      "placeholder": "请输入订单号",
      "validation": {
        "pattern": "^PO-\\d{4}-\\d+$",
        "message": "订单号格式应为 PO-年份-数字"
      }
    },
    {
      "name": "type",
      "label": "紧急程度",
      "type": "select",
      "required": true,
      "options": [
        { "value": "normal", "label": "普通" },
        { "value": "urgent", "label": "紧急" },
        { "value": "critical", "label": "危急" }
      ]
    },
    {
      "name": "remark",
      "label": "备注",
      "type": "textarea",
      "required": false,
      "placeholder": "选填，有什么特殊说明吗？"
    }
  ],
  "required": true
}
```

#### 槽位字段类型说明

| type | 说明 | 支持的配置项 |
|------|------|-------------|
| `text` | 单行文本输入 | `placeholder`, `validation` |
| `textarea` | 多行文本输入 | `placeholder`, `maxLength` |
| `select` | 下拉选择 | `options` (value/label 数组) |
| `radio` | 单选按钮 | `options` (value/label 数组) |
| `checkbox` | 多选框 | `options` (value/label 数组) |

#### 槽位验证配置

```json
{
  "name": "email",
  "label": "邮箱",
  "type": "text",
  "validation": {
    "pattern": "^[^@]+@[^@]+\\.[^@]+$",
    "message": "请输入有效的邮箱地址"
  }
}
```

#### 前端提交槽位数据

用户填写完表单后，前端通过 `resumeHitl` 提交：

```ts
const { resumeHitl } = useChat()

// 监听 slot-fill 事件
function onSlotFill(id: string, values: Record<string, any>) {
  resumeHitl({
    action: 'submit_slots',
    taskId: id,
    filledSlots: values,  // 包含所有槽位字段
    userInput: '用户输入的原始内容'
  })
}
```

提交后端接收格式：

```json
{
  "confirmation_result": {
    "task_id": "TASK-001",
    "action": "submit_slots",
    "filled_slots": {
      "orderId": "PO-2024-001",
      "type": "urgent",
      "remark": "请尽快处理"
    }
  },
  "session_id": "sess_abc123"
}
```

---

### 槽位填充示例

后端发送 `slot_fill` 事件，前端显示填写表单，用户提交后通过 `resumeHitl` 继续流程：

```ts
const { resumeHitl } = useChat()

// 用户填写了订单号和紧急程度后点击"继续"
function onSlotFillSubmit(id: string, values: Record<string, any>) {
  resumeHitl({
    action: 'submit_slots',
    taskId: id,
    filledSlots: {
      orderId: values.orderId,    // 槽位字段名由后端定义
      type: values.type,
    },
  })
}
```

### resumeHitl 参数说明

```ts
interface HitlResumeParams {
  /** 操作类型 */
  action: 'confirm' | 'cancel' | 'submit_slots' | 'reject'
  /** 任务 ID（来自 SSE 事件中的 task_id） */
  taskId?: string
  /** 用户选择的选项 ID（interaction 类型用） */
  selectedValue?: string
  /** 槽位填充值（submit_slots 专用） */
  filledSlots?: Record<string, any>
  /** 原始用户输入 */
  userInput?: string
  /** 携带 pending HITL 卡片的消息 ID（自动检测，可省略） */
  sourceMsgId?: number
}
```

### HITL 状态

```ts
interface HitlRuntimeState {
  conversationId: string | null   // 当前会话 ID
  currentRunId: string | null     // 当前运行 ID
  currentTask: HitlTask | null     // 当前等待处理的任务
  isWaitingHitl: boolean           // 是否在等待人工介入
  userInput: string | null         // 触发该 HITL 的原始用户输入
}
```

---

## 会话日志

`chatLogger` 是一个单例对象，提供完整的请求/响应日志记录和导出功能。

### 导出当前会话日志

```ts
import { chatLogger } from '@chatbotui/agent-chatbot-ui'

// 导出为 JSON
chatLogger.exportSessionLog()

// 导出为 Markdown（更易读，包含时间戳和方向标记）
chatLogger.exportAsMarkdown()
```

### 查询历史会话

```ts
// 获取所有会话 ID 列表
const sessionList = chatLogger.getSessionList()

// 获取指定会话的完整日志
const log = chatLogger.getSessionLog(sessionId)

// 清空指定会话
chatLogger.clearSession(sessionId)

// 清空所有日志
chatLogger.clearAll()
```

### 日志数据结构

```ts
interface SessionLog {
  sessionId: string        // 会话唯一 ID
  sessionStart: string     // 开始时间（ISO 8601）
  sessionEnd?: string      // 结束时间
  entries: LogEntry[]      // 日志条目列表
}

interface LogEntry {
  timestamp: string        // 时间戳
  type: 'user_input' | 'backend_request' | 'backend_response' | 'sse_chunk' | 'error'
  direction: 'send' | 'receive'
  content: any             // 内容
  metadata?: Record<string, any>  // 元数据（如 endpoint、statusCode）
}
```

日志默认存储在 `localStorage`，最多保留 50 个会话，超出后自动清理最旧的会话。

---

## SSE 事件类型参考

后端需以 SSE（Server-Sent Events）格式返回流式响应。以下是本库支持的所有事件类型。

### 事件列表

| 事件名 | 触发时机 | 说明 |
|--------|----------|------|
| `stream_start` | 流开始 | 包含 `mode` 字段（`five_step` 或 `general_chat`） |
| `think` | 思维链片段 | 实时推送 AI 思考/推理过程 |
| `think_done` | 思维链结束 | 标记思维链流式输出完成 |
| `content` | 内容片段 | 实时推送最终回复内容 |
| `message` | 文本消息 | 兼容简化的消息格式 |
| `step_update` | 步骤状态更新 | 五步执行生命周期状态变化 |
| `tool_call` | 工具调用开始 | 发起 Skill / MCP / RAG 工具调用 |
| `tool_result` | 工具调用结果 | 工具执行完成，返回结果或错误 |
| `interaction` | 交互选择 | 任务完成后询问用户后续操作 |
| `confirm_request` | 确认请求 | 高风险操作执行前的确认（含槽位填充） |
| `slot_fill` / `slot_fill_request` | 槽位填充 | 需要用户补充表单字段 |
| `risk_confirm_request` | 风险确认 | 高风险操作特殊确认 |
| `approval_request` | 审批请求 | 多级审批场景 |
| `done` | 流结束 | 标记本次响应流结束 |
| `error` | 错误 | 发生错误时推送 |

### SSE 数据格式

**支持两种 SSE 格式：**

| 格式 | 说明 | 示例 |
|------|------|------|
| **标准 SSE** | `event:` 和 `data:` 分行，块之间用空行分隔 | `event: content\ndata: {...}\n\n` |
| **紧凑格式** | 事件类型和 JSON 用 Tab 分隔，在同一行 | `content\t{"content": "..."}\n` |

**标准 SSE 格式示例：**
```
event: content
data: {"content": "已查询到 5 条未执行采购需求"}

event: step_update
data: {"step": 4, "stepName": "执行过程", "status": "completed", "summary": "查询完成"}

event: done
data: {}
```

**紧凑格式示例：**
```
content	{"content": "已查询到 5 条未执行采购需求"}
step_update	{"step": 4, "stepName": "执行过程", "status": "completed"}
done	{}
```

> 💡 **提示**：紧凑格式适合后端实现简单，减少了格式处理的复杂度。

### 五步执行生命周期（step_update）

当 `mode` 为 `five_step` 时，Agent 按以下顺序推送步骤状态：

| 步骤 | 状态值 | 说明 |
|------|--------|------|
| Step 1 | `step_update` | 意图识别 — 识别用户意图、操作类型和风险等级 |
| Step 2 | `step_update` | 本体对象定位 — 定位到目标业务对象及其属性 |
| Step 3 | `step_update` | 任务规划 — 生成执行计划、查询条件 |
| Step 4 | `step_update` | 执行过程 — 调用外部系统连接器执行 |
| Step 5 | `step_update` | 生成回复 — 汇总结果，生成自然语言回复和建议操作 |

---

## 后端接入说明

### 接口清单

| 接口 | 方法 | 说明 |
|------|------|------|
| `/chat` | POST | 主对话接口，接收用户消息，返回 SSE 流 |
| `/chat/confirm` | POST | HITL 确认接口，恢复被暂停的流程（自动从 `/chat` 推导） |

### 主对话接口请求格式

```json
POST /chat
Content-Type: application/json

{
  "message": "帮我查一下还有哪些采购需求没有执行",
  "session_id": "sess_abc123",
  "stream": true
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `message` | string | 用户输入文本 |
| `session_id` | string | 会话 ID（可选，用于多轮上下文） |
| `stream` | boolean | 必须为 `true`，启用 SSE 流式响应 |

### HITL 确认接口请求格式

```json
POST /chat/confirm
Content-Type: application/json

{
  "confirmation_result": {
    "task_id": "task_001",
    "action": "submit_slots",
    "selected_value": "",
    "filled_slots": {
      "orderId": "PO-2024-001",
      "type": "urgent"
    },
    "user_input": "帮我查一下还有哪些采购需求没有执行"
  },
  "session_id": "sess_abc123",
  "stream": true
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `confirmation_result.task_id` | string | 任务 ID（来自 SSE 事件中的 `task_id`） |
| `confirmation_result.action` | string | 操作类型：`confirm` / `cancel` / `submit_slots` / `reject` |
| `confirmation_result.filled_slots` | object | 槽位填充值（`submit_slots` 专用） |
| `confirmation_result.selected_value` | string | 用户选择的选项 ID（`interaction` 类型用） |
| `session_id` | string | 会话 ID |

---

## 常见问题

### Q: 组件导入后页面空白/样式错乱

确保在应用入口处导入了 `config.ts`，它负责注册全局 CSS 变量：

```ts
import '@chatbotui/agent-chatbot-ui/src/config.ts'
```

### Q: 消息发送后没有响应

按以下顺序排查：

1. 确认 `window.__CHAT_CONFIG__.endpoint` 已正确设置，且后端服务可访问
2. 打开浏览器 DevTools → Network，检查 `/chat` 接口是否返回了 SSE 流
3. 点击组件右上角 📋 按钮，查看会话日志中的请求和响应详情
4. 确认后端返回的是标准 SSE 格式（`event:` + `data:`），而非 JSON 或 chunked HTTP

### Q: 如何自定义对话标题和副标题？

两种方式：

**运行时配置（优先级高）：**
```ts
window.__CHAT_CONFIG__ = {
  endpoint: '/chat',
  title: '我的 AI 助手',
  subtitle: '企业内部知识库',
}
```

**构建时配置：**
```bash
# .env
VITE_CHAT_TITLE=我的 AI 助手
VITE_CHAT_SUBTITLE=企业内部知识库
```

### Q: FloatChat 默认显示位置不符合需求？

修改 `chatStyle` 的默认值。`FloatChat.vue` 中默认是：

```ts
const chatStyle = ref<Record<string, string>>({ bottom: '100px', right: '24px' })
```

拖拽后位置会切换为 `left` + `top`，拖拽逻辑在 `src/components/FloatChat.vue` 中。

### Q: 如何关闭暗色模式？

本库跟随 `html[data-theme="dark"]` 属性自动切换主题。在入口文件中：

```ts
// 强制使用亮色主题
document.documentElement.setAttribute('data-theme', 'light')
```

### Q: 非 Vue 项目能否使用？

可以。将 `dist/` 目录下的 UMD 包通过 `<script>` 标签引入：

```html
<script src="https://unpkg.com/@chatbotui/agent-chatbot-ui/dist/agent-chatbot-ui.umd.cjs"></script>
<script>
  window.__CHAT_CONFIG__ = { endpoint: '/chat' }
</script>
<div id="chat-app"></div>
<script>
  const { createApp } = Vue
  createApp(Chat).mount('#chat-app')
</script>
```

### Q: 如何监听消息变化？

```ts
import { watch } from 'vue'
import { useChat } from '@chatbotui/agent-chatbot-ui'

const { messages } = useChat()

watch(messages, (newMessages) => {
  console.log('消息更新:', newMessages)
}, { deep: true })
```

---

## TypeScript 类型参考

所有类型均从 `@chatbotui/agent-chatbot-ui` 导出：

```ts
import type {
  ChatMessage,
  ToolCall,
  StepInfo,
  StepStatus,
  StepType,
  InteractionChoice,
  InteractionOption,
  ConfirmRequest,
  SlotFillRequest,
  SlotDefinition,
  HitlTask,
  HitlTaskStatus,
  HitlTaskType,
  HitlAction,
  HitlRuntimeState,
  ChatConfig,
} from '@chatbotui/agent-chatbot-ui'
```

详见源码 `src/composables/useChat.ts` 中的类型定义。
