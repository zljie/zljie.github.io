import { h } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import * as AntdXComponents from 'ant-design-x-vue'
import HomeLayout from './layouts/Home.vue'
import ChatLayout from './layouts/Chat.vue'
import './styles/custom.css'

export default {
  extends: DefaultTheme,

  Layout: () => {
    const { frontmatter } = useData()
    if (frontmatter.value.layout === 'chat') {
      return h(ChatLayout, null, {})
    }
    if (frontmatter.value.layout === 'home') {
      return h(HomeLayout, null, {})
    }
    return h(DefaultTheme.Layout, null, {})
  },

  enhanceApp({ app }) {
    for (const [name, component] of Object.entries(AntdXComponents)) {
      app.component(name, component as any)
    }
  },
}
