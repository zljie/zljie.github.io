# Personal Portfolio with VitePress & ant-design-x-vue

A personal CV, blog, and AI chat site built with [VitePress](https://vitepress.dev) and [ant-design-x-vue](https://github.com/wzc520pyfm/ant-design-x-vue).

## Features

- **Home** - Hero section with avatar, bio, and latest blog posts
- **CV** - Personal resume page with skills, experience, and education
- **Blog** - Markdown-based blog with VitePress features
- **AI Chat** - Interactive chat UI powered by ant-design-x-vue (Bubble, Sender, Welcome, Conversation components)

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
