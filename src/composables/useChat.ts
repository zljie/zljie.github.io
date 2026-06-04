import { ref, reactive, nextTick, shallowRef } from 'vue'
import { chatLogger } from './chatLogger'

declare global {
  interface Window {
    __CHAT_CONFIG__?: {
      endpoint: string
      title?: string
      subtitle?: string
    }
  }
}

// ─── HITL State Types ────────────────────────────────────────────

/** HITL pending task status */
export type HitlTaskStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired'

/** HITL task types */
export type HitlTaskType = 'confirm' | 'slot_fill' | 'risk_confirm' | 'approval'

/** HITL resume action types */
export type HitlAction = 'confirm' | 'cancel' | 'submit_slots' | 'reject'

/**
 * HITL Task - represents a pending human-in-the-loop task
 */
export interface HitlTask {
  taskId: string
  runId?: string
  type: HitlTaskType
  status: HitlTaskStatus
  step: StepType
  title: string
  message: string
  riskLevel: 'low' | 'medium' | 'high'
}

/**
 * HITL Runtime State - tracks the current HITL session
 */
export interface HitlRuntimeState {
  /** Current conversation ID */
  conversationId: string | null
  /** Current run ID */
  currentRunId: string | null
  /** Current pending HITL task */
  currentTask: HitlTask | null
  /** Whether we're waiting for HITL response */
  isWaitingHitl: boolean
  /** Original user input for this task */
  userInput: string | null
}

// ─── Step Lifecycle Types ──────────────────────────────────────────

export type StepStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'waiting_confirmation'
  | 'blocked'
  | 'error'

export type StepType = 1 | 2 | 3 | 4 | 5

/** Step 1 — 意图识别详情 */
export interface Step1Details {
  intent: string
  intentLabel: string
  objectTerm: string
  normalizedTerm?: string
  operationType: 'query' | 'create' | 'update' | 'delete' | 'publish' | 'recommend'
  riskLevel: 'low' | 'medium' | 'high'
  requiresConfirmation: boolean
  requiresConfirmationReason?: string
  alternativeIntents?: string[]
}

/** Step 2 — 本体对象定位详情 */
export interface AttributeInfo {
  key: string
  label: string
  usage: 'filter' | 'display' | 'rule' | 'audit'
}

export interface OntologyGap {
  gapType: 'missing_object' | 'missing_attribute' | 'missing_action' | 'missing_rule'
  description: string
  suggestion: string
}

export interface Step2Details {
  objectType: string
  objectLabel: string
  hitKeywords: string[]
  attributes: AttributeInfo[]
  availableActions: string[]
  ontologyCompleteness: 'full' | 'partial' | 'insufficient'
  gaps?: OntologyGap[]
}

/** Step 3 — 任务规划详情 */
export interface QueryCondition {
  field: string
  operator: string
  value: any
  label: string
}

export interface AggregationRule {
  type: 'count' | 'sum' | 'group_by'
  fields: string[]
  label: string
}

export interface PlannedAction {
  sequence: number
  actionId: string
  actionLabel: string
  connector?: string
  description: string
}

export interface Step3Details {
  plannedActions: PlannedAction[]
  queryConditions?: QueryCondition[]
  aggregationRules?: AggregationRule[]
  displayFields?: string[]
  riskLevel: 'low' | 'medium' | 'high'
  requiresConfirmation: boolean
  alternativePlans?: PlannedAction[][]
}

/** Step 4 — 执行过程详情 */
export interface ExecutionRecord {
  connectorName: string
  connectorId: string
  actionId: string
  status: 'pending' | 'running' | 'success' | 'error' | 'timeout'
  startTime?: string
  endTime?: string
  latencyMs?: number
  requestParams?: Record<string, any>
  responseSummary?: string
  resultCount?: number
  errorMessage?: string
  errorCode?: string
}

export interface Step4Details {
  executions: ExecutionRecord[]
}

/** Step 5 — 生成回复详情 */
export interface RecordStat {
  label: string
  value: string | number
  unit?: string
}

export interface SuggestedAction {
  id: string
  label: string
  type: 'navigate' | 'execute' | 'export' | 'compose'
  params?: Record<string, any>
}

export interface Step5Details {
  resultSummary: string
  statistics?: RecordStat[]
  resultDefinition?: string
  nextActions: SuggestedAction[]
  ontologyImprovements?: OntologyGap[]
}

/** 连接器信息（Step 4 专用） */
export interface ConnectorInfo {
  name: string
  id: string
  status: 'pending' | 'success' | 'error'
  resultSummary?: string
  resultCount?: number
  latencyMs?: number
  errorMessage?: string
}

/** 完整步骤信息 */
export interface StepInfo {
  step: StepType
  stepName: string
  status: StepStatus
  summary?: string
  details?: Step1Details | Step2Details | Step3Details | Step4Details | Step5Details
  connector?: ConnectorInfo
  suggestedActions?: SuggestedAction[]
}

// ─── HITL Interaction Types ──────────────────────────────────────

/** 单个交互选项 */
export interface InteractionOption {
  id: string
  /** 显示文案 */
  label: string
  /** 图标类型 */
  icon?: 'list' | 'chart' | 'export' | 'filter' | 'compose' | 'search' | 'approve' | 'reject' | 'detail' | 'compare'
  /** 动作类型：用户选择后触发 */
  action: 'navigate' | 'execute' | 'export' | 'compose' | 'confirm' | 'cancel'
  /** 传递给后端的参数 */
  params?: Record<string, any>
  /** 选项描述（次要说明） */
  description?: string
  /** 是否高亮推荐 */
  recommended?: boolean
}

/**
 * SSE `interaction` 事件 — 任务完成后，Agent 询问用户需要哪项后续动作
 * 典型场景：结果展示后「需要我展示详细列表吗？」
 */
export interface InteractionChoice {
  /** 交互 ID */
  id: string
  /** 交互标题 */
  title: string
  /** 交互描述 */
  description?: string
  /** 交互类型 */
  type: 'choice' | 'confirm' | 'rating' | 'input'
  /** 可选选项列表 */
  options?: InteractionOption[]
  /** confirm 类型专用：操作描述 */
  confirmDetails?: {
    action: string
    riskLevel: 'low' | 'medium' | 'high'
    affectedCount?: number
    affectedLabel?: string
  }
  /** rating 类型专用：评分范围 */
  ratingConfig?: {
    min: number
    max: number
    labels?: { min: string; max: string }
  }
  /** input 类型专用：提示文案 */
  inputPlaceholder?: string
  /** 是否必须响应（true = 用户必须选一个才能继续） */
  required: boolean
  /** 超时秒数（可选） */
  timeoutSeconds?: number
}

/**
 * SSE `confirm_request` 事件 — 高风险操作执行前的确认请求
 * 当包含 slots 字段时，表示需要用户补充信息的槽位填充请求
 */
export interface ConfirmRequest {
  id: string
  step: StepType
  title: string
  message: string
  confirmAction: { id: string; label: string }
  cancelAction: { id: string; label: string }
  riskLevel: 'low' | 'medium' | 'high'
  affectedRecords?: Array<{ type: string; id: string; label: string }>
  /** 详细确认信息（可选） */
  confirmDetails?: {
    action: string
    riskLevel: 'low' | 'medium' | 'high'
    affectedCount?: number
    affectedLabel?: string
  }
  /** 槽位填充需求（可选） */
  slots?: SlotDefinition[]
  /** 提交后继续执行的 action（用于 slots 填充场景） */
  action?: { id: string; label: string }
}

/**
 * 槽位定义 — HITL 需要用户补充的字段
 */
export interface SlotDefinition {
  /** 槽位标识符（后端期望的字段名） */
  id: string
  /** 槽位显示名称 */
  label: string
  /** 槽位类型 */
  type: 'text' | 'number' | 'select' | 'date' | 'textarea'
  /** 是否必填 */
  required: boolean
  /** 占位提示 */
  placeholder?: string
  /** 校验规则 */
  validation?: {
    /** 最小值（number 类型） */
    min?: number
    /** 最大值（number 类型） */
    max?: number
    /** 最小长度（text/textarea 类型） */
    minLength?: number
    /** 最大长度（text/textarea 类型） */
    maxLength?: number
    /** 正则表达式校验 */
    pattern?: string
    /** 正则表达式错误提示 */
    patternMessage?: string
  }
  /** 下拉选项（select 类型） */
  options?: Array<{ value: string; label: string }>
  /** 默认值 */
  defaultValue?: string | number
  /** 帮助说明 */
  helpText?: string
}

/**
 * SSE `confirm_request` 事件扩展 — 槽位填充请求
 * 当后端需要用户补充信息时使用（如：填写单据编号、单据类型）
 */
export interface SlotFillRequest {
  id: string
  step: StepType
  title: string
  message: string
  /** 需要填充的槽位列表 */
  slots: SlotDefinition[]
  /** 提交后继续执行的 action */
  continueAction: { id: string; label: string }
  /** 取消操作 */
  cancelAction: { id: string; label: string }
  /** 风险等级 */
  riskLevel: 'low' | 'medium' | 'high'
}

/**
 * SSE `approval_request` 事件 — 审批请求
 * 用于多级审批、主管确认等场景
 */
export interface ApprovalRequest {
  id: string
  step: StepType
  title: string
  message: string
  /** 审批人信息 */
  approver: {
    id: string
    name: string
    role?: string
  }
  /** 审批操作配置 */
  approveAction: { id: string; label: string }
  rejectAction: { id: string; label: string }
  /** 风险等级 */
  riskLevel: 'low' | 'medium' | 'high'
  /** 审批详情 */
  approvalDetails?: {
    action: string
    affectedCount?: number
    affectedLabel?: string
    reason?: string
  }
}

// ─── Tool Call Types ──────────────────────────────────────────────

export interface ToolCall {
  id: string
  type: 'skill' | 'mcp' | 'rag'
  name: string
  description?: string
  input?: any
  status: 'pending' | 'success' | 'error'
  output?: any
  error?: string
}

// ─── Chat Message ─────────────────────────────────────────────────

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  /** Markdown-rendered HTML for the assistant message */
  rendered?: string
  /** Raw think/reasoning text being streamed */
  thinkContent?: string
  /** Whether the think section has finished streaming */
  thinkDone?: boolean
  /** Whether the full message has finished streaming */
  done?: boolean
  /** Tool calls invoked during this assistant response */
  toolCalls?: ToolCall[]
  /** 5-step execution lifecycle (accumulated in order) */
  stepLifecycle?: StepInfo[]
  /** HITL interaction choice card (from SSE interaction event) */
  interaction?: InteractionChoice
  /** HITL confirm request (from SSE confirm_request event) */
  confirmRequest?: ConfirmRequest
  /** HITL slot-fill request (from SSE confirm_request event with slots) */
  slotFillRequest?: SlotFillRequest
  /** HITL approval request (from SSE approval_request event) */
  approvalRequest?: ApprovalRequest
  /** Task ID from the backend for HITL resume */
  taskId?: string
  /** Run ID from the backend for HITL resume */
  runId?: string
  /** Whether this message has pending HITL action */
  hasPendingHitl?: boolean
}

// ─── SSE Parser ─────────────────────────────────────────────────────

interface Chunk {
  think?: string
  think_done?: boolean
  content?: string
  done?: boolean
  error?: string
  task_id?: string
  run_id?: string
  conversation_id?: string
  step_update?: {
    step: StepType
    stepName: string
    status: StepStatus
    summary?: string
    details?: any
    connector?: ConnectorInfo
    suggestedActions?: SuggestedAction[]
  }
  interaction?: InteractionChoice
  confirm_request?: ConfirmRequest
  slot_fill?: SlotFillRequest
  risk_confirm_request?: ConfirmRequest
  approval_request?: ApprovalRequest
  tool_call?: {
    type: 'skill' | 'mcp' | 'rag'
    name: string
    description?: string
    input?: any
    id: string
  }
  tool_result?: {
    id: string
    name: string
    status: 'success' | 'error' | 'pending'
    output?: any
    error?: string
  }
}

function parseSSE(raw: string): Chunk[] {
  const chunks: Chunk[] = []
  const curLines: string[] = []

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trimEnd()
    if (line === '') {
      if (curLines.length > 0) {
        const parsed = parseEventLines(curLines)
        for (const c of parsed) chunks.push(c)
        curLines.length = 0
      }
    } else {
      curLines.push(line)
    }
  }
  if (curLines.length > 0) {
    const parsed = parseEventLines(curLines)
    for (const c of parsed) chunks.push(c)
  }
  return chunks
}

function parseEventLines(lines: string[]): Chunk[] {
  let eventType: string | null = null
  const dataLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventType = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim().replace(/\r$/, ''))
    }
  }

  if (!eventType) eventType = 'message'
  if (dataLines.length === 0) return []

  const out: Chunk[] = []
  for (const dl of dataLines) {
    if (dl === '[DONE]') {
      out.push({ done: true })
      continue
    }

    let body: Record<string, any>
    try {
      body = JSON.parse(dl)
    } catch {
      continue
    }

    if (typeof body.data === 'string') {
      try {
        body = { ...body, ...JSON.parse(body.data) }
        delete body.data
      } catch {
        // keep original body
      }
    }

    // Extract task_id, run_id, conversation_id from body if present
    const { taskId, runId, conversationId } = body
    const baseChunk: Partial<Chunk> = {}
    if (taskId) baseChunk.task_id = taskId
    if (runId) baseChunk.run_id = runId
    if (conversationId) baseChunk.conversation_id = conversationId

    switch (eventType) {
      case 'think':        out.push({ ...baseChunk, think: body.content }); break
      case 'think_done':   out.push({ ...baseChunk, think_done: true }); break
      case 'content':      out.push({ ...baseChunk, content: body.content }); break
      case 'message':      out.push({ ...baseChunk, content: body.content }); break
      case 'step_update':  out.push({ ...baseChunk, step_update: body as any }); break
      case 'interaction':  out.push({ ...baseChunk, interaction: body as any }); break
      case 'confirm_request':     out.push({ ...baseChunk, confirm_request: body as any }); break
      case 'slot_fill':
      case 'slot_fill_request':    out.push({ ...baseChunk, slot_fill: body as any }); break
      case 'risk_confirm_request': out.push({ ...baseChunk, risk_confirm_request: body as any }); break
      case 'approval_request':     out.push({ ...baseChunk, approval_request: body as any }); break
      case 'tool_call':    out.push({ ...baseChunk, tool_call: body as any }); break
      case 'tool_result':  out.push({ ...baseChunk, tool_result: body as any }); break
      case 'done':         out.push({ ...baseChunk, done: true }); break
      case 'error':        out.push({ ...baseChunk, error: body.message || JSON.stringify(body) }); break
    }
  }
  return out
}

function getEndpoint(): string {
  return (
    (typeof window !== 'undefined' && window.__CHAT_CONFIG__?.endpoint) ||
    '/chat'
  )
}

export function useChat(initialMessages?: ChatMessage[]) {
  const messages = ref<ChatMessage[]>(initialMessages ? [...initialMessages] : [])
  const inputValue = ref('')
  const loading = ref(false)
  const messagesRef = ref<HTMLElement>()
  const messageIdCounter = ref(initialMessages?.length ?? 0)

  // ─── HITL State ───────────────────────────────────────────────
  /** Current HITL runtime state */
  const hitlState = ref<HitlRuntimeState>({
    conversationId: null,
    currentRunId: null,
    currentTask: null,
    isWaitingHitl: false,
    userInput: null,
  })

  /** Whether a HITL action is in progress (prevents duplicate submissions) */
  const hitlLoading = ref(false)

  /** Current session ID for chat logging */
  const currentSessionId = ref<string | null>(null)

  function setMessages(msgs: ChatMessage[]) {
    messages.value = msgs.map((m) => ({ ...m }))
    messageIdCounter.value = msgs.length
    nextTick(() => scrollToBottom())
  }

  function clearMessages() {
    messages.value = []
    messageIdCounter.value = 0
  }

  function scrollToBottom() {
    nextTick(() => {
      if (messagesRef.value) {
        messagesRef.value.scrollTop = messagesRef.value.scrollHeight
      }
    })
  }

  function scrollToMessage(id: number) {
    nextTick(() => {
      if (!messagesRef.value) return
      const el = messagesRef.value.querySelector(`[data-msg-id="${id}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' })
    })
  }

  async function sendMessageNonStreaming() {
    const text = inputValue.value.trim()
    if (!text || loading.value) return

    inputValue.value = ''

    const userMsg: ChatMessage = {
      id: ++messageIdCounter.value,
      role: 'user',
      content: text,
    }
    messages.value.push(userMsg)
    scrollToBottom()

    loading.value = true

    chatLogger.logUserInput(text)

    try {
      const endpoint = getEndpoint()
      const requestBody = {
        message: messages.value
          .filter((m) => m.role === 'user')
          .map((m) => m.content),
        session_id: currentSessionId.value,
        stream: false,
        enable_five_step: true,
      }

      chatLogger.logBackendRequest(requestBody, endpoint)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      chatLogger.logBackendResponse(data, response.status)

      const reply: ChatMessage = {
        id: ++messageIdCounter.value,
        role: 'assistant',
        content: data.response || data.reply || data.content || JSON.stringify(data),
        done: true,
      }
      messages.value.push(reply)
    } catch (err: any) {
      chatLogger.logError(err, 'Non-streaming request failed')
      const reply: ChatMessage = {
        id: ++messageIdCounter.value,
        role: 'assistant',
        content: `Error: Could not reach backend at ${getEndpoint()}`,
        done: true,
      }
      messages.value.push(reply)
    }

    loading.value = false
    scrollToBottom()
  }

  async function sendMessageStreaming(text: string, originalUserInput?: string): Promise<void> {
    const assistantMsg = reactive<ChatMessage>({
      id: ++messageIdCounter.value,
      role: 'assistant',
      content: '',
      thinkContent: '',
      thinkDone: false,
      done: false,
      toolCalls: [],
      stepLifecycle: [],
      interaction: undefined,
      confirmRequest: undefined,
      slotFillRequest: undefined,
      taskId: undefined,
      runId: undefined,
    })
    messages.value.push(assistantMsg)
    scrollToMessage(assistantMsg.id)

    chatLogger.logUserInput(text)

    // Extract task ID and run ID from SSE events
    let capturedTaskId: string | undefined
    let capturedRunId: string | undefined
    let capturedConversationId: string | undefined

    try {
      const endpoint = getEndpoint()
      const requestBody = {
        message: text,
        session_id: currentSessionId.value,
        stream: true,
        enable_five_step: true,
      }

      chatLogger.logBackendRequest(requestBody, endpoint)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.body) {
        throw new Error('Response body is null — streaming not supported')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunkText = decoder.decode(value, { stream: !done })
        buffer += chunkText

        chatLogger.logSSEChunk({ raw: chunkText }, chunkText)

        buffer = buffer.replace(/\r\n/g, '\n')
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const eventBlock of parts) {
          if (!eventBlock.trim()) continue
          const chunks = parseSSE(eventBlock)
          for (const chunk of chunks) {
            chatLogger.logSSEChunk(chunk)

            // Capture task_id, run_id, conversation_id from any chunk
            if (chunk.task_id && !capturedTaskId) {
              capturedTaskId = chunk.task_id
              assistantMsg.taskId = chunk.task_id
            }
            if (chunk.run_id && !capturedRunId) {
              capturedRunId = chunk.run_id
              assistantMsg.runId = chunk.run_id
            }
            if (chunk.conversation_id && !capturedConversationId) {
              capturedConversationId = chunk.conversation_id
            }

            if (chunk.error) {
              assistantMsg.content = `Error: ${chunk.error}`
              assistantMsg.done = true
              break
            }

            if (chunk.think !== undefined) {
              assistantMsg.thinkContent = (assistantMsg.thinkContent || '') + chunk.think
              scrollToMessage(assistantMsg.id)
            }

            if (chunk.think_done) {
              assistantMsg.thinkDone = true
            }

            function getCurrentStepName(): string | null {
              const steps = assistantMsg.stepLifecycle
              if (!steps || steps.length === 0) return null
              const activeOrCompleted = steps.filter(
                (s) => s.status === 'active' || s.status === 'completed'
              )
              if (activeOrCompleted.length === 0) return null
              const latest = activeOrCompleted[activeOrCompleted.length - 1]
              return latest.stepName || `Step ${latest.step}`
            }

            if (chunk.content !== undefined) {
              const stepName = getCurrentStepName()
              const prefix = stepName ? `\n\n**【${stepName}】**\n` : '\n\n'
              assistantMsg.content = (assistantMsg.content || '') + prefix + chunk.content
              scrollToMessage(assistantMsg.id)
            }

            if (chunk.tool_call !== undefined) {
              const tc = chunk.tool_call
              if (!assistantMsg.toolCalls) assistantMsg.toolCalls = []
              assistantMsg.toolCalls.push({
                id: tc.id,
                type: tc.type,
                name: tc.name,
                description: tc.description,
                input: tc.input,
                status: 'pending',
              })
              scrollToMessage(assistantMsg.id)
            }

            if (chunk.tool_result !== undefined) {
              const tr = chunk.tool_result
              if (assistantMsg.toolCalls) {
                const call = assistantMsg.toolCalls.find((c) => c.id === tr.id)
                if (call) {
                  call.status = tr.status
                  call.output = tr.output
                  call.error = tr.error
                }
              }
              scrollToMessage(assistantMsg.id)
            }

            if (chunk.step_update !== undefined) {
              const su = chunk.step_update
              if (!assistantMsg.stepLifecycle) assistantMsg.stepLifecycle = []
              const idx = assistantMsg.stepLifecycle.findIndex((s) => s.step === su.step)
              if (idx >= 0) {
                Object.assign(assistantMsg.stepLifecycle[idx], su)
              } else {
                assistantMsg.stepLifecycle.push(su as any)
              }
              scrollToMessage(assistantMsg.id)
            }

            if (chunk.interaction !== undefined) {
              assistantMsg.interaction = chunk.interaction
              scrollToMessage(assistantMsg.id)
            }

            if (chunk.confirm_request !== undefined) {
              const cr = chunk.confirm_request
              const taskId = cr.id || capturedTaskId || `confirm-${Date.now()}`

              // Update HITL state
              hitlState.value = {
                conversationId: capturedConversationId || hitlState.value.conversationId,
                currentRunId: capturedRunId || hitlState.value.currentRunId,
                currentTask: {
                  taskId,
                  runId: capturedRunId,
                  type: 'confirm',
                  status: 'pending',
                  step: cr.step,
                  title: cr.title,
                  message: cr.message,
                  riskLevel: cr.riskLevel,
                },
                isWaitingHitl: true,
                userInput: originalUserInput || text,
              }
              assistantMsg.hasPendingHitl = true

              if (cr.slots && Array.isArray(cr.slots) && cr.slots.length > 0) {
                assistantMsg.slotFillRequest = {
                  id: taskId,
                  step: cr.step,
                  title: cr.title,
                  message: cr.message,
                  slots: cr.slots,
                  continueAction: cr.action || { id: 'continue', label: '继续' },
                  cancelAction: cr.cancelAction || { id: 'cancel', label: '取消' },
                  riskLevel: cr.riskLevel,
                }
              } else {
                assistantMsg.confirmRequest = {
                  id: taskId,
                  step: cr.step,
                  title: cr.title,
                  message: cr.message,
                  confirmAction: cr.action || { id: 'confirm', label: '确认' },
                  cancelAction: cr.cancelAction || { id: 'cancel', label: '取消' },
                  riskLevel: cr.riskLevel,
                  affectedRecords: cr.affectedRecords,
                }
              }
              scrollToMessage(assistantMsg.id)
            }

            if (chunk.slot_fill !== undefined) {
              const sf = chunk.slot_fill
              const taskId = sf.id || capturedTaskId || `slot-fill-${Date.now()}`

              // Update HITL state
              hitlState.value = {
                conversationId: capturedConversationId || hitlState.value.conversationId,
                currentRunId: capturedRunId || hitlState.value.currentRunId,
                currentTask: {
                  taskId,
                  runId: capturedRunId,
                  type: 'slot_fill',
                  status: 'pending',
                  step: sf.step,
                  title: sf.title,
                  message: sf.message,
                  riskLevel: sf.riskLevel,
                },
                isWaitingHitl: true,
                userInput: originalUserInput || text,
              }
              assistantMsg.hasPendingHitl = true

              assistantMsg.slotFillRequest = {
                id: taskId,
                step: sf.step,
                title: sf.title,
                message: sf.message,
                slots: sf.slots,
                continueAction: sf.continueAction || { id: 'continue', label: '继续' },
                cancelAction: sf.cancelAction || { id: 'cancel', label: '取消' },
                riskLevel: sf.riskLevel,
              }
              scrollToMessage(assistantMsg.id)
            }

            if (chunk.done) {
              assistantMsg.done = true
              // Clear HITL waiting state on completion (if not waiting for HITL)
              if (!assistantMsg.hasPendingHitl) {
                // Don't reset hitlState here - let resumeHitl handle it
              }
            }
          }
        }
      }
    } catch (err: any) {
      chatLogger.logError(err, 'Streaming request failed')
      assistantMsg.content = `Error: ${err.message || 'Unknown error'}`
      assistantMsg.done = true
    }

    scrollToMessage(assistantMsg.id)
  }

  /**
   * Resume HITL task - sends confirmation/cancellation/slot-fill to the backend
   * Uses POST /chat/confirm (or /chat/resume) instead of /chat to avoid re-entering Step 1
   */
  async function resumeHitl(params: {
    action: HitlAction
    taskId?: string
    selectedValue?: string
    filledSlots?: Record<string, any>
    userInput?: string
    /** ID of the message carrying the pending HITL card; auto-detected if omitted */
    sourceMsgId?: number
  }): Promise<void> {
    if (hitlLoading.value) {
      console.warn('[HITL] Already processing HITL action, ignoring duplicate request')
      return
    }

    hitlLoading.value = true
    loading.value = true

    const taskId = params.taskId || hitlState.value.currentTask?.taskId
    const runId = hitlState.value.currentRunId
    const conversationId = hitlState.value.conversationId
    const userInput = params.userInput || hitlState.value.userInput

    // Auto-detect the source message if not explicitly provided
    const sourceMsgId = params.sourceMsgId ?? messages.value.find((m) => m.hasPendingHitl)?.id

    console.log('[HITL] Resuming task:', {
      action: params.action,
      taskId,
      runId,
      conversationId,
    })

    try {
      // Call the HITL resume endpoint
      const resumeEndpoint = getResumeEndpoint()
      const requestBody = {
        confirmation_result: {
          task_id: taskId,
          action: params.action,
          selected_value: params.selectedValue || '',
          filled_slots: params.filledSlots || {},
          user_input: userInput || '',
        },
        session_id: conversationId,
        stream: true,
      }

      chatLogger.logBackendRequest(requestBody, resumeEndpoint)

      const response = await fetch(resumeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`HITL resume failed: ${response.status}`)
      }

      // Update HITL state - we're now waiting for streaming response
      if (taskId && hitlState.value.currentTask) {
        hitlState.value.currentTask.status = params.action === 'cancel' ? 'cancelled' : 'confirmed'
      }

      // Continue streaming the response — update the original message in-place
      if (response.body) {
        await streamHitlResponse(response.body, taskId!, runId!, sourceMsgId ?? undefined)
      }
    } catch (err: any) {
      console.error('[HITL] Resume failed:', err)
      chatLogger.logError(err, 'HITL resume failed')

      // Add error message
      const errorMsg: ChatMessage = {
        id: ++messageIdCounter.value,
        role: 'assistant',
        content: `操作失败: ${err.message || '请稍后重试'}`,
        done: true,
      }
      messages.value.push(errorMsg)
    } finally {
      hitlLoading.value = false
      loading.value = false

      // Clear HITL state after completion
      hitlState.value = {
        conversationId: null,
        currentRunId: null,
        currentTask: null,
        isWaitingHitl: false,
        userInput: null,
      }
    }
  }

  /**
   * Get the resume endpoint - supports both /chat/confirm and /chat/resume
   */
  function getResumeEndpoint(): string {
    const baseEndpoint = getEndpoint()
    // Try /chat/confirm first, fall back to /chat/resume
    return baseEndpoint.replace(/\/$/, '') + '/confirm'
  }

  /**
   * Stream HITL resume response.
   * If sourceMsgId is provided, the original message is updated in-place (card stays visible
   * until the stream replaces it). Otherwise a new assistant message is created.
   */
  async function streamHitlResponse(
    body: ReadableStream<Uint8Array>,
    originalTaskId?: string,
    originalRunId?: string,
    sourceMsgId?: number,
  ): Promise<void> {
    let assistantMsg: ChatMessage

    if (sourceMsgId !== undefined) {
      // Update the existing message in-place (e.g. the one with the pending HITL card)
      const idx = messages.value.findIndex((m) => m.id === sourceMsgId)
      if (idx >= 0) {
        assistantMsg = messages.value[idx]
        assistantMsg.content = ''
        assistantMsg.thinkContent = ''
        assistantMsg.thinkDone = false
        assistantMsg.done = false
        assistantMsg.toolCalls = []
        assistantMsg.stepLifecycle = []
        assistantMsg.interaction = undefined
        assistantMsg.confirmRequest = undefined
        assistantMsg.slotFillRequest = undefined
        assistantMsg.hasPendingHitl = false
      } else {
        // Fallback: create new message if source not found
        assistantMsg = reactive<ChatMessage>({
          id: ++messageIdCounter.value,
          role: 'assistant',
          content: '',
          thinkContent: '',
          thinkDone: false,
          done: false,
          toolCalls: [],
          stepLifecycle: [],
          interaction: undefined,
          confirmRequest: undefined,
          slotFillRequest: undefined,
          taskId: originalTaskId,
          runId: originalRunId,
        })
        messages.value.push(assistantMsg)
      }
    } else {
      assistantMsg = reactive<ChatMessage>({
        id: ++messageIdCounter.value,
        role: 'assistant',
        content: '',
        thinkContent: '',
        thinkDone: false,
        done: false,
        toolCalls: [],
        stepLifecycle: [],
        interaction: undefined,
        confirmRequest: undefined,
        slotFillRequest: undefined,
        taskId: originalTaskId,
        runId: originalRunId,
      })
      messages.value.push(assistantMsg)
    }
    scrollToMessage(assistantMsg.id)

    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunkText = decoder.decode(value, { stream: !done })
        buffer += chunkText

        chatLogger.logSSEChunk({ raw: chunkText }, chunkText)

        buffer = buffer.replace(/\r\n/g, '\n')
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const eventBlock of parts) {
          if (!eventBlock.trim()) continue
          const chunks = parseSSE(eventBlock)
          for (const chunk of chunks) {
            chatLogger.logSSEChunk(chunk)

            if (chunk.error) {
              assistantMsg.content = `Error: ${chunk.error}`
              assistantMsg.done = true
              break
            }

            if (chunk.think !== undefined) {
              assistantMsg.thinkContent = (assistantMsg.thinkContent || '') + chunk.think
              scrollToMessage(assistantMsg.id)
            }

            if (chunk.think_done) {
              assistantMsg.thinkDone = true
            }

            if (chunk.content !== undefined) {
              assistantMsg.content = (assistantMsg.content || '') + chunk.content
              scrollToMessage(assistantMsg.id)
            }

            if (chunk.step_update !== undefined) {
              const su = chunk.step_update
              if (!assistantMsg.stepLifecycle) assistantMsg.stepLifecycle = []
              const idx = assistantMsg.stepLifecycle.findIndex((s) => s.step === su.step)
              if (idx >= 0) {
                Object.assign(assistantMsg.stepLifecycle[idx], su)
              } else {
                assistantMsg.stepLifecycle.push(su as any)
              }
              scrollToMessage(assistantMsg.id)
            }

            if (chunk.tool_call !== undefined) {
              const tc = chunk.tool_call
              if (!assistantMsg.toolCalls) assistantMsg.toolCalls = []
              assistantMsg.toolCalls.push({
                id: tc.id,
                type: tc.type,
                name: tc.name,
                description: tc.description,
                input: tc.input,
                status: 'pending',
              })
              scrollToMessage(assistantMsg.id)
            }

            if (chunk.tool_result !== undefined) {
              const tr = chunk.tool_result
              if (assistantMsg.toolCalls) {
                const call = assistantMsg.toolCalls.find((c) => c.id === tr.id)
                if (call) {
                  call.status = tr.status
                  call.output = tr.output
                  call.error = tr.error
                }
              }
              scrollToMessage(assistantMsg.id)
            }

            if (chunk.done) {
              assistantMsg.done = true
            }
          }
        }
      }
    } catch (err: unknown) {
      chatLogger.logError(err, 'HITL stream failed')
      assistantMsg.content = `Error: ${(err as Error).message || 'Stream interrupted'}`
      assistantMsg.done = true
    }

    scrollToMessage(assistantMsg.id)
  }

  async function continueTask(text: string): Promise<void> {
    if (loading.value) return

    inputValue.value = ''
    loading.value = true

    const userMsg: ChatMessage = {
      id: ++messageIdCounter.value,
      role: 'user',
      content: text,
    }
    messages.value.push(userMsg)
    scrollToBottom()

    chatLogger.logUserInput(text)

    try {
      // Pass original user input for HITL context
      const userInput = hitlState.value.userInput || text
      await sendMessageStreaming(text, userInput)
    } catch {
      messages.value.pop()
      await sendMessageNonStreaming()
    }

    loading.value = false
  }

  async function sendMessage() {
    const text = inputValue.value.trim()
    if (!text || loading.value) return

    const sessionId = chatLogger.startSession()
    currentSessionId.value = sessionId

    inputValue.value = ''
    loading.value = true

    const userMsg: ChatMessage = {
      id: ++messageIdCounter.value,
      role: 'user',
      content: text,
    }
    messages.value.push(userMsg)
    scrollToBottom()

    try {
      await sendMessageStreaming(text)
    } catch {
      messages.value.pop()
      await sendMessageNonStreaming()
    }

    loading.value = false
    chatLogger.endSession()
    console.log(`[ChatLogger] Session ${sessionId} ended`)
  }

  return {
    messages,
    inputValue,
    loading,
    messagesRef,
    sendMessage,
    continueTask,
    resumeHitl,
    currentSessionId,
    hitlState,
    hitlLoading,
    scrollToBottom,
    setMessages,
    clearMessages,
  }
}
