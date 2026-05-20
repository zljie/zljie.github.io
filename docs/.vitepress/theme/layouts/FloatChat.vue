<template>
  <Teleport to="body">
    <Transition name="chat-popup">
      <div v-if="isOpen" class="float-chat" :style="chatStyle">
        <div class="float-header" @mousedown="startDrag">
          <div class="float-header-info">
            <img
              class="float-avatar"
              src="https://api.dicebear.com/7.x/bottts/svg?seed=AI"
              alt="AI"
            />
            <div>
              <div class="float-title">{{ config.title || 'AI Assistant' }}</div>
              <div class="float-subtitle">{{ config.subtitle || 'Powered by ant-design-x-vue' }}</div>
            </div>
          </div>
          <button class="float-close" @click="isOpen = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="float-messages" ref="messagesRef">
          <Welcome v-if="messages.length === 0" :user="welcomeUser" />
          <template v-for="msg in messages" :key="msg.id">
            <div class="float-message-row" :class="msg.role">
              <img
                v-if="msg.role === 'assistant'"
                class="float-avatar-sm"
                src="https://api.dicebear.com/7.x/bottts/svg?seed=AI"
                alt="AI"
              />
              <Bubble :content="msg.content" :role="msg.role" />
              <img
                v-if="msg.role === 'user'"
                class="float-avatar-sm"
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=User"
                alt="User"
              />
            </div>
          </template>
          <div v-if="loading" class="float-message-row assistant">
            <img
              class="float-avatar-sm"
              src="https://api.dicebear.com/7.x/bottts/svg?seed=AI"
              alt="AI"
            />
            <div class="float-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <div class="float-input">
          <Sender
            :value="inputValue"
            @update:value="(v: string) => inputValue = v"
            :disabled="loading"
            placeholder="Type a message..."
            @send="sendMessage"
            @submit="sendMessage"
          />
        </div>
      </div>
    </Transition>

    <Transition name="fab">
      <button
        v-if="!isOpen"
        class="float-fab"
        @click="isOpen = true"
        aria-label="Open chat"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
        <span v-if="unread > 0" class="float-badge">{{ unread }}</span>
      </button>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { Bubble, Sender, Welcome } from 'ant-design-x-vue'
import { useChat } from './useChat'

const config = computed(() => {
  if (typeof window === 'undefined') return {}
  return window.__CHAT_CONFIG__ || {}
})

const isOpen = ref(false)
const unread = ref(0)
const welcomeUser = ref({ name: 'Guest' })
const chatStyle = ref({ bottom: '100px', right: '24px' })

let dragOffsetX = 0
let dragOffsetY = 0
let isDragging = false

const { messages, inputValue, loading, messagesRef, sendMessage, scrollToBottom } = useChat()

watch(isOpen, (val) => {
  if (val) {
    unread.value = 0
    nextTick(scrollToBottom)
  }
})

watch(messages, () => {
  if (!isOpen.value) {
    unread.value++
  }
  nextTick(scrollToBottom)
}, { deep: true })

function startDrag(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.float-close')) return
  isDragging = true
  const el = (e.currentTarget as HTMLElement).parentElement!
  dragOffsetX = e.clientX - el.offsetLeft
  dragOffsetY = e.clientY - el.offsetTop
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e: MouseEvent) {
  if (!isDragging) return
  const vw = window.innerWidth
  const vh = window.innerHeight
  const w = 380
  const h = 560
  const x = Math.min(Math.max(0, e.clientX - dragOffsetX), vw - w)
  const y = Math.min(Math.max(0, e.clientY - dragOffsetY), vh - h)
  chatStyle.value = { left: `${x}px`, top: `${y}px`, right: 'auto', bottom: 'auto' }
}

function stopDrag() {
  isDragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}
</script>

<style scoped>
.float-chat {
  position: fixed;
  z-index: 9999;
  width: 380px;
  height: 560px;
  display: flex;
  flex-direction: column;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  font-family: var(--vp-font-family-base);
}

.float-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--vp-c-brand-1);
  color: #fff;
  cursor: move;
  user-select: none;
  flex-shrink: 0;
}

.float-header-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.float-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
}

.float-avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.float-title {
  font-size: 0.95rem;
  font-weight: 600;
}

.float-subtitle {
  font-size: 0.75rem;
  opacity: 0.8;
}

.float-close {
  background: rgba(255,255,255,0.15);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: background 0.15s;
}

.float-close:hover {
  background: rgba(255,255,255,0.25);
}

.float-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.float-message-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.float-message-row.user {
  flex-direction: row-reverse;
}

.float-typing {
  display: flex;
  gap: 4px;
  padding: 10px 14px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  margin-top: 4px;
}

.float-typing span {
  width: 6px;
  height: 6px;
  background: var(--vp-c-text-3);
  border-radius: 50%;
  animation: bounce 1.2s infinite;
}

.float-typing span:nth-child(2) { animation-delay: 0.2s; }
.float-typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.float-input {
  padding: 12px 16px 16px;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  flex-shrink: 0;
}

.float-fab {
  position: fixed;
  z-index: 9998;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;
}

.float-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.25);
}

.float-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid var(--vp-c-bg);
}

.chat-popup-enter-active,
.chat-popup-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.chat-popup-enter-from,
.chat-popup-leave-to {
  opacity: 0;
  transform: scale(0.88) translateY(16px);
}

.fab-enter-active,
.fab-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: scale(0.6);
}
</style>
