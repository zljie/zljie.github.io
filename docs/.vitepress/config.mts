import { defineConfig } from 'vitepress'
import { mockStreamingChat } from './theme/mockStreamingChat'

const CHAT_ENDPOINT = process.env.CHAT_ENDPOINT || '/chat'

export default defineConfig({
  title: "赵龙杰's Portfolio",
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
      { text: '首页', link: '/' },
      { text: '简历', link: '/cv' },
      { text: '博客', link: '/blog/' },
      { text: 'AI 对话', link: '/chat' },
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
    plugins: [mockStreamingChat()],
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
