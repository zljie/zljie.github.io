// Config
import { defaultConfig, type ChatConfig } from './config'
export { defaultConfig }
export type { ChatConfig }

// Components
export { default as Chat } from './components/Chat.vue'
export { default as FloatChat } from './components/FloatChat.vue'
export { default as MarkdownBubble } from './components/MarkdownBubble.vue'
export { default as AgentExecutionCard } from './components/AgentExecutionCard.vue'
export { default as HumanInTheLoopCard } from './components/HumanInTheLoopCard.vue'

// Composables
export { useChat } from './composables/useChat'
export { chatLogger } from './composables/chatLogger'

// Types
export type {
  ChatMessage,
  ToolCall,
  StepInfo,
  StepStatus,
  StepType,
  InteractionChoice,
  InteractionOption,
  ConfirmRequest,
  SlotFillRequest,
  SlotDefinition,
  HitlTask,
  HitlTaskStatus,
  HitlTaskType,
  HitlAction,
  HitlRuntimeState,
} from './composables/useChat'
