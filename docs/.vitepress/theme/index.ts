import { h, defineAsyncComponent } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import HomeLayout from './layouts/Home.vue'
import './styles/custom.css'

const ChatLayout = defineAsyncComponent(() => import('./layouts/Chat.vue'))

const LetsTalkLayout = defineAsyncComponent(() => import('./layouts/LetsTalk.vue'))

const FloatChat = defineAsyncComponent(() => import('./layouts/FloatChat.vue'))

export default {
  extends: DefaultTheme,

  Layout: () => {
    const { frontmatter } = useData()
    let inner: any
    if (frontmatter.value.layout === 'chat') {
      inner = h(ChatLayout, null, {})
    } else if (frontmatter.value.layout === 'lets-talk') {
      inner = h(LetsTalkLayout, null, {})
    } else if (frontmatter.value.layout === 'home') {
      inner = h(HomeLayout, null, {})
    } else {
      inner = h(DefaultTheme.Layout, null, {})
    }
    return [inner, h(FloatChat)]
  },
}
