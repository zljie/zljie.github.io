import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

// Shared config
const plugins = [
  vue(),
  dts({
    include: ['src/**/*.ts', 'src/**/*.d.ts', 'src/**/*.vue'],
    rollupTypes: true,
    afterBuild: () => {
      console.log('✅ Type declarations generated')
    },
  }),
]

// Library build config (for npm run build)
const libBuild = {
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AgentChatbotUI',
      formats: ['es', 'umd'] as ['es', 'umd'],
      fileName: (format: string) => `agent-chatbot-ui.${format}.js`,
    },
    rollupOptions: {
      external: ['vue', 'ant-design-vue', 'ant-design-x-vue', 'marked'],
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
}

// Dev server config (for npm run dev)
const devConfig = {
  root: 'examples',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: resolve(__dirname, 'examples/index.html'),
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5174,
  },
}

// Examples build config (for vercel deployment)
const examplesBuild = {
  root: 'examples',
  build: {
    outDir: '../dist-examples',
    rollupOptions: {
      input: resolve(__dirname, 'examples/index.html'),
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}

export default defineConfig(({ command, mode }) => {
  // Examples mode: no dts plugin needed
  if (mode === 'examples') {
    return { plugins: [vue()], ...examplesBuild }
  }
  if (command === 'serve') {
    return { plugins, ...devConfig }
  }
  return { plugins, ...libBuild }
})
