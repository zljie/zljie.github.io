<template>
  <div class="exec-card">

    <!-- ─── Overall progress bar ──────────────────────────────── -->
    <div class="exec-card__progress">
      <div
        v-for="n in 5"
        :key="n"
        class="exec-card__progress-pip"
        :class="[pipClass(n as StepType), { 'is-last': n === 5 }]"
        :title="`${stepLabel(n as StepType)}`"
      >
        <span class="pip-dot" />
      </div>
    </div>

    <!-- ─── Steps ────────────────────────────────────────────── -->
    <div class="exec-card__steps">
      <div
        v-for="(step, idx) in sortedSteps"
        :key="step.step"
        class="step-card"
        :class="[
          `step-card--${step.status}`,
          { 'step-card--active': step.status === 'active' }
        ]"
      >
        <!-- Step header row -->
        <button
          class="step-card__header"
          @click="toggleDetail(step.step)"
        >
          <!-- Number badge -->
          <div class="step-card__num" :class="`num--${step.status}`">
            <!-- pending -->
            <span v-if="step.status === 'pending'" class="num-pip num-pip--pending" />
            <!-- active -->
            <span v-else-if="step.status === 'active'" class="spinner" />
            <!-- waiting -->
            <span v-else-if="step.status === 'waiting_confirmation'" class="num-pip num-pip--warn">!</span>
            <!-- completed -->
            <span v-else-if="step.status === 'completed'" class="num-check">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <!-- blocked/error -->
            <span v-else-if="step.status === 'blocked' || step.status === 'error'" class="num-pip num-pip--err">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
              </svg>
            </span>
          </div>

          <!-- Title + summary -->
          <div class="step-card__meta">
            <div class="step-card__title-row">
              <span class="step-card__label">Step {{ step.step }}. {{ step.stepName }}</span>
              <span class="step-card__status-tag" :class="`tag--${step.status}`">
                {{ statusLabel(step.status) }}
              </span>
            </div>
            <div class="step-card__summary">{{ step.summary || '' }}</div>
          </div>

          <!-- Expand chevron -->
          <div class="step-card__chevron" :class="{ 'is-open': detailOpen[step.step] }">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </button>

        <!-- ─── Card front face: key info at a glance ─────────── -->
        <div v-if="step.details && !detailOpen[step.step]" class="step-card__face">
          <!-- Step 1: Intent -->
          <template v-if="step.step === 1 && isStep1Details(step.details)">
            <div class="step-card__chips">
              <span class="chip chip--intent">{{ step.details.intentLabel }}</span>
              <span class="chip" :class="`chip--risk-${step.details.riskLevel}`">
                {{ riskLabel(step.details.riskLevel) }}
              </span>
              <span v-if="step.details.requiresConfirmation" class="chip chip--confirm">需确认</span>
            </div>
            <div class="step-card__attrs">
              <span class="attr"><span class="attr__k">术语</span><span class="attr__v">{{ step.details.objectTerm }}</span></span>
              <span class="attr"><span class="attr__k">操作</span><span class="attr__v">{{ step.details.operationType }}</span></span>
            </div>
          </template>

          <!-- Step 2: Ontology -->
          <template v-else-if="step.step === 2 && isStep2Details(step.details)">
            <div class="step-card__chips">
              <span class="chip chip--object">{{ step.details.objectLabel }}</span>
              <span class="chip" :class="`chip--complete-${step.details.ontologyCompleteness}`">
                本体 {{ completenessLabel(step.details.ontologyCompleteness) }}
              </span>
            </div>
            <div class="step-card__attrs">
              <span class="attr"><span class="attr__k">命中</span><span class="attr__v">{{ step.details.hitKeywords.join(', ') }}</span></span>
              <span class="attr"><span class="attr__k">动作</span><span class="attr__v">{{ step.details.availableActions.join(', ') }}</span></span>
            </div>
          </template>

          <!-- Step 3: Task Planning -->
          <template v-else-if="step.step === 3 && isStep3Details(step.details)">
            <div class="step-card__chips">
              <span class="chip" :class="`chip--risk-${step.details.riskLevel}`">
                {{ riskLabel(step.details.riskLevel) }}
              </span>
              <span v-if="step.details.requiresConfirmation" class="chip chip--confirm">需确认</span>
            </div>
            <div class="step-card__attrs">
              <span class="attr"><span class="attr__k">动作</span><span class="attr__v">{{ step.details.plannedActions.map(a => a.actionLabel).join(' → ') }}</span></span>
            </div>
          </template>

          <!-- Step 4: Execution -->
          <template v-else-if="step.step === 4">
            <div v-if="step.connector" class="step-card__connector">
              <span class="connector-badge" :class="`connector-badge--${step.connector.status}`">
                <svg v-if="step.connector.status === 'success'" width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else-if="step.connector.status === 'error'" width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
                <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" stroke-dasharray="28 56" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="connector-name">{{ step.connector.name }}</span>
              <span v-if="step.connector.resultCount !== undefined" class="connector-count">
                {{ step.connector.resultCount }} 条
              </span>
              <span v-if="step.connector.latencyMs" class="connector-latency">
                {{ step.connector.latencyMs }}ms
              </span>
            </div>
          </template>

          <!-- Step 5: Response -->
          <template v-else-if="step.step === 5 && isStep5Details(step.details)">
            <div class="step-card__chips">
              <span v-for="stat in (step.details.statistics || []).slice(0, 3)" :key="stat.label" class="chip chip--stat">
                {{ stat.label }}: <strong>{{ stat.value }}{{ stat.unit || '' }}</strong>
              </span>
            </div>
            <div v-if="step.details.resultDefinition" class="step-card__attrs">
              <span class="attr"><span class="attr__k">口径</span><span class="attr__v">{{ step.details.resultDefinition }}</span></span>
            </div>
          </template>
        </div>

        <!-- ─── Expanded detail panel ───────────────────────── -->
        <Transition name="slide-down">
          <div v-if="detailOpen[step.step]" class="step-card__detail">

            <!-- Step 1 detail -->
            <template v-if="step.step === 1 && isStep1Details(step.details)">
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="detail-row__k">意图 ID</span>
                  <code class="detail-row__v">{{ step.details.intent }}</code>
                </div>
                <div class="detail-row">
                  <span class="detail-row__k">意图标签</span>
                  <span class="detail-row__v">{{ step.details.intentLabel }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-row__k">原始术语</span>
                  <span class="detail-row__v">{{ step.details.objectTerm }}</span>
                </div>
                <div v-if="step.details.normalizedTerm" class="detail-row">
                  <span class="detail-row__k">归一化术语</span>
                  <span class="detail-row__v">{{ step.details.normalizedTerm }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-row__k">操作类型</span>
                  <span class="detail-row__v">{{ step.details.operationType }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-row__k">风险等级</span>
                  <span class="detail-row__v" :class="`text--risk-${step.details.riskLevel}`">{{ riskLabel(step.details.riskLevel) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-row__k">需确认</span>
                  <span class="detail-row__v">{{ step.details.requiresConfirmation ? '是' : '否' }}</span>
                </div>
                <div v-if="step.details.requiresConfirmationReason" class="detail-row">
                  <span class="detail-row__k">确认原因</span>
                  <span class="detail-row__v">{{ step.details.requiresConfirmationReason }}</span>
                </div>
                <div v-if="step.details.alternativeIntents?.length" class="detail-row">
                  <span class="detail-row__k">候选意图</span>
                  <span class="detail-row__v">{{ step.details.alternativeIntents.join(', ') }}</span>
                </div>
              </div>
            </template>

            <!-- Step 2 detail -->
            <template v-else-if="step.step === 2 && isStep2Details(step.details)">
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="detail-row__k">本体对象</span>
                  <code class="detail-row__v">{{ step.details.objectType }}</code>
                </div>
                <div class="detail-row">
                  <span class="detail-row__k">中文名</span>
                  <span class="detail-row__v">{{ step.details.objectLabel }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-row__k">命中关键词</span>
                  <span class="detail-row__v">{{ step.details.hitKeywords.join(', ') }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-row__k">可用动作</span>
                  <span class="detail-row__v">{{ step.details.availableActions.join(', ') }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-row__k">本体完整性</span>
                  <span class="detail-row__v">{{ completenessLabel(step.details.ontologyCompleteness) }}</span>
                </div>
                <div v-if="step.details.gaps?.length" class="detail-section">
                  <span class="detail-section__label">本体缺口</span>
                  <div v-for="gap in step.details.gaps" :key="gap.gapType" class="gap-item">
                    <span class="gap-type">{{ gap.gapType }}</span>
                    <span>{{ gap.description }}</span>
                    <span class="gap-suggestion">→ {{ gap.suggestion }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- Step 3 detail -->
            <template v-else-if="step.step === 3 && isStep3Details(step.details)">
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="detail-row__k">风险等级</span>
                  <span class="detail-row__v" :class="`text--risk-${step.details.riskLevel}`">{{ riskLabel(step.details.riskLevel) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-row__k">需确认</span>
                  <span class="detail-row__v">{{ step.details.requiresConfirmation ? '是' : '否' }}</span>
                </div>
                <div v-if="step.details.plannedActions?.length" class="detail-section">
                  <span class="detail-section__label">计划动作</span>
                  <div v-for="action in step.details.plannedActions" :key="action.sequence" class="action-item">
                    <span class="action-seq">{{ action.sequence }}</span>
                    <div class="action-info">
                      <span class="action-label">{{ action.actionLabel }}</span>
                      <span class="action-desc">{{ action.description }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="step.details.queryConditions?.length" class="detail-section">
                  <span class="detail-section__label">查询条件</span>
                  <div v-for="cond in step.details.queryConditions" :key="cond.field" class="cond-item">
                    <code>{{ cond.field }}</code>
                    <span class="cond-op">{{ cond.operator }}</span>
                    <code>{{ String(cond.value) }}</code>
                    <span class="cond-label">{{ cond.label }}</span>
                  </div>
                </div>
                <div v-if="step.details.displayFields?.length" class="detail-row">
                  <span class="detail-row__k">展示字段</span>
                  <span class="detail-row__v">{{ step.details.displayFields.join(', ') }}</span>
                </div>
              </div>
            </template>

            <!-- Step 4 detail -->
            <template v-else-if="step.step === 4 && isStep4Details(step.details)">
              <div class="detail-grid">
                <div v-for="exec in step.details.executions" :key="exec.actionId" class="exec-card-detail">
                  <div class="exec-card-detail__header">
                    <span class="exec-name">{{ exec.connectorName }}</span>
                    <span class="exec-status" :class="`exec-status--${exec.status}`">{{ exec.status }}</span>
                    <span v-if="exec.latencyMs" class="exec-latency">{{ exec.latencyMs }}ms</span>
                  </div>
                  <div v-if="exec.requestParams" class="detail-row">
                    <span class="detail-row__k">请求参数</span>
                    <code class="detail-row__v">{{ JSON.stringify(exec.requestParams) }}</code>
                  </div>
                  <div v-if="exec.responseSummary" class="detail-row">
                    <span class="detail-row__k">响应摘要</span>
                    <span class="detail-row__v">{{ exec.responseSummary }}</span>
                  </div>
                  <div v-if="exec.resultCount !== undefined" class="detail-row">
                    <span class="detail-row__k">返回记录</span>
                    <span class="detail-row__v">{{ exec.resultCount }}</span>
                  </div>
                  <div v-if="exec.errorMessage" class="detail-row">
                    <span class="detail-row__k">错误信息</span>
                    <span class="detail-row__v text--err">{{ exec.errorMessage }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- Step 5 detail -->
            <template v-else-if="step.step === 5 && isStep5Details(step.details)">
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="detail-row__k">结果摘要</span>
                  <span class="detail-row__v">{{ step.details.resultSummary }}</span>
                </div>
                <div v-if="step.details.resultDefinition" class="detail-row">
                  <span class="detail-row__k">统计口径</span>
                  <span class="detail-row__v">{{ step.details.resultDefinition }}</span>
                </div>
                <div v-if="step.details.statistics?.length" class="detail-section">
                  <span class="detail-section__label">统计数据</span>
                  <div class="stat-grid">
                    <div v-for="stat in step.details.statistics" :key="stat.label" class="stat-item">
                      <span class="stat-item__label">{{ stat.label }}</span>
                      <span class="stat-item__value">{{ stat.value }}<span v-if="stat.unit" class="stat-item__unit">{{ stat.unit }}</span></span>
                    </div>
                  </div>
                </div>
                <div v-if="step.details.ontologyImprovements?.length" class="detail-section">
                  <span class="detail-section__label">本体优化建议</span>
                  <div v-for="imp in step.details.ontologyImprovements" :key="imp.gapType" class="gap-item">
                    <span class="gap-type">{{ imp.gapType }}</span>
                    <span>{{ imp.description }}</span>
                    <span class="gap-suggestion">→ {{ imp.suggestion }}</span>
                  </div>
                </div>
              </div>

              <!-- Suggested actions -->
              <div v-if="step.suggestedActions?.length" class="suggested-actions">
                <span class="suggested-actions__label">建议动作</span>
                <div class="suggested-actions__btns">
                  <button
                    v-for="action in step.suggestedActions"
                    :key="action.id"
                    class="suggested-action-btn"
                    :class="`suggested-action-btn--${action.type}`"
                    @click="$emit('action', action)"
                  >
                    {{ action.label }}
                  </button>
                </div>
              </div>
            </template>

            <!-- Generic fallback -->
            <template v-else-if="step.details">
              <pre class="detail-raw">{{ JSON.stringify(step.details, null, 2) }}</pre>
            </template>
          </div>
        </Transition>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import type {
  StepInfo, StepType, StepStatus,
  Step1Details, Step2Details, Step3Details, Step4Details, Step5Details,
} from './useChat'

const props = defineProps<{
  steps: StepInfo[]
}>()

defineEmits<{
  action: [action: { id: string; label: string; type: string; params?: any }]
}>()

const detailOpen = reactive<Record<number, boolean>>({})

function toggleDetail(step: number) {
  detailOpen[step] = !detailOpen[step]
}

const sortedSteps = computed(() =>
  [...props.steps].sort((a, b) => a.step - b.step)
)

// ─── Labels ──────────────────────────────────────────────────────
const STEP_LABELS: Record<StepType, string> = {
  1: '意图识别', 2: '本体对象定位', 3: '任务规划', 4: '执行过程', 5: '生成回复',
}
function stepLabel(n: StepType): string { return STEP_LABELS[n] || `Step ${n}` }

const STATUS_LABELS: Record<StepStatus, string> = {
  pending: '待处理', active: '进行中', completed: '已完成',
  waiting_confirmation: '等待确认', blocked: '已阻断', error: '异常',
}
function statusLabel(s: StepStatus): string { return STATUS_LABELS[s] || s }

function riskLabel(r: string): string {
  const m: Record<string, string> = { low: '低风险', medium: '中风险', high: '高风险' }
  return m[r] || r
}

function completenessLabel(c: string): string {
  const m: Record<string, string> = { full: '完整', partial: '部分', insufficient: '不足' }
  return m[c] || c
}

// ─── Pip class for progress bar ─────────────────────────────────
function pipClass(n: StepType): string {
  const step = props.steps.find((s) => s.step === n)
  if (!step) return 'pip--pending'
  if (step.status === 'completed') return 'pip--done'
  if (step.status === 'active') return 'pip--active'
  if (step.status === 'waiting_confirmation') return 'pip--warn'
  if (step.status === 'blocked' || step.status === 'error') return 'pip--err'
  return 'pip--pending'
}

// ─── Type guards ────────────────────────────────────────────────
function isStep1Details(d: any): d is Step1Details { return d?.intent !== undefined }
function isStep2Details(d: any): d is Step2Details { return d?.objectType !== undefined }
function isStep3Details(d: any): d is Step3Details { return d?.plannedActions !== undefined }
function isStep4Details(d: any): d is Step4Details { return d?.executions !== undefined }
function isStep5Details(d: any): d is Step5Details { return d?.resultSummary !== undefined }
</script>

<style scoped>
/* ─── Progress bar ────────────────────────────────────────────── */
.exec-card__progress {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 14px;
  padding: 10px 14px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
}

.exec-card__progress-pip {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0;
  position: relative;
}

.exec-card__progress-pip:not(.is-last)::after {
  content: '';
  flex: 1;
  height: 2px;
  background: var(--vp-c-divider);
  margin: 0 4px;
}

.pip-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vp-c-divider);
  flex-shrink: 0;
  z-index: 1;
  transition: background 0.3s, transform 0.2s;
}

.pip--done .pip-dot      { background: #3fb950; transform: scale(1.15); }
.pip--active .pip-dot    { background: var(--vp-c-brand-1); transform: scale(1.3); box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.18); }
.pip--warn .pip-dot     { background: #e3b341; }
.pip--err .pip-dot      { background: #f85149; }
.pip--pending .pip-dot  { background: var(--vp-c-divider); }

/* ─── Steps container ─────────────────────────────────────────── */
.exec-card__steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ─── Individual Step Card ────────────────────────────────────── */
.step-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.25s, box-shadow 0.25s;
}

.step-card--active {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 1px var(--vp-c-brand-1);
}

.step-card--completed { border-color: rgba(63,185,80,0.35); }
.step-card--blocked,
.step-card--error    { border-color: rgba(248,81,73,0.35); }

/* ─── Card header row ────────────────────────────────────────── */
.step-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: none;
  border: none;
  padding: 10px 12px;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  background: var(--vp-c-bg-soft);
  transition: background 0.15s;
}

.step-card__header:hover { background: var(--vp-c-bg); }

.step-card__num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--vp-c-bg);
  border: 1.5px solid var(--vp-c-divider);
  transition: border-color 0.25s, background 0.25s;
}

.num--completed { border-color: #3fb950; color: #3fb950; }
.num--active   { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.num--warn     { border-color: #e3b341; color: #e3b341; }
.num--err      { border-color: #f85149; color: #f85149; }

.num-pip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.num-pip--pending { background: var(--vp-c-divider); }
.num-pip--warn   { background: #e3b341; color: #fff; font-size: 9px; font-weight: 900; width: auto; height: auto; border-radius: 2px; padding: 0 2px; }
.num-pip--err    { width: auto; height: auto; background: transparent; }

.num-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--vp-c-brand-1);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: block;
}

@keyframes spin { to { transform: rotate(360deg); } }

.step-card__meta {
  flex: 1;
  min-width: 0;
}

.step-card__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.step-card__label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.step-card__status-tag {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tag--completed  { background: rgba(63,185,80,0.15);  color: #3fb950; }
.tag--active     { background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); }
.tag--pending    { background: var(--vp-c-bg-soft);    color: var(--vp-c-text-3); border: 1px solid var(--vp-c-divider); }
.tag--waiting_confirmation { background: rgba(227,179,65,0.15); color: #e3b341; }
.tag--blocked,
.tag--error      { background: rgba(248,81,73,0.12);  color: #f85149; }

.step-card__summary {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-card__chevron {
  color: var(--vp-c-text-3);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.step-card__chevron.is-open { transform: rotate(0deg); }
.step-card__chevron:not(.is-open) { transform: rotate(-90deg); }

/* ─── Card front face ────────────────────────────────────────── */
.step-card__face {
  padding: 8px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--vp-c-bg);
  border-top: 1px solid var(--vp-c-divider);
}

.step-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.chip {
  font-size: 0.68rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
}

.chip--intent   { background: rgba(88,166,255,0.12); border-color: rgba(88,166,255,0.3); color: #58a6ff; }
.chip--object  { background: rgba(183,148,255,0.12); border-color: rgba(183,148,255,0.3); color: #b794f4; }
.chip--confirm { background: rgba(227,179,65,0.12); border-color: rgba(227,179,65,0.3); color: #e3b341; }

.chip--risk-low    { background: rgba(63,185,80,0.1);  border-color: rgba(63,185,80,0.3);  color: #3fb950; }
.chip--risk-medium { background: rgba(227,179,65,0.1); border-color: rgba(227,179,65,0.3); color: #e3b341; }
.chip--risk-high   { background: rgba(248,81,73,0.1);  border-color: rgba(248,81,73,0.3);  color: #f85149; }

.chip--complete-full       { background: rgba(63,185,80,0.1);  border-color: rgba(63,185,80,0.3);  color: #3fb950; }
.chip--complete-partial   { background: rgba(227,179,65,0.1); border-color: rgba(227,179,65,0.3); color: #e3b341; }
.chip--complete-insufficient { background: rgba(248,81,73,0.1); border-color: rgba(248,81,73,0.3); color: #f85149; }

.chip--stat {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}

.chip--stat strong { color: var(--vp-c-text-1); }

.step-card__attrs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attr {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 0.72rem;
}

.attr__k {
  color: var(--vp-c-text-3);
  font-weight: 600;
  white-space: nowrap;
}

.attr__v {
  color: var(--vp-c-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 240px;
}

/* Connector badge */
.step-card__connector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
}

.connector-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.connector-badge--success { background: rgba(63,185,80,0.15); color: #3fb950; }
.connector-badge--error   { background: rgba(248,81,73,0.12); color: #f85149; }
.connector-badge--pending,
.connector-badge--running { background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); }

.connector-name { font-weight: 600; color: var(--vp-c-text-1); flex: 1; }
.connector-count { color: var(--vp-c-brand-1); font-weight: 700; }
.connector-latency { color: var(--vp-c-text-3); font-size: 0.7rem; }

/* ─── Expanded detail panel ───────────────────────────────────── */
.step-card__detail {
  padding: 10px 12px 12px;
  background: var(--vp-c-bg);
  border-top: 1px solid var(--vp-c-divider);
}

/* Detail grid */
.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.75rem;
  min-width: 0;
}

.detail-row__k {
  color: var(--vp-c-text-3);
  font-weight: 600;
  white-space: nowrap;
  min-width: 72px;
  flex-shrink: 0;
}

.detail-row__v {
  color: var(--vp-c-text-2);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-row__v code,
code {
  font-family: 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.9em;
  background: var(--vp-c-bg-soft);
  padding: 0.1em 0.35em;
  border-radius: 4px;
  color: var(--vp-c-text-1);
}

.text--risk-low    { color: #3fb950; }
.text--risk-medium { color: #e3b341; }
.text--risk-high   { color: #f85149; }
.text--err         { color: #f85149; }

.detail-section {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-section__label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Attribute table */
.attr-table {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.72rem;
}

.attr-table__row {
  display: grid;
  grid-template-columns: 1fr 1fr 64px;
  gap: 6px;
  padding: 3px 6px;
  border-radius: 4px;
  color: var(--vp-c-text-2);
  align-items: center;
}

.attr-table__header {
  font-weight: 700;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  font-size: 0.62rem;
  letter-spacing: 0.05em;
}

.usage-badge {
  font-size: 0.6rem;
  padding: 1px 5px;
  border-radius: 4px;
  text-align: center;
}

.usage-badge--filter   { background: rgba(88,166,255,0.12); color: #58a6ff; }
.usage-badge--display  { background: rgba(183,148,255,0.12); color: #b794f4; }
.usage-badge--rule     { background: rgba(227,179,65,0.12); color: #e3b341; }
.usage-badge--audit    { background: rgba(121,192,128,0.12); color: #79c061; }

/* Gap items */
.gap-item {
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  padding: 4px 8px;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: baseline;
}

.gap-type {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  flex-shrink: 0;
}

.gap-suggestion {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

/* Action items */
.action-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.75rem;
}

.action-seq {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.62rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-info {
  flex: 1;
  min-width: 0;
}

.action-label {
  font-weight: 600;
  color: var(--vp-c-text-1);
  display: block;
}

.action-desc {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  display: block;
}

/* Condition items */
.cond-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  flex-wrap: wrap;
  background: var(--vp-c-bg-soft);
  padding: 4px 8px;
  border-radius: 6px;
}

.cond-op {
  color: var(--vp-c-brand-1);
  font-weight: 700;
}

.cond-label {
  color: var(--vp-c-text-3);
  font-size: 0.7rem;
}

/* Exec detail */
.exec-card-detail {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 6px;
}

.exec-card-detail__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.exec-name { font-weight: 600; font-size: 0.78rem; color: var(--vp-c-text-1); flex: 1; }
.exec-status { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.exec-status--success { color: #3fb950; }
.exec-status--error   { color: #f85149; }
.exec-status--running { color: var(--vp-c-brand-1); }
.exec-status--pending { color: var(--vp-c-text-3); }
.exec-status--timeout { color: #e3b341; }
.exec-latency { font-size: 0.7rem; color: var(--vp-c-text-3); }

.exec-card-detail .detail-grid {
  padding: 8px 10px;
  gap: 4px;
}

/* Stat grid */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 6px;
  margin-top: 4px;
}

.stat-item {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px 10px;
  text-align: center;
}

.stat-item__label {
  display: block;
  font-size: 0.65rem;
  color: var(--vp-c-text-3);
  margin-bottom: 2px;
  font-weight: 600;
}

.stat-item__value {
  display: block;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--vp-c-text-1);
  line-height: 1.2;
}

.stat-item__unit {
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--vp-c-text-3);
  margin-left: 2px;
}

/* Raw JSON fallback */
.detail-raw {
  margin: 0;
  font-family: 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.72rem;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  white-space: pre-wrap;
  word-break: break-word;
}

/* ─── Suggested actions ───────────────────────────────────────── */
.suggested-actions {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--vp-c-divider);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.suggested-actions__label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.suggested-actions__btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.suggested-action-btn {
  padding: 5px 12px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-brand-1);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.suggested-action-btn:hover {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.suggested-action-btn--navigate { border-color: #58a6ff; color: #58a6ff; }
.suggested-action-btn--navigate:hover { background: #58a6ff; color: #fff; }

.suggested-action-btn--execute { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.suggested-action-btn--execute:hover { background: var(--vp-c-brand-1); color: #fff; }

.suggested-action-btn--export { border-color: #3fb950; color: #3fb950; }
.suggested-action-btn--export:hover { background: #3fb950; color: #fff; }

.suggested-action-btn--compose { border-color: #b794f4; color: #b794f4; }
.suggested-action-btn--compose:hover { background: #b794f4; color: #fff; }

/* ─── Animations ─────────────────────────────────────────────── */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  overflow: hidden;
  max-height: 600px;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
