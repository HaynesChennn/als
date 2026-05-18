<script setup>
import { list as langList, setI18nLanguage, loadLocaleMessages, autoLang } from './config/lang.js'
import { useAppStore } from './stores/app'
import { motion } from 'motion-v'
import LoadingCard from '@/components/Loading.vue'
import InfoCard from '@/components/Information.vue'
import SpeedtestCard from '@/components/Speedtest.vue'
import UtilitiesCard from '@/components/Utilities.vue'
import TrafficCard from '@/components/TrafficDisplay.vue'

const currentLangCode = ref('en-US')
const appStore = useAppStore()

const handleLangChange = async () => {
  await loadLocaleMessages(currentLangCode.value)
  setI18nLanguage(currentLangCode.value)
}

onMounted(async () => {
  const d = await autoLang()
  if (d) currentLangCode.value = d
})
</script>

<template>
  <div class="min-h-screen bg-slate-50/70 font-sans">

    <!-- Header -->
    <motion.header
      :initial="{ opacity: 0, y: -16 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ type: 'spring', stiffness: 260, damping: 28 }"
      class="bg-white/90 border-b border-slate-200/80 sticky top-0 z-30 backdrop-blur-sm"
    >
      <div class="max-w-5xl mx-auto px-5 flex items-center justify-between" style="height:52px">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm shadow-blue-500/30">
            <i class="fa-solid fa-globe text-white" style="font-size:11px" />
          </div>
          <span class="font-bold text-slate-900 text-sm tracking-tight">Looking Glass</span>
        </div>

        <div class="flex items-center gap-3">
          <motion.div
            v-if="!appStore.connecting"
            :initial="{ opacity: 0, scale: 0.8 }"
            :animate="{ opacity: 1, scale: 1 }"
            :transition="{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }"
            class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100"
          >
            <span class="relative flex h-1.5 w-1.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span class="text-[10px] font-semibold text-emerald-600">Connected</span>
          </motion.div>

          <select
            v-model="currentLangCode"
            @change="handleLangChange"
            class="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/25 cursor-pointer transition-all hover:border-slate-300"
          >
            <option v-for="lang in langList" :key="lang.value" :value="lang.value">{{ lang.label }}</option>
          </select>
        </div>
      </div>
    </motion.header>

    <main class="max-w-5xl mx-auto px-5 py-5 space-y-4">
      <motion.div
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ type: 'spring', stiffness: 200, damping: 24 }"
      >
        <LoadingCard v-if="appStore.connecting" />
      </motion.div>

      <template v-if="!appStore.connecting">
        <motion.div
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ type: 'spring', stiffness: 200, damping: 24 }"
        ><InfoCard /></motion.div>

        <motion.div
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ type: 'spring', stiffness: 200, damping: 24, delay: 0.08 }"
        ><UtilitiesCard /></motion.div>

        <motion.div
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ type: 'spring', stiffness: 200, damping: 24, delay: 0.14 }"
        ><SpeedtestCard /></motion.div>

        <motion.div
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ type: 'spring', stiffness: 200, damping: 24, delay: 0.2 }"
        >
          <TrafficCard v-if="appStore.config?.feature_iface_traffic" />
        </motion.div>
      </template>
    </main>

    <!-- Footer -->
    <motion.footer
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :transition="{ delay: 0.4, duration: 0.6 }"
      class="border-t border-slate-200/80 bg-white/60 mt-12 backdrop-blur-sm"
    >
      <div class="max-w-5xl mx-auto px-5 h-12 flex items-center justify-between text-xs text-slate-400">
        <span>
          Powered by
          <a href="https://github.com/wikihost-opensource/als" target="_blank"
             class="text-blue-500 hover:text-blue-600 transition-colors font-medium ml-0.5">
            WIKIHOST ALS
          </a>
        </span>
        <span class="font-mono tabular-nums">{{ $t('memory_usage') }}: {{ appStore.memoryUsage }}</span>
      </div>
    </motion.footer>
  </div>
</template>
