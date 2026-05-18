<script setup>
/**
 * Slot-machine digit roller inspired by MotionNumber (motion-number.barvian.me).
 * Uses Vue's native <Transition> for enter/leave (more reliable than motion-v
 * AnimatePresence in Vue context). Gradient mask fades the slot edges.
 */

const props = defineProps({
  value:     { type: Number, required: true },
  format:    { type: Function, default: (v) => v.toFixed(0) },
  stiffness: { type: Number, default: 100 },  // kept for API compatibility
  damping:   { type: Number, default: 20 },   // kept for API compatibility
  interval:  { type: Number, default: 1000 },
})

const displayed = ref(props.value)
const direction = ref(0)  // 1 = increasing, -1 = decreasing
let timer = null
let lastUpdate = 0

const apply = (v) => {
  direction.value = v > displayed.value ? 1 : v < displayed.value ? -1 : 0
  displayed.value = v
  lastUpdate = Date.now()
}

watch(() => props.value, (v) => {
  clearTimeout(timer)
  const wait = props.interval - (Date.now() - lastUpdate)
  if (wait <= 0) apply(v)
  else timer = setTimeout(() => apply(v), wait)
})

onUnmounted(() => clearTimeout(timer))

const chars = computed(() => props.format(Math.max(0, displayed.value)).split(''))
const isDigit = (c) => c >= '0' && c <= '9'

const SLOT_MASK = [
  'linear-gradient(to bottom,',
  '  transparent 0,',
  '  black 3px,',
  '  black calc(100% - 3px),',
  '  transparent 100%',
  ')',
].join(' ')

// Transition name drives CSS class selection — changes before re-render
const transitionName = computed(() => direction.value >= 0 ? 'digit-up' : 'digit-down')
</script>

<template>
  <span class="inline-flex items-baseline">
    <span v-for="(char, i) in chars" :key="i" class="inline-block">

      <!-- Digit slot: Vue Transition handles enter/leave, CSS drives the roll -->
      <span
        v-if="isDigit(char)"
        class="digit-slot relative inline-block overflow-hidden"
        :style="{ maskImage: SLOT_MASK, WebkitMaskImage: SLOT_MASK }"
      >
        <Transition :name="transitionName">
          <span :key="`${i}-${char}`" class="block">{{ char }}</span>
        </Transition>
      </span>

      <!-- Non-digit (., space, unit letters) — static -->
      <template v-else>{{ char }}</template>

    </span>
  </span>
</template>

<style scoped>
/* Increasing: old digit exits upward, new digit enters from below */
.digit-up-enter-active { transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.15s ease-out; }
.digit-up-leave-active { transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.15s ease-in 0.3s; position: absolute; top: 0; left: 0; right: 0; }
.digit-up-enter-from   { transform: translateY(100%); opacity: 0; }
.digit-up-leave-to     { transform: translateY(-100%); opacity: 0; }

/* Decreasing: old digit exits downward, new digit enters from above */
.digit-down-enter-active { transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.15s ease-out; }
.digit-down-leave-active { transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.15s ease-in 0.3s; position: absolute; top: 0; left: 0; right: 0; }
.digit-down-enter-from   { transform: translateY(-100%); opacity: 0; }
.digit-down-leave-to     { transform: translateY(100%); opacity: 0; }
</style>
