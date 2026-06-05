<template>
  <div class="lets-talk-page">
    <aside class="lets-talk-sidebar">
      <div class="sidebar-brand">
        <p class="sidebar-eyebrow">LET'S TALK</p>
        <h1>把想法聊成可落地的方案</h1>
        <p class="sidebar-description">
          无论你想聊合作机会、产品战略、数字化转型，还是 AI 在企业场景里的实际落地，
          这里都可以直接开始。
        </p>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">适合聊这些</div>
        <div class="topic-list">
          <button
            v-for="topic in conversationTopics"
            :key="topic.title"
            class="topic-card"
            @click="sendQuickPrompt(topic.prompt)"
          >
            <span class="topic-icon">{{ topic.icon }}</span>
            <span class="topic-copy">
              <strong>{{ topic.title }}</strong>
              <span>{{ topic.description }}</span>
            </span>
          </button>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">开始前你可以这样问</div>
        <ul class="question-list">
          <li v-for="prompt in starterQuestions" :key="prompt">
            <button @click="sendQuickPrompt(prompt)">{{ prompt }}</button>
          </li>
        </ul>
      </div>
    </aside>

    <main class="lets-talk-main">
      <div class="lets-talk-header">
        <div>
          <div class="header-title">{{ config.title || "Let's Talk" }}</div>
          <div class="header-subtitle">{{ config.subtitle || 'Start the conversation' }}</div>
        </div>
        <div class="header-actions">
          <a href="/cv" class="header-link">查看简历</a>
          <a href="/blog/" class="header-link header-link--muted">浏览文章</a>
        </div>
      </div>

      <div class="lets-talk-chat-shell">
        <section v-if="messages.length === 0" class="welcome-panel">
          <span class="welcome-kicker">DISCOVERY CALL</span>
          <h2>先从一个真实问题开始。</h2>
          <p>
            我更擅长围绕业务目标、组织协作和产品落地来对话。你可以直接说你正在推进的项目、
            遇到的阻碍，或者希望我帮你一起澄清的决策。
          </p>
          <div class="welcome-tags">
            <span v-for="tag in welcomeTags" :key="tag">{{ tag }}</span>
          </div>
          <div class="quick-prompts">
            <div class="quick-prompts-label">快速开始</div>
            <div class="quick-prompts-grid">
              <button
                v-for="prompt in quickPrompts"
                :key="prompt.text"
                class="quick-prompt-btn"
                @click="sendQuickPrompt(prompt.text)"
              >
                <span class="quick-prompt-icon">{{ prompt.icon }}</span>
                <span class="quick-prompt-text">{{ prompt.text }}</span>
              </button>
            </div>
          </div>
        </section>

        <div v-else class="messages" ref="messagesRef">
          <template v-for="msg in messages" :key="msg.id">
            <div class="message-row" :class="msg.role" :data-msg-id="msg.id">
              <img
                v-if="msg.role === 'assistant'"
                class="avatar"
                src="https://api.dicebear.com/7.x/bottts/svg?seed=AI"
                alt="AI"
              />
              <div v-if="msg.role === 'user'" class="user-bubble">
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

        <div class="chat-input-area">
          <div class="input-wrapper">
            <input
              class="chat-input"
              type="text"
              v-model="inputValue"
              :disabled="loading"
              placeholder="比如：我们想做一个统一认证平台，该怎么规划产品路线？"
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
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import { useChat, type InteractionOption } from './useChat'
import MarkdownBubble from './MarkdownBubble.vue'

const config = computed(() => {
  if (typeof window === 'undefined') return { title: '', subtitle: '' }
  return window.__CHAT_CONFIG__ || { title: '', subtitle: '' }
})

const {
  messages,
  inputValue,
  loading,
  messagesRef,
  sendMessage,
  continueTask,
  scrollToBottom,
} = useChat()

const welcomeTags = ['合作机会', '产品咨询', '数字化转型', 'AI 落地', '团队协作']

const conversationTopics = [
  {
    icon: '🤝',
    title: '合作机会',
    description: '聊顾问合作、项目共创、产品咨询与交付方式。',
    prompt: '我们想聊一下合作方式，你通常适合参与什么类型的项目？',
  },
  {
    icon: '🧭',
    title: '产品策略',
    description: '梳理业务目标、用户价值、产品边界和路线图。',
    prompt: '如果要从 0 到 1 规划一个企业数字化产品，建议先从哪些部分开始？',
  },
  {
    icon: '🏗️',
    title: '架构与平台化',
    description: '讨论统一认证、低代码平台、中后台能力建设。',
    prompt: '我们在做平台化建设时，怎么判断哪些能力应该沉淀成中台？',
  },
  {
    icon: '🤖',
    title: 'AI 场景落地',
    description: '判断 AI 该放在哪里，如何避免“为了 AI 而 AI”。',
    prompt: '企业里做 AI 产品落地时，应该如何选择最值得先做的场景？',
  },
]

const starterQuestions = [
  '我们现在有多个业务系统，想做统一认证平台，应该先梳理什么？',
  '如果一个团队想从传统项目制转向敏捷协作，第一步该怎么做？',
  '低代码平台适合什么样的企业和团队，不适合什么情况？',
  '怎么判断一个 AI 需求是真需求，还是伪需求？',
]

const quickPrompts = [
  {
    icon: '🎯',
    text: '帮我梳理一个企业数字化产品从 0 到 1 的规划框架',
  },
  {
    icon: '🧩',
    text: '我们想做统一认证平台，请帮我拆一下核心能力模块',
  },
  {
    icon: '⚙️',
    text: '怎么判断低代码平台应该做成通用平台还是场景化平台？',
  },
  {
    icon: '🚀',
    text: '如果要推进 AI 在业务中的落地，第一阶段最适合做哪些事情？',
  },
]

watch(
  messages,
  () => {
    nextTick(scrollToBottom)
  },
  { deep: true },
)

async function sendQuickPrompt(text: string) {
  inputValue.value = text
  await handleSendMessage()
}

async function handleSendMessage() {
  if (!inputValue.value.trim() || loading.value) return
  await sendMessage()
}

function handleHitlSelect(option: InteractionOption, params?: Record<string, any>) {
  continueTask(`[action] ${option.id}${params ? ` ${JSON.stringify(params)}` : ''}`)
}

function handleHitlConfirm(id: string, params?: Record<string, any>) {
  continueTask(`[confirm] ${id}${params ? ` ${JSON.stringify(params)}` : ''}`)
}

function handleHitlCancel(id: string) {
  continueTask(`[cancel] ${id}`)
}

function handleHitlRating(rating: number) {
  continueTask(`[rating] ${rating}`)
}

function handleHitlInput(value: string) {
  continueTask(value)
}

function handleHitlDismiss() {
  continueTask('[timeout]')
}

function handleHitlSlotFill(id: string, values: Record<string, any>) {
  const formattedValues = Object.entries(values)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')
  continueTask(`[slot-fill] ${id} | ${formattedValues}`)
}

function handleHitlSlotCancel(id: string) {
  continueTask(`[cancel] ${id}`)
}
</script>

<style scoped>
.lets-talk-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(300px, 420px) minmax(0, 1fr);
  background:
    radial-gradient(circle at top left, rgba(17, 17, 17, 0.08), transparent 30%),
    var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.lets-talk-sidebar {
  padding: 40px 28px 32px;
  border-right: 1px solid var(--vp-c-divider);
  background: linear-gradient(180deg, var(--vp-c-bg-soft), rgba(127, 127, 127, 0.04));
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.sidebar-eyebrow {
  margin: 0 0 12px;
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.sidebar-brand h1 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.8rem);
  line-height: 1.05;
}

.sidebar-description {
  margin: 16px 0 0;
  font-size: 0.98rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sidebar-section-title {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.topic-list {
  display: grid;
  gap: 12px;
}

.topic-card {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  background: var(--vp-c-bg);
  padding: 16px;
  display: flex;
  gap: 14px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.topic-card:hover {
  transform: translateY(-2px);
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 12px 30px rgba(17, 17, 17, 0.08);
}

.topic-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--vp-c-brand-soft);
  font-size: 1.2rem;
  flex-shrink: 0;
}

.topic-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.topic-copy strong {
  font-size: 0.95rem;
}

.topic-copy span {
  color: var(--vp-c-text-2);
  font-size: 0.86rem;
  line-height: 1.5;
}

.question-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.question-list button {
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
  color: var(--vp-c-text-2);
  cursor: pointer;
  line-height: 1.6;
}

.question-list button:hover {
  color: var(--vp-c-brand-1);
}

.lets-talk-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 20px;
}

.lets-talk-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.header-title {
  font-size: 1.1rem;
  font-weight: 700;
}

.header-subtitle {
  margin-top: 4px;
  color: var(--vp-c-text-3);
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-link {
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 999px;
  text-decoration: none;
  color: #fff;
  background: var(--vp-c-brand-1);
  font-size: 0.9rem;
  font-weight: 600;
}

.header-link--muted {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.lets-talk-chat-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--vp-c-divider);
  border-radius: 28px;
  overflow: hidden;
  background: var(--vp-c-bg);
  box-shadow: 0 20px 60px rgba(17, 17, 17, 0.08);
}

.welcome-panel {
  padding: 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.welcome-kicker {
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.welcome-panel h2 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 3rem);
  line-height: 1.05;
}

.welcome-panel p {
  margin: 0;
  max-width: 780px;
  color: var(--vp-c-text-2);
  line-height: 1.8;
  font-size: 1rem;
}

.welcome-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.welcome-tags span {
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 0.88rem;
}

.quick-prompts {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quick-prompts-label {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.quick-prompts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.quick-prompt-btn {
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  padding: 18px;
  background: linear-gradient(180deg, var(--vp-c-bg-soft), var(--vp-c-bg));
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.quick-prompt-btn:hover {
  transform: translateY(-2px);
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 12px 28px rgba(17, 17, 17, 0.07);
}

.quick-prompt-icon {
  font-size: 1.1rem;
  line-height: 1.2;
}

.quick-prompt-text {
  font-size: 0.94rem;
  line-height: 1.6;
  color: var(--vp-c-text-1);
}

.messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 32px 24px 12px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.message-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-row.user {
  justify-content: flex-end;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.user-bubble {
  max-width: min(70%, 760px);
  background: var(--vp-c-brand-1);
  color: #fff;
  padding: 14px 16px;
  border-radius: 18px 18px 4px 18px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.chat-input-area {
  padding: 20px 24px 24px;
  border-top: 1px solid var(--vp-c-divider);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), var(--vp-c-bg));
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  border-radius: 18px;
  padding: 8px 8px 8px 16px;
}

.chat-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--vp-c-text-1);
  font-size: 0.96rem;
  outline: none;
  padding: 8px 0;
}

.chat-input::placeholder {
  color: var(--vp-c-text-3);
}

.send-btn {
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 14px;
  background: var(--vp-c-brand-1);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.send-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 1100px) {
  .lets-talk-page {
    grid-template-columns: 1fr;
  }

  .lets-talk-sidebar {
    border-right: none;
    border-bottom: 1px solid var(--vp-c-divider);
  }

  .quick-prompts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .lets-talk-main {
    padding: 16px;
  }

  .lets-talk-sidebar {
    padding: 28px 20px;
  }

  .lets-talk-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .welcome-panel {
    padding: 28px 20px;
  }

  .messages {
    padding: 24px 16px 12px;
  }

  .chat-input-area {
    padding: 16px;
  }

  .user-bubble {
    max-width: 85%;
  }
}
</style>
