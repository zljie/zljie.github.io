/// <reference types="vite/client" />

/**
 * Agent Chatbot UI - Configuration
 *
 * Usage:
 *   Development: ./dev.sh --endpoint http://localhost:8000/chat
 *                Or: VITE_CHAT_ENDPOINT=http://localhost:8000/chat pnpm dev
 *   Production:   Set VITE_CHAT_ENDPOINT at build time (CI/CD pipeline)
 */

export interface ChatConfig {
  /** Backend Agent endpoint (SSE chat endpoint) */
  endpoint: string
  /** Chat page title */
  title?: string
  /** Chat page subtitle */
  subtitle?: string
}

// ─── Inject into global window ──────────────────────────────────
const endpoint: string = import.meta.env.VITE_CHAT_ENDPOINT || '/chat'
const title: string = import.meta.env.VITE_CHAT_TITLE || 'AI Assistant'
const subtitle: string = import.meta.env.VITE_CHAT_SUBTITLE || 'Powered by Agent Chatbot UI'

export const defaultConfig: ChatConfig = { endpoint, title, subtitle }

if (typeof window !== 'undefined') {
  window.__CHAT_CONFIG__ = defaultConfig
}
