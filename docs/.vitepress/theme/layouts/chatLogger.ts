/**
 * Chat Logger - 记录每一次用户输入和后端响应的完整交互
 * 每个会话一个日志文件，便于前后端信息对齐
 */

export interface LogEntry {
  timestamp: string
  type: 'user_input' | 'backend_request' | 'backend_response' | 'sse_chunk' | 'error'
  direction: 'send' | 'receive'
  content: any
  metadata?: Record<string, any>
}

export interface SessionLog {
  sessionId: string
  sessionStart: string
  sessionEnd?: string
  entries: LogEntry[]
}

class ChatLogger {
  private currentSession: SessionLog | null = null
  private logBuffer: LogEntry[] = []
  private flushTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * 开始新的会话日志
   */
  startSession(): string {
    const sessionId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    this.currentSession = {
      sessionId,
      sessionStart: new Date().toISOString(),
      entries: [],
    }
    this.logBuffer = []
    return sessionId
  }

  /**
   * 结束当前会话
   */
  endSession(): void {
    if (this.currentSession) {
      this.currentSession.sessionEnd = new Date().toISOString()
      this.flushToStorage()
    }
  }

  /**
   * 记录用户输入
   */
  logUserInput(text: string, metadata?: Record<string, any>): void {
    this.addEntry({
      timestamp: new Date().toISOString(),
      type: 'user_input',
      direction: 'send',
      content: text,
      metadata,
    })
  }

  /**
   * 记录发送到后端的请求
   */
  logBackendRequest(requestBody: any, endpoint: string): void {
    this.addEntry({
      timestamp: new Date().toISOString(),
      type: 'backend_request',
      direction: 'send',
      content: requestBody,
      metadata: { endpoint },
    })
  }

  /**
   * 记录后端响应（非流式）
   */
  logBackendResponse(response: any, statusCode?: number): void {
    this.addEntry({
      timestamp: new Date().toISOString(),
      type: 'backend_response',
      direction: 'receive',
      content: response,
      metadata: { statusCode },
    })
  }

  /**
   * 记录 SSE chunk（流式响应）
   */
  logSSEChunk(chunk: any, rawData?: string): void {
    this.addEntry({
      timestamp: new Date().toISOString(),
      type: 'sse_chunk',
      direction: 'receive',
      content: chunk,
      metadata: rawData ? { rawData } : undefined,
    })
  }

  /**
   * 记录错误
   */
  logError(error: any, context?: string): void {
    this.addEntry({
      timestamp: new Date().toISOString(),
      type: 'error',
      direction: 'receive',
      content: error instanceof Error ? error.message : String(error),
      metadata: {
        context,
        stack: error instanceof Error ? error.stack : undefined,
      },
    })
  }

  /**
   * 添加日志条目
   */
  private addEntry(entry: LogEntry): void {
    if (!this.currentSession) {
      this.startSession()
    }

    this.logBuffer.push(entry)
    this.currentSession!.entries.push(entry)

    // 批量写入本地存储，防止频繁 IO
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }
    this.flushTimer = setTimeout(() => this.flushToStorage(), 1000)
  }

  /**
   * 刷新到本地存储
   */
  private flushToStorage(): void {
    if (!this.currentSession) return

    try {
      const key = `chatlog_${this.currentSession.sessionId}`
      localStorage.setItem(key, JSON.stringify(this.currentSession))

      // 维护会话列表
      const sessionList = this.getSessionList()
      if (!sessionList.includes(this.currentSession.sessionId)) {
        sessionList.push(this.currentSession.sessionId)
        // 只保留最近 50 个会话
        if (sessionList.length > 50) {
          const toRemove = sessionList.shift()
          if (toRemove) localStorage.removeItem(`chatlog_${toRemove}`)
        }
        localStorage.setItem('chatlog_sessions', JSON.stringify(sessionList))
      }
    } catch (e) {
      console.warn('[ChatLogger] Failed to save to localStorage:', e)
    }
  }

  /**
   * 获取会话列表
   */
  getSessionList(): string[] {
    try {
      const list = localStorage.getItem('chatlog_sessions')
      return list ? JSON.parse(list) : []
    } catch {
      return []
    }
  }

  /**
   * 获取指定会话的日志
   */
  getSessionLog(sessionId: string): SessionLog | null {
    try {
      const data = localStorage.getItem(`chatlog_${sessionId}`)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  /**
   * 获取当前会话的日志
   */
  getCurrentSession(): SessionLog | null {
    return this.currentSession
  }

  /**
   * 导出日志为 JSON 文件
   */
  exportSessionLog(sessionId?: string): void {
    const session = sessionId
      ? this.getSessionLog(sessionId)
      : this.currentSession

    if (!session) {
      console.warn('[ChatLogger] No session to export')
      return
    }

    const blob = new Blob([JSON.stringify(session, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.sessionId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * 导出为 Markdown 格式（更易读）
   */
  exportAsMarkdown(sessionId?: string): void {
    const session = sessionId
      ? this.getSessionLog(sessionId)
      : this.currentSession

    if (!session) {
      console.warn('[ChatLogger] No session to export')
      return
    }

    let md = `# Chat Session Log\n\n`
    md += `**Session ID:** \`${session.sessionId}\`\n`
    md += `**Start:** ${session.sessionStart}\n`
    md += `**End:** ${session.sessionEnd || 'In Progress'}\n\n`
    md += `---\n\n`

    for (const entry of session.entries) {
      const time = new Date(entry.timestamp).toLocaleTimeString()
      const dir = entry.direction === 'send' ? '⬆️' : '⬇️'

      md += `## ${dir} [${time}] ${entry.type}\n\n`

      if (entry.metadata?.endpoint) {
        md += `**Endpoint:** \`${entry.metadata.endpoint}\`\n\n`
      }

      if (entry.metadata?.statusCode) {
        md += `**Status:** ${entry.metadata.statusCode}\n\n`
      }

      md += `\`\`\`json\n${JSON.stringify(entry.content, null, 2)}\n\`\`\`\n\n`

      if (entry.metadata?.rawData) {
        md += `**Raw:** \`${entry.metadata.rawData}\`\n\n`
      }

      md += `---\n\n`
    }

    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.sessionId}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * 清除指定会话
   */
  clearSession(sessionId?: string): void {
    const id = sessionId || this.currentSession?.sessionId
    if (id) {
      localStorage.removeItem(`chatlog_${id}`)
      const list = this.getSessionList().filter((s) => s !== id)
      localStorage.setItem('chatlog_sessions', JSON.stringify(list))
    }
    if (sessionId === this.currentSession?.sessionId) {
      this.currentSession = null
    }
  }

  /**
   * 清除所有日志
   */
  clearAll(): void {
    const sessions = this.getSessionList()
    for (const sid of sessions) {
      localStorage.removeItem(`chatlog_${sid}`)
    }
    localStorage.removeItem('chatlog_sessions')
    this.currentSession = null
  }
}

// 单例导出
export const chatLogger = new ChatLogger()
