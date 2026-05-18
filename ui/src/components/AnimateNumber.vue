<script setup>
/**
 * Slot-machine digit roller inspired by MotionNumber (motion-number.barvian.me).
 * Each digit independently springs up/down; a gradient mask fades the entry/exit
 * edges so digits appear to roll out of a slot rather than hard-clip.
 * Updates are throttled so rapid data bursts don't cause visual flashing.
 */
import { motion, AnimatePresence } from 'motion-v'

const props = defineProps({
  value:     { type: Number, required: true },
  format:    { type: Function, default: (v) => v.toFixed(0) },
  stiffness: { type: Number, default: 100 },
  damping:   { type: Number, default: 20 },
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

// Gradient that fades the top/bottom edges of each digit slot.
// Using a fixed 3 px fade zone works across all text sizes (10 px – 48 px).
const SLOT_MASK = [
  'linear-gradient(to bottom,',
  '  transparent 0,',
  '  black 3px,',
  '  black calc(100% - 3px),',
  '  transparent 100%',
  ')',
].join(' ')
</script>

<template>
  <!--
    items-baseline keeps digit slots and unit letters on the same text baseline.
    tabular-nums is inherited from the parent so digit widths stay stable.
  -->
  <span class="inline-flex items-baseline">
    <span v-for="(char, i) in chars" :key="i" class="inline-block">

      <!-- ── Digit slot ── -->
      <span
        v-if="isDigit(char)"
        class="relative inline-block overflow-hidden"
        :style="{
          maskImage: SLOT_MASK,
          WebkitMaskImage: SLOT_MASK,
        }"
      >
        <AnimatePresence mode="popLayout" :initial="false">
          <motion.span
            :key="char"
            :initial="{ y: direction >= 0 ? '100%' : '-100%', opacity: 0 }"
            :animate="{ y: '0%', opacity: 1 }"
            :exit="{ y: direction >= 0 ? '-100%' : '100%', opacity: 0 }"
            :transition="{
              y:       { type: 'spring', stiffness: stiffness, damping: damping },
              opacity: { duration: 0.15, ease: 'easeOut' },
            }"
            class="block"
          >{{ char }}</motion.span>
        </AnimatePresence>
      </span>

      <!-- ── Non-digit (., space, unit letters) — static ── -->
      <template v-else>{{ char }}</template>

    </span>
  </span>
</template>
