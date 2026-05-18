<script setup>
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import { motion, AnimatePresence } from 'motion-v'

const appStore = useAppStore()
const { config } = storeToRefs(appStore)

const _v = (loader) => defineAsyncComponent({ loader, delay: 0 })

const tools = ref([
  { label: 'Ping',         icon: 'fa-solid fa-wifi',        color: 'text-blue-500',    enable: false, c: _v(() => import('./Utilities/Ping.vue')) },
  { label: 'IPerf3',       icon: 'fa-solid fa-chart-area',  color: 'text-violet-500',  enable: false, c: _v(() => import('./Utilities/IPerf3.vue')) },
  { label: 'Speedtest.net',icon: 'fa-solid fa-gauge-high',  color: 'text-orange-500',  enable: false, c: _v(() => import('./Utilities/SpeedtestNet.vue')) },
  { label: 'Shell',        icon: 'fa-solid fa-terminal',    color: 'text-emerald-500', enable: false, c: _v(() => import('./Utilities/Shell.vue')) },
])

onMounted(() => {
  for (const t of tools.value) {
    const k = 'feature_' + t.label.toLowerCase().replace('.', '_dot_')
    t.enable = config.value[k] ?? false
  }
})

const active = shallowRef(null)
const activeLabel = ref('')
const activeIcon = ref('')
const activeColor = ref('')
const open = ref(false)

const openTool = (t) => {
  active.value = toRaw(t.c)
  activeLabel.value = t.label
  activeIcon.value = t.icon
  activeColor.value = t.color
  open.value = true
}
const close = () => { open.value = false; setTimeout(() => (active.value = null), 350) }

const hasAny = computed(() => tools.value.some((t) => t.enable))
</script>

<template>
  <div v-if="hasAny" class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
    <div class="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
      <div class="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
        <i class="fa-solid fa-screwdriver-wrench text-blue-500 text-[10px]" />
      </div>
      <h2 class="text-sm font-semibold text-slate-700">{{ $t('network_tools') }}</h2>
    </div>
    <div class="p-4 flex flex-wrap gap-2">
      <template v-for="(t, i) in tools" :key="t.label">
        <motion.button
          v-if="t.enable"
          @click="openTool(t)"
          :initial="{ opacity: 0, scale: 0.9 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ type: 'spring', stiffness: 300, damping: 22, delay: i * 0.05 }"
          :whileHover="{ scale: 1.04, y: -1 }"
          :whileTap="{ scale: 0.96 }"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors select-none"
        >
          <i :class="[t.icon, 'text-xs', t.color]" />
          {{ t.label }}
        </motion.button>
      </template>
    </div>
  </div>

  <!-- Slide-over drawer with motion-v -->
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex justify-end"
      :style="{ pointerEvents: open ? 'auto' : 'none' }"
    >
      <!-- Backdrop -->
      <motion.div
        :animate="{ opacity: open ? 1 : 0 }"
        :transition="{ duration: 0.2 }"
        class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        @click="close"
      />

      <!-- Drawer panel -->
      <motion.div
        :initial="{ x: '100%' }"
        :animate="{ x: open ? '0%' : '100%' }"
        :transition="{ type: 'spring', stiffness: 280, damping: 30 }"
        class="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full"
      >
        <!-- Drawer header -->
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div class="flex items-center gap-2.5">
            <i :class="[activeIcon, 'text-sm', activeColor]" />
            <span class="font-semibold text-slate-800 text-sm">{{ activeLabel }}</span>
          </div>
          <motion.button
            @click="close"
            :whileHover="{ scale: 1.1 }"
            :whileTap="{ scale: 0.9 }"
            :transition="{ type: 'spring', stiffness: 400, damping: 20 }"
            class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <i class="fa-solid fa-xmark text-sm" />
          </motion.button>
        </div>
        <!-- Drawer body -->
        <div class="flex-1 overflow-auto p-5 min-h-0">
          <component v-if="active" :is="active" @closed="close" />
        </div>
      </motion.div>
    </div>
  </Teleport>
</template>
