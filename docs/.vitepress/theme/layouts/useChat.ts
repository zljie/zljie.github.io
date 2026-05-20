import { ref, nextTick } from 'vue'

declare global {
  interface Window {
    __CHAT_CONFIG__?: {
      endpoint: string
      title?: string
      subtitle?: string
    }
  }
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
}

function getEndpoint(): string {
  return (
    (typeof window !== 'undefined' && window.__CHAT_CONFIG__?.endpoint) ||
    '/chat'
  )
}

export function useChat() {
  const messages = ref<ChatMessage[]>([])
  const inputValue = ref('')
  const loading = ref(false)
  const messagesRef = ref<HTMLElement>()
  const messageIdCounter = ref(0)

  function scrollToBottom() {
    nextTick(() => {
      if (messagesRef.value) {
        messagesRef.value.scrollTop = messagesRef.value.scrollHeight
      }
    })
  }

  async function sendMessage() {
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

    try {
      const endpoint = getEndpoint()
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await response.json()
      const reply: ChatMessage = {
        id: ++messageIdCounter.value,
        role: 'assistant',
        content:
          data.response || data.reply || data.content || JSON.stringify(data),
      }
      messages.value.push(reply)
    } catch {
      const reply: ChatMessage = {
        id: ++messageIdCounter.value,
        role: 'assistant',
        content: `Error: Could not reach backend at ${getEndpoint()}`,
      }
      messages.value.push(reply)
    }

    loading.value = false
    scrollToBottom()
  }

  return {
    messages,
    inputValue,
    loading,
    messagesRef,
    sendMessage,
    scrollToBottom,
  }
}
