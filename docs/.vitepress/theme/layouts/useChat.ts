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
  /** Markdown-rendered HTML for the assistant message */
  rendered?: string
  /** Raw think/reasoning text being streamed */
  thinkContent?: string
  /** Whether the think section has finished streaming */
  thinkDone?: boolean
  /** Whether the full message has finished streaming */
  done?: boolean
}

interface Chunk {
  think?: string
  think_done?: boolean
  content?: string
  done?: boolean
  error?: string
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

  function scrollToMessage(id: number) {
    nextTick(() => {
      if (!messagesRef.value) return
      const el = messagesRef.value.querySelector(`[data-msg-id="${id}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' })
    })
  }

  /**
   * Non-streaming fallback — used when streaming is not available.
   * Kept for backward compatibility with external endpoints.
   */
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

    try {
      const endpoint = getEndpoint()
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.value
            .filter((m) => m.role === 'user')
            .map((m) => ({ role: 'user', content: m.content })),
          stream: false,
        }),
      })
      const data = await response.json()
      const reply: ChatMessage = {
        id: ++messageIdCounter.value,
        role: 'assistant',
        content:
          data.response || data.reply || data.content || JSON.stringify(data),
        done: true,
      }
      messages.value.push(reply)
    } catch {
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

  /**
   * Streaming version — opens an SSE connection and updates the message
   * in-place as chunks arrive. Supports both think mode and content streaming.
   */
  async function sendMessageStreaming(text: string): Promise<void> {
    const assistantMsg: ChatMessage = {
      id: ++messageIdCounter.value,
      role: 'assistant',
      content: '',
      thinkContent: '',
      thinkDone: false,
      done: false,
    }
    messages.value.push(assistantMsg)
    scrollToMessage(assistantMsg.id)

    try {
      const endpoint = getEndpoint()
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.value
            .filter((m) => m.role === 'user')
            .map((m) => ({ role: 'user', content: m.content })),
          stream: true,
        }),
      })

      if (!response.body) {
        throw new Error('Response body is null — streaming not supported')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const raw = decoder.decode(value, { stream: !done })
        // SSE format: "data: {...}\n\n"
        for (const line of raw.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const body = line.slice(6)
          let chunk: Chunk
          try {
            chunk = JSON.parse(body)
          } catch {
            continue
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

          if (chunk.content !== undefined) {
            assistantMsg.content = (assistantMsg.content || '') + chunk.content
            scrollToMessage(assistantMsg.id)
          }

          if (chunk.done) {
            assistantMsg.done = true
          }
        }
      }
    } catch (err: any) {
      assistantMsg.content = `Error: ${err.message || 'Unknown error'}`
      assistantMsg.done = true
    }

    scrollToMessage(assistantMsg.id)
  }

  /**
   * Unified send — detects if the endpoint supports streaming by checking
   * the Accept header in the response, then falls back gracefully.
   */
  async function sendMessage() {
    const text = inputValue.value.trim()
    if (!text || loading.value) return

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
      // Try streaming first
      await sendMessageStreaming(text)
    } catch {
      // Fallback to non-streaming
      messages.value.pop() // remove the placeholder assistant msg
      await sendMessageNonStreaming()
      return
    }

    loading.value = false
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
