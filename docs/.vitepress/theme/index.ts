import { h, defineComponent, onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import HomeLayout from './layouts/Home.vue'
import LetsTalkLayout from './layouts/LetsTalk.vue'
import './styles/custom.css'

// Initialize chat config from environment variables or use default
// Note: Always set endpoint from VITE_CHAT_ENDPOINT because the @chatbotui/agent-chatbot-ui package
// may have already initialized window.__CHAT_CONFIG__ with default values at import time
if (typeof window !== 'undefined') {
  if (!window.__CHAT_CONFIG__) {
    window.__CHAT_CONFIG__ = {}
  }
  // Always override endpoint to ensure VITE_CHAT_ENDPOINT takes precedence
  window.__CHAT_CONFIG__.endpoint = import.meta.env.VITE_CHAT_ENDPOINT || 'http://localhost:8000/chat'
  window.__CHAT_CONFIG__.title = window.__CHAT_CONFIG__.title || "Let's Talk"
  window.__CHAT_CONFIG__.subtitle = window.__CHAT_CONFIG__.subtitle || 'Start the conversation'
}

// ClientOnly: renders children only after mount (client-side only, no SSR)
const ClientOnly = defineComponent({
  setup(_props, { slots }) {
    const show = ref(false)
    onMounted(() => { show.value = true })
    return () => (show.value && slots.default ? slots.default() : null)
  },
})

export default {
  extends: DefaultTheme,

  Layout: () => {
    const { frontmatter } = useData()
    if (frontmatter.value.layout === 'lets-talk') {
      return h(ClientOnly, null, { default: () => h(LetsTalkLayout) })
    } else if (frontmatter.value.layout === 'home') {
      return h(HomeLayout)
    } else {
      return h(DefaultTheme.Layout)
    }
  },
}
