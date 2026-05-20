<template>
  <div class="chat-page">
    <div class="chat-header">
      <div class="header-info">
        <span class="header-title">{{ config.title || 'AI Chat' }}</span>
        <span class="header-subtitle">{{ config.subtitle || 'Powered by ant-design-x-vue' }}</span>
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
import { Bubble, Sender, Welcome } from 'ant-design-x-vue'
import { useChat, type ChatMessage } from './useChat'

const config = computed(() => {
  if (typeof window === 'undefined') return {}
  return window.__CHAT_CONFIG__ || {}
})

const { messages, inputValue, loading, messagesRef, sendMessage } = useChat()

interface Conversation {
  id: number
  title: string
  messages: ChatMessage[]
}

const conversations = ref<Conversation[]>([
  { id: 1, title: 'Chat 1', messages: [] },
  { id: 2, title: 'Chat 2', messages: [] },
])
const activeConvId = ref(1)
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

async function handleSendMessage() {
  const text = inputValue.value.trim()
  await sendMessage()
  const conv = conversations.value.find((c) => c.id === activeConvId.value)
  if (conv && text) {
    conv.messages = [...messages.value]
    conv.title = text.slice(0, 20) + (text.length > 20 ? '...' : '')
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
