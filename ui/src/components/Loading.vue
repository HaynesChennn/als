<script setup>
import { motion, useSpring } from 'motion-v'
const spring = useSpring(0, { stiffness: 60, damping: 20 })
const pct = ref(0)
spring.on('change', v => { pct.value = v })
onMounted(() => { spring.set(100) })
</script>

<template>
  <motion.div
    :initial="{ opacity: 0, y: 10 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ type: 'spring', stiffness: 240, damping: 26 }"
    class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6"
  >
    <div class="flex items-center gap-3 mb-4">
      <div class="relative w-5 h-5 flex-shrink-0">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-40" />
        <span class="relative inline-flex rounded-full h-5 w-5 bg-blue-500 items-center justify-center">
          <i class="fa-solid fa-circle-notch animate-spin text-white" style="font-size:9px" />
        </span>
      </div>
      <span class="text-sm text-slate-500 font-medium">Connecting to server…</span>
      <span class="ml-auto font-mono text-xs text-slate-400 tabular-nums">{{ Math.round(pct) }}%</span>
    </div>
    <div class="h-1 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        :animate="{ width: pct + '%' }"
        :transition="{ type: 'spring', stiffness: 60, damping: 20 }"
        class="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
      />
    </div>
  </motion.div>
</template>
