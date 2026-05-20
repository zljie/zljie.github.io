import { h } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import * as AntdXComponents from 'ant-design-x-vue'
import HomeLayout from './layouts/Home.vue'
import ChatLayout from './layouts/Chat.vue'
import FloatChat from './layouts/FloatChat.vue'
import './styles/custom.css'

export default {
  extends: DefaultTheme,

  Layout: () => {
    const { frontmatter } = useData()
    let inner: any
    if (frontmatter.value.layout === 'chat') {
      inner = h(ChatLayout, null, {})
    } else if (frontmatter.value.layout === 'home') {
      inner = h(HomeLayout, null, {})
    } else {
      inner = h(DefaultTheme.Layout, null, {})
    }
    return [inner, h(FloatChat)]
  },

  enhanceApp({ app }) {
    for (const [name, component] of Object.entries(AntdXComponents)) {
      app.component(name, component as any)
    }
  },
}
