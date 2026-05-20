import { defineConfig } from 'vitepress'

const CHAT_ENDPOINT = (import.meta as any).env?.CHAT_ENDPOINT || 'http://localhost:8000/chat'

export default defineConfig({
  title: "John Doe's Portfolio",
  description: 'Personal CV, blog, and AI chat interface',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/avatar.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    [
      'link',
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: '',
      },
    ],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700;800&display=swap',
      },
    ],
    [
      'script',
      {},
      `window.__CHAT_CONFIG__ = { endpoint: '${CHAT_ENDPOINT}' };`,
    ],
  ],

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'CV', link: '/cv' },
      { text: 'Blog', link: '/blog/' },
      { text: 'AI Chat', link: '/chat' },
    ],

    sidebar: [
      {
        text: 'Blog',
        items: [
          { text: 'Getting Started', link: '/blog/getting-started' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com' },
      { icon: 'mail', link: 'mailto:hello@example.com' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 John Doe',
    },
  },

  vite: {
    ssr: {
      noExternal: ['ant-design-x-vue', 'ant-design-vue'],
    },
    resolve: {
      alias: {
        '../_util/type': '../_util/type.js',
      },
    },
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
})
