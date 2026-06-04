# @chatbotui/agent-chatbot-ui

Vue 3 AI Agent Chatbot UI 组件库，透明展示 5 步执行生命周期、人机交互 (HITL) 和流式响应。基于 [ant-design-x-vue](https://github.com/ant-design/ant-design-x-vue) 构建。

[在线 Demo](https://opendataco.github.io/agent-chatbot-ui/) · [English](#)

## 特性

- **5 步执行生命周期** — 每个 Agent 响应都透明展示完整处理流程：意图识别、本体映射、任务规划、执行、响应生成
- **人机交互 (HITL)** — 支持暂停等待用户确认、槽位填充、风险审批或任意交互选择
- **流式响应** — 通过 SSE 实时流式传输 Agent 思考过程和最终回复
- **丰富的交互卡片** — 内置确认对话框、选项网格、评分输入、槽位填充表单、审批流程等 UI
- **工具调用可视化** — 展示 skill/MCP/RAG 工具调用，包括状态、输入输出和错误信息
- **会话日志** — 内置会话日志记录，支持 JSON/Markdown 导出

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 类型检查
pnpm lint
```

## 组件

### Chat

Full-page chat layout with sidebar, welcome screen, message history, and session logging panel.

```vue
<template>
  <Chat />
</template>

<script setup>
import { Chat } from '@chatbotui/agent-chatbot-ui'
</script>
```

Configure via global `window.__CHAT_CONFIG__`:

```ts
window.__CHAT_CONFIG__ = {
  endpoint: 'https://your-agent-api.com/sse',
  title: 'My AI Assistant',
  subtitle: 'Powered by Agent Chatbot UI',
}
```

### FloatChat

Floating chat widget that can be embedded in any page. Toggles between expanded chat and a compact launcher button.

```vue
<template>
  <FloatChat />
</template>

<script setup>
import { FloatChat } from '@chatbotui/agent-chatbot-ui'
</script>
```

### MarkdownBubble

Renders an assistant message with:
- Markdown rendering (via `marked`)
- Streaming indicator (blinking cursor)
- Collapsible think/reasoning section
- Tool call cards
- 5-step execution lifecycle card
- HITL interaction cards (choice, confirm, slot-fill, approval)

### AgentExecutionCard

Standalone component for rendering the 5-step execution lifecycle visualization.

### HumanInTheLoopCard

Standalone component for rendering HITL interaction UI (confirm dialogs, option grids, slot-fill forms, approval requests).

## useChat Composable

The `useChat` composable handles SSE streaming, message state, and HITL resumption.

```ts
import { useChat } from '@chatbotui/agent-chatbot-ui'

const {
  messages,          // Ref<ChatMessage[]>
  inputValue,         // Ref<string>
  loading,            // Ref<boolean>
  messagesRef,        // Ref<HTMLElement | null>
  sendMessage,        // () => Promise<void>
  continueTask,       // (content?: string) => Promise<void>
  resumeHitl,         // (params: HitlResumeParams) => Promise<void>
  hitlState,          // Ref<HitlRuntimeState>
  hitlLoading,        // Ref<boolean>
  clearMessages,      // () => void
} = useChat({
  endpoint: '/sse',   // optional, defaults to window.__CHAT_CONFIG__.endpoint
  onChunk?: (chunk) => {},
  onError?: (error) => {},
})
```

### SSE Event Types

The composable automatically parses these SSE event types from your backend:

| Event | Description |
|-------|-------------|
| `message` | Streaming text chunk (think or content) |
| `step_update` | 5-step lifecycle progress update |
| `tool_call` / `tool_result` | Tool invocation and result |
| `interaction` | Post-task interaction choice card |
| `confirm_request` | Pre-execution confirmation (may include slot-fill) |
| `slot_fill` | Slot-fill request |
| `approval_request` | Multi-level approval request |

### HITL Resumption

When the agent sends a HITL event, the UI pauses and waits for user input. Call `resumeHitl` to continue:

```ts
// Confirm a high-risk action
resumeHitl({ action: 'confirm', taskId: 'task-123' })

// Cancel
resumeHitl({ action: 'cancel', taskId: 'task-123' })

// Fill slot values
resumeHitl({
  action: 'submit_slots',
  taskId: 'task-123',
  filledSlots: { orderId: 'PO-2024-001', type: 'urgent' },
})

// Select an interaction option
resumeHitl({ action: 'confirm', selectedValue: 'show_detail' })
```

## Installation

```bash
npm install @chatbotui/agent-chatbot-ui
# or
pnpm add @chatbotui/agent-chatbot-ui
```

### Peer Dependencies

```json
{
  "vue": "^3.5.0",
  "ant-design-vue": "^4.0.0",
  "ant-design-x-vue": "^1.6.0",
  "marked": ">=9.0.0"
}
```

## TypeScript Types

All types are exported for use in your application:

```ts
import type {
  ChatMessage,
  StepInfo,
  StepStatus,
  StepType,
  ToolCall,
  HitlTask,
  HitlRuntimeState,
  ConfirmRequest,
  SlotFillRequest,
  InteractionChoice,
  InteractionOption,
} from '@chatbotui/agent-chatbot-ui'
```

## 5-Step Execution Lifecycle

The 5-step lifecycle provides full transparency into how the agent processes each request:

| Step | Name | Description |
|------|------|-------------|
| 1 | **Intent Recognition** | Identifies user intent, operation type, and risk level |
| 2 | **Ontology Mapping** | Maps query terms to domain objects and attributes |
| 3 | **Task Planning** | Plans the sequence of actions, query conditions, and aggregations |
| 4 | **Execution** | Executes actions via connectors with latency and result tracking |
| 5 | **Response Generation** | Generates natural language response with statistics and next actions |

## Browser Compatibility

Requires Vue 3.5+ with `<script setup>` support.

## License

MIT

---

## 中文

### 特性

- **5 步执行生命周期** — 每个 Agent 响应都透明展示完整处理流程：意图识别、本体映射、任务规划、执行、响应生成
- **人机交互 (HITL)** — 支持暂停等待用户确认、槽位填充、风险审批或任意交互选择
- **流式响应** — 通过 SSE 实时流式传输 Agent 思考过程和最终回复
- **丰富的交互卡片** — 内置确认对话框、选项网格、评分输入、槽位填充表单、审批流程等 UI
- **工具调用可视化** — 展示 skill/MCP/RAG 工具调用，包括状态、输入输出和错误信息
- **会话日志** — 内置会话日志记录，支持 JSON/Markdown 导出

### 组件

#### Chat

全屏聊天布局，包含侧边栏、欢迎页面、消息历史和会话日志面板。

```vue
<template>
  <Chat />
</template>

<script setup>
import { Chat } from '@chatbotui/agent-chatbot-ui'
</script>
```

通过全局配置 `window.__CHAT_CONFIG__` 进行配置：

```ts
window.__CHAT_CONFIG__ = {
  endpoint: 'https://your-agent-api.com/sse',
  title: '我的 AI 助手',
  subtitle: '由 Agent Chatbot UI 驱动',
}
```

#### FloatChat

可嵌入任意页面的浮动聊天小部件，在展开的聊天窗口和紧凑的启动按钮之间切换。

```vue
<template>
  <FloatChat />
</template>

<script setup>
import { FloatChat } from '@chatbotui/agent-chatbot-ui'
</script>
```

#### MarkdownBubble

渲染助手消息，包含：
- Markdown 渲染（通过 `marked`）
- 流式指示器（闪烁光标）
- 可折叠的思考/推理区域
- 工具调用卡片
- 5 步执行生命周期卡片
- HITL 交互卡片（选择、确认、槽位填充、审批）

#### AgentExecutionCard

独立组件，用于渲染 5 步执行生命周期可视化。

#### HumanInTheLoopCard

独立组件，用于渲染 HITL 交互 UI（确认对话框、选项网格、槽位填充表单、审批请求）。

### useChat 组合式函数

`useChat` 组合式函数处理 SSE 流式传输、消息状态和 HITL 恢复。

```ts
import { useChat } from '@chatbotui/agent-chatbot-ui'

const {
  messages,          // Ref<ChatMessage[]>
  inputValue,        // Ref<string>
  loading,           // Ref<boolean>
  messagesRef,       // Ref<HTMLElement | null>
  sendMessage,       // () => Promise<void>
  continueTask,      // (content?: string) => Promise<void>
  resumeHitl,        // (params: HitlResumeParams) => Promise<void>
  hitlState,         // Ref<HitlRuntimeState>
  hitlLoading,       // Ref<boolean>
  clearMessages,     // () => void
} = useChat({
  endpoint: '/sse',  // 可选，默认为 window.__CHAT_CONFIG__.endpoint
  onChunk?: (chunk) => {},
  onError?: (error) => {},
})
```

### SSE 事件类型

组合式函数自动解析来自后端的以下 SSE 事件类型：

| 事件 | 描述 |
|------|------|
| `message` | 流式文本块（思考或内容） |
| `step_update` | 5 步生命周期进度更新 |
| `tool_call` / `tool_result` | 工具调用和结果 |
| `interaction` | 任务后交互选择卡片 |
| `confirm_request` | 执行前确认（可能包含槽位填充） |
| `slot_fill` | 槽位填充请求 |
| `approval_request` | 多级审批请求 |

### HITL 恢复

当 Agent 发送 HITL 事件时，UI 会暂停并等待用户输入。调用 `resumeHitl` 继续：

```ts
// 确认高风险操作
resumeHitl({ action: 'confirm', taskId: 'task-123' })

// 取消
resumeHitl({ action: 'cancel', taskId: 'task-123' })

// 填充槽位值
resumeHitl({
  action: 'submit_slots',
  taskId: 'task-123',
  filledSlots: { orderId: 'PO-2024-001', type: 'urgent' },
})

// 选择交互选项
resumeHitl({ action: 'confirm', selectedValue: 'show_detail' })
```

### 安装

```bash
npm install @chatbotui/agent-chatbot-ui
# 或
pnpm add @chatbotui/agent-chatbot-ui
```

### Peer Dependencies

```json
{
  "vue": "^3.5.0",
  "ant-design-vue": "^4.0.0",
  "ant-design-x-vue": "^1.6.0",
  "marked": ">=9.0.0"
}
```

### TypeScript 类型

所有类型都已导出，可在应用中使用：

```ts
import type {
  ChatMessage,
  StepInfo,
  StepStatus,
  StepType,
  ToolCall,
  HitlTask,
  HitlRuntimeState,
  ConfirmRequest,
  SlotFillRequest,
  InteractionChoice,
  InteractionOption,
} from '@chatbotui/agent-chatbot-ui'
```

### 5 步执行生命周期

5 步生命周期提供 Agent 如何处理每个请求的完整透明度：

| 步骤 | 名称 | 描述 |
|------|------|------|
| 1 | **意图识别** | 识别用户意图、操作类型和风险级别 |
| 2 | **本体映射** | 将查询术语映射到领域对象和属性 |
| 3 | **任务规划** | 规划操作序列、查询条件和聚合 |
| 4 | **执行** | 通过连接器执行操作，跟踪延迟和结果 |
| 5 | **响应生成** | 生成带有统计和后续操作的自然语言响应 |

### 浏览器兼容性

需要 Vue 3.5+ 支持 `<script setup>`。
