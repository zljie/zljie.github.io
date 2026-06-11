<template>
  <div class="demo-odeas" :class="{ dark: isDark }">
    <!-- Header -->
    <div class="odeas-header">
      <div class="header-left">
        <span class="header-icon">🏗️</span>
        <div class="header-text">
          <span class="header-title">ODEAS Agent 架构演示</span>
          <span class="header-sub">BeBios Agent 标准框架 — 7层业务栈 + 3层横切</span>
        </div>
      </div>
      <div class="header-right">
        <span class="trace-badge">trace-{{ traceId }}</span>
        <button class="theme-btn" @click="isDark = !isDark" :title="isDark ? '切换到浅色' : '切换到深色'">
          {{ isDark ? '☀️' : '🌙' }}
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="odeas-body">
      <!-- Left: Layer Navigation -->
      <div class="layer-nav">
        <!-- Intro Step -->
        <div
          class="nav-item nav-item--intro"
          :class="{
            'is-active': currentStep === -1,
            'is-done': currentStep > -1,
          }"
          @click="goToStep(-1)"
        >
          <div class="nav-step-dot">
            <span v-if="currentStep > -1" class="check-icon">✓</span>
            <span v-else class="step-num">0</span>
          </div>
          <div class="nav-info">
            <span class="nav-label">开始演示</span>
            <span class="nav-desc">架构总览</span>
          </div>
        </div>

        <div class="nav-connector" />

        <!-- M1/M2/M3 Cross-cutting -->
        <div class="nav-section-label">横切层</div>
        <div
          v-for="step in crossSteps"
          :key="step.id"
          class="nav-item"
          :class="{
            'is-active': currentStep === step.id,
            'is-done': currentStep > step.id,
            'is-glow': currentStep >= step.triggerAfter,
          }"
          :style="{ '--layer-color': step.color }"
          @click="goToStep(step.id)"
        >
          <div class="nav-step-dot">
            <span v-if="currentStep > step.id" class="check-icon">✓</span>
            <span v-else class="step-num">{{ step.id + 1 }}</span>
          </div>
          <div class="nav-info">
            <span class="nav-label">{{ step.label }}</span>
            <span class="nav-desc">{{ step.subLabel }}</span>
          </div>
        </div>

        <div class="nav-connector" />

        <!-- L1-L7 Business -->
        <div class="nav-section-label">业务层</div>
        <div
          v-for="step in layerSteps"
          :key="step.id"
          class="nav-item"
          :class="{
            'is-active': currentStep === step.id,
            'is-done': currentStep > step.id,
            'is-hitl': step.hasHitl && hitlActive,
          }"
          :style="{ '--layer-color': step.color }"
          @click="goToStep(step.id)"
        >
          <div class="nav-step-dot">
            <span v-if="currentStep > step.id" class="check-icon">✓</span>
            <span v-else class="step-num">{{ step.id + 1 }}</span>
          </div>
          <div class="nav-info">
            <span class="nav-label">{{ step.label }}</span>
            <span class="nav-desc">{{ step.subLabel }}</span>
          </div>
        </div>

        <!-- Return trip -->
        <div class="nav-connector" />
        <div
          class="nav-item nav-item--return"
          :class="{
            'is-active': currentStep === returnStep.id,
            'is-done': currentStep > returnStep.id,
          }"
          :style="{ '--layer-color': returnStep.color }"
          @click="goToStep(returnStep.id)"
        >
          <div class="nav-step-dot">
            <span v-if="currentStep > returnStep.id" class="check-icon">✓</span>
            <span v-else class="step-num">↑</span>
          </div>
          <div class="nav-info">
            <span class="nav-label">{{ returnStep.label }}</span>
            <span class="nav-desc">{{ returnStep.subLabel }}</span>
          </div>
        </div>
      </div>

      <!-- Right: Detail Panel -->
      <div class="layer-detail">
        <!-- INTRO STEP -->
        <div v-if="currentStep === -1" class="intro-panel">
          <div class="intro-hero">
            <div class="intro-title">请求流转路径</div>
            <div class="intro-scenario">场景：「帮我提交<span class="hl">3万元</span>的采购申请」</div>
          </div>

          <div class="arch-diagram">
            <div class="arch-row arch-row--cross">
              <div class="arch-cell arch-cell--m1">
                <div class="arch-label">M1</div>
                <div class="arch-name">反思与学习引擎</div>
              </div>
              <div class="arch-cell arch-cell--m2">
                <div class="arch-label">M2</div>
                <div class="arch-name">安全与治理层</div>
              </div>
              <div class="arch-cell arch-cell--m3">
                <div class="arch-label">M3</div>
                <div class="arch-name">基础设施横切层</div>
              </div>
            </div>
            <div class="arch-spacer">横切层 · 垂直穿透</div>
            <div class="arch-row arch-row--biz">
              <div class="arch-cell arch-cell--l1">L1</div>
              <div class="arch-cell arch-cell--l2">L2</div>
              <div class="arch-cell arch-cell--l3">L3</div>
              <div class="arch-cell arch-cell--l4">L4</div>
              <div class="arch-cell arch-cell--l5">L5</div>
              <div class="arch-cell arch-cell--l6">L6</div>
              <div class="arch-cell arch-cell--l7">L7</div>
            </div>
            <div class="arch-spacer">业务层 · 纵向流转</div>
          </div>

          <div class="intro-cta">
            <button class="cta-btn" @click="nextStep">
              <span>开始演示</span>
              <span class="cta-arrow">→</span>
            </button>
            <label class="hitl-toggle">
              <input type="checkbox" v-model="hitlActive" />
              <span>HITL 分支（金额 > 5万触发审批升级）</span>
            </label>
          </div>
        </div>

        <!-- NORMAL LAYER STEPS -->
        <template v-else>
          <!-- Cross-cutting step -->
          <template v-if="currentCross">
            <div class="cross-panel">
              <div class="step-badge" :style="{ background: currentCross.color }">
                {{ currentCross.id === 10 ? 'M1' : currentCross.id === 11 ? 'M2' : 'M3' }}
              </div>
              <div class="step-header">
                <h2 class="step-title">{{ currentCross.title }}</h2>
                <p class="step-desc">{{ currentCross.description }}</p>
              </div>

              <!-- Submodules -->
              <div class="submodules">
                <div class="submodules-label">子模块</div>
                <div class="submodule-tags">
                  <span
                    v-for="m in currentCross.modules"
                    :key="m"
                    class="submodule-tag"
                    :style="{ borderColor: currentCross.color, color: currentCross.color }"
                  >{{ m }}</span>
                </div>
              </div>

              <!-- Annotation banner -->
              <div class="cross-banner" :style="{ borderColor: currentCross.color, background: currentCross.color + '15' }">
                <span class="cross-banner-icon">⚡</span>
                <div>
                  <div class="cross-banner-title">{{ currentCross.annotation.title }}</div>
                  <div class="cross-banner-body">{{ currentCross.annotation.body }}</div>
                </div>
              </div>

              <!-- Data flow -->
              <div class="data-flow">
                <div class="data-box data-box--input">
                  <div class="data-box-label">切面介入</div>
                  <pre class="data-box-content">{{ currentCross.input }}</pre>
                </div>
                <div class="flow-arrow">→</div>
                <div class="data-box data-box--output">
                  <div class="data-box-label">检查结果</div>
                  <pre class="data-box-content">{{ currentCross.output }}</pre>
                </div>
              </div>

              <!-- Effect -->
              <div class="step-effect" v-if="currentCross.effect">
                <span class="effect-label">效果</span>
                <span class="effect-text">{{ currentCross.effect }}</span>
              </div>
            </div>
          </template>

          <!-- Normal layer step -->
          <template v-else-if="currentLayer">
            <!-- Step indicator bar -->
            <div class="step-indicator">
              <span
                v-for="(s, i) in layerSteps"
                :key="s.id"
                class="step-dot"
                :class="{
                  'is-active': s.id === currentStep,
                  'is-done': currentStep > s.id,
                  'is-hitl': s.hasHitl && hitlActive && currentStep > s.id,
                }"
              />
            </div>

            <!-- Layer header -->
            <div class="layer-header" :style="{ '--layer-color': currentLayer.color }">
              <div class="layer-badge" :style="{ background: currentLayer.color }">
                {{ currentLayer.label }}
              </div>
              <div class="layer-meta">
                <h2 class="layer-title">{{ currentLayer.title }}</h2>
                <p class="layer-desc">{{ currentLayer.description }}</p>
              </div>
            </div>

            <!-- HITL warning banner -->
            <div v-if="currentLayer.hasHitl && hitlActive" class="hitl-warning">
              <span class="hitl-warning-icon">🔔</span>
              <span>{{ currentLayer.hitlWarning }}</span>
            </div>

            <!-- Submodules -->
            <div class="submodules">
              <div class="submodules-label">子模块</div>
              <div class="submodule-tags">
                <span
                  v-for="m in currentLayer.modules"
                  :key="m.name"
                  class="submodule-tag"
                  :class="{ 'submodule-tag--active': activeSubmodule === m.name }"
                  :style="{ borderColor: currentLayer.color, color: currentLayer.color }"
                  @click="activeSubmodule = activeSubmodule === m.name ? null : m.name"
                >{{ m.name }}</span>
              </div>
              <div class="submodule-detail" v-if="activeSubmodule">
                <div
                  v-for="m in currentLayer.modules.filter(x => x.name === activeSubmodule)"
                  :key="m.name"
                >
                  <div class="submodule-desc">{{ m.desc }}</div>
                  <div class="submodule-func">{{ m.func }}</div>
                </div>
              </div>
            </div>

            <!-- Cross-cutting banners -->
            <template v-if="currentLayer.crosscut && currentLayer.crosscut.length">
              <div
                v-for="cx in currentLayer.crosscut"
                :key="cx.layer"
                class="cross-banner"
                :style="{ borderColor: cx.color, background: cx.color + '15' }"
              >
                <span class="cross-banner-icon">⚡</span>
                <div>
                  <div class="cross-banner-title">{{ cx.layer }}</div>
                  <div class="cross-banner-body">{{ cx.desc }}</div>
                </div>
              </div>
            </template>

            <!-- Data flow -->
            <div class="data-flow">
              <div class="data-box data-box--input">
                <div class="data-box-label">输入</div>
                <pre class="data-box-content">{{ currentLayer.input }}</pre>
              </div>
              <div class="flow-arrow-container">
                <div class="flow-arrow">↓</div>
                <div class="flow-processing" v-if="isAnimating">
                  <div class="processing-dots">
                    <span /><span /><span />
                  </div>
                  <div class="processing-text">{{ currentLayer.processingText }}</div>
                </div>
              </div>
              <div class="data-box data-box--output">
                <div class="data-box-label">输出</div>
                <pre class="data-box-content" :class="{ 'blink': isAnimating }">{{ isAnimating ? '...' : currentLayer.output }}</pre>
              </div>
            </div>

            <!-- HITL branch card -->
            <template v-if="currentLayer.hitlBranch">
              <div class="hitl-card" :class="{ 'hitl-card--active': hitlActive, 'hitl-card--inactive': !hitlActive }">
                <div class="hitl-card-header">
                  <span class="hitl-card-icon">{{ hitlActive ? '🔔' : '⏭️' }}</span>
                  <span class="hitl-card-title">{{ currentLayer.hitlBranch.title }}</span>
                </div>
                <div class="hitl-card-body">
                  <div class="hitl-card-desc">{{ currentLayer.hitlBranch.desc }}</div>
                  <div class="hitl-card-flow">
                    <span class="hitl-node">{{ hitlActive ? currentLayer.hitlBranch.whenActive : currentLayer.hitlBranch.whenInactive }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- Action summary -->
            <div class="step-effect" v-if="currentLayer.effect">
              <span class="effect-label">动作</span>
              <span class="effect-text">{{ currentLayer.effect }}</span>
            </div>

            <!-- Navigation -->
            <div class="step-nav">
              <button class="nav-btn nav-btn--prev" @click="prevStep" :disabled="currentStep === -1">
                ← 上一步
              </button>
              <button class="nav-btn nav-btn--next" @click="nextStep">
                {{ currentStep === lastStepId ? '重新开始' : '下一步 →' }}
              </button>
            </div>
          </template>

          <!-- Return step -->
          <template v-else-if="currentStep === returnStep.id">
            <div class="return-panel">
              <div class="layer-header" :style="{ '--layer-color': returnStep.color }">
                <div class="layer-badge" :style="{ background: returnStep.color }">
                  响应回程
                </div>
                <div class="layer-meta">
                  <h2 class="layer-title">{{ returnStep.title }}</h2>
                  <p class="layer-desc">{{ returnStep.description }}</p>
                </div>
              </div>

              <div class="return-flow">
                <div
                  v-for="(item, i) in returnStep.phases"
                  :key="i"
                  class="return-phase"
                  :style="{ '--phase-color': item.color }"
                >
                  <div class="return-phase-num">{{ i + 1 }}</div>
                  <div class="return-phase-info">
                    <div class="return-phase-name">{{ item.name }}</div>
                    <div class="return-phase-desc">{{ item.desc }}</div>
                  </div>
                </div>
              </div>

              <div class="step-effect" v-if="returnStep.effect">
                <span class="effect-label">最终效果</span>
                <span class="effect-text">{{ returnStep.effect }}</span>
              </div>

              <div class="step-nav">
                <button class="nav-btn nav-btn--prev" @click="prevStep">
                  ← 上一步
                </button>
                <button class="nav-btn nav-btn--next" @click="resetDemo">
                  重新开始 ↺
                </button>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>

    <!-- Bottom: State Bar -->
    <div class="state-bar">
      <div class="state-item">
        <span class="state-label">槽位进度</span>
        <div class="slot-pills">
          <span
            v-for="slot in slotPills"
            :key="slot.key"
            class="slot-pill"
            :class="{ 'slot-pill--filled': slot.filled }"
          >
            {{ slot.key }}: {{ slot.value || '?' }}
          </span>
        </div>
      </div>

      <div class="state-divider" />

      <div class="state-item">
        <span class="state-label">Token 成本</span>
        <span class="state-value token-value">￥{{ tokenCost.toFixed(2) }}</span>
      </div>

      <div class="state-divider" />

      <div class="state-item">
        <span class="state-label">Trace ID</span>
        <span class="state-value trace-value">{{ traceId }}</span>
      </div>

      <div class="state-divider" />

      <div class="state-item">
        <span class="state-label">HITL 状态</span>
        <span class="state-value hitl-value" :class="hitlStatusClass">
          {{ hitlStatusText }}
        </span>
      </div>

      <div class="state-divider" />

      <div class="state-item">
        <span class="state-label">对话状态</span>
        <span class="state-value">{{ conversationState }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// ── Theme ──────────────────────────────────────────────────────
const isDark = ref(false)

// ── Navigation ─────────────────────────────────────────────────
const currentStep = ref(-1)
const stepIndex = computed(() => {
  const idx = allSteps.findIndex(s => s.id === currentStep.value)
  return idx >= 0 ? idx : -1
})
const isAnimating = ref(false)
const activeSubmodule = ref<string | null>(null)

// HITL mode toggle
const hitlActive = ref(false)

// Token cost
const tokenCost = ref(0.0)
const traceId = 'a3f8b2c1'

// Slot state
const slots = ref({
  amount: null as string | null,
  vendor: null as string | null,
  type: null as string | null,
})

const slotPills = computed(() => [
  { key: 'amount', value: slots.value.amount, filled: !!slots.value.amount },
  { key: 'vendor', value: slots.value.vendor, filled: !!slots.value.vendor },
  { key: 'type', value: slots.value.type, filled: !!slots.value.type },
])

// HITL state
const hitlPending = ref(false)
const hitlResolved = ref(false)

const hitlStatusClass = computed(() => {
  if (hitlPending.value) return 'hitl-pending'
  if (hitlResolved.value) return 'hitl-resolved'
  return 'hitl-none'
})

const hitlStatusText = computed(() => {
  if (hitlPending.value) return '等待审批'
  if (hitlResolved.value) return '已审批'
  return '无'
})

// Conversation state
const conversationState = computed(() => {
  if (currentStep.value === -1) return 'idle'
  if (currentStep.value <= 2) return '理解中'
  if (currentStep.value === 3 || currentStep.value === 4) return hitlPending.value ? '等待补充' : '补全槽位'
  if (currentStep.value === 5) return hitlPending.value ? '等待审批' : '规划中'
  if (currentStep.value === 6) return '执行中'
  if (currentStep.value === 7) return '处理结果'
  if (currentStep.value === 8) return '完成'
  return '完成'
})

// M2 appears twice in the flow: once after L2 (input filter), once after L5 (permission check)
// We model it as two separate step objects so both appear in the sidebar
const crossSteps = [
  {
    id: 10,
    label: 'M2 安全治理',
    subLabel: '输入过滤 / PII脱敏',
    title: 'M2 安全与治理层 — 切面介入',
    description: '系统在 L2 语义理解后切面介入，校验输入安全性、PII 脱敏与审计追踪。',
    color: '#E24B4A',
    modules: ['输入过滤器', 'PII 脱敏器', '权限校验器', '审计追踪器', '输出审核器'],
    triggerAfter: 1,
    annotation: {
      title: '切面介入 · L2 之后',
      body: '输入过滤检测 Prompt 注入 → PII 脱敏处理金额字段 → 权限校验确认用户是否有采购申请权限',
    },
    input: `{
  "userId": "user_001",
  "input": "帮我提交3万元的采购申请",
  "channel": "wework",
  "timestamp": "2026-06-11T10:00:00Z"
}`,
    output: `{
  "safe": true,
  "piiMasked": false,
  "hasPermission": true,
  "auditLogId": "audit-20260611-001",
  "traceId": "trace-a3f8b2c1"
}`,
    effect: '通过安全检查，允许进入语义理解管线。',
  },
  {
    id: 11,
    label: 'M2 安全治理',
    subLabel: '权限校验 / 审计记录',
    title: 'M2 安全与治理层 — 权限校验',
    description: 'L5 规划决策后切面介入，校验用户是否有权执行该操作，记录操作审计日志。',
    color: '#E24B4A',
    modules: ['输入过滤器', 'PII 脱敏器', '权限校验器', '审计追踪器', '输出审核器'],
    triggerAfter: 4,
    annotation: {
      title: '切面介入 · L5 之后',
      body: 'RBAC 权限校验：用户角色 employee，有权提交限额内采购申请（3万 < 10万限额）',
    },
    input: `{
  "userId": "user_001",
  "role": "employee",
  "action": "create_purchase_order",
  "params": { "amount": 30000 },
  "permissionLimit": 100000
}`,
    output: `{
  "authorized": true,
  "role": "employee",
  "withinLimit": true,
  "auditId": "audit-perm-20260611-001",
  "riskCheckPassed": true
}`,
    effect: '权限校验通过。用户角色 employee 有权创建 3万元采购单（限额 10万）。',
  },
  {
    id: 12,
    label: 'M3 基础设施',
    subLabel: 'Token 成本 / 限流检查',
    title: 'M3 基础设施横切层',
    description: '在 L6 工具执行前切面介入，采集 Token 消耗、执行限流检查与多租户隔离校验。',
    color: '#378ADD',
    modules: ['可观测性', 'Token 成本管控', '限流', '多租户隔离'],
    triggerAfter: 5,
    annotation: {
      title: '切面介入 · L6 之前',
      body: 'Token 成本归因统计本次对话累计消耗 → 限流检查 QPS 是否超限 → 多租户隔离确认数据范围',
    },
    input: `{
  "userId": "user_001",
  "plan": ["create_po", "submit_approval"],
  "tokenBudget": 8000,
  "tokensUsed": 3240
}`,
    output: `{
  "withinBudget": true,
  "rateLimitOk": true,
  "tenantOk": true,
  "tokenCostTotal": 0.12,
  "tracingEnabled": true
}`,
    effect: '通过基础设施检查，触发工具调用。当前累计 Token 成本：¥0.12',
  },
]

const layerSteps = [
  {
    id: 0,
    label: 'L1',
    subLabel: '交互呈现层',
    title: 'L1 交互呈现层',
    description: '接收来自企微渠道的用户输入，经过渠道接入网关标准化为统一消息格式，准备传递给下游。',
    color: '#7F77DD',
    modules: [
      { name: '渠道接入网关', desc: '多协议适配（WebSocket/HTTP/企微/钉钉），消息格式标准化，渠道身份认证', func: '企微消息 → StandardMessage' },
      { name: '富媒体传输器', desc: '文本/文件/图片双向传输，大文件分片与断点续传', func: '媒体格式自适应' },
      { name: 'HITL 交互卡片引擎', desc: '审批/确认/选择类卡片的声明式渲染，动作回调处理', func: '卡片 Schema → 渲染' },
      { name: '输出渲染器', desc: 'Markdown 渲染，富媒体卡片构建，语音合成适配，流式输出', func: '结构化数据 → UI' },
    ],
    input: `{
  "rawInput": "帮我提交3万元的采购申请",
  "channel": "wework",
  "userId": "user_001",
  "msgType": "text",
  "timestamp": "2026-06-11T10:00:00Z"
}`,
    output: `{
  "text": "帮我提交3万元的采购申请",
  "channel": "wework",
  "userId": "user_001",
  "msgId": "msg-uuid-001",
  "sessionId": "sess-uuid-001",
  "timestamp": "2026-06-11T10:00:00Z",
  "type": "StandardMessage"
}`,
    processingText: '渠道适配 + 消息标准化',
    effect: '输出标准化消息，传递给 L2 语义理解层。',
    crosscut: [],
    hasHitl: false,
  },
  {
    id: 1,
    label: 'L2',
    subLabel: '语义理解层',
    title: 'L2 语义理解层',
    description: '将自然语言转化为结构化意图 + 槽位。通过三级 fallback 策略（规则 → Embedding → LLM）识别意图，提取金额、供应商等关键参数。',
    color: '#1D9E75',
    modules: [
      { name: '意图识别器', desc: '规则匹配 → 语义相似度 → LLM 意图解析，三级 fallback，置信度评估', func: '"帮我提交采购申请" → submit_purchase_request' },
      { name: '槽位提取器', desc: '基于规则提取（日期/金额/手机号），基于本体的推断，必填槽位校验与缺失追问', func: '3万元 → amount=30000' },
      { name: '语义映射引擎', desc: '同义词库管理，实体别名解析，业务术语标准化器', func: '"提交" = "发起审批"' },
    ],
    input: `{
  "text": "帮我提交3万元的采购申请",
  "sessionId": "sess-uuid-001",
  "history": []
}`,
    output: `{
  "intent": "submit_purchase_request",
  "intentConfidence": 0.94,
  "slots": {
    "amount": { "value": 30000, "unit": "CNY", "raw": "3万元", "filled": true },
    "type": { "value": "purchase", "filled": true },
    "vendor": { "value": null, "filled": false, "missing": true },
    "description": { "value": null, "filled": false }
  },
  "semanticMap": { "提交": "发起审批", "采购": "purchase" }
}`,
    processingText: '意图识别 + 槽位提取',
    effect: '识别意图「提交采购申请」，槽位「金额」已填充，「供应商」缺失，需要追问。',
    crosscut: [{ layer: 'M2 · 输入过滤器', desc: '检测到 Prompt 注入风险：无。输入安全，放行。', color: '#E24B4A' }],
    hasHitl: false,
  },
  {
    id: 2,
    label: 'L3',
    subLabel: '上下文状态层',
    title: 'L3 上下文状态层',
    description: '管理对话状态，追踪槽位填充进度。发现「供应商」槽位缺失后，触发追问策略并生成 HITL 卡片。',
    color: '#378ADD',
    modules: [
      { name: '会话状态管理器', desc: '全局/用户级/任务级三级状态隔离', func: '会话创建 → 状态初始化' },
      { name: '槽位填充追踪器', desc: '已填充/缺失槽位登记簿，默认值填充', func: 'amount✓ type✓ vendor✗' },
      { name: '对话状态机', desc: '状态转换引擎，追问策略生成器，流程模板加载', func: 'state: clarifying' },
      { name: 'HITL 状态同步器', desc: '等待审批状态标记，审批结果接收，流程恢复触发', func: 'HITL 卡片渲染' },
    ],
    input: `{
  "intent": "submit_purchase_request",
  "slots": {
    "amount": { "value": 30000, "filled": true },
    "type": { "value": "purchase", "filled": true },
    "vendor": { "filled": false, "missing": true }
  },
  "sessionId": "sess-uuid-001"
}`,
    output: `{
  "filledSlots": ["amount", "type"],
  "missingSlots": ["vendor"],
  "state": "clarifying",
  "askQuestion": "请问供应商是哪家公司？",
  "hitlCard": {
    "id": "hitl-vendor-001",
    "type": "slot_fill",
    "title": "补充供应商信息",
    "fields": [{ "key": "vendor", "label": "供应商名称", "required": true }]
  }
}`,
    processingText: '槽位追踪 + 追问策略生成',
    effect: '发现「供应商」缺失，渲染 HITL 卡片追问用户：「请问供应商是哪家公司？」',
    crosscut: [],
    hasHitl: true,
    hitlWarning: 'HITL 分支：用户回复"华为"后，槽位「vendor」将被填充，流程继续。',
    hitlBranch: {
      title: 'HITL 追问分支（L3）',
      desc: '当槽位缺失时，L3 生成追问策略并渲染 HITL 卡片，等待用户补充信息。',
      whenActive: '用户回复"华为" → vendor=华为已填充 → 继续下游流程',
      whenInactive: '用户回复后自动继续',
    },
  },
  {
    id: 3,
    label: 'L4',
    subLabel: '记忆与知识层',
    title: 'L4 记忆与知识层',
    description: '查询本体定义验证供应商实体，检索采购制度确认审批阈值，将相关知识注入 LLM 上下文。',
    color: '#639922',
    modules: [
      { name: '知识检索器', desc: '向量检索 + 关键词检索 + RRF 混合融合排序', func: '检索"采购审批阈值"相关文档' },
      { name: '本体解析器', desc: '实体定义加载，关系图构建，业务约束解析', func: '"华为" → vendor 实体验证' },
      { name: '工作记忆管理器', desc: '当前上下文缓存，上下文压缩，token 预算分配', func: '知识注入 LLM context' },
      { name: '长期记忆库', desc: '用户画像，交互历史归档，偏好学习', func: '历史偏好 → 默认值填充' },
    ],
    input: `{
  "slots": { "amount": 30000, "vendor": "华为", "type": "purchase" },
  "intent": "submit_purchase_request",
  "sessionId": "sess-uuid-001"
}`,
    output: `{
  "ontologyValidated": { "vendor": { "id": "vendor-huawei", "name": "华为", "type": "trusted", "valid": true } },
  "knowledgeRetrieved": [
    { "content": "采购金额 ≥ ¥50,000 需财务总监审批", "source": "采购制度-v3.2" },
    { "content": "采购金额 ≥ ¥100,000 需 CFO 会签", "source": "采购制度-v3.2" }
  ],
  "relevantRules": [
    { "rule": "amount >= 50000 → director_approval_required", "triggered": false, "amount": 30000 }
  ],
  "contextInjection": "当前金额 ¥30,000，低于 ¥50,000 阈值，无需财务总监审批。"
}`,
    processingText: '本体解析 + 知识检索',
    effect: '验证「华为」为可信供应商。检索采购制度：3万元 < 5万，不触发总监审批。',
    crosscut: [],
    hasHitl: false,
  },
  {
    id: 4,
    label: 'L5',
    subLabel: '规划与决策层',
    title: 'L5 规划与决策层',
    description: '将意图拆解为可执行步骤，校验业务规则，评估风险等级。HITL 分支下，30万触发高风险审批升级。',
    color: '#BA7517',
    modules: [
      { name: '任务拆解器', desc: '目标解析，子任务生成，依赖关系分析', func: '意图 → 子任务列表' },
      { name: '执行计划生成器', desc: '计划模板加载，执行序列编排，回退计划构建', func: '生成执行计划' },
      { name: '规则校验器', desc: '前置条件检查，业务口径校验，边界约束验证', func: '3万 < 5万，无需总监审批' },
      { name: '风险评估器', desc: '业务风险检测，权限风险扫描，操作影响评估', func: '风险等级：低风险（正常流程）' },
    ],
    input: `{
  "intent": "submit_purchase_request",
  "slots": { "amount": 30000, "vendor": "华为", "type": "purchase" },
  "knowledge": { "threshold": 50000, "cfoThreshold": 100000 },
  "userRole": "employee"
}`,
    output: `{
  "subTasks": [
    { "id": "task-1", "action": "create_purchase_order", "params": { "vendor": "华为", "amount": 30000, "type": "purchase" } },
    { "id": "task-2", "action": "submit_approval", "params": { "assignee": "张经理", "threshold": 50000 } }
  ],
  "ruleCheck": { "amountBelowThreshold": true, "requiresDirectorApproval": false },
  "riskAssessment": { "level": "low", "requiresHitl": false },
  "plan": ["create_po", "submit_approval"]
}`,
    processingText: '任务拆解 + 规则校验 + 风险评估',
    effect: '3万元低于5万阈值，无需总监审批。风险低，自动执行。生成计划：[创建采购单, 提交审批]。',
    crosscut: [{ layer: 'M2 · 权限校验', desc: '用户角色 employee，有权提交 3万元采购申请（限额内）。权限通过。', color: '#E24B4A' }],
    hasHitl: true,
    hitlWarning: 'HITL 分支：若金额 ≥ 5万则触发高风险升级，需 L5 → L3 通知 → L1 渲染审批卡片。',
    hitlBranch: {
      title: 'HITL 审批升级分支（L5）',
      desc: 'L5 风险评估发现高风险操作时，自动触发 HITL 升级流程。',
      whenActive: '金额 ≥ 5万 → 风险=高 → HITL 挂起 → 等待经理审批 → 审批通过后继续执行',
      whenInactive: '金额 < 5万 → 风险=低 → 自动执行',
    },
  },
  {
    id: 5,
    label: 'L6',
    subLabel: '工具与动作执行层',
    title: 'L6 工具与动作执行层',
    description: '执行工具调用，通过参数填充、幂等保障、熔断降级确保可靠性，最终返回采购单号。',
    color: '#D4537E',
    modules: [
      { name: '工具注册中心', desc: '工具发现，元数据管理，版本控制', func: '发现 ERP API 工具' },
      { name: '调用编排器', desc: '参数填充，调用序列调度，并行调用管理', func: '填充 vendor=华为, amount=30000' },
      { name: '结果标准化器', desc: '响应格式适配，错误码映射，空值处理', func: 'ERP 响应 → 统一格式' },
      { name: '可靠性保障器', desc: '重试管理，幂等处理，补偿事务协调', func: '幂等键: po-idempotent-20260611-001' },
      { name: '熔断降级器', desc: '超时监控，失败计数，降级策略执行', func: 'ERP 系统可用，熔断器关闭' },
    ],
    input: `{
  "plan": ["create_po", "submit_approval"],
  "params": { "vendor": "华为", "amount": 30000, "type": "purchase" },
  "idempotencyKey": "po-idempotent-20260611-001",
  "tools": ["erp_create_po", "approval_submit"]
}`,
    output: `{
  "toolCalls": [
    {
      "tool": "erp_create_po",
      "status": "success",
      "result": {
        "poId": "PO-20260611-001",
        "vendor": "华为",
        "amount": 30000,
        "status": "created",
        "createdAt": "2026-06-11T10:00:02Z"
      },
      "latencyMs": 847,
      "retryCount": 0
    },
    {
      "tool": "approval_submit",
      "status": "success",
      "result": { "approvalId": "APR-20260611-001", "assignee": "张经理", "status": "pending" },
      "latencyMs": 312
    }
  ],
  "idempotencyChecked": true,
  "circuitBreaker": "closed"
}`,
    processingText: '调用 ERP API → 创建采购单 → 提交审批',
    effect: '采购单 PO-20260611-001 创建成功，审批 APR-20260611-001 已提交给张经理。',
    crosscut: [
      { layer: 'M3 · Token 成本管控', desc: '本次对话累计 Token 消耗：3240，总成本 ¥0.12。预算充足，未触发熔断。', color: '#378ADD' },
    ],
    hasHitl: false,
  },
  {
    id: 6,
    label: 'L7',
    subLabel: '多Agent编排层',
    title: 'L7 多 Agent 与 Skill 编排层',
    description: '本场景为单 Agent 执行，L7 路由无需触发。复杂场景下 L7 负责多 Agent 协作、结果聚合与 Skill 热加载。',
    color: '#E07B39',
    modules: [
      { name: 'Agent 注册中心', desc: 'Agent 元数据存储，能力目录，健康状态监控', func: '注册 Agent：ProcurementAgent' },
      { name: '任务路由器', desc: '意图-Agent 匹配，负载均衡，优先级调度', func: '意图 → ProcurementAgent（直接路由）' },
      { name: '协作协调器', desc: '多 Agent 会话管理，任务分片，中间结果交换', func: '单 Agent 场景，无需协作' },
      { name: 'Skill 加载器', desc: 'Skill 解析，依赖解析，热加载管理', func: '按需加载采购审批 Skill' },
    ],
    input: `{
  "intent": "submit_purchase_request",
  "slots": { "amount": 30000, "vendor": "华为" },
  "availableAgents": ["ProcurementAgent", "FinanceAgent", "HRAgent"],
  "agentCapabilities": { "ProcurementAgent": ["create_po", "submit_approval"] }
}`,
    output: `{
  "selectedAgent": "ProcurementAgent",
  "routeReason": "意图 submit_purchase_request 匹配 ProcurementAgent 能力集",
  "multiAgentRequired": false,
  "skillLoaded": ["procurement_workflow_v1"],
  "executionMode": "single_agent"
}`,
    processingText: 'Agent 匹配 + Skill 加载',
    effect: '路由至 ProcurementAgent，无需多 Agent 协作。加载采购审批 Skill v1。',
    crosscut: [],
    hasHitl: false,
  },
]

const returnStep = {
  id: 7,
  label: '↑',
  subLabel: '响应回程',
  title: '响应回程：L6 → L3 → L1',
  description: '执行结果自下而上逐层回传，每层进行结果标准化、状态更新，最终在 L1 渲染用户可见的响应卡片。',
  color: '#7F77DD',
  effect: '采购单 PO-20260611-001 已创建，审批已提交给张经理。响应以 Markdown 卡片形式推送至企微。',
  phases: [
    { name: 'L6 结果标准化', desc: 'ERP 响应格式 → 统一 Response 格式 { poId, approvalId, status }', color: '#D4537E' },
    { name: 'L3 状态更新', desc: '槽位全部填充 → 对话状态 completed → 长期记忆归档用户偏好', color: '#378ADD' },
    { name: 'L1 输出渲染', desc: 'Markdown 卡片 → 采购单详情 + 审批进度 → 流式推送企微', color: '#7F77DD' },
  ],
}

// Ordered sequence of all steps (for navigation order)
const stepSequence: number[] = [0, 10, 1, 2, 3, 4, 11, 5, 12, 6, 7]
// id→sequenceIndex lookup
const seqIndexMap = new Map(stepSequence.map((id, i) => [id, i]))

const allSteps = [
  ...layerSteps,
  ...crossSteps,
  returnStep,
]

const lastStepId = stepSequence[stepSequence.length - 1]

const currentLayer = computed(() => {
  if (currentStep.value === -1) return null
  if (currentStep.value === returnStep.id) return null
  return layerSteps.find(s => s.id === currentStep.value) || null
})

const currentCross = computed(() => {
  if (currentStep.value < 0) return null
  return crossSteps.find(s => s.id === currentStep.value) || null
})

function goToStep(step: number) {
  currentStep.value = step
  activeSubmodule.value = null
  isAnimating.value = false
}

async function animateStep() {
  isAnimating.value = true
  await new Promise(r => setTimeout(r, 1200))
  isAnimating.value = false
}

// Slot updates keyed by step id
const slotUpdates: Record<number, () => void> = {
  2: () => { slots.value.amount = '30000'; slots.value.type = 'purchase' },
  3: () => { /* HITL pending set via nextStep */ },
  4: () => { slots.value.vendor = '华为'; hitlPending.value = false; hitlResolved.value = false },
}

async function nextStep() {
  // Intro → first step
  if (currentStep.value === -1) {
    slots.value.amount = null
    slots.value.vendor = null
    slots.value.type = null
    hitlPending.value = false
    hitlResolved.value = false
    tokenCost.value = 0
    currentStep.value = stepSequence[0]
    await animateStep()
    tokenCost.value = 0.03
    return
  }

  const curIdx = seqIndexMap.get(currentStep.value)
  if (curIdx === undefined) return

  const nextIdx = curIdx + 1

  // Hit end → reset
  if (nextIdx >= stepSequence.length) {
    resetDemo()
    return
  }

  const nextId = stepSequence[nextIdx]
  currentStep.value = nextId

  // Apply slot/state updates
  const updater = slotUpdates[nextId]
  if (updater) updater()

  // HITL: entering L3 triggers pending if toggle is on
  if (nextId === 2 && hitlActive.value) {
    hitlPending.value = true
  }

  // Token cost accumulation
  if (nextId === 10 || nextId === 11) tokenCost.value += 0.04
  if (nextId === 12) tokenCost.value += 0.05
  if (nextId === 7) tokenCost.value = 0.12

  await animateStep()
}

function prevStep() {
  if (currentStep.value === -1) return
  const curIdx = seqIndexMap.get(currentStep.value)
  if (curIdx === undefined || curIdx <= 0) {
    currentStep.value = -1
    return
  }
  currentStep.value = stepSequence[curIdx - 1]
}

function resetDemo() {
  currentStep.value = -1
  slots.value = { amount: null, vendor: null, type: null }
  hitlPending.value = false
  hitlResolved.value = false
  tokenCost.value = 0
  activeSubmodule.value = null
  isAnimating.value = false
}
</script>

<style scoped>
/* ── Root ──────────────────────────────────────────────────── */
.demo-odeas {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--vp-c-bg, #ffffff);
  color: var(--vp-c-text-1, #24292f);
  font-family: var(--vp-font-family-base, system-ui, -apple-system, sans-serif);
  --layer-l1: #7F77DD;
  --layer-l2: #1D9E75;
  --layer-l3: #378ADD;
  --layer-l4: #639922;
  --layer-l5: #BA7517;
  --layer-l6: #D4537E;
  --layer-l7: #E07B39;
  --layer-m1: #888780;
  --layer-m2: #E24B4A;
  --layer-m3: #378ADD;
  transition: background 0.3s, color 0.3s;
}

.demo-odeas.dark {
  --vp-c-bg: #0d1117;
  --vp-c-bg-soft: #161b22;
  --vp-c-bg-alt: #161b22;
  --vp-c-divider: #30363d;
  --vp-c-text-1: #c9d1d9;
  --vp-c-text-2: #b1bac4;
  --vp-c-text-3: #8b949e;
  --vp-c-brand-1: #7c85ff;
  --vp-c-brand-soft: rgba(124, 133, 255, 0.15);
}

/* ── Header ────────────────────────────────────────────────── */
.odeas-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--vp-c-divider, #d0d7de);
  background: var(--vp-c-bg-soft, #f6f8fa);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 1.4rem;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.header-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.header-sub {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.trace-badge {
  font-size: 0.7rem;
  font-family: monospace;
  padding: 2px 8px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  color: var(--vp-c-text-3);
}

.theme-btn {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: border-color 0.15s;
}

.theme-btn:hover {
  border-color: var(--vp-c-brand-1);
}

/* ── Body ─────────────────────────────────────────────────── */
.odeas-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ── Layer Navigation ─────────────────────────────────────── */
.layer-nav {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--vp-c-divider, #d0d7de);
  background: var(--vp-c-bg-soft, #f6f8fa);
  overflow-y: auto;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.nav-section-label {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  padding: 10px 16px 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
  min-height: 48px;
}

.nav-item:hover {
  background: var(--vp-c-bg, rgba(0,0,0,0.04));
}

.nav-item.is-active {
  background: color-mix(in srgb, var(--layer-color, var(--vp-c-brand-1)) 12%, transparent);
}

.nav-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 32px;
  background: var(--layer-color, var(--vp-c-brand-1));
  border-radius: 0 2px 2px 0;
  animation: pulse-border 1.5s ease-in-out infinite;
}

.nav-item.is-done .nav-step-dot {
  background: var(--layer-color, var(--vp-c-brand-1));
  color: #fff;
}

.nav-item.is-hitl .nav-step-dot {
  animation: pulse-hitl 1s ease-in-out infinite;
}

.nav-step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--vp-c-bg, #fff);
  border: 1.5px solid var(--vp-c-divider, #d0d7de);
  transition: all 0.3s;
  position: relative;
}

.nav-item.is-active .nav-step-dot {
  background: var(--layer-color, var(--vp-c-brand-1));
  border-color: var(--layer-color, var(--vp-c-brand-1));
  color: #fff;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--layer-color, var(--vp-c-brand-1)) 20%, transparent);
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.step-num {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--vp-c-text-3);
}

.nav-item.is-active .step-num {
  color: #fff;
}

.check-icon {
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
}

.nav-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.nav-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-item.is-active .nav-label {
  color: var(--layer-color, var(--vp-c-brand-1));
}

.nav-desc {
  font-size: 0.65rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-connector {
  height: 1px;
  background: var(--vp-c-divider, #d0d7de);
  margin: 4px 12px;
}

/* ── Layer Detail ─────────────────────────────────────────── */
.layer-detail {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Intro Panel ──────────────────────────────────────────── */
.intro-panel {
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: center;
  padding-top: 20px;
}

.intro-hero {
  text-align: center;
}

.intro-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--vp-c-text-1);
  margin-bottom: 12px;
}

.intro-scenario {
  font-size: 1rem;
  color: var(--vp-c-text-2);
}

.hl {
  color: var(--vp-c-brand-1);
  font-weight: 700;
}

/* Architecture diagram */
.arch-diagram {
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
}

.arch-row {
  display: flex;
  gap: 8px;
}

.arch-row--cross {
  gap: 8px;
}

.arch-cell {
  flex: 1;
  padding: 10px 6px;
  border-radius: 8px;
  text-align: center;
  font-size: 0.7rem;
}

.arch-label {
  font-weight: 800;
  font-size: 0.8rem;
  margin-bottom: 2px;
}

.arch-name {
  color: var(--vp-c-text-2);
  font-size: 0.62rem;
}

.arch-cell--m1 { background: #F1EFE8; color: #444441; }
.arch-cell--m2 { background: #FCEBEB; color: #791F1F; }
.arch-cell--m3 { background: #E6F1FB; color: #0C447C; }

.arch-spacer {
  text-align: center;
  font-size: 0.65rem;
  color: var(--vp-c-text-3);
  letter-spacing: 0.05em;
  padding: 4px 0;
}

.arch-cell--l1 { background: #EEEDFE; color: #3C3489; }
.arch-cell--l2 { background: #E1F5EE; color: #085041; }
.arch-cell--l3 { background: #E6F1FB; color: #0C447C; }
.arch-cell--l4 { background: #EAF3DE; color: #27500A; }
.arch-cell--l5 { background: #FAEEDA; color: #633806; }
.arch-cell--l6 { background: #FBEAF0; color: #72243E; }
.arch-cell--l7 { background: #FDF0E6; color: #7A3D10; }

.intro-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.cta-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  background: var(--vp-c-brand-1, #646cff);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 16px rgba(100, 108, 255, 0.3);
}

.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(100, 108, 255, 0.4);
}

.cta-arrow {
  font-size: 1.2rem;
  transition: transform 0.2s;
}

.cta-btn:hover .cta-arrow {
  transform: translateX(4px);
}

.hitl-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--vp-c-text-2);
  cursor: pointer;
  padding: 8px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  transition: border-color 0.15s, background 0.15s;
}

.hitl-toggle:has(input:checked) {
  border-color: #E07B39;
  background: #FDF0E6;
}

.hitl-toggle input {
  accent-color: #E07B39;
}

/* ── Cross Panel ──────────────────────────────────────────── */
.cross-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  color: #fff;
  font-weight: 800;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  align-self: flex-start;
}

/* ── Step Indicator ───────────────────────────────────────── */
.step-indicator {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 0;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-divider, #d0d7de);
  transition: all 0.3s;
}

.step-dot.is-active {
  background: var(--vp-c-brand-1, #646cff);
  transform: scale(1.4);
}

.step-dot.is-done {
  background: var(--vp-c-brand-1, #646cff);
  opacity: 0.4;
}

.step-dot.is-hitl {
  background: #E07B39;
  animation: pulse-hitl 1s ease-in-out infinite;
}

/* ── Layer Header ─────────────────────────────────────────── */
.layer-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.layer-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 52px;
  padding: 0 14px;
  border-radius: 12px;
  color: #fff;
  font-weight: 800;
  font-size: 1.1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  flex-shrink: 0;
}

.layer-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.layer-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.step-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.step-desc {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.step-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ── HITL Warning ─────────────────────────────────────────── */
.hitl-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #FDF0E6;
  border: 1px solid #E07B39;
  border-radius: 8px;
  font-size: 0.82rem;
  color: #7A3D10;
}

.hitl-warning-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

/* ── Submodules ───────────────────────────────────────────── */
.submodules {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.submodules-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3);
}

.submodule-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.submodule-tag {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 500;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.15s;
  background: var(--vp-c-bg);
}

.submodule-tag:hover,
.submodule-tag--active {
  background: color-mix(in srgb, currentColor 10%, transparent);
}

.submodule-detail {
  padding: 10px 14px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  font-size: 0.8rem;
}

.submodule-desc {
  color: var(--vp-c-text-2);
  margin-bottom: 4px;
}

.submodule-func {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--vp-c-brand-1);
}

/* ── Cross Banner ──────────────────────────────────────────── */
.cross-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 3px solid;
  font-size: 0.82rem;
}

.cross-banner-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-top: 1px;
}

.cross-banner-title {
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 2px;
}

.cross-banner-body {
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

/* ── Data Flow ────────────────────────────────────────────── */
.data-flow {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.data-box {
  flex: 1;
  min-width: 0;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  overflow: hidden;
}

.data-box--input {
  border-color: var(--vp-c-divider);
}

.data-box--output {
  border-color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1, #646cff) 5%, var(--vp-c-bg));
}

.data-box-label {
  padding: 4px 10px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.data-box-content {
  padding: 10px 12px;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.68rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  overflow-x: auto;
  white-space: pre;
  max-height: 260px;
  overflow-y: auto;
  margin: 0;
}

.data-box-content.blink {
  animation: blink 0.8s ease-in-out infinite;
}

.flow-arrow-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.flow-arrow {
  font-size: 1.4rem;
  color: var(--vp-c-text-3);
}

.flow-processing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.processing-dots {
  display: flex;
  gap: 4px;
}

.processing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  animation: bounce 1.2s ease-in-out infinite;
}

.processing-dots span:nth-child(2) { animation-delay: 0.2s; }
.processing-dots span:nth-child(3) { animation-delay: 0.4s; }

.processing-text {
  font-size: 0.65rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

/* ── HITL Card ────────────────────────────────────────────── */
.hitl-card {
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  overflow: hidden;
  transition: all 0.3s;
}

.hitl-card--active {
  border-color: #E07B39;
  box-shadow: 0 4px 16px rgba(224, 123, 57, 0.15);
}

.hitl-card--inactive {
  opacity: 0.6;
}

.hitl-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  font-weight: 700;
  font-size: 0.85rem;
}

.hitl-card-icon {
  font-size: 1rem;
}

.hitl-card-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hitl-card-desc {
  font-size: 0.82rem;
  color: var(--vp-c-text-2);
}

.hitl-card-flow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
}

.hitl-node {
  padding: 4px 10px;
  border-radius: 6px;
  background: #FDF0E6;
  color: #7A3D10;
  font-weight: 500;
  border: 1px solid #E07B39;
}

/* ── Step Effect ──────────────────────────────────────────── */
.step-effect {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  font-size: 0.85rem;
}

.effect-label {
  font-weight: 700;
  color: var(--vp-c-brand-1);
  white-space: nowrap;
  font-size: 0.75rem;
  padding: 2px 8px;
  background: var(--vp-c-brand-soft);
  border-radius: 4px;
  height: fit-content;
}

.effect-text {
  color: var(--vp-c-text-1);
  line-height: 1.5;
}

/* ── Step Nav ─────────────────────────────────────────────── */
.step-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid var(--vp-c-divider);
}

.nav-btn {
  padding: 8px 20px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.nav-btn:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-btn--next {
  background: var(--vp-c-brand-1, #646cff);
  border-color: var(--vp-c-brand-1, #646cff);
  color: #fff;
}

.nav-btn--next:hover:not(:disabled) {
  background: color-mix(in srgb, var(--vp-c-brand-1, #646cff) 85%, #000);
  color: #fff;
}

/* ── Return Panel ─────────────────────────────────────────── */
.return-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.return-flow {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.return-phase {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  border-left: 4px solid var(--phase-color, var(--vp-c-brand-1));
}

.return-phase-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--phase-color, var(--vp-c-brand-1));
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.return-phase-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.return-phase-name {
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--vp-c-text-1);
}

.return-phase-desc {
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
}

/* ── State Bar ─────────────────────────────────────────────── */
.state-bar {
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 16px;
  border-top: 1px solid var(--vp-c-divider, #d0d7de);
  background: var(--vp-c-bg-soft, #f6f8fa);
  flex-shrink: 0;
  overflow-x: auto;
}

.state-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.state-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3);
}

.state-value {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-family: 'SF Mono', monospace;
}

.token-value {
  color: var(--vp-c-brand-1);
}

.trace-value {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
}

.hitl-value {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.72rem;
}

.hitl-none {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-3);
}

.hitl-pending {
  background: #FDF0E6;
  color: #7A3D10;
  border: 1px solid #E07B39;
  animation: pulse-hitl 1.5s ease-in-out infinite;
}

.hitl-resolved {
  background: #E1F5EE;
  color: #085041;
}

.slot-pills {
  display: flex;
  gap: 4px;
}

.slot-pill {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-family: monospace;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-3);
  transition: all 0.3s;
}

.slot-pill--filled {
  background: #E1F5EE;
  border-color: #1D9E75;
  color: #085041;
}

.state-divider {
  width: 1px;
  height: 24px;
  background: var(--vp-c-divider, #d0d7de);
  flex-shrink: 0;
}

/* ── Animations ───────────────────────────────────────────── */
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--layer-color, var(--vp-c-brand-1)) 20%, transparent); }
  50% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--layer-color, var(--vp-c-brand-1)) 10%, transparent); }
}

@keyframes pulse-border {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes pulse-hitl {
  0%, 100% { box-shadow: 0 0 0 0 rgba(224, 123, 57, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(224, 123, 57, 0); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}
</style>
