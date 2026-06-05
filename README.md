# Personal Portfolio with VitePress & Agent Chatbot UI

A personal CV, blog, and AI chat site built with [VitePress](https://vitepress.dev) and [@chatbotui/agent-chatbot-ui](https://github.com/opendataco/agent-chatbot-ui).

## Features

- **Home** - Hero section with avatar, bio, and latest blog posts
- **CV** - Personal resume page with skills, experience, and education
- **Blog** - Markdown-based blog with VitePress features
- **AI Chat** - Interactive chat UI powered by Agent Chatbot UI (full-screen and floating modes)

## Getting Started

```bash
pnpm install
pnpm docs:dev
```

Visit `http://localhost:5173`

## Scripts

- `pnpm docs:dev` - Start dev server with hot reload
- `pnpm docs:build` - Build for production
- `pnpm docs:preview` - Preview production build

## Extending the AI Chat

To connect the chat UI to a real AI backend (OpenAI, Claude, etc.), edit the `mockReply()` function in `docs/.vitepress/theme/layouts/Chat.vue`:

```typescript
// Replace mockReply with an API call:
async function sendMessage() {
  const text = inputValue.value.trim()
  if (!text) return

  inputValue.value = ''
  messages.value.push({ id: ++messageIdCounter, role: 'user', content: text })
  scrollToBottom()
  loading.value = true

  // TODO: Replace with your AI API integration
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message: text }),
  })

  messages.value.push({ id: ++messageIdCounter, role: 'assistant', content: await response.text() })
  loading.value = false
  scrollToBottom()
}
```
