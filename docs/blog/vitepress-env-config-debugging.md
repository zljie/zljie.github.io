---
title: VitePress 环境变量配置踩坑记
date: 2026-05-25
description: 记录在 VitePress 项目中通过环境变量配置动态 API 地址时遇到的坑，以及排查和解决的全过程。
cover: https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80
---

# VitePress 环境变量配置踩坑记

Published: May 25, 2026

## 问题背景

在 VitePress 项目中，我们通过嵌入 ant-design-x-vue 的 AI Chat 组件来对接一个线上 Agent 服务。出于灵活性的考虑，我们将 Agent 的 API 地址设计为可配置的环境变量，这样本地开发时使用 localhost，生产环境自动切换到线上地址。

配置的架构如下：

- `docs/.vitepress/config.mts` — 在 `<head>` 中注入 `window.__CHAT_CONFIG__`，包含 endpoint 地址
- `.github/workflows/deploy.yml` — GitHub Actions 构建时通过环境变量注入生产地址

## 遇到的问题

部署完成后，页面上 AI Chat 始终报错：

```
Error: Could not reach backend at http://localhost:8000/chat
```

明明已经在 CI 中设置了 `CHAT_ENDPOINT`，但构建出的静态页面中仍然硬编码着 localhost 地址。

## 排查过程

### 第一步：检查 CI 环境变量层级

最初将环境变量放在了 job 级别：

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      CHAT_ENDPOINT: https://od-agent-production.up.railway.app/chat
    steps:
      - name: Build
        run: pnpm docs:build
```

以为这样就能让 Node.js 进程读取到，但实际上 job 级别的 `env` 不会自动注入到子进程的环境变量中。

### 第二步：迁移到 step 级别

将环境变量移到 `Build` step 层级后推送，CI 日志显示构建成功，但问题依旧。

### 第三步：本地模拟验证

在本地用同样的环境变量执行构建：

```bash
CHAT_ENDPOINT=https://od-agent-production.up.railway.app/chat pnpm docs:build
```

然后检查构建产物：

```bash
grep "localhost" docs/.vitepress/dist/index.html
```

发现输出中仍然是 localhost。

### 第四步：定位根因

查阅构建后的 HTML 源码，确认问题是 `config.mts` 中的这段代码没有正确读取环境变量：

```typescript
// 原来的写法
const CHAT_ENDPOINT = (import.meta as any).env?.CHAT_ENDPOINT || 'http://localhost:8000/chat'
```

问题在于：**`import.meta.env` 在 VitePress 的配置文件（`config.mts`）中并不会被 Vite 正确地替换和展开**。这是因为 VitePress 的配置在 Vite 处理链之前执行，`import.meta.env` 的注入机制并不适用于配置文件本身。

## 解决方案

将 `import.meta.env` 改为 `process.env`：

```typescript
const CHAT_ENDPOINT = process.env.CHAT_ENDPOINT || 'http://localhost:8000/chat'
```

修改后重新构建，验证构建产物中的地址已正确替换为线上地址：

```html
<script>window.__CHAT_CONFIG__={endpoint:"https://od-agent-production.up.railway.app/chat"};</script>
```

## 总结

1. **VitePress 配置文件中应使用 `process.env`**，而不是 `import.meta.env`。`import.meta.env` 是 Vite 在处理应用代码时注入的，而配置文件在 Vite 处理链之前执行，无法获得同样的支持。

2. **CI 环境变量放在 step 级别而非 job 级别**，才能确保子进程（如 `pnpm docs:build`）读取到正确的值。

3. **本地模拟验证**是排查此类问题的有效手段。直接检查构建产物的内容，比查看 CI 日志更直观。

4. **GitHub Actions workflow 中 job 级别的 `env`** 只会影响该 job 下所有 step 的执行环境（PATH 等），不会自动作为进程环境变量传递。这是很多人容易踩的坑。
