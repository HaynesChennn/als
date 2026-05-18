<script setup>
import { useAppStore } from '@/stores/app'
import { motion, AnimatePresence } from 'motion-v'
import AnimateNumber from '@/components/AnimateNumber.vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const appStore = useAppStore()
let workerInstance = null
let workerTimer = null
const working = ref(false)
const dlStarted = ref(false), ulStarted = ref(false)

const dlSpeed = ref(0)
const ulSpeed = ref(0)

const dlLabels = [], dlData = [], ulLabels = [], ulData = []

const makeChartData = (color) => ref({
  labels: [],
  datasets: [{
    data: [],
    borderColor: color,
    backgroundColor: color + '12',
    fill: true, tension: 0.45, borderWidth: 2, pointRadius: 0,
  }]
})
const dlChartData = makeChartData('#3b82f6')
const ulChartData = makeChartData('#10b981')

const makeOpts = (label) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 200, easing: 'easeOutQuart' },
  interaction: { intersect: false, mode: 'index' },
  scales: {
    x: { display: false },
    y: {
      grid: { color: 'rgba(148,163,184,0.1)' },
      border: { display: false },
      ticks: { color: '#94a3b8', font: { size: 10 }, callback: (v) => v + ' Mbps' },
      suggestedMin: 0,
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15,23,42,0.88)',
      bodyColor: '#f1f5f9',
      borderColor: 'rgba(148,163,184,0.15)',
      borderWidth: 1,
      padding: 8,
      callbacks: { label: (c) => ` ${label}  ${parseFloat(c.raw).toFixed(2)} Mbps` }
    }
  }
})

const ts = () => {
  const d = new Date()
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

const pushChart = (chartDataRef, labels, data, value) => {
  const MAX = 50
  labels.push(ts())
  data.push(parseFloat(value) || 0)
  if (labels.length > MAX) { labels.shift(); data.shift() }
  chartDataRef.value = {
    labels: [...labels],
    datasets: [{ ...chartDataRef.value.datasets[0], data: [...data] }],
  }
}

const toggle = (force = false) => {
  if (workerInstance) {
    workerInstance.postMessage('abort')
    clearInterval(workerTimer)
    workerInstance = null
    if (force) {
      dlSpeed.value = 0; ulSpeed.value = 0
      dlStarted.value = false; ulStarted.value = false
    }
    working.value = false
    return
  }
  working.value = true
  workerInstance = new Worker('./speedtest_worker.js')
  workerInstance.onmessage = (e) => {
    const d = JSON.parse(e.data)
    if (d.testState >= 4) return toggle(false)
    if (d.testState === 1 && d.dlStatus === 0) {
      dlSpeed.value = 0; ulSpeed.value = 0
    }
    if (d.ulStatus) {
      ulStarted.value = true
      ulSpeed.value = parseFloat(d.ulStatus) || 0
      pushChart(ulChartData, ulLabels, ulData, d.ulStatus)
      return
    }
    if (d.dlStatus) {
      dlStarted.value = true
      dlSpeed.value = parseFloat(d.dlStatus) || 0
      pushChart(dlChartData, dlLabels, dlData, d.dlStatus)
    }
  }
  workerInstance.postMessage('start ' + JSON.stringify({
    test_order: 'D_U',
    url_dl:   './session/' + appStore.sessionId + '/speedtest/download',
    url_ul:   './session/' + appStore.sessionId + '/speedtest/upload',
    url_ping: './session/' + appStore.sessionId + '/speedtest/upload',
  }))
  workerTimer = setInterval(() => workerInstance.postMessage('status'), 200)
}

onUnmounted(() => {
  if (workerInstance) { workerInstance.postMessage('abort'); clearInterval(workerTimer) }
})
</script>

<template>
  <!-- Speed panels with AnimatePresence for smooth enter/exit -->
  <AnimatePresence>
    <motion.div
      v-if="working || dlStarted || ulStarted"
      key="panels"
      :initial="{ opacity: 0, y: -12 }"
      :animate="{ opacity: 1, y: 0 }"
      :exit="{ opacity: 0, y: -8 }"
      :transition="{ type: 'spring', stiffness: 240, damping: 24 }"
      class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5"
    >
      <!-- Download -->
      <motion.div
        :initial="{ opacity: 0, x: -24 }"
        :animate="{ opacity: 1, x: 0 }"
        :transition="{ type: 'spring', stiffness: 200, damping: 22 }"
        class="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="relative flex h-2 w-2">
            <span v-if="working && dlStarted" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
            <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{{ $t('librespeed_download') }}</span>
        </div>
        <div class="flex items-baseline gap-2 mb-3">
          <AnimateNumber
            :value="dlSpeed"
            :format="(v) => v.toFixed(2)"
            class="font-mono text-[3rem] font-bold text-slate-900 tabular-nums leading-none tracking-tight"
          />
          <span class="text-sm text-slate-400 font-medium">Mbps</span>
        </div>
        <div style="height:100px">
          <Line :data="dlChartData" :options="makeOpts('Download')" />
        </div>
      </motion.div>

      <!-- Upload -->
      <motion.div
        :initial="{ opacity: 0, x: 24 }"
        :animate="{ opacity: 1, x: 0 }"
        :transition="{ type: 'spring', stiffness: 200, damping: 22, delay: 0.08 }"
        class="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="relative flex h-2 w-2">
            <span v-if="working && ulStarted" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{{ $t('librespeed_upload') }}</span>
        </div>
        <div class="flex items-baseline gap-2 mb-3">
          <AnimateNumber
            :value="ulSpeed"
            :format="(v) => v.toFixed(2)"
            class="font-mono text-[3rem] font-bold text-slate-900 tabular-nums leading-none tracking-tight"
          />
          <span class="text-sm text-slate-400 font-medium">Mbps</span>
        </div>
        <div style="height:100px">
          <Line :data="ulChartData" :options="makeOpts('Upload')" />
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>

  <!-- CTA button -->
  <div class="flex justify-center">
    <motion.button
      @click="toggle()"
      :whileHover="{ scale: 1.03 }"
      :whileTap="{ scale: 0.97 }"
      :transition="{ type: 'spring', stiffness: 400, damping: 20 }"
      :class="[
        'inline-flex items-center gap-2.5 px-7 py-2.5 rounded-xl text-sm font-semibold select-none',
        working
          ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
      ]"
    >
      <i :class="['fa-solid text-xs', working ? 'fa-stop' : 'fa-play']" />
      {{ working ? $t('librespeed_stop') : $t('librespeed_begin') }}
    </motion.button>
  </div>
</template>
