<template>
  <div class="chat-page">
    <div class="chat-header">
      <div class="header-info">
        <span class="header-title">AI Chat</span>
        <span class="header-subtitle">Powered by ant-design-x-vue</span>
      </div>
    </div>

    <div class="chat-container">
      <div class="conversation-list">
        <div class="conversation-header">
          <span>Conversations</span>
          <button class="new-chat-btn" @click="createConversation">+ New</button>
        </div>
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="conversation-item"
          :class="{ active: activeConvId === conv.id }"
          @click="selectConversation(conv.id)"
        >
          {{ conv.title }}
        </div>
      </div>

      <div class="chat-main">
        <div class="messages" ref="messagesRef">
          <Welcome v-if="messages.length === 0" :user="welcomeUser" />
          <template v-for="msg in messages" :key="msg.id">
            <div class="message-row" :class="msg.role">
              <img
                v-if="msg.role === 'assistant'"
                class="avatar"
                src="https://api.dicebear.com/7.x/bottts/svg?seed=AI"
                alt="AI"
              />
              <Bubble :content="msg.content" :role="msg.role" />
              <img
                v-if="msg.role === 'user'"
                class="avatar"
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=User"
                alt="User"
              />
            </div>
          </template>
          <div v-if="loading" class="message-row assistant">
            <img
              class="avatar"
              src="https://api.dicebear.com/7.x/bottts/svg?seed=AI"
              alt="AI"
            />
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <Sender
            v-model="inputValue"
            :disabled="loading"
            placeholder="Type a message..."
            @send="sendMessage"
            @submit="sendMessage"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Bubble, Sender, Welcome } from 'ant-design-x-vue'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
}

interface Conversation {
  id: number
  title: string
  messages: Message[]
}

const conversations = ref<Conversation[]>([
  { id: 1, title: 'Chat 1', messages: [] },
  { id: 2, title: 'Chat 2', messages: [] },
])
const activeConvId = ref(1)
const messages = ref<Message[]>([])
const inputValue = ref('')
const loading = ref(false)
const messagesRef = ref<HTMLElement>()
const messageIdCounter = ref(0)
const welcomeUser = ref({ name: 'Guest' })

function selectConversation(id: number) {
  activeConvId.value = id
  const conv = conversations.value.find((c) => c.id === id)
  messages.value = conv?.messages ?? []
}

function createConversation() {
  const newId = conversations.value.length + 1
  conversations.value.push({ id: newId, title: `Chat ${newId}`, messages: [] })
  selectConversation(newId)
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

function mockReply(userMessage: string): string {
  const lower = userMessage.toLowerCase()
  if (lower.includes('hello') || lower.includes('hi')) {
    return "Hello! I'm your AI assistant. How can I help you today?"
  }
  if (lower.includes('who are you') || lower.includes('about')) {
    return "I'm an AI assistant built with ant-design-x-vue and Vue 3. I can chat with you, answer questions, and help with various tasks!"
  }
  if (lower.includes('help')) {
    return "I can help you with:\n- Answering questions\n- Writing code snippets\n- Explaining concepts\n- Brainstorming ideas\n\nJust type your question!"
  }
  return `You said: "${userMessage}"\n\nThis is a mock response. To connect to a real AI backend, integrate OpenAI or Claude API at the sendMessage function in docs/.vitepress/theme/layouts/Chat.vue.`
}

async function sendMessage() {
  const text = inputValue.value.trim()
  if (!text || loading.value) return

  inputValue.value = ''

  const userMsg: Message = {
    id: ++messageIdCounter.value,
    role: 'user',
    content: text,
  }
  messages.value.push(userMsg)
  scrollToBottom()

  loading.value = true

  await new Promise((r) => setTimeout(r, 800))

  const reply: Message = {
    id: ++messageIdCounter.value,
    role: 'assistant',
    content: mockReply(text),
  }
  messages.value.push(reply)

  const conv = conversations.value.find((c) => c.id === activeConvId.value)
  if (conv) {
    conv.messages = [...messages.value]
    conv.title = text.slice(0, 20) + (text.length > 20 ? '...' : '')
  }

  loading.value = false
  scrollToBottom()
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

.header-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.header-subtitle {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  margin-left: 12px;
}

.chat-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.conversation-list {
  width: 220px;
  border-right: 1px solid var(--vp-c-divider);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background: var(--vp-c-bg-soft);
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-divider);
}

.new-chat-btn {
  background: var(--vp-c-brand-1);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.8rem;
  cursor: pointer;
}

.conversation-item {
  padding: 10px 16px;
  font-size: 0.85rem;
  cursor: pointer;
  border-bottom: 1px solid var(--vp-c-divider);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--vp-c-text-2);
  transition: background 0.15s, color 0.15s;
}

.conversation-item:hover {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.conversation-item.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

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

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: var(--vp-c-text-3);
  border-radius: 50%;
  animation: bounce 1.2s infinite;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.chat-input-area {
  padding: 12px 24px 24px;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}
</style>
