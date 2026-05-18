<script setup>
/**
 * Slot-machine digit roller.
 * Uses :key trick to force element recreation, triggering CSS @keyframes.
 * This avoids Vue <Transition> scoped-CSS class-name mismatch which breaks
 * the animation and leaves digits stuck off-screen (invisible).
 */

const props = defineProps({
  value:     { type: Number, required: true },
  format:    { type: Function, default: (v) => v.toFixed(0) },
  stiffness: { type: Number, default: 100 },  // API compat — unused
  damping:   { type: Number, default: 20 },   // API compat — unused
  interval:  { type: Number, default: 500 },
})

const displayed = ref(props.value)
const direction = ref(0)   // 1 = increasing, -1 = decreasing, 0 = no change
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

// Gradient fades the top/bottom 3 px of each digit slot — creates the
// "rolling out of a slot" look without needing exit animations.
const SLOT_MASK = [
  'linear-gradient(to bottom,',
  '  transparent 0,',
  '  black 3px,',
  '  black calc(100% - 3px),',
  '  transparent 100%)',
].join(' ')
</script>

<template>
  <span class="inline-flex items-baseline">
    <span v-for="(char, i) in chars" :key="i" class="inline-block">

      <!-- Digit slot: clip-path clips the roll without shifting the text baseline.
           overflow:hidden would move the inline-block baseline to its bottom edge,
           misaligning digits with surrounding unit letters. -->
      <span
        v-if="isDigit(char)"
        class="an-slot relative inline-block"
        :style="{ maskImage: SLOT_MASK, WebkitMaskImage: SLOT_MASK }"
      >
        <!--
          :key changes when char changes → Vue destroys old element and mounts
          a new one → CSS @keyframe plays automatically on mount.
          direction is baked into the class, not the key, so the same digit
          at the same position doesn't re-animate unless the char changes.
        -->
        <span
          :key="`${i}-${char}`"
          :class="direction >= 0 ? 'an-roll-up' : 'an-roll-down'"
          class="block"
        >{{ char }}</span>
      </span>

      <!-- Non-digit (., space, unit letters) — static -->
      <template v-else>{{ char }}</template>

    </span>
  </span>
</template>

<style>
/* Global (not scoped) so @keyframes names are stable.
   Class names are prefixed with "an-" to avoid collisions. */

/* clip-path clips the rolling digit without changing the inline-block baseline.
   overflow:hidden would shift the baseline to the bottom edge, causing number/letter misalignment. */
.an-slot { clip-path: inset(0); }

@keyframes an-roll-up-in {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes an-roll-down-in {
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
}
.an-roll-up   { animation: an-roll-up-in   0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
.an-roll-down { animation: an-roll-down-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
</style>
