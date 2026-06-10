/// <reference types="vite/client" />

/**
 * Agent 聊天机器人 UI - 配置
 *
 * 使用方式：
 *   开发：./dev.sh --endpoint http://localhost:8000/chat
 *        或：VITE_CHAT_ENDPOINT=http://localhost:8000/chat pnpm dev
 *   生产：在构建时设置 VITE_CHAT_ENDPOINT（CI/CD 流程）
 */

export interface ChatConfig {
  /** 后端 Agent 端点（SSE 聊天端点） */
  endpoint: string
  /** 聊天页面标题 */
  title?: string
  /** 聊天页面副标题 */
  subtitle?: string
}

// ─── 注入到全局 window ──────────────────────────────────────
const endpoint: string = import.meta.env.VITE_CHAT_ENDPOINT || '/chat'
const title: string = import.meta.env.VITE_CHAT_TITLE || 'AI 助手'
const subtitle: string = import.meta.env.VITE_CHAT_SUBTITLE || '由 Agent 聊天机器人 UI 驱动'

export const defaultConfig: ChatConfig = { endpoint, title, subtitle }

if (typeof window !== 'undefined') {
  window.__CHAT_CONFIG__ = defaultConfig
}
