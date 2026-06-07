# Chat 组件集成指南

> 本文档描述如何将 `@ant-design-x-vue/agent-chatbot-ui` 组件集成到 VitePress 静态项目中，以及 `five_step` 和 `general_chat` 两种对话模式的 SSE 协议规范。

---

## 目录

- [快速集成到 VitePress](#快速集成到-vitepress)
- [两种对话模式详解](#两种对话模式详解)
- [SSE 事件对照表](#sse-事件对照表)
- [后端 API 规范](#后端-api-规范)
- [HITL 交互机制](#hitl-交互机制)

---

## 快速集成到 VitePress

### 方式一：页面级导入

在 `.md` 文件中直接导入 `Chat` 组件：

```md
---
layout: doc
---
<script setup>
import { Chat } from '../src/index.ts'
</script>

<Chat />
```

> 注意：VitePress 默认以源码模式解析 Markdown，需要确保 `src/` 目录被 Vite 正确解析。

### 方式二：全局注册（推荐）

在 VitePress 主题中全局注册组件，参考 `.vitepress/config.ts`：

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import Chat from './src/components/Chat.vue'
import MarkdownBubble from './src/components/MarkdownBubble.vue'

export default defineConfig({
  // ...
})
```

在主题入口中注册：

```ts
// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import { Chat, MarkdownBubble } from '../../src/index.ts'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Chat', Chat)
    app.component('MarkdownBubble', MarkdownBubble)
  }
}
```

### 方式三：作为子模块引用

如果 Chat UI 放在独立子目录，可以作为 git submodule 或 npm 包引用：

```bash
# 作为 submodule
git submodule add <repo-url> packages/chatbot-ui

# 在 package.json 中添加依赖
pnpm add file:./packages/chatbot-ui
```

---

## 配置 Endpoint

在 VitePress 的 `config.ts` 中通过 `<script>` 注入全局配置：

```ts
export default defineConfig({
  head: [
    ['script', {}, `
      window.__CHAT_CONFIG__ = {
        endpoint: '/api/chat',   // 你的后端接口地址
        title: 'AI 助手',
        subtitle: 'Powered by Agent'
      }
    `]
  ]
})
```

| 配置项 | 类型 | 说明 |
|-------|------|------|
| `endpoint` | `string` | 后端 Chat API 地址，默认 `/chat` |
| `title` | `string` | 聊天窗口标题 |
| `subtitle` | `string` | 副标题 |

运行时也可以覆盖：

```bash
VITE_CHAT_ENDPOINT=http://localhost:8000/chat pnpm dev
```

---

## 两种对话模式详解

`five_step` 和 `general_chat` 是后端通过 `stream_start` 事件声明的运行模式，**前端会自动识别，无需手动配置**。

### Five Step 模式 — 本体业务域模式

适用于结构化业务查询场景（RAG 检索、ERP 系统操作、数据分析）。后端会分步骤推送执行过程，用户可以清晰看到 Agent 的意图识别、任务规划和工具调用过程。

#### 典型 SSE 序列

```
event: stream_start
data: {"mode": "five_step"}

event: step_update          ← Step 1: 意图识别
data: {"step": 1, "stepName": "意图识别", "status": "completed", "summary": "查询未执行采购需求", "details": {"intent": "query_unexecuted_purchase_requests", "operationType": "query", "riskLevel": "low"}}

event: step_update          ← Step 2: 本体对象定位
data: {"step": 2, "stepName": "本体对象定位", "status": "completed", "summary": "命中采购需求对象", "details": {"objectType": "purchase_request", "objectLabel": "采购需求"}}

event: step_update          ← Step 3: 任务规划
data: {"step": 3, "stepName": "任务规划", "status": "completed", "summary": "计划查询未执行且未删除采购需求", "details": {"plannedActions": [...], "queryConditions": [...]}}

event: step_update          ← Step 4: 执行过程
data: {"step": 4, "stepName": "执行过程", "status": "completed", "connector": {"name": "ProcurementSystemConnector", "status": "success", "resultCount": 5}, "summary": "查询完成，共返回 5 条记录"}

event: step_update          ← Step 5: 生成回复
data: {"step": 5, "stepName": "生成回复", "status": "completed", "suggestedActions": [{"id": "show_detail", "label": "展示明细"}, ...]}

event: interaction          ← 可选：询问用户后续操作
data: {"id": "interaction-001", "type": "choice", "title": "请选择后续操作", "required": false, "options": [{"id": "show_detail", "label": "展示明细列表", "icon": "list", "action": "navigate", "recommended": true}, ...]}

event: message
data: {"content": "已查询到 **5 条** 未执行采购需求。\n\n来源分布：\n\n- **系统接口集成**：3 条\n- **手工创建**：2 条"}

event: done
data: {}
```

前端渲染效果：消息气泡上方依次展示 5 个步骤卡片（意图识别 → 本体对象定位 → 任务规划 → 执行过程 → 生成回复），每个步骤可展开查看详情。

### General Chat 模式 — 普通聊天模式

适用于问答、代码生成、创意写作等非结构化场景。后端只推送连续的文本流，不包含执行步骤信息。

#### 典型 SSE 序列

```
event: stream_start
data: {"mode": "general_chat"}

event: think
data: {"content": "Let me think through this systematically...\n\n**Key dimensions to evaluate:**\n\n1. **Team structure**..."}

event: think_done
data: {}

event: message
data: {"content": "This is a high-stakes architectural decision. Let me walk you through..."}
data: {"content": " What\'s your current team size?"}

event: done
data: {}
```

前端渲染效果：先显示折叠的"思考中"区域，思考完成后展开显示思考内容，然后流式渲染回复文本。

### 模式自动识别规则

前端根据以下规则自动推断模式：

1. 收到 `stream_start` 事件且包含 `mode` 字段 → 使用该值
2. 收到 `step_update` 事件但没有 `mode` 字段 → 自动降级为 `five_step`
3. 收到 `think` / `message` 事件但没有 `step_update` → 自动降级为 `general_chat`

---

## SSE 事件对照表

### 核心事件

| 后端事件 | 触发时机 | 前端 `ChatMessage` 字段 | 说明 |
|---------|---------|----------------------|------|
| `stream_start` | 流开始时 | `mode` | 声明运行模式（`five_step` 或 `general_chat`） |
| `think` | 思考过程 | `thinkContent` | 累加追加到思考区域 |
| `think_done` | 思考结束 | `thinkDone = true` | 展开思考区域 |
| `message` / `content` | 正文片段 | `content` | 累加追加到气泡，流式渲染 |
| `done` | 流结束 | `done = true` | 标记消息完成，移除 loading 状态 |
| `error` | 发生错误 | `content = "Error: ..."` | 显示错误信息 |

### Five Step 专属事件

| 后端事件 | 触发时机 | 前端 `ChatMessage` 字段 | 说明 |
|---------|---------|----------------------|------|
| `step_update` | 五步法每步完成 | `stepLifecycle[]` | 追加步骤到执行路径数组 |

### 工具调用事件

| 后端事件 | 触发时机 | 前端 `ChatMessage` 字段 | 说明 |
|---------|---------|----------------------|------|
| `tool_call` | 工具开始调用 | `toolCalls[]` | 追加工具调用卡片，status = `pending` |
| `tool_result` | 工具调用完成 | `toolCalls[]` | 更新对应工具卡片状态和输出 |

### HITL 交互事件

| 后端事件 | 触发时机 | 前端渲染 | 说明 |
|---------|---------|---------|------|
| `interaction` | 需要用户选择后续动作 | `InteractionChoice` 卡片 | 显示选项按钮 |
| `confirm_request` | 高风险操作确认 | `ConfirmRequest` 卡片 | 确认/取消按钮 |
| `slot_fill` | 需要用户补充信息 | `SlotFillRequest` 卡片 | 表单槽位填写 |
| `approval_request` | 审批请求 | `ApprovalRequest` 卡片 | 审批/拒绝按钮 |

### 字段命名规范

后端可使用下划线命名或驼峰命名，前端会自动兼容：

```
task_id / taskId      → assistantMsg.taskId
run_id / runId        → assistantMsg.runId
conversation_id        → hitlState.conversationId
step_update           → assistantMsg.stepLifecycle[]
confirm_request       → assistantMsg.confirmRequest
slot_fill             → assistantMsg.slotFillRequest
```

---

## 后端 API 规范

### 请求格式

```
POST /chat
Content-Type: application/json

{
  "message": "帮我查一下采购需求",       // 用户输入（流式模式下为字符串，非流式为数组）
  "session_id": "可选的会话ID",         // 用于多轮对话上下文
  "stream": true                         // true = SSE 流式响应
}
```

### 非流式响应（`stream: false`）

```json
{
  "response": "已查询到 5 条未执行采购需求..."
}
```

### SSE 流式响应

后端返回 `Content-Type: text/event-stream`，每个事件格式：

```
event: <event_type>
data: <JSON>

```

> 注意：事件块之间以**空行分隔**（`\n\n`），这是 SSE 协议标准。

### HITL 继续接口

当用户在交互卡片上点击按钮后，前端会调用继续接口：

```
POST /chat/confirm
Content-Type: application/json

{
  "confirmation_result": {
    "task_id": "confirm-001",
    "action": "confirm",               // confirm | cancel | submit_slots
    "selected_value": "show_detail",   // 用户选择的选项 ID
    "filled_slots": {},                // 槽位填充的值
    "user_input": "帮我查采购需求"      // 原始用户输入
  },
  "session_id": "...",
  "stream": true
}
```

前端会自动拼接 `/confirm` 后缀，完整路径为 `{endpoint}/confirm`。

---

## HITL 交互机制

### 用户操作 → 前端行为映射

| 用户操作 | 前端调用 | 发送 action | 说明 |
|---------|---------|------------|------|
| 点击选项按钮（execute/confirm） | `resumeHitl()` | `confirm` | 继续执行选中的动作 |
| 点击选项按钮（navigate/export） | `continueTask()` | 通过正文发送 `[action] <id>` | 作为新的用户消息发送 |
| 点击确认卡片"确认"按钮 | `resumeHitl()` | `confirm` | 继续高风险操作 |
| 点击确认卡片"取消"按钮 | `resumeHitl()` | `cancel` | 放弃当前操作 |
| 填写槽位表单并提交 | `resumeHitl()` | `submit_slots` + `filledSlots` | 补充信息后继续 |
| 点击槽位卡片"取消" | `resumeHitl()` | `cancel` | 放弃当前操作 |
| 点击星级评分 | `continueTask()` | 通过正文发送 `[rating] <n>` | 作为新消息发送 |

### Slot 槽位定义示例

```json
{
  "id": "slot-fill-001",
  "step": 3,
  "title": "补充采购信息",
  "message": "请填写以下信息以便生成询价单",
  "type": "slot_fill",
  "slots": [
    {
      "id": "supplier",
      "label": "供应商",
      "type": "select",
      "required": true,
      "options": [
        {"value": "supplier_a", "label": "供应商 A"},
        {"value": "supplier_b", "label": "供应商 B"}
      ]
    },
    {
      "id": "quantity",
      "label": "采购数量",
      "type": "number",
      "required": true,
      "validation": {"min": 1, "max": 10000}
    },
    {
      "id": "notes",
      "label": "备注",
      "type": "textarea",
      "required": false,
      "placeholder": "请输入其他要求..."
    }
  ],
  "continueAction": {"id": "create_inquiry", "label": "生成询价单"},
  "cancelAction": {"id": "cancel", "label": "取消"},
  "riskLevel": "low"
}
```

### Interaction 选项示例

```json
{
  "id": "interaction-001",
  "title": "请选择后续操作",
  "description": "已查询到 5 条未执行采购需求，您希望如何继续？",
  "type": "choice",
  "required": false,
  "options": [
    {"id": "show_detail", "label": "展示明细列表", "icon": "list", "action": "navigate", "description": "查看每条采购需求的完整信息", "recommended": true},
    {"id": "aggregate_dept", "label": "按部门汇总", "icon": "chart", "action": "execute", "description": "按申请部门统计数量分布"},
    {"id": "create_inquiry", "label": "生成询价单", "icon": "compose", "action": "execute"},
    {"id": "export", "label": "导出清单", "icon": "export", "action": "export"}
  ]
}
```

### 模式选择建议

| 场景 | 推荐模式 | 理由 |
|-----|---------|------|
| 业务查询（RAG/知识库） | `five_step` | 透明展示意图识别→规划→执行过程，增强用户信任 |
| ERP/CRM 系统操作 | `five_step` | 展示数据来源和操作对象，避免误操作 |
| 通用问答 / 代码生成 | `general_chat` | 纯流式响应，更轻量，延迟更低 |
| 需要用户干预（审批/确认） | `five_step` + HITL | 五步法 + 交互卡片，支持复杂业务流 |
| 创意写作 / 对话聊天 | `general_chat` | 思考链可折叠，体验更自然 |

---

## 组件导出清单

```ts
// 完整导出（从 src/index.ts）
export { default as Chat }            // 全功能聊天页面组件
export { default as FloatChat }       // 悬浮窗聊天组件
export { default as MarkdownBubble }  // 单条消息气泡组件
export { default as AgentExecutionCard }  // Agent 执行卡片组件
export { default as HumanInTheLoopCard } // HITL 交互卡片组件

// Composable
export { useChat }                    // 核心聊天逻辑 hook

// 类型定义
export type { ChatMessage, ToolCall, StepInfo, InteractionChoice, InteractionOption, ConfirmRequest, SlotFillRequest, HitlTask, HitlAction, ... }
```

如需单独使用气泡组件：

```vue
<template>
  <MarkdownBubble
    :content="message.content"
    role="assistant"
    :streaming="!message.done"
    :think-content="message.thinkContent"
    :think-done="message.thinkDone"
    :step-lifecycle="message.stepLifecycle"
    :interaction="message.interaction"
    :confirm-request="message.confirmRequest"
    :slot-fill-request="message.slotFillRequest"
    @hitl-select="handleHitlSelect"
    @hitl-confirm="handleHitlConfirm"
    @hitl-cancel="handleHitlCancel"
    @hitl-slot-fill="handleHitlSlotFill"
  />
</template>
```
