<template>
  <div class="chat-page">
    <div class="chat-header">
      <div class="header-info">
        <span class="header-title">{{ config.title || 'AI Chat' }}</span>
        <span class="header-subtitle">{{ config.subtitle || 'Powered by ant-design-x-vue' }}</span>
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
            <div class="welcome-subtitle">{{ config.subtitle || 'Powered by ant-design-x-vue' }}</div>
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
              <Bubble
                v-if="msg.role === 'user'"
                :content="msg.content"
                :role="msg.role"
              />
              <MarkdownBubble
                v-else
                :content="msg.content"
                role="assistant"
                :streaming="!msg.done"
                :think-content="msg.thinkContent"
                :think-done="msg.thinkDone"
                :tool-calls="msg.toolCalls"
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
          <Sender
            :value="inputValue"
            @update:value="(v: string) => inputValue = v"
            :disabled="loading"
            placeholder="Type a message..."
            @send="handleSendMessage"
            @submit="handleSendMessage"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bubble, Sender } from 'ant-design-x-vue'
import { useChat, type ChatMessage } from './useChat'
import MarkdownBubble from './MarkdownBubble.vue'

const config = computed(() => {
  if (typeof window === 'undefined') return { title: '', subtitle: '' }
  return window.__CHAT_CONFIG__ || { title: '', subtitle: '' }
})

const { messages, inputValue, loading, messagesRef, sendMessage, setMessages, clearMessages } = useChat()

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

const scenarios: Scenario[] = [
  { id: 'demo-skill', title: 'Skill Calling', subtitle: 'Weather & tools', icon: '🔧', messages: skillDemo },
  { id: 'demo-rag', title: 'RAG Retrieval', subtitle: 'Policy search', icon: '📚', messages: ragDemo },
  { id: 'demo-think', title: 'Think Mode', subtitle: 'Reasoning chain', icon: '🧠', messages: thinkDemo },
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
type ActiveId = string
const activeId = ref<string>('welcome')

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
  if (activeId.value.startsWith('demo-')) {
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
</style>
