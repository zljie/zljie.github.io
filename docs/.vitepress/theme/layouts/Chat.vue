<template>
  <div class="chat-page">
    <div class="chat-header">
      <div class="header-info">
        <span class="header-title">{{ config.title || 'AI Chat' }}</span>
        <span class="header-subtitle">{{ config.subtitle || 'Powered by Agent Chatbot UI' }}</span>
      </div>
      <div class="header-actions">
        <button class="log-btn" @click="showLogPanel = !showLogPanel" title="会话日志">
          📋
        </button>
      </div>
    </div>

    <!-- Log Panel -->
    <div v-if="showLogPanel" class="log-panel">
      <div class="log-panel-header">
        <span>会话日志</span>
        <button class="log-panel-close" @click="showLogPanel = false">×</button>
      </div>
      <div class="log-panel-content">
        <div class="log-sessions">
          <div
            v-for="sid in sessionList"
            :key="sid"
            class="log-session-item"
            :class="{ active: selectedSession === sid }"
            @click="selectSession(sid)"
          >
            <span class="session-id">{{ sid.slice(0, 20) }}...</span>
          </div>
          <div v-if="sessionList.length === 0" class="no-sessions">暂无日志</div>
        </div>
        <div class="log-detail" v-if="selectedSession && selectedLog">
          <div class="log-actions">
            <button @click="exportJSON">导出 JSON</button>
            <button @click="exportMarkdown">导出 Markdown</button>
            <button @click="clearCurrentSession" class="danger">清除</button>
          </div>
          <pre class="log-content">{{ JSON.stringify(selectedLog, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <div class="chat-container">
      <!-- Left sidebar: scenarios + conversations -->
      <div class="conversation-list">
        <!-- Demo Scenarios -->
        <div class="conv-section">
          <div class="conv-section-title">Demo Scenarios</div>
          <div
            v-for="sc in scenarios"
            :key="sc.id"
            class="conv-item conv-item--demo"
            :class="{ active: activeId === sc.id && activeId.startsWith('demo-') }"
            @click="selectScenario(sc)"
          >
            <span class="conv-item-icon">{{ sc.icon }}</span>
            <div class="conv-item-text">
              <span class="conv-item-title">{{ sc.title }}</span>
              <span class="conv-item-sub">{{ sc.subtitle }}</span>
            </div>
          </div>
        </div>

        <div class="conv-divider" />

        <!-- My Conversations -->
        <div class="conv-section conv-section--flex">
          <div class="conv-section-title">My Chats</div>
          <button class="new-chat-btn" @click="createConversation" title="New chat">+</button>
        </div>
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="conv-item conv-item--user"
          :class="{ active: activeId === conv.id }"
          @click="selectConversation(conv.id)"
        >
          <span class="conv-item-title">{{ conv.title }}</span>
        </div>
      </div>

      <!-- Chat main area -->
      <div class="chat-main">
        <!-- Welcome / quick prompts (shown when no messages) -->
        <div v-if="messages.length === 0" class="welcome-area">
          <div class="welcome-header">
            <img
              class="welcome-avatar"
              src="https://api.dicebear.com/7.x/bottts/svg?seed=AI"
              alt="AI"
            />
            <div class="welcome-title">{{ config.title || 'AI Assistant' }}</div>
            <div class="welcome-subtitle">{{ config.subtitle || 'Powered by Agent Chatbot UI' }}</div>
          </div>
          <div class="quick-prompts">
            <div class="quick-prompts-label">Try these</div>
            <div class="quick-prompts-grid">
              <button
                v-for="qp in quickPrompts"
                :key="qp.text"
                class="quick-prompt-btn"
                @click="sendQuickPrompt(qp.text)"
              >
                <span class="qp-icon">{{ qp.icon }}</span>
                <span class="qp-text">{{ qp.text }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Messages -->
        <div class="messages" ref="messagesRef">
          <template v-for="msg in messages" :key="msg.id">
            <div class="message-row" :class="msg.role" :data-msg-id="msg.id">
              <img
                v-if="msg.role === 'assistant'"
                class="avatar"
                src="https://api.dicebear.com/7.x/bottts/svg?seed=AI"
                alt="AI"
              />
              <div
                v-if="msg.role === 'user'"
                class="user-bubble"
              >
                {{ msg.content }}
              </div>
              <MarkdownBubble
                v-else
                :content="msg.content"
                role="assistant"
                :streaming="!msg.done"
                :think-content="msg.thinkContent"
                :think-done="msg.thinkDone"
                :tool-calls="msg.toolCalls"
                :step-lifecycle="msg.stepLifecycle"
                :interaction="msg.interaction"
                :confirm-request="msg.confirmRequest"
                :slot-fill-request="msg.slotFillRequest"
                @hitl-select="handleHitlSelect"
                @hitl-confirm="handleHitlConfirm"
                @hitl-cancel="handleHitlCancel"
                @hitl-rating="handleHitlRating"
                @hitl-input="handleHitlInput"
                @hitl-dismiss="handleHitlDismiss"
                @hitl-slot-fill="handleHitlSlotFill"
                @hitl-slot-cancel="handleHitlSlotCancel"
              />
              <img
                v-if="msg.role === 'user'"
                class="avatar"
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=User"
                alt="User"
              />
            </div>
          </template>
        </div>

        <!-- Input area -->
        <div class="chat-input-area">
          <div class="input-wrapper">
            <input
              class="chat-input"
              type="text"
              v-model="inputValue"
              :disabled="loading"
              placeholder="Type a message..."
              @keydown.enter="handleSendMessage"
            />
            <button
              class="send-btn"
              :disabled="loading || !inputValue.trim()"
              @click="handleSendMessage"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChat, type ChatMessage, type InteractionOption } from './useChat'
import MarkdownBubble from './MarkdownBubble.vue'
import { chatLogger } from './chatLogger'

const config = computed(() => {
  if (typeof window === 'undefined') return { title: '', subtitle: '' }
  return window.__CHAT_CONFIG__ || { title: '', subtitle: '' }
})

const { messages, inputValue, loading, messagesRef, sendMessage, continueTask, currentSessionId, setMessages, clearMessages } = useChat()

// ── Demo Scenarios ──────────────────────────────────────────────
interface Scenario {
  id: string
  title: string
  subtitle: string
  icon: string
  messages: ChatMessage[]
}

const skillDemo: ChatMessage[] = [
  {
    id: 1, role: 'user',
    content: 'What\'s the weather in Shanghai today?',
  },
  {
    id: 2, role: 'assistant',
    content: '',
    done: true,
    toolCalls: [
      {
        id: 'tc-1', type: 'skill', name: 'get_weather',
        description: 'Query weather information for a city',
        input: { city: 'Shanghai', unit: 'celsius' },
        status: 'success',
        output: { city: 'Shanghai', temp: 24, condition: 'Cloudy', humidity: 65 },
      },
    ],
  },
  {
    id: 3, role: 'assistant',
    content: '## Shanghai Weather\n\n| Item | Value |\n|------|-------|\n| **City** | Shanghai |\n| **Temperature** | 24°C |\n| **Condition** | Cloudy |\n| **Humidity** | 65% |\n\nThe weather in Shanghai today is quite pleasant — cloudy with a comfortable temperature. Would you like me to check any other cities?',
  },
]

const ragDemo: ChatMessage[] = [
  {
    id: 1, role: 'user',
    content: 'What\'s the procurement approval policy for orders over 100k?',
  },
  {
    id: 2, role: 'assistant',
    content: '',
    done: true,
    toolCalls: [
      {
        id: 'tc-2', type: 'rag', name: 'procurement_policy',
        description: 'Search internal procurement policy documents',
        input: { query: 'approval threshold 100k procurement', top_k: 3 },
        status: 'success',
        output: { chunks: ['PO > CNY 100,000 requires CFO countersignature.', 'Budget pre-approval needed for >50k.'] },
      },
    ],
  },
  {
    id: 3, role: 'assistant',
    content: 'Based on the procurement policy documents, here\'s the approval matrix:\n\n| Order Range | Approver |\n|-------------|----------|\n| < CNY 50,000 | Department Manager |\n| CNY 50,000 – 100,000 | Finance Director |\n| **> CNY 100,000** | **CFO countersignature required** |\n\n> **Note:** Budget pre-approval is mandatory for orders ≥ CNY 50,000 before PO issuance.\n\nDo you need the full policy document or help drafting the approval request?',
  },
]

const thinkDemo: ChatMessage[] = [
  {
    id: 1, role: 'user',
    content: 'Should we migrate our monolith app to microservices? What factors should we consider?',
  },
  {
    id: 2, role: 'assistant',
    content: 'Let me think through this systematically...',
    thinkContent: 'The user is asking about microservices migration decision factors.\n\n**Key dimensions to evaluate:**\n\n1. **Team structure** — Conway\'s Law: microservice boundaries should mirror team boundaries. If teams are small and colocated, a monolith may actually be more efficient.\n\n2. **Scale requirements** — Microservices shine when different components have wildly different scaling needs (e.g., search vs. user auth).\n\n3. **Deployment frequency** — High deployment frequency + independent release trains → microservices win. Low frequency → unnecessary complexity.\n\n4. **Data consistency tolerance** — Microservices require accepting eventual consistency. If the business needs strong ACID guarantees across domains, this is a major red flag.\n\n5. **Operational overhead** — Service mesh, distributed tracing, circuit breakers, separate pipelines... the hidden tax is enormous without platform engineering investment.\n\n**Recommendation framework:**\n- Start with modular monolith (clean domain boundaries inside one deployable unit)\n- Extract services only when: (a) team is >8 people per domain, (b) scaling pain is real, (c) CI/CD is mature\n\n**Anti-pattern warning:** "We\'ll do microservices so we can scale" — premature optimisation that kills startups.',
    thinkDone: true,
  },
  {
    id: 3, role: 'assistant',
    content: 'This is a high-stakes architectural decision. Let me walk you through the key evaluation dimensions:\n\n## Should You Migrate to Microservices?\n\n### TL;DR: Probably not yet.\n\nThe microservices-vs-monolith debate is often a distraction. What matters more is **service boundaries** and **team autonomy**.\n\n---\n\n### Decision Framework\n\n| Factor | Microservices Win | Monolith Wins |\n|--------|-----------------|---------------|\n| **Team size** | >8 engineers per domain | Small colocated team |\n| **Scaling** | Wildly different per component | Uniform load |\n| **Deploy cadence** | Multiple deploys/day | Weekly or less |\n| **Data consistency** | Eventual consistency OK | Strong ACID needed |\n| **Operational maturity** | SRE, service mesh, tracing | Manual deployments |\n\n---\n\n### My Recommendation\n\n**Start with a Modular Monolith.**\n\nEnforce strict domain boundaries and clean architecture *inside* one deployable unit. Extract services only when you hit real, measured pain:\n\n1. A specific component needs independent scaling\n2. Teams are blocked by deployment coupling\n3. CI/CD is mature enough to handle distributed complexity\n\n---\n\n### Red Flags\n\n- "We\'ll scale better" (premature optimization)\n- "Microservices are more modern" (cargo cult)\n- No dedicated platform/ops team\n\nWhat\'s your current team size and deployment frequency? That context would help me give a more targeted assessment.',
  },
]

const multiTurnDemo: ChatMessage[] = [
  {
    id: 1, role: 'user',
    content: 'I want to understand our sales pipeline.',
  },
  {
    id: 2, role: 'assistant',
    content: 'Our sales pipeline consists of 5 key stages:\n\n```\nLead → MQL → SQL → Opportunity → Contract → Closed\n```\n\n**Key metrics:**\n- Average deal cycle: **28 days**\n- Win rate: **34%**\n- Average deal size: **¥128,000**\n\nWhich stage would you like to dive deeper into — lead generation, qualification criteria, or conversion analysis?',
  },
  {
    id: 3, role: 'user',
    content: 'Tell me more about the MQL to SQL conversion rate.',
  },
  {
    id: 4, role: 'assistant',
    content: '## MQL → SQL Conversion Analysis\n\n**Overall conversion rate: 41%**\n\n| Segment | Conversion Rate | Avg Time |\n|---------|----------------|----------|\n| Inbound (content) | 38% | 6 days |\n| Inbound (events) | 52% | 3 days |\n| Outbound | 29% | 11 days |\n\n**Key insight:** Outbound leads take 3x longer to qualify and convert at lower rates — suggesting qualification criteria misalignment with outbound targeting.\n\n**Recommended actions:**\n1. Align outbound ICP (Ideal Customer Profile) with MQL scoring model\n2. Add engagement scoring to complement firmographic scoring\n\nWould you like a breakdown by industry vertical or sales rep?',
  },
  {
    id: 5, role: 'user',
    content: 'Which rep has the highest outbound conversion rate?',
  },
  {
    id: 6, role: 'assistant',
    content: '## Outbound Conversion by Sales Rep\n\n| Rep | Outbound MQLs | SQLs | Conversion | Avg Cycle |\n|-----|--------------|------|-----------|-----------|\n| **Sarah Chen** | 47 | 21 | **44.7%** | 9 days |\n| Marcus Liu | 63 | 24 | 38.1% | 10 days |\n| Anna Wang | 39 | 14 | 35.9% | 12 days |\n| Tom Zhao | 55 | 17 | 30.9% | 14 days |\n\n**Sarah Chen** leads the team with **44.7%** outbound conversion — 15% above team average. Key observation: she prioritizes warm accounts (those with recent product demo requests) over cold outreach.\n\nWant me to analyze Sarah\'s outreach playbook to identify replicable patterns?',
  },
]

// 5-Step Demo: Purchase Request Query
const fiveStepDemo: ChatMessage[] = [
  {
    id: 1, role: 'user',
    content: '帮我查一下目前还有哪些采购需求没有执行。',
  },
  {
    id: 2, role: 'assistant',
    content: '',
    done: true,
    interaction: {
      id: 'interaction-001',
      title: '请选择后续操作',
      description: '已查询到 5 条未执行采购需求，您希望如何继续？',
      type: 'choice',
      required: false,
      options: [
        { id: 'show_detail', label: '展示明细列表', icon: 'list', action: 'navigate', description: '查看每条采购需求的完整信息', recommended: true },
        { id: 'aggregate_dept', label: '按部门汇总', icon: 'chart', action: 'execute', description: '按申请部门统计数量分布' },
        { id: 'filter_type', label: '按采购类型筛选', icon: 'filter', action: 'execute', description: '按来源类型进一步筛选' },
        { id: 'create_inquiry', label: '生成询价单', icon: 'compose', action: 'execute', description: '为选中的采购需求生成询价单' },
        { id: 'export', label: '导出清单', icon: 'export', action: 'export', description: '导出为 Excel 或 CSV 格式' },
      ],
    },
    stepLifecycle: [
      {
        step: 1,
        stepName: '意图识别',
        status: 'completed',
        summary: '查询未执行采购需求',
        details: {
          intent: 'query_unexecuted_purchase_requests',
          intentLabel: '查询未执行采购需求',
          objectTerm: '采购需求',
          operationType: 'query',
          riskLevel: 'low',
          requiresConfirmation: false,
        },
      },
      {
        step: 2,
        stepName: '本体对象定位',
        status: 'completed',
        summary: '命中采购需求对象',
        details: {
          objectType: 'purchase_request',
          objectLabel: '采购需求',
          hitKeywords: ['采购需求', '采购计划', '物料需求'],
          attributes: [
            { key: 'status', label: '执行状态', usage: 'filter' },
            { key: 'delete_flag', label: '删除标记', usage: 'filter' },
            { key: 'source_type', label: '来源类型', usage: 'display' },
            { key: 'apply_dep', label: '申请部门', usage: 'display' },
            { key: 'material_id', label: '物料编码', usage: 'display' },
            { key: 'quantity', label: '需求数量', usage: 'display' },
          ],
          availableActions: ['查询', '展示', '状态判断'],
          ontologyCompleteness: 'partial',
          gaps: [
            {
              gapType: 'missing_attribute',
              description: '缺少 source_type 字段映射',
              suggestion: '在采购需求对象中补充来源类型字段',
            },
          ],
        },
      },
      {
        step: 3,
        stepName: '任务规划',
        status: 'completed',
        summary: '计划查询未执行且未删除采购需求',
        details: {
          plannedActions: [
            { sequence: 1, actionId: 'purchase_request/list', actionLabel: '查询采购需求', description: '从采购系统查询所有采购需求' },
            { sequence: 2, actionId: 'filter/unexecuted', actionLabel: '筛选未执行', description: '排除已执行、已删除记录' },
            { sequence: 3, actionId: 'aggregate/source', actionLabel: '统计来源分布', description: '按来源类型聚合数量' },
            { sequence: 4, actionId: 'format/response', actionLabel: '格式化返回', description: '生成摘要和明细' },
          ],
          queryConditions: [
            { field: 'delete_flag', operator: '!=', value: 1, label: '未删除' },
            { field: 'status', operator: '=', value: '未执行', label: '状态为未执行' },
          ],
          aggregationRules: [
            { type: 'count', fields: ['source_type'], label: '按来源统计数量' },
          ],
          displayFields: ['编号', '物料', '数量', '部门', '申请人', '需求日期', '来源'],
          riskLevel: 'low',
          requiresConfirmation: false,
        },
      },
      {
        step: 4,
        stepName: '执行过程',
        status: 'completed',
        summary: '查询完成，共返回 5 条记录',
        connector: {
          name: 'ProcurementSystemConnector',
          id: 'procurement-connector-v1',
          status: 'success',
          resultSummary: '查询成功',
          resultCount: 5,
          latencyMs: 1247,
        },
        details: {
          executions: [
            {
              connectorName: 'ProcurementSystemConnector',
              connectorId: 'procurement-connector-v1',
              actionId: 'purchase_request/list',
              status: 'success',
              startTime: '2026-06-02T10:35:00Z',
              endTime: '2026-06-02T10:35:01.247Z',
              latencyMs: 1247,
              requestParams: { delete_flag: '!=1', status: '未执行' },
              responseSummary: '查询成功',
              resultCount: 5,
            },
          ],
        },
      },
      {
        step: 5,
        stepName: '生成回复',
        status: 'completed',
        summary: '已生成结果摘要和下一步建议',
        suggestedActions: [
          { id: 'show_detail', label: '展示明细', type: 'navigate' },
          { id: 'aggregate_dept', label: '按部门汇总', type: 'execute' },
          { id: 'filter_type', label: '按采购类型筛选', type: 'execute' },
          { id: 'create_inquiry', label: '生成询价单', type: 'execute' },
          { id: 'export', label: '导出清单', type: 'export' },
        ],
        details: {
          resultSummary: '已查询到 5 条未执行采购需求',
          statistics: [
            { label: '总数量', value: 5, unit: '条' },
            { label: '系统接口集成', value: 3, unit: '条' },
            { label: '手工创建', value: 2, unit: '条' },
          ],
          resultDefinition: '未执行：当前状态为未执行；已删除记录已排除',
          nextActions: [],
        },
      },
    ],
  },
  {
    id: 3, role: 'assistant',
    content: '已查询到 **5 条** 未执行采购需求。\n\n来源分布：\n\n- **系统接口集成**：3 条\n- **手工创建**：2 条\n- **批量导入**：0 条\n\n---\n\n需要我为您展示详细列表吗？',
  },
]

const scenarios: Scenario[] = [
  { id: 'demo-skill', title: 'Skill Calling', subtitle: 'Weather & tools', icon: '🔧', messages: skillDemo },
  { id: 'demo-rag', title: 'RAG Retrieval', subtitle: 'Policy search', icon: '📚', messages: ragDemo },
  { id: 'demo-think', title: 'Think Mode', subtitle: 'Reasoning chain', icon: '🧠', messages: thinkDemo },
  { id: 'demo-5step', title: '5-Step Agent', subtitle: '透明执行', icon: '🔍', messages: fiveStepDemo },
  { id: 'demo-multiturn', title: 'Multi-turn', subtitle: 'Context memory', icon: '💬', messages: multiTurnDemo },
]

// ── Quick Prompts ───────────────────────────────────────────────
const quickPrompts = [
  { icon: '🔧', text: 'What\'s the weather in Beijing?' },
  { icon: '🧠', text: 'Explain microservices vs monolith in simple terms' },
  { icon: '📊', text: 'Analyze our Q1 sales performance' },
  { icon: '📋', text: 'What\'s the procurement approval policy for 200k orders?' },
]

// ── Active conversation state ────────────────────────────────────
type ActiveId = string | number
const activeId = ref<ActiveId>('welcome')

// ── My Conversations ────────────────────────────────────────────
interface Conversation {
  id: number
  title: string
  messages: ChatMessage[]
}

const conversations = ref<Conversation[]>([])
const nextConvId = ref(100)

function selectScenario(sc: Scenario) {
  activeId.value = sc.id
  setMessages(sc.messages)
}

function selectConversation(id: number) {
  activeId.value = id
  const conv = conversations.value.find((c) => c.id === id)
  if (conv) setMessages(conv.messages)
}

function createConversation() {
  const id = nextConvId.value++
  conversations.value.unshift({ id, title: 'New Chat', messages: [] })
  activeId.value = id
  clearMessages()
}

async function sendQuickPrompt(text: string) {
  inputValue.value = text
  await handleSendMessage()
}

async function handleSendMessage() {
  const text = inputValue.value.trim()
  if (!text || loading.value) return
  await sendMessage()

  // If on a demo scenario, fork to a new user conversation
  if (typeof activeId.value === 'string' && activeId.value.startsWith('demo-')) {
    const id = nextConvId.value++
    conversations.value.unshift({
      id,
      title: text.slice(0, 24) + (text.length > 24 ? '...' : ''),
      messages: [...messages.value],
    })
    activeId.value = id
    return
  }

  // Save to existing user conversation
  const conv = conversations.value.find((c) => c.id === activeId.value)
  if (conv) {
    conv.messages = [...messages.value]
    conv.title = messages.value[0]?.role === 'user'
      ? messages.value[0].content.slice(0, 24) + (messages.value[0].content.length > 24 ? '...' : '')
      : conv.title
  }
}

// ── HITL Event Handlers ────────────────────────────────────────────
function handleHitlSelect(option: InteractionOption, params?: Record<string, any>) {
  console.log('[HITL] Select option:', option, params)
  // 用 continueTask 续接当前会话，不开新 task
  continueTask(`[action] ${option.id}`)
}

function handleHitlConfirm(id: string, params?: Record<string, any>) {
  console.log('[HITL] Confirm:', id, params)
  continueTask(`[confirm] ${id}`)
}

function handleHitlCancel(id: string) {
  console.log('[HITL] Cancel:', id)
  continueTask(`[cancel] ${id}`)
}

function handleHitlRating(rating: number) {
  console.log('[HITL] Rating:', rating)
  continueTask(`[rating] ${rating}`)
}

function handleHitlInput(value: string) {
  console.log('[HITL] Input:', value)
  continueTask(value)
}

function handleHitlDismiss() {
  console.log('[HITL] Dismiss')
  continueTask('[timeout]')
}

/**
 * Handle slot-fill: user filled the required fields and submitted
 * Sends the slot values back to the backend to continue the flow
 */
function handleHitlSlotFill(id: string, values: Record<string, any>) {
  console.log('[HITL] Slot fill:', id, values)
  // Format the slot values as a structured message for the backend
  const formattedValues = Object.entries(values)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')
  continueTask(`[slot-fill] ${id} | ${formattedValues}`)
}

function handleHitlSlotCancel(id: string) {
  console.log('[HITL] Slot cancel:', id)
  continueTask(`[cancel] ${id}`)
}

// ── Log Panel ───────────────────────────────────────────────────
const showLogPanel = ref(false)
const selectedSession = ref<string | null>(null)

const sessionList = computed(() => chatLogger.getSessionList())

const selectedLog = computed(() => {
  if (!selectedSession.value) return null
  return chatLogger.getSessionLog(selectedSession.value)
})

function selectSession(sessionId: string) {
  selectedSession.value = sessionId
}

function exportJSON() {
  chatLogger.exportSessionLog(selectedSession.value || undefined)
}

function exportMarkdown() {
  chatLogger.exportAsMarkdown(selectedSession.value || undefined)
}

function clearCurrentSession() {
  if (selectedSession.value) {
    chatLogger.clearSession(selectedSession.value)
    selectedSession.value = null
  }
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.chat-header {
  height: 56px;
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: var(--vp-c-bg-soft);
  flex-shrink: 0;
}

.header-info {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.header-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.header-subtitle {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.chat-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ── Sidebar ──────────────────────────────── */
.conversation-list {
  width: 240px;
  border-right: 1px solid var(--vp-c-divider);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background: var(--vp-c-bg-soft);
  overflow-y: auto;
}

.conv-section {
  padding: 8px 0 4px;
}

.conv-section--flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 12px;
}

.conv-section-title {
  padding: 4px 16px 6px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.conv-divider {
  height: 1px;
  background: var(--vp-c-divider);
  margin: 4px 12px;
}

.conv-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  border-bottom: 1px solid transparent;
  transition: background 0.15s;
  min-width: 0;
}

.conv-item:hover {
  background: var(--vp-c-bg);
}

.conv-item.active {
  background: var(--vp-c-brand-soft);
}

.conv-item--demo {
  padding: 10px 16px;
}

.conv-item--user {
  padding: 8px 16px;
  font-size: 0.82rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--vp-c-text-2);
}

.conv-item.active .conv-item-title,
.conv-item.active .conv-item-sub {
  color: var(--vp-c-brand-1);
}

.conv-item-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.conv-item-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.conv-item-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-item-sub {
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.new-chat-btn {
  background: var(--vp-c-brand-1);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.8rem;
  cursor: pointer;
  line-height: 1.4;
}

/* ── Main ───────────────────────────────── */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Welcome area ───────────────────────── */
.welcome-area {
  padding: 40px 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.welcome-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.welcome-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid var(--vp-c-brand-1);
}

.welcome-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.welcome-subtitle {
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
}

.quick-prompts {
  width: 100%;
  max-width: 560px;
}

.quick-prompts-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3);
  margin-bottom: 10px;
}

.quick-prompts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.quick-prompt-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
  font-family: inherit;
  font-size: 0.82rem;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.quick-prompt-btn:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 8px var(--vp-c-brand-soft);
  transform: translateY(-1px);
}

.qp-icon {
  font-size: 0.95rem;
  flex-shrink: 0;
}

.qp-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Messages ───────────────────────────── */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.message-row.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid var(--vp-c-divider);
}

/* ── Input ──────────────────────────────── */
.chat-input-area {
  padding: 12px 24px 24px;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.chat-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.chat-input:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  padding: 10px 14px;
  border-radius: 8px;
  border: none;
  background: var(--vp-c-brand-1);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.1s;
}

.send-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
  transform: translateY(-1px);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

/* ── User Bubble ────────────────────────── */
.user-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--vp-c-brand-1);
  color: #fff;
  line-height: 1.5;
  font-size: 0.9rem;
}

/* ── Header Actions ────────────────────── */
.header-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.log-btn {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.15s;
}

.log-btn:hover {
  background: var(--vp-c-bg);
}

/* ── Log Panel ──────────────────────────── */
.log-panel {
  position: fixed;
  top: 56px;
  right: 0;
  bottom: 0;
  width: 400px;
  background: var(--vp-c-bg);
  border-left: 1px solid var(--vp-c-divider);
  display: flex;
  flex-direction: column;
  z-index: 100;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
}

.log-panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  background: var(--vp-c-bg-soft);
}

.log-panel-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 4px;
  color: var(--vp-c-text-2);
}

.log-panel-close:hover {
  color: var(--vp-c-text-1);
}

.log-panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.log-sessions {
  padding: 8px;
  border-bottom: 1px solid var(--vp-c-divider);
  max-height: 120px;
  overflow-y: auto;
}

.log-session-item {
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--vp-c-text-2);
}

.log-session-item:hover {
  background: var(--vp-c-bg-soft);
}

.log-session-item.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.session-id {
  word-break: break-all;
}

.no-sessions {
  padding: 12px;
  text-align: center;
  color: var(--vp-c-text-3);
  font-size: 0.8rem;
}

.log-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.log-actions {
  padding: 8px 12px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.log-actions button {
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  font-size: 0.75rem;
  transition: background 0.15s;
}

.log-actions button:hover {
  background: var(--vp-c-bg);
}

.log-actions button.danger {
  color: #dc3545;
  border-color: #dc3545;
}

.log-actions button.danger:hover {
  background: #dc354510;
}

.log-content {
  flex: 1;
  overflow: auto;
  padding: 12px;
  margin: 0;
  font-size: 0.7rem;
  font-family: monospace;
  background: var(--vp-c-bg-soft);
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
