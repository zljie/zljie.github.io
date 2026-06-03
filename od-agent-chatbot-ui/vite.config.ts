import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.d.ts', 'src/**/*.vue'],
      rollupTypes: true,
      afterBuild: () => {
        console.log('✅ Type declarations generated')
      },
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AgentChatbotUI',
      formats: ['es', 'umd'],
      fileName: (format) => `agent-chatbot-ui.${format}.js`,
    },
    rollupOptions: {
      external: [
        'vue',
        'ant-design-vue',
        'ant-design-x-vue',
        'marked',
      ],
      output: {
        globals: {
          vue: 'Vue',
          'ant-design-vue': 'ant-design-vue',
          'ant-design-x-vue': 'ant-design-x-vue',
          marked: 'marked',
        },
        assetFileNames: 'agent-chatbot-ui.[ext]',
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5174,
  },
})
