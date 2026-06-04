<template>
  <div class="hitl-card" :class="`hitl-card--${cardType}`">

    <!-- Card header -->
    <div class="hitl-card__header">
      <div class="hitl-card__icon">
        <!-- choice -->
        <svg v-if="cardType === 'choice'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 15a3 3 0 1 0 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <!-- confirm -->
        <svg v-else-if="cardType === 'confirm'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <!-- rating -->
        <svg v-else-if="cardType === 'rating'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <!-- input -->
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="4 7 4 4 20 4 20 7"/>
          <line x1="9" y1="20" x2="15" y2="20"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
      </div>
      <div class="hitl-card__meta">
        <span class="hitl-card__title">{{ interaction?.title || confirm?.title }}</span>
        <span v-if="interaction?.description || confirm?.message" class="hitl-card__desc">
          {{ interaction?.description || confirm?.message }}
        </span>
      </div>
      <div v-if="isRequired" class="hitl-card__required-badge">需回复</div>
    </div>

    <!-- ─── Choice type ─────────────────────────────────────── -->
    <div v-if="cardType === 'choice' && interaction?.options" class="hitl-card__options">
      <button
        v-for="option in interaction.options"
        :key="option.id"
        class="hitl-option"
        :class="[
          `hitl-option--${option.action}`,
          { 'hitl-option--recommended': option.recommended }
        ]"
        :disabled="isSubmitting || loading"
        @click="selectOption(option)"
      >
        <span class="hitl-option__icon">
          <component :is="iconComponent(option.icon)" />
        </span>
        <span class="hitl-option__content">
          <span class="hitl-option__label">{{ option.label }}</span>
          <span v-if="option.description" class="hitl-option__desc">{{ option.description }}</span>
        </span>
        <span v-if="option.recommended" class="hitl-option__badge">推荐</span>
      </button>
    </div>

    <!-- ─── Confirm type ────────────────────────────────────── -->
    <div v-else-if="cardType === 'confirm' && confirm" class="hitl-card__confirm">
      <div v-if="confirm.confirmDetails" class="confirm-details">
        <div class="confirm-risk" :class="`confirm-risk--${confirm.confirmDetails.riskLevel}`">
          <span class="confirm-risk__icon">
            <svg v-if="confirm.confirmDetails.riskLevel === 'high'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <svg v-else-if="confirm.confirmDetails.riskLevel === 'medium'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
          {{ riskLabel(confirm.confirmDetails.riskLevel) }}
        </div>
        <div class="confirm-info">
          <span class="confirm-action">{{ confirm.confirmDetails.action }}</span>
          <span v-if="confirm.confirmDetails.affectedCount !== undefined" class="confirm-affected">
            影响 {{ confirm.confirmDetails.affectedCount }} 条
            <span v-if="confirm.confirmDetails.affectedLabel">{{ confirm.confirmDetails.affectedLabel }}</span>
          </span>
        </div>
        <div v-if="confirm.affectedRecords?.length" class="confirm-records">
          <span
            v-for="record in confirm.affectedRecords"
            :key="record.id"
            class="confirm-record-chip"
          >
            {{ record.label || record.id }}
          </span>
        </div>
      </div>

      <div class="confirm-actions">
        <button class="confirm-btn confirm-btn--cancel" :disabled="isSubmitting || loading" @click="cancelConfirm">
          {{ confirm.cancelAction.label }}
        </button>
        <button class="confirm-btn" :class="`confirm-btn--${confirm.riskLevel}`" :disabled="isSubmitting || loading" @click="confirmAction">
          {{ confirm.confirmAction.label }}
        </button>
      </div>
    </div>

    <!-- ─── Rating type ─────────────────────────────────────── -->
    <div v-else-if="cardType === 'rating' && interaction?.ratingConfig" class="hitl-card__rating">
      <div class="rating-labels">
        <span>{{ interaction.ratingConfig.labels?.min || interaction.ratingConfig.min }}</span>
        <span>{{ interaction.ratingConfig.labels?.max || interaction.ratingConfig.max }}</span>
      </div>
      <div class="rating-stars">
        <button
          v-for="n in (interaction.ratingConfig.max - interaction.ratingConfig.min + 1)"
          :key="n"
          class="rating-star"
          :class="{ 'rating-star--active': n <= (selectedRating ?? 0) }"
          @click="selectRating(n)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" :fill="n <= (selectedRating ?? 0) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>
      <div v-if="selectedRating !== null" class="rating-submit">
        <button class="confirm-btn confirm-btn--primary" @click="submitRating">
          提交评分
        </button>
      </div>
    </div>

    <!-- ─── Input type ──────────────────────────────────────── -->
    <div v-else-if="cardType === 'input'" class="hitl-card__input-area">
      <input
        v-if="inputMode === 'text'"
        ref="inputRef"
        v-model="inputValue"
        class="hitl-input"
        :placeholder="interaction?.inputPlaceholder || '请输入...'"
        @keydown.enter="submitInput"
      />
      <textarea
        v-else
        ref="inputRef"
        v-model="inputValue"
        class="hitl-input hitl-input--textarea"
        :placeholder="interaction?.inputPlaceholder || '请输入...'"
        rows="3"
        @keydown.ctrl.enter="submitInput"
      />
      <div class="input-actions">
        <span class="input-hint">按 Enter 发送</span>
        <button class="confirm-btn confirm-btn--primary" :disabled="!inputValue.trim()" @click="submitInput">
          发送
        </button>
      </div>
    </div>

    <!-- ─── Slot Fill type ─────────────────────────────────── -->
    <div v-else-if="cardType === 'slot-fill' && slotFill" class="hitl-card__slot-fill">
      <!-- Message description -->
      <div v-if="slotFill.message" class="slot-fill-message">
        {{ slotFill.message }}
      </div>

      <!-- Slot fields -->
      <div class="slot-fill-form">
        <div
          v-for="(slot, idx) in slotFill.slots"
          :key="slot.id"
          class="slot-field"
          :class="{ 'slot-field--error': slotErrors[slot.id] }"
        >
          <label class="slot-field__label">
            <span class="slot-field__name">{{ slot.label }}</span>
            <span v-if="slot.required" class="slot-field__required">*</span>
            <span v-if="slot.helpText" class="slot-field__help" :title="slot.helpText">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
            </span>
          </label>

          <!-- Text input -->
          <input
            v-if="slot.type === 'text'"
            :ref="(el) => setSlotRef(el as HTMLInputElement, slot.id)"
            v-model="slotValues[slot.id]"
            type="text"
            class="hitl-input"
            :placeholder="slot.placeholder || `请输入${slot.label}`"
            @keydown="(e) => handleSlotKeydown(e, slot, idx)"
            @blur="() => { slotErrors[slot.id] = validateSlot(slot) }"
          />

          <!-- Number input -->
          <input
            v-else-if="slot.type === 'number'"
            :ref="(el) => setSlotRef(el as HTMLInputElement, slot.id)"
            v-model="slotValues[slot.id]"
            type="number"
            class="hitl-input"
            :placeholder="slot.placeholder || `请输入数字`"
            :min="slot.validation?.min"
            :max="slot.validation?.max"
            @keydown="(e) => handleSlotKeydown(e, slot, idx)"
            @blur="() => { slotErrors[slot.id] = validateSlot(slot) }"
          />

          <!-- Date input -->
          <input
            v-else-if="slot.type === 'date'"
            :ref="(el) => setSlotRef(el as HTMLInputElement, slot.id)"
            v-model="slotValues[slot.id]"
            type="date"
            class="hitl-input"
            @keydown="(e) => handleSlotKeydown(e, slot, idx)"
            @blur="() => { slotErrors[slot.id] = validateSlot(slot) }"
          />

          <!-- Select -->
          <select
            v-else-if="slot.type === 'select'"
            :ref="(el) => setSlotRef(el as HTMLSelectElement, slot.id)"
            v-model="slotValues[slot.id]"
            class="hitl-input hitl-select"
            @change="() => { slotErrors[slot.id] = validateSlot(slot) }"
          >
            <option value="" disabled>{{ slot.placeholder || `请选择${slot.label}` }}</option>
            <option v-for="opt in slot.options" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>

          <!-- Textarea -->
          <textarea
            v-else-if="slot.type === 'textarea'"
            :ref="(el) => setSlotRef(el as HTMLTextAreaElement, slot.id)"
            v-model="slotValues[slot.id]"
            class="hitl-input hitl-input--textarea"
            :placeholder="slot.placeholder || `请输入${slot.label}`"
            rows="3"
            @blur="() => { slotErrors[slot.id] = validateSlot(slot) }"
          />

          <!-- Error message -->
          <span v-if="slotErrors[slot.id]" class="slot-field__error">
            {{ slotErrors[slot.id] }}
          </span>
        </div>
      </div>

      <!-- Form actions -->
      <div class="slot-fill-actions">
        <button class="confirm-btn confirm-btn--cancel" :disabled="isSubmitting || loading" @click="cancelSlotFill">
          {{ slotFill.cancelAction.label }}
        </button>
        <button
          class="confirm-btn"
          :class="`confirm-btn--${slotFill.riskLevel}`"
          :disabled="isSubmitting || loading"
          @click="submitSlotFill"
        >
          {{ slotFill.continueAction.label }}
        </button>
      </div>
    </div>

    <!-- Timeout indicator -->
    <div v-if="interaction?.timeoutSeconds" class="hitl-card__timeout">
      <div class="timeout-bar" :style="{ width: timeoutPercent + '%' }" />
      <span class="timeout-label">超时自动取消: {{ timeoutRemaining }}s</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, defineComponent, h } from 'vue'
import type { InteractionChoice, InteractionOption, ConfirmRequest, SlotFillRequest, SlotDefinition } from '../composables/useChat'

const props = defineProps<{
  interaction?: InteractionChoice
  confirm?: ConfirmRequest
  slotFill?: SlotFillRequest
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [option: InteractionOption, params?: Record<string, any>]
  confirm: [id: string, params?: Record<string, any>]
  cancel: [id: string]
  rating: [rating: number]
  input: [value: string]
  dismiss: []
  'slot-fill': [id: string, values: Record<string, any>]
  'slot-cancel': [id: string]
}>()

// Prevent duplicate submissions
const isSubmitting = ref(false)

// ─── Derived ───────────────────────────────────────────────────
const cardType = computed(() => {
  if (props.slotFill) return 'slot-fill'
  return props.interaction?.type ?? (props.confirm ? 'confirm' : 'choice')
})
const isRequired = computed(() => props.interaction?.required ?? false)

// ─── Choice handling ────────────────────────────────────────────
function selectOption(option: InteractionOption) {
  if (isSubmitting.value || props.loading) return
  isSubmitting.value = true
  emit('select', option, option.params)
}

// ─── Confirm handling ───────────────────────────────────────────
function confirmAction() {
  if (isSubmitting.value || props.loading || !props.confirm) return
  isSubmitting.value = true
  emit('confirm', props.confirm.id, props.confirm.confirmDetails)
}

function cancelConfirm() {
  if (isSubmitting.value || props.loading || !props.confirm) return
  isSubmitting.value = true
  emit('cancel', props.confirm.id)
}

// ─── Rating handling ────────────────────────────────────────────
const selectedRating = ref<number | null>(null)
function selectRating(n: number) {
  selectedRating.value = n
}
function submitRating() {
  if (selectedRating.value !== null) {
    emit('rating', selectedRating.value)
  }
}

// ─── Input handling ─────────────────────────────────────────────
const inputMode = ref<'text' | 'textarea'>('text')
const inputValue = ref('')
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement>()
function submitInput() {
  if (!inputValue.value.trim()) return
  emit('input', inputValue.value)
  inputValue.value = ''
}

// ─── Slot Fill handling ─────────────────────────────────────────
interface SlotValues {
  [key: string]: string | number
}
interface SlotErrors {
  [key: string]: string
}

const slotValues = reactive<SlotValues>({})
const slotErrors = reactive<SlotErrors>({})
const slotInputRefs = reactive<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>({})

function initializeSlotValues() {
  if (!props.slotFill?.slots) return
  for (const slot of props.slotFill.slots) {
    slotValues[slot.id] = slot.defaultValue ?? ''
    slotErrors[slot.id] = ''
  }
}

function validateSlot(slot: SlotDefinition): string {
  const value = slotValues[slot.id]
  const strValue = String(value ?? '')

  if (slot.required && !strValue.trim()) {
    return `请填写${slot.label}`
  }

  if (!slot.validation) return ''

  if (slot.type === 'number' && strValue) {
    const num = Number(value)
    if (isNaN(num)) return '请输入有效数字'
    if (slot.validation.min !== undefined && num < slot.validation.min) {
      return `最小值为 ${slot.validation.min}`
    }
    if (slot.validation.max !== undefined && num > slot.validation.max) {
      return `最大值为 ${slot.validation.max}`
    }
  }

  if ((slot.type === 'text' || slot.type === 'textarea') && strValue) {
    if (slot.validation.minLength !== undefined && strValue.length < slot.validation.minLength) {
      return `最少 ${slot.validation.minLength} 个字符`
    }
    if (slot.validation.maxLength !== undefined && strValue.length > slot.validation.maxLength) {
      return `最多 ${slot.validation.maxLength} 个字符`
    }
    if (slot.validation.pattern) {
      const regex = new RegExp(slot.validation.pattern)
      if (!regex.test(strValue)) {
        return slot.validation.patternMessage || '格式不正确'
      }
    }
  }

  return ''
}

function validateAllSlots(): boolean {
  if (!props.slotFill?.slots) return true

  let isValid = true
  for (const slot of props.slotFill.slots) {
    const error = validateSlot(slot)
    slotErrors[slot.id] = error
    if (error) isValid = false
  }
  return isValid
}

function submitSlotFill() {
  if (!validateAllSlots()) return
  if (!props.slotFill) return
  if (isSubmitting.value || props.loading) return
  isSubmitting.value = true
  emit('slot-fill', props.slotFill.id, { ...slotValues })
}

function cancelSlotFill() {
  if (!props.slotFill) return
  if (isSubmitting.value || props.loading) return
  isSubmitting.value = true
  emit('slot-cancel', props.slotFill.id)
}

function setSlotRef(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null, slotId: string) {
  slotInputRefs[slotId] = el
}

// Initialize slot values when component mounts or slotFill changes
onMounted(() => {
  initializeSlotValues()
})

// Re-initialize when slotFill changes
import { watch } from 'vue'
watch(() => props.slotFill?.id, () => {
  initializeSlotValues()
})

function focusSlot(slotId: string) {
  const el = slotInputRefs[slotId]
  if (el && el.focus) {
    el.focus()
  }
}

function handleSlotKeydown(e: KeyboardEvent, slot: SlotDefinition, slotIndex: number) {
  if (e.key === 'Enter' && slot.type !== 'textarea') {
    e.preventDefault()
    // Move to next slot or submit
    const slots = props.slotFill?.slots ?? []
    if (slotIndex < slots.length - 1) {
      focusSlot(slots[slotIndex + 1].id)
    } else {
      submitSlotFill()
    }
  }
}

// ─── Timeout countdown ──────────────────────────────────────────
const timeoutRemaining = ref(props.interaction?.timeoutSeconds ?? 0)
const timeoutPercent = ref(100)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  const total = props.interaction?.timeoutSeconds
  if (total && total > 0) {
    timer = setInterval(() => {
      timeoutRemaining.value--
      timeoutPercent.value = Math.max(0, (timeoutRemaining.value / total) * 100)
      if (timeoutRemaining.value <= 0) {
        clearInterval(timer!)
        emit('dismiss')
      }
    }, 1000)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// ─── Helpers ───────────────────────────────────────────────────
function riskLabel(r: string): string {
  const m: Record<string, string> = { low: '低风险', medium: '中风险', high: '高风险' }
  return m[r] || r
}

// ─── Icon components (inline SVGs) ─────────────────────────────
const ICONS: Record<string, ReturnType<typeof defineComponent>> = {
  list: defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('line', { x1: '8', y1: '6', x2: '21', y2: '6' }),
    h('line', { x1: '8', y1: '12', x2: '21', y2: '12' }),
    h('line', { x1: '8', y1: '18', x2: '21', y2: '18' }),
    h('line', { x1: '3', y1: '6', x2: '3.01', y2: '6' }),
    h('line', { x1: '3', y1: '12', x2: '3.01', y2: '12' }),
    h('line', { x1: '3', y1: '18', x2: '3.01', y2: '18' }),
  ]) }),
  chart: defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('line', { x1: '18', y1: '20', x2: '18', y2: '10' }),
    h('line', { x1: '12', y1: '20', x2: '12', y2: '4' }),
    h('line', { x1: '6', y1: '20', x2: '6', y2: '14' }),
  ]) }),
  export: defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
    h('polyline', { points: '7 10 12 15 17 10' }),
    h('line', { x1: '12', y1: '15', x2: '12', y2: '3' }),
  ]) }),
  filter: defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('polygon', { points: '22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' }),
  ]) }),
  compose: defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('path', { d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' }),
    h('path', { d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' }),
  ]) }),
  search: defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('circle', { cx: '11', cy: '11', r: '8' }),
    h('line', { x1: '21', y1: '21', x2: '16.65', y2: '16.65' }),
  ]) }),
  approve: defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('polyline', { points: '20 6 9 17 4 12' }),
  ]) }),
  reject: defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
    h('line', { x1: '6', y1: '6', x2: '18', y2: '18' }),
  ]) }),
  detail: defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('circle', { cx: '11', cy: '11', r: '8' }),
    h('line', { x1: '21', y1: '21', x2: '16.65', y2: '16.65' }),
    h('line', { x1: '11', y1: '8', x2: '11', y2: '14' }),
    h('line', { x1: '8', y1: '11', x2: '14', y2: '11' }),
  ]) }),
  compare: defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('line', { x1: '18', y1: '20', x2: '18', y2: '10' }),
    h('line', { x1: '12', y1: '20', x2: '12', y2: '4' }),
    h('line', { x1: '6', y1: '20', x2: '6', y2: '14' }),
    h('line', { x1: '2', y1: '20', x2: '22', y2: '20' }),
  ]) }),
}

function iconComponent(iconName?: string) {
  if (iconName && ICONS[iconName]) return ICONS[iconName]
  // Default icon
  return ICONS.list
}
</script>

<style scoped>
.hitl-card {
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  overflow: hidden;
  margin: 8px 0;
  font-size: 0.82rem;
}

/* ─── Color variants ─────────────────────────────────────────── */
.hitl-card--choice {
  border-color: var(--vp-c-brand-soft);
  background: linear-gradient(135deg, var(--vp-c-bg-soft) 0%, rgba(0, 120, 212, 0.04) 100%);
}

.hitl-card--confirm {
  border-color: rgba(248, 81, 73, 0.4);
  background: linear-gradient(135deg, var(--vp-c-bg-soft) 0%, rgba(248, 81, 73, 0.05) 100%);
}

.hitl-card--rating {
  border-color: rgba(183, 148, 255, 0.3);
  background: linear-gradient(135deg, var(--vp-c-bg-soft) 0%, rgba(183, 148, 255, 0.05) 100%);
}

.hitl-card--input {
  border-color: rgba(121, 192, 128, 0.3);
  background: linear-gradient(135deg, var(--vp-c-bg-soft) 0%, rgba(121, 192, 128, 0.05) 100%);
}

.hitl-card--slot-fill {
  border-color: rgba(121, 192, 255, 0.4);
  background: linear-gradient(135deg, var(--vp-c-bg-soft) 0%, rgba(121, 192, 255, 0.05) 100%);
}

/* ─── Header ────────────────────────────────────────────────── */
.hitl-card__header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.hitl-card__icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hitl-card--choice .hitl-card__icon {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.hitl-card--confirm .hitl-card__icon {
  background: rgba(248, 81, 73, 0.12);
  color: #f85149;
}

.hitl-card--rating .hitl-card__icon {
  background: rgba(183, 148, 255, 0.12);
  color: #b794f4;
}

.hitl-card--input .hitl-card__icon {
  background: rgba(121, 192, 128, 0.12);
  color: #79c061;
}

.hitl-card--slot-fill .hitl-card__icon {
  background: rgba(121, 192, 255, 0.12);
  color: #79c0ff;
}

.hitl-card__meta {
  flex: 1;
  min-width: 0;
}

.hitl-card__title {
  display: block;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.hitl-card__desc {
  display: block;
  margin-top: 2px;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  line-height: 1.4;
}

.hitl-card__required-badge {
  font-size: 0.6rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 10px;
  background: rgba(248, 81, 73, 0.15);
  color: #f85149;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
  align-self: center;
}

/* ─── Options (choice type) ─────────────────────────────────── */
.hitl-card__options {
  padding: 10px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hitl-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
  width: 100%;
}

.hitl-option:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  transform: translateX(2px);
}

.hitl-option--recommended {
  border-color: rgba(0, 120, 212, 0.4);
  background: rgba(0, 120, 212, 0.06);
}

.hitl-option--recommended:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.hitl-option__icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.hitl-option__content {
  flex: 1;
  min-width: 0;
}

.hitl-option__label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.hitl-option__desc {
  display: block;
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  margin-top: 1px;
}

.hitl-option__badge {
  font-size: 0.6rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 10px;
  background: var(--vp-c-brand-1);
  color: #fff;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
}

.hitl-option--navigate .hitl-option__icon { background: rgba(88,166,255,0.12); color: #58a6ff; }
.hitl-option--export .hitl-option__icon  { background: rgba(63,185,80,0.12);  color: #3fb950; }
.hitl-option--compose .hitl-option__icon { background: rgba(183,148,255,0.12); color: #b794f4; }
.hitl-option--confirm .hitl-option__icon { background: rgba(248,81,73,0.12);  color: #f85149; }
.hitl-option--cancel .hitl-option__icon  { background: var(--vp-c-bg-soft); color: var(--vp-c-text-3); }

/* ─── Confirm type ──────────────────────────────────────────── */
.hitl-card__confirm {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.confirm-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.confirm-risk {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  width: fit-content;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.confirm-risk--high {
  background: rgba(248,81,73,0.12);
  color: #f85149;
  border: 1px solid rgba(248,81,73,0.3);
}

.confirm-risk--medium {
  background: rgba(227,179,65,0.12);
  color: #e3b341;
  border: 1px solid rgba(227,179,65,0.3);
}

.confirm-risk--low {
  background: rgba(63,185,80,0.1);
  color: #3fb950;
  border: 1px solid rgba(63,185,80,0.3);
}

.confirm-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
}

.confirm-action {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.confirm-affected {
  color: var(--vp-c-text-3);
  font-size: 0.75rem;
}

.confirm-records {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.confirm-record-chip {
  font-size: 0.68rem;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

.confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.confirm-btn {
  padding: 7px 16px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  border: 1px solid transparent;
}

.confirm-btn:hover { transform: translateY(-1px); }
.confirm-btn:active { transform: translateY(0); }

.confirm-btn--cancel {
  background: var(--vp-c-bg);
  border-color: var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

.confirm-btn--cancel:hover {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-text-3);
}

.confirm-btn--primary,
.confirm-btn--high {
  background: #f85149;
  color: #fff;
}

.confirm-btn--high:hover { background: #da3633; }

.confirm-btn--medium {
  background: #e3b341;
  color: #fff;
}

.confirm-btn--medium:hover { background: #d29922; }

.confirm-btn--low {
  background: #3fb950;
  color: #fff;
}

.confirm-btn--low:hover { background: #2ea043; }

/* ─── Rating type ───────────────────────────────────────────── */
.hitl-card__rating {
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.rating-labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 220px;
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  font-weight: 600;
}

.rating-stars {
  display: flex;
  gap: 4px;
}

.rating-star {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--vp-c-divider);
  transition: color 0.15s, transform 0.15s;
}

.rating-star:hover,
.rating-star--active {
  color: #e3b341;
  transform: scale(1.15);
}

.rating-submit { margin-top: 4px; }

/* ─── Input type ───────────────────────────────────────────── */
.hitl-card__input-area {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hitl-input {
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: inherit;
  font-size: 0.82rem;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.hitl-input:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.12);
}

.hitl-input--textarea {
  resize: vertical;
  min-height: 72px;
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.input-hint {
  font-size: 0.68rem;
  color: var(--vp-c-text-3);
}

/* ─── Timeout ──────────────────────────────────────────────── */
.hitl-card__timeout {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: var(--vp-c-bg);
  border-top: 1px solid var(--vp-c-divider);
  position: relative;
  overflow: hidden;
}

.timeout-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: rgba(248, 81, 73, 0.15);
  transition: width 1s linear;
}

.timeout-label {
  font-size: 0.68rem;
  color: var(--vp-c-text-3);
  position: relative;
  z-index: 1;
}

/* ─── Slot Fill Form ───────────────────────────────────────────── */
.hitl-card__slot-fill {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slot-fill-message {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
  padding: 8px 10px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.slot-fill-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slot-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slot-field__label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.slot-field__name {
  color: var(--vp-c-text-1);
}

.slot-field__required {
  color: #f85149;
}

.slot-field__help {
  color: var(--vp-c-text-3);
  cursor: help;
  display: flex;
  align-items: center;
}

.slot-field__error {
  font-size: 0.68rem;
  color: #f85149;
}

.slot-field--error .hitl-input {
  border-color: #f85149;
}

.slot-field--error .hitl-input:focus {
  box-shadow: 0 0 0 2px rgba(248, 81, 73, 0.15);
}

.hitl-select {
  cursor: pointer;
  appearance: auto;
}

.slot-fill-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid var(--vp-c-divider);
}

/* ─── Shared confirm-btn base ──────────────────────────────── */
.confirm-btn--primary {
  background: var(--vp-c-brand-1);
  color: #fff;
  border: 1px solid transparent;
}

.confirm-btn--primary:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
}

.confirm-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}
</style>
