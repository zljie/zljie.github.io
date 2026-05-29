import { ref, reactive, nextTick } from 'vue'

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
  /** Tool calls invoked during this assistant response */
  toolCalls?: ToolCall[]
}

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

/**
 * SSE parser that properly handles:
 * - event: message / event: ping lines (lines not starting with "data:")
 * - data: [DONE] markers
 * - Multi-chunk JSON bodies split across TCP packets
 * - Partial lines arriving in different chunks
 */
interface Chunk {
  think?: string
  think_done?: boolean
  content?: string
  done?: boolean
  error?: string
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
      // Empty line = end of current event
      if (curLines.length > 0) {
        const parsed = parseEventLines(curLines)
        for (const c of parsed) chunks.push(c)
        curLines.length = 0
      }
    } else {
      curLines.push(line)
    }
  }
  // Flush incomplete trailing event
  if (curLines.length > 0) {
    const parsed = parseEventLines(curLines)
    for (const c of parsed) chunks.push(c)
  }
  return chunks
}

/**
 * Parse one event's accumulated lines into one or more Chunks.
 * Handles multiple data: lines within a single event block by emitting
 * one Chunk per data: line.
 */
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

  if (!eventType) eventType = 'message'  // no event: line → default "message" event
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

    switch (eventType) {
      case 'think':        out.push({ think: body.content });         break
      case 'think_done':   out.push({ think_done: true });           break
      case 'content':      out.push({ content: body.content });       break
      case 'message':      out.push({ content: body.content });       break
      case 'tool_call':    out.push({ tool_call: body as any });      break
      case 'tool_result':  out.push({ tool_result: body as any });    break
      case 'done':         out.push({ done: true });                  break
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
    const assistantMsg = reactive<ChatMessage>({
      id: ++messageIdCounter.value,
      role: 'assistant',
      content: '',
      thinkContent: '',
      thinkDone: false,
      done: false,
      toolCalls: [],
    })
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
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: !done })

        // Normalise line endings so we can split on either \n\n or \r\n\r\n
        buffer = buffer.replace(/\r\n/g, '\n')
        // Split on SSE event boundary (\n\n) to isolate complete events
        // The remaining buffer (after the last \n\n) may contain a partial event — keep it
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? '' // carry over incomplete trailing chunk

        for (const eventBlock of parts) {
          if (!eventBlock.trim()) continue
          const chunks = parseSSE(eventBlock)
          for (const chunk of chunks) {
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
    setMessages,
    clearMessages,
  }
}
