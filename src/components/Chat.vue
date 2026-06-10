<template>
  <div class="chat-page">
    <div class="chat-header">
      <div class="header-info">
        <span class="header-title">{{ config.title || 'AI 助手' }}</span>
        <span class="header-subtitle">{{ config.subtitle || '由 Agent 聊天机器人 UI 驱动' }}</span>
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
        <!-- 示例场景 -->
        <div class="conv-section">
          <div class="conv-section-title">示例场景</div>
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

        <!-- 我的对话 -->
        <div class="conv-section conv-section--flex">
          <div class="conv-section-title">我的对话</div>
          <button class="new-chat-btn" @click="createConversation" title="新建对话">+</button>
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
            <div class="welcome-title">{{ config.title || 'AI 助手' }}</div>
            <div class="welcome-subtitle">{{ config.subtitle || '由 Agent 聊天机器人 UI 驱动' }}</div>
          </div>
          <div class="quick-prompts">
            <div class="quick-prompts-label">试试这些</div>
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
              <template v-if="msg.role === 'user'">
                <div class="user-bubble">{{ msg.content }}</div>
                <img
                  class="avatar"
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=User"
                  alt="User"
                />
              </template>
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
                :mode="msg.mode"
                @hitl-select="handleHitlSelect"
                @hitl-confirm="handleHitlConfirm"
                @hitl-cancel="handleHitlCancel"
                @hitl-rating="handleHitlRating"
                @hitl-input="handleHitlInput"
                @hitl-dismiss="handleHitlDismiss"
                @hitl-slot-fill="handleHitlSlotFill"
                @hitl-slot-cancel="handleHitlSlotCancel"
              />
            </div>
          </template>
        </div>

        <!-- Input area -->
        <div class="chat-input-area">
          <div class="input-wrapper">
            <input
              v-model="inputValue"
              class="chat-input"
              :disabled="loading"
              placeholder="输入消息..."
              @keydown.enter="handleSendMessage"
            />
            <button
              class="send-btn"
              :disabled="loading || !inputValue.trim()"
              @click="handleSendMessage"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
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
import { useChat, type ChatMessage, type InteractionOption } from '../composables/useChat'
import MarkdownBubble from './MarkdownBubble.vue'
import { chatLogger } from '../composables/chatLogger'

const config = computed(() => {
  if (typeof window === 'undefined') return { title: '', subtitle: '' }
  return window.__CHAT_CONFIG__ || { title: '', subtitle: '' }
})

const { messages, inputValue, loading, messagesRef, sendMessage, continueTask, resumeHitl, currentSessionId, hitlState, hitlLoading, setMessages, clearMessages } = useChat()

// ── 示例场景 ──────────────────────────────────────────────
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
    content: '今天上海天气怎么样？',
  },
  {
    id: 2, role: 'assistant',
    content: '',
    done: true,
    toolCalls: [
      {
        id: 'tc-1', type: 'skill', name: 'get_weather',
        description: '查询城市天气信息',
        input: { city: 'Shanghai', unit: 'celsius' },
        status: 'success',
        output: { city: 'Shanghai', temp: 24, condition: 'Cloudy', humidity: 65 },
      },
    ],
  },
  {
    id: 3, role: 'assistant',
    content: '## 上海天气\n\n| 项目 | 数值 |\n|------|-------|\n| **城市** | 上海 |\n| **温度** | 24°C |\n| **天气状况** | 多云 |\n| **湿度** | 65% |\n\n今天上海的天气相当宜人 — 多云，温度舒适。需要我查看其他城市的天气吗？',
  },
]

const ragDemo: ChatMessage[] = [
  {
    id: 1, role: 'user',
    content: '超过 10 万的采购订单审批政策是什么？',
  },
  {
    id: 2, role: 'assistant',
    content: '',
    done: true,
    toolCalls: [
      {
        id: 'tc-2', type: 'rag', name: 'procurement_policy',
        description: '搜索内部采购政策文档',
        input: { query: 'approval threshold 100k procurement', top_k: 3 },
        status: 'success',
        output: { chunks: ['PO > CNY 100,000 requires CFO countersignature.', 'Budget pre-approval needed for >50k.'] },
      },
    ],
  },
  {
    id: 3, role: 'assistant',
    content: '根据采购政策文档，以下是审批矩阵：\n\n| 订单金额 | 审批人 |\n|-------------|----------|\n| < ¥50,000 | 部门经理 |\n| ¥50,000 – 100,000 | 财务总监 |\n| **> ¥100,000** | **CFO 会签** |\n\n> **注意：** 订单金额 ≥ ¥50,000 时，在签发采购订单前必须完成预算预审批。\n\n您需要完整的政策文档或起草审批申请的帮助吗？',
  },
]

const thinkDemo: ChatMessage[] = [
  {
    id: 1, role: 'user',
    content: '我们应该把单体应用迁移到微服务吗？需要考虑哪些因素？',
  },
  {
    id: 2, role: 'assistant',
    content: '让我系统地分析一下...',
    thinkContent: '用户在询问微服务迁移决策需要考虑的因素。\n\n**关键评估维度：**\n\n1. **团队结构** — Conway 定律：微服务的边界应该与团队边界一致。如果团队规模小且同地协作，单体应用实际上可能更高效。\n\n2. **扩展需求** — 当不同组件有截然不同的扩展需求时（如搜索服务 vs 用户认证），微服务优势明显。\n\n3. **部署频率** — 高部署频率 + 独立的发布节奏 → 微服务胜出。低频率 → 不必要的复杂性。\n\n4. **数据一致性容忍度** — 微服务需要接受最终一致性。如果业务需要跨领域的强 ACID 保证，这是一个重大警示信号。\n\n5. **运维开销** — 服务网格、分布式追踪、熔断器、独立流水线...如果没有平台工程投入，隐藏成本巨大。\n\n**建议框架：**\n- 从模块化单体开始（在一个可部署单元内保持清晰的领域边界）\n- 只有当满足以下条件时才抽取服务：(a) 每领域团队超过 8 人，(b) 扩展痛点真实存在，(c) CI/CD 已成熟\n\n**反模式警告：**"我们用微服务就可以扩展" — 这是杀死创业公司的过早优化。',
    thinkDone: true,
  },
  {
    id: 3, role: 'assistant',
    content: '这是一个高风险的架构决策。让我为你梳理关键评估维度：\n\n## 应该迁移到微服务吗？\n\n### TL;DR：可能还不是时候。\n\n微服务与单体之争往往是分散注意力的。更重要的是**服务边界**和**团队自主权**。\n\n---\n\n### 决策框架\n\n| 因素 | 微服务胜出 | 单体胜出 |\n|--------|-----------------|---------------|\n| **团队规模** | 每领域超过 8 名工程师 | 小型同地协作团队 |\n| **扩展性** | 各组件负载差异大 | 统一负载 |\n| **部署节奏** | 每天多次部署 | 每周或更少 |\n| **数据一致性** | 可接受最终一致性 | 需要强 ACID 保证 |\n| **运维成熟度** | SRE、服务网格、追踪 | 手动部署 |\n\n---\n\n### 我的建议\n\n**从模块化单体开始。**\n\n在一个可部署单元内强制执行严格的领域边界和清晰的架构。只有当遇到真实的、可衡量的痛点时才抽取服务：\n\n1. 某个特定组件需要独立扩展\n2. 团队被部署耦合所阻碍\n3. CI/CD 足够成熟以处理分布式复杂性\n\n---\n\n### 警示信号\n\n- "我们会扩展得更好"（过早优化）\n- "微服务更现代"（技术崇拜）\n- 没有专门的平台/运维团队\n\n你们当前的团队规模和部署频率是多少？这个背景信息有助于我给出更有针对性的评估。',
  },
]

const multiTurnDemo: ChatMessage[] = [
  {
    id: 1, role: 'user',
    content: '我想了解一下我们的销售 pipeline。',
  },
  {
    id: 2, role: 'assistant',
    content: '我们的销售管道包含 5 个关键阶段：\n\n```\n线索 → MQL → SQL → 商机 → 合同 → 成交\n```\n\n**关键指标：**\n- 平均成交周期：**28 天**\n- 赢单率：**34%**\n- 平均客单价：**¥128,000**\n\n您想深入了解哪个阶段 — 线索生成、筛选标准还是转化分析？',
  },
  {
    id: 3, role: 'user',
    content: '给我讲讲 MQL 到 SQL 的转化率。',
  },
  {
    id: 4, role: 'assistant',
    content: '## MQL → SQL 转化分析\n\n**总体转化率：41%**\n\n| 客户群 | 转化率 | 平均耗时 |\n|---------|----------------|----------|\n| Inbound（内容营销） | 38% | 6 天 |\n| Inbound（活动获客） | 52% | 3 天 |\n| Outbound（主动外呼） | 29% | 11 天 |\n\n**关键洞察：**外呼线索的筛选和转化耗时是入站线索的 3 倍，且转化率更低 — 这表明外呼目标与 MQL 评分标准存在偏差。\n\n**建议措施：**\n1. 校准外呼 ICP（理想客户画像）与 MQL 评分模型\n2. 增加互动评分来补充企业特征评分\n\n您想按行业垂直领域或销售人员来细分查看吗？',
  },
  {
    id: 5, role: 'user',
    content: '哪位销售的主动外呼转化率最高？',
  },
  {
    id: 6, role: 'assistant',
    content: '## 销售主动外呼转化分析\n\n| 销售 | 外呼 MQL | SQL | 转化率 | 平均周期 |\n|-----|--------------|------|-----------|-----------|\n| **陈思远** | 47 | 21 | **44.7%** | 9 天 |\n| 刘明辉 | 63 | 24 | 38.1% | 10 天 |\n| 王安娜 | 39 | 14 | 35.9% | 12 天 |\n| 赵天成 | 55 | 17 | 30.9% | 14 天 |\n\n**陈思远**以 **44.7%** 的外呼转化率领跑全队 — 比团队平均水平高出 15%。关键发现：她会优先跟进活跃客户（有近期产品演示请求的），而非冷启动外呼。\n\n需要我分析陈思远的外呼策略，找出可复制的模式吗？',
  },
]

// 5步示例：采购需求查询
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
  { id: 'demo-skill', title: '工具调用', subtitle: '天气和工具', icon: '🔧', messages: skillDemo },
  { id: 'demo-rag', title: 'RAG 检索', subtitle: '政策查询', icon: '📚', messages: ragDemo },
  { id: 'demo-think', title: '思考模式', subtitle: '推理链', icon: '🧠', messages: thinkDemo },
  { id: 'demo-5step', title: '5步 Agent', subtitle: '透明执行', icon: '🔍', messages: fiveStepDemo },
  { id: 'demo-multiturn', title: '多轮对话', subtitle: '上下文记忆', icon: '💬', messages: multiTurnDemo },
]

// ── 快捷提示词 ───────────────────────────────────────────────
const quickPrompts = [
  { icon: '🔧', text: '今天北京天气怎么样？' },
  { icon: '🧠', text: '用简单的语言解释微服务和单体的区别' },
  { icon: '📊', text: '分析一下我们 Q1 的销售业绩' },
  { icon: '📋', text: '20 万订单的采购审批政策是什么？' },
]

// ── 当前对话状态 ────────────────────────────────────
type ActiveId = string | number
const activeId = ref<ActiveId>('welcome')

// ── 我的对话 ────────────────────────────────────────────
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
  conversations.value.unshift({ id, title: '新对话', messages: [] })
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

  // 如果在示例场景上，分叉到新的用户对话
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

  // 保存到现有用户对话
  const conv = conversations.value.find((c) => c.id === activeId.value)
  if (conv) {
    conv.messages = [...messages.value]
    conv.title = messages.value[0]?.role === 'user'
      ? messages.value[0].content.slice(0, 24) + (messages.value[0].content.length > 24 ? '...' : '')
      : conv.title
  }
}

// ── HITL 事件处理 ────────────────────────────────────────────

/**
 * 处理 HITL 选项选择
 * 使用 resumeHitl 从中断点继续，而不是 continueTask
 */
function handleHitlSelect(option: InteractionOption, params?: Record<string, any>) {
  console.log('[HITL] Select option:', option, params)

  // 对于代表确认操作的交互选项
  if (option.action === 'confirm' || option.action === 'execute') {
    resumeHitl({
      action: 'confirm',
      selectedValue: option.id,
    })
  } else if (option.action === 'cancel') {
    resumeHitl({
      action: 'cancel',
    })
  } else {
    // 对于其他操作（导航、导出、编写），使用带 action 标记的 continueTask
    continueTask(`[action] ${option.id}`)
  }
}

/**
 * 处理确认按钮点击
 * 关键修复：使用 resumeHitl 从中断点恢复
 */
function handleHitlConfirm(id: string, params?: Record<string, any>) {
  console.log('[HITL] Confirm:', id, params)
  resumeHitl({
    action: 'confirm',
    taskId: id,
  })
}

/**
 * Handle cancel button click
 */
function handleHitlCancel(id: string) {
  console.log('[HITL] Cancel:', id)
  resumeHitl({
    action: 'cancel',
    taskId: id,
  })
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
  resumeHitl({
    action: 'cancel',
  })
}

/**
 * 处理槽位填充：用户填写了必填字段并提交
 * 关键修复：使用 resumeHitl 和 filled_slots 继续流程
 */
function handleHitlSlotFill(id: string, values: Record<string, any>) {
  console.log('[HITL] Slot fill:', id, values)
  resumeHitl({
    action: 'submit_slots',
    taskId: id,
    filledSlots: values,
  })
}

function handleHitlSlotCancel(id: string) {
  console.log('[HITL] Slot cancel:', id)
  resumeHitl({
    action: 'cancel',
    taskId: id,
  })
}

// ── 日志面板 ───────────────────────────────────────────────────
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
  height: 100%;
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

.user-bubble {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  padding: 10px 14px;
  border-radius: 14px;
  max-width: 70%;
  font-size: 0.9rem;
  line-height: 1.5;
}

.message-row.user .user-bubble {
  background: var(--vp-c-brand-1);
  color: #fff;
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
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.chat-input:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.12);
}

.chat-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: var(--vp-c-brand-1);
  color: #fff;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}

.send-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
