<template>
  <div class="md-bubble" :class="[`md-bubble--${role}`, { 'md-bubble--streaming': streaming }]">

    <!-- Think Section (only for assistant) -->
    <div v-if="role === 'assistant'" class="md-bubble__think">
      <button
        class="think-toggle"
        :class="{ 'think-toggle--open': thinkOpen }"
        @click="thinkOpen = !thinkOpen"
        :aria-expanded="thinkOpen"
      >
        <span class="think-toggle__icon">
          <svg v-if="!thinkOpen" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="think-toggle__label">Thinking Process</span>
        <span v-if="!thinkDone" class="think-toggle__dots">
          <span></span><span></span><span></span>
        </span>
      </button>

      <div v-show="thinkOpen" class="think-content">
        <pre class="think-text">{{ thinkContent }}</pre><span v-if="streaming && !thinkDone" class="think-cursor" />
      </div>
    </div>

    <!-- Tools Section (only for assistant, only when tools were called) -->
    <div v-if="role === 'assistant' && toolCalls && toolCalls.length > 0" class="md-bubble__tools">
      <button
        class="think-toggle"
        :class="{ 'think-toggle--open': toolsOpen }"
        @click="toolsOpen = !toolsOpen"
        :aria-expanded="toolsOpen"
      >
        <span class="think-toggle__icon">
          <svg v-if="!toolsOpen" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2L8 6L4 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="think-toggle__label">Using Tools</span>
        <span class="tool-count">{{ toolCalls.length }}</span>
        <span v-if="hasPendingTool" class="think-toggle__dots">
          <span></span><span></span><span></span>
        </span>
      </button>

      <div v-show="toolsOpen" class="tools-content">
        <div
          v-for="tool in toolCalls"
          :key="tool.id"
          class="tool-card"
          :class="`tool-card--${tool.status}`"
        >
          <div class="tool-card__header">
            <span class="tool-type-badge" :class="`tool-type-badge--${tool.type}`">
              {{ tool.type.toUpperCase() }}
            </span>
            <span class="tool-name">{{ tool.name }}</span>
            <span class="tool-status" :class="`tool-status--${tool.status}`">
              {{ tool.status }}
            </span>
          </div>

          <div v-if="tool.input" class="tool-card__section">
            <span class="tool-card__label">Input</span>
            <pre class="tool-card__code">{{ formatJson(tool.input) }}</pre>
          </div>

          <div v-if="tool.status === 'pending'" class="tool-card__section">
            <span class="tool-card__pending-text">Waiting for result...</span>
          </div>

          <div v-if="tool.status === 'success' && tool.output !== undefined" class="tool-card__section">
            <span class="tool-card__label">Output</span>
            <pre class="tool-card__code">{{ formatJson(tool.output) }}</pre>
          </div>

          <div v-if="tool.status === 'error' && tool.error" class="tool-card__section">
            <span class="tool-card__label">Error</span>
            <pre class="tool-card__code tool-card__code--error">{{ tool.error }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="md-bubble__content" v-html="renderedContent" />
    <span v-if="streaming && role === 'assistant'" class="md-bubble__cursor" />

  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { marked } from 'marked'
import type { ToolCall } from './useChat'

const props = defineProps<{
  content: string
  role: 'user' | 'assistant'
  streaming?: boolean
  thinkContent?: string
  thinkDone?: boolean
  toolCalls?: ToolCall[]
}>()

const thinkOpen = ref(false)
const toolsOpen = ref(true)
const raw = ref(props.content)
const rawThink = ref(props.thinkContent || '')

const hasPendingTool = computed(() =>
  (props.toolCalls ?? []).some((t) => t.status === 'pending')
)

function formatJson(val: any): string {
  if (typeof val === 'string') {
    try { return JSON.stringify(JSON.parse(val), null, 2) } catch { return val }
  }
  return JSON.stringify(val, null, 2)
}

// Keep content in sync during streaming
watch(
  () => props.content,
  (val) => { raw.value = val },
)

// Keep think content in sync during streaming
watch(
  () => props.thinkContent,
  (val) => { rawThink.value = val || '' },
)

marked.setOptions({
  gfm: true,
  breaks: true,
})

const renderedContent = computed(() => {
  if (!raw.value) return ''
  return marked.parse(raw.value) as string
})
</script>

<style scoped>
/* ===== Base ===== */
.md-bubble {
  position: relative;
  max-width: 100%;
  line-height: 1.6;
}

.md-bubble__content {
  overflow-x: auto;
}

.md-bubble--assistant .md-bubble__content :deep(> *:first-child) {
  margin-top: 0;
}

.md-bubble--assistant .md-bubble__content :deep(> *:last-child) {
  margin-bottom: 0;
}

/* ===== Think Section ===== */
.md-bubble__think {
  margin-bottom: 8px;
}

.think-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 4px 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: color 0.15s;
}

.think-toggle:hover {
  color: var(--vp-c-brand-2);
}

.think-toggle__icon {
  display: flex;
  align-items: center;
  transition: transform 0.2s;
}

.think-toggle--open .think-toggle__icon {
  transform: rotate(0deg);
}

.think-toggle__dots {
  display: inline-flex;
  gap: 3px;
  margin-left: 4px;
}

.think-toggle__dots span {
  width: 4px;
  height: 4px;
  background: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: think-bounce 1.2s infinite;
  opacity: 0.6;
}

.think-toggle__dots span:nth-child(2) { animation-delay: 0.2s; }
.think-toggle__dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes think-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
  30% { transform: translateY(-4px); opacity: 1; }
}

.think-content {
  margin-top: 6px;
  padding: 10px 14px;
  background: var(--vp-c-bg-soft);
  border-left: 3px solid var(--vp-c-brand-1);
  border-radius: 0 8px 8px 0;
  font-size: 0.82rem;
  line-height: 1.6;
}

.think-text {
  margin: 0;
  padding: 0;
  background: none;
  border: none;
  font-family: inherit;
  font-size: inherit;
  color: var(--vp-c-text-2);
  white-space: pre-wrap;
  word-break: break-word;
  min-width: 0;
}

.think-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--vp-c-brand-1);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 0.8s step-end infinite;
}

/* ===== Inline code ===== */
.md-bubble__content :deep(code) {
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
  font-size: 0.875em;
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-weight: 400;
}

.md-bubble--assistant .md-bubble__content :deep(code) {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.md-bubble--user .md-bubble__content :deep(code) {
  background: rgba(255, 255, 255, 0.15);
  color: inherit;
}

/* ===== Code blocks ===== */
.md-bubble__content :deep(pre) {
  position: relative;
  margin: 0.6em 0;
  padding: 14px 16px;
  border-radius: 10px;
  overflow-x: auto;
  font-size: 0.85em;
  line-height: 1.6;
}

.md-bubble--assistant .md-bubble__content :deep(pre) {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.md-bubble--user .md-bubble__content :deep(pre) {
  background: rgba(0, 0, 0, 0.15);
}

.md-bubble__content :deep(pre code) {
  background: none;
  padding: 0;
  font-size: inherit;
  border-radius: 0;
  color: inherit;
}

/* ===== Headings ===== */
.md-bubble__content :deep(h1),
.md-bubble__content :deep(h2),
.md-bubble__content :deep(h3),
.md-bubble__content :deep(h4) {
  font-weight: 600;
  line-height: 1.35;
}

.md-bubble__content :deep(h1) { font-size: 1.2em; margin: 0.5em 0 0.4em; }
.md-bubble__content :deep(h2) { font-size: 1.1em; margin: 0.5em 0 0.4em; }
.md-bubble__content :deep(h3) { font-size: 1em; margin: 0.5em 0 0.3em; }
.md-bubble__content :deep(h4) { font-size: 0.95em; margin: 0.4em 0 0.3em; }

/* ===== Paragraphs & lists ===== */
.md-bubble__content :deep(p) {
  margin: 0.4em 0;
}

.md-bubble__content :deep(ul),
.md-bubble__content :deep(ol) {
  margin: 0.4em 0;
  padding-left: 1.4em;
}

.md-bubble__content :deep(li) {
  margin: 0.2em 0;
}

.md-bubble__content :deep(li > ul),
.md-bubble__content :deep(li > ol) {
  margin: 0.1em 0;
}

/* ===== Blockquotes ===== */
.md-bubble__content :deep(blockquote) {
  margin: 0.5em 0;
  padding: 0.4em 0.8em;
  border-radius: 6px;
  border-left: 3px solid var(--vp-c-brand-1);
}

.md-bubble--assistant .md-bubble__content :deep(blockquote) {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}

.md-bubble--user .md-bubble__content :deep(blockquote) {
  background: rgba(0, 0, 0, 0.1);
}

.md-bubble__content :deep(blockquote p) {
  margin: 0;
}

/* ===== Links ===== */
.md-bubble__content :deep(a) {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s;
}

.md-bubble__content :deep(a:hover) {
  border-bottom-color: var(--vp-c-brand-1);
}

/* ===== Tables ===== */
.md-bubble__content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.6em 0;
  font-size: 0.9em;
}

.md-bubble__content :deep(th),
.md-bubble__content :deep(td) {
  padding: 0.4em 0.8em;
  border: 1px solid var(--vp-c-divider);
  text-align: left;
}

.md-bubble__content :deep(th) {
  font-weight: 600;
  background: var(--vp-c-bg-soft);
}

/* ===== Horizontal rule ===== */
.md-bubble__content :deep(hr) {
  border: none;
  border-top: 1px solid var(--vp-c-divider);
  margin: 0.8em 0;
}

/* ===== Images ===== */
.md-bubble__content :deep(img) {
  max-width: 100%;
  border-radius: 6px;
  margin: 0.4em 0;
}

/* ===== Streaming cursor ===== */
.md-bubble__cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--vp-c-brand-1);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 0.8s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ===== Tools Section ===== */
.md-bubble__tools {
  margin-bottom: 8px;
}

.tool-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.7rem;
  font-weight: 700;
  margin-left: 4px;
}

.tools-content {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-card {
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  overflow: hidden;
  font-size: 0.82rem;
}

.tool-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.tool-type-badge {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.tool-type-badge--skill {
  background: rgba(88, 166, 255, 0.15);
  color: #58a6ff;
}

.tool-type-badge--mcp {
  background: rgba(183, 148, 255, 0.15);
  color: #b794f4;
}

.tool-type-badge--rag {
  background: rgba(121, 192, 128, 0.15);
  color: #79c061;
}

.tool-name {
  font-weight: 600;
  color: var(--vp-c-text-1);
  flex: 1;
}

.tool-status {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tool-status--pending { color: var(--vp-c-text-3); }
.tool-status--success { color: #3fb950; }
.tool-status--error { color: #f85149; }

.tool-card--success { border-color: rgba(63, 185, 80, 0.3); }
.tool-card--error { border-color: rgba(248, 81, 73, 0.3); }

.tool-card__section {
  padding: 6px 12px;
  border-top: 1px solid var(--vp-c-divider);
}

.tool-card__label {
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.tool-card__code {
  margin: 0;
  padding: 6px 8px;
  background: var(--vp-c-bg);
  border-radius: 4px;
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
}

.tool-card__code--error {
  color: #f85149;
  background: rgba(248, 81, 73, 0.06);
}

.tool-card__pending-text {
  color: var(--vp-c-text-3);
  font-style: italic;
  font-size: 0.78rem;
}
</style>
