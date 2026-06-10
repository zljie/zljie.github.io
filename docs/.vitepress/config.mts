import { defineConfig } from 'vitepress'
import { resolve } from 'path'

// Chat endpoint - use environment variable or fallback to production default
const CHAT_ENDPOINT = process.env.VITE_CHAT_ENDPOINT || 'https://od-agent-production-ae5a.up.railway.app/chat'

// Get absolute path to the package dist file
const chatbotPkgPath = resolve(
  process.cwd(),
  'node_modules/@chatbotui/agent-chatbot-ui/dist/agent-chatbot-ui.es.js'
)

export default defineConfig({
  title: "赵龙杰's Portfolio",
  description: 'Personal CV and blog',

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
    // Inject chat config for client-side access
    [
      'script',
      {},
      `window.__CHAT_CONFIG__ = window.__CHAT_CONFIG__ || { endpoint: ${JSON.stringify(CHAT_ENDPOINT)}, title: "Let's Talk", subtitle: 'Start the conversation' };`,
    ],
  ],

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '简历', link: '/cv' },
      { text: '博客', link: '/blog/' },
      { text: "Let's Talk", link: '/lets-talk' },
    ],

    sidebar: [
      {
        text: '博客',
        items: [
          { text: 'VitePress 环境变量配置踩坑记', link: '/blog/vitepress-env-config-debugging' },
          { text: '统一认证平台', link: '/blog/unified-identity-platform' },
          { text: 'BeEver 研发平台', link: '/blog/beever-platform' },
          { text: '房屋工单维修 SaaS 产品', link: '/blog/house-repair-saas' },
          { text: 'AI 问卷信息采集', link: '/blog/ai-questionnaire' },
          { text: '自研低代码平台', link: '/blog/self-developed-lowcode' },
          { text: '公共服务组敏捷转型', link: '/blog/agile-transformation' },
          { text: '数据质量管理平台', link: '/blog/data-quality-platform' },
          { text: 'Salesforce 迁移', link: '/blog/salesforce-migration' },
          { text: '本体驱动 Agent 时代', link: '/blog/ontology-system-insight' },
          { text: 'Chatbot 输入理解与预处理工程', link: '/blog/2026-05-28_Chatbot输入理解与预处理工程-8层链路架构设计' },
          { text: 'VitePress × ant-design-x-vue 踩坑全记录', link: '/blog/2026-05-29_VitePress嵌入ant-design-x-vue悬浮聊天的踩坑全记录' },
          { text: 'SSE 流式响应后端踩坑全记录', link: '/blog/2026-05-29_SSE流式响应后端踩坑报告' },
          { text: 'AI 动态生成问卷踩坑全记录', link: '/blog/2026-06-02_AI动态生成问卷踩坑全记录' },
          { text: '十分钟为 VitePress 嵌入 AI 对话界面', link: '/blog/2026-06-10_用-chatbot-ui-十分钟为-VitePress-嵌入-AI-对话界面' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com' },
      { icon: 'mail', link: 'mailto:hello@example.com' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 赵龙杰',
    },
  },

  vite: {
    resolve: {
      alias: {
        '@chatbotui/agent-chatbot-ui': chatbotPkgPath,
      },
    },
    ssr: {
      noExternal: ['ant-design-x-vue', 'ant-design-vue', 'dayjs', 'marked'],
    },
    optimizeDeps: {
      include: ['dayjs', 'marked', 'ant-design-x-vue', 'ant-design-vue'],
    },
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
})
