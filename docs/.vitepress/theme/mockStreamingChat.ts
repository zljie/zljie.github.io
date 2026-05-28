/**
 * Vite plugin: dev-time mock streaming chat endpoint.
 *
 * Intercepts POST requests to /chat and responds with SSE (Server-Sent Events)
 * that simulate a real LLM streaming both the "thinking" process and the final
 * markdown content. Remove this plugin in production — use a real backend.
 *
 * Usage: add `import './mockStreamingChat';` in docs/.vitepress/config.mts`
 * or `theme/index.ts`. We register it directly in theme/index.ts so it's
 * only active when the theme loads.
 */
export function mockStreamingChat() {
  return {
    name: 'vitepress-plugin-mock-streaming-chat',

    configureServer(server: any) {
      server.middlewares.use('/chat', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')

        const send = (data: string) => {
          res.write(`data: ${data}\n\n`)
        }

        // Read user message from request body
        // Supports both formats:
        //   Simple:   { "message": "hello", "stream": true }
        //   deep-chat: { "messages": [{"role":"user","content":"hello"}], "stream": true }
        let userMessage = ''
        try {
          const body = await readBody(req)
          const parsed = JSON.parse(body)
          if (typeof parsed.message === 'string' && parsed.message.trim()) {
            userMessage = parsed.message.trim()
          } else if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
            // Extract the last user message from the conversation history
            for (let i = parsed.messages.length - 1; i >= 0; i--) {
              const msg = parsed.messages[i]
              if (msg.role === 'user' && typeof msg.content === 'string' && msg.content.trim()) {
                userMessage = msg.content.trim()
                break
              }
            }
          }
        } catch {}

        // Simulate realistic streaming delay
        const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

        const thinkContent = buildThinkContent(userMessage)
        const answerContent = buildAnswerContent(userMessage)

        // Stream think content word by word
        for (const chunk of thinkContent) {
          send(JSON.stringify({ think: chunk.text }))
          await delay(chunk.delay)
        }

        // Signal end of thinking phase
        send(JSON.stringify({ think_done: true }))
        await delay(300)

        // Stream answer content chunk by chunk
        for (const chunk of answerContent) {
          send(JSON.stringify({ content: chunk.text }))
          await delay(chunk.delay)
        }

        // Signal stream end
        send(JSON.stringify({ done: true }))
        res.end()
      })
    },
  }
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => (body += chunk.toString()))
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function buildThinkContent(userMessage: string) {
  // Simulate a thought process that references the user's message
  const topic = extractTopic(userMessage)
  const steps = [
    `The user asks: "${truncate(userMessage, 40)}"`,
    `Intent: I need to analyze this ${topic} request and provide a comprehensive answer.`,
    `Structure: I'll organize the response with clear sections covering key concepts.`,
    `Examples: I should include practical examples to illustrate each point.`,
    `Tone: Keep it concise and professional, suitable for a technical blog context.`,
    `Safety: No sensitive information or harmful content detected — safe to proceed.`,
    `Markdown: I'll format the response with headers, code blocks, and lists.`,
  ]

  return steps.flatMap((step, i) => {
    const words = step.split(' ')
    return words.map((word, j) => ({
      text: word + (j < words.length - 1 ? ' ' : '\n'),
      delay: j === 0 ? (i * 60 + 20) : (8 + Math.random() * 12),
    }))
  })
}

function buildAnswerContent(userMessage: string) {
  const topic = extractTopic(userMessage)

  const content = [
    `# ${topic.charAt(0).toUpperCase() + topic.slice(1)} Overview\n\n`,
    `This is a comprehensive overview of **${topic}**. Let me break it down into the key aspects you should understand.\n\n`,
    `## Key Concepts\n\n`,
    `1. **Foundation** — Understanding the core principles that underpin ${topic}\n`,
    `2. **Implementation** — Practical steps for applying ${topic} in real scenarios\n`,
    `3. **Best Practices** — Industry-standard approaches and common pitfalls to avoid\n\n`,
    `## Code Example\n\n`,
    `\`\`\`typescript\n`,
    `// Example implementation of ${topic}\n`,
    `async function example(input: string): Promise<Result> {\n`,
    `  const processed = await preprocess(input);\n`,
    `  return await process(processed);\n`,
    `}\n`,
    `\`\`\`\n\n`,
    `## Summary\n\n`,
    `In this overview, we covered the essential concepts of **${topic}**, including key definitions, practical examples, and best practices. `,
    `Understanding these fundamentals will help you apply ${topic} effectively in your own work.\n\n`,
    `> Feel free to ask follow-up questions for deeper exploration of any specific aspect.\n`,
  ]

  return content.flatMap((text, i) => [
    {
      text,
      delay: i === 0 ? 5 : (2 + Math.random() * 8),
    },
  ])
}

function extractTopic(message: string): string {
  const clean = message.trim()
  if (!clean) return 'the topic'
  // Simple keyword extraction — use first 3 meaningful words
  const words = clean.split(/\s+/).slice(0, 3)
  return words.join(' ')
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '…' : s
}
