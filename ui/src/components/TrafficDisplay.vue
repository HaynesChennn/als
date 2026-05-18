<script setup>
import { useAppStore } from '@/stores/app'
import { formatBytes } from '@/helper/unit'
import { motion } from 'motion-v'
import AnimateNumber from '@/components/AnimateNumber.vue'
import MotionChart from '@/components/MotionChart.vue'

const appStore = useAppStore()
const interfaces = ref({})

const createIface = (name) => {
  interfaces.value[name] = {
    receive: 0, send: 0, lastReceive: 0, lastSend: 0,
    rxRate: 0, txRate: 0,
    labels: [], rxData: [], txData: [],
  }
}

const ts = (d) =>
  d.getHours().toString().padStart(2, '0') + ':' +
  d.getMinutes().toString().padStart(2, '0') + ':' +
  d.getSeconds().toString().padStart(2, '0')

const pushPoint = (name, rx, tx, label) => {
  const iface = interfaces.value[name]
  iface.rxRate = rx
  iface.txRate = tx

  const MAX = 30
  const newLabels = [...iface.labels, label]
  const newRx = [...iface.rxData, rx]
  const newTx = [...iface.txData, tx]
  if (newLabels.length > MAX) { newLabels.shift(); newRx.shift(); newTx.shift() }
  iface.labels = newLabels
  iface.rxData = newRx
  iface.txData = newTx
}

const handleCache = (e) => {
  const data = JSON.parse(e.data)
  for (const idx in data) {
    const d = data[idx]; const name = d.InterfaceName
    if (!interfaces.value[name]) createIface(name)
    const iface = interfaces.value[name]
    // Reset baseline on every cache event so SSE reconnects don't produce stale deltas
    iface.lastReceive = 0; iface.lastSend = 0
    for (const pt of d.Caches) {
      iface.receive = +pt[1]; iface.send = +pt[2]
      if (!iface.lastReceive) iface.lastReceive = iface.receive
      if (!iface.lastSend) iface.lastSend = iface.send
      const rx = Math.max(0, iface.receive - iface.lastReceive)
      const tx = Math.max(0, iface.send - iface.lastSend)
      iface.lastReceive = iface.receive; iface.lastSend = iface.send
      pushPoint(name, rx, tx, ts(new Date(+pt[0] * 1000)))
    }
  }
}

const handleTraffic = (e) => {
  const [name, time, rxRaw, txRaw] = e.data.split(',')
  if (!interfaces.value[name]) createIface(name)
  const iface = interfaces.value[name]
  iface.receive = +rxRaw; iface.send = +txRaw
  // Reset baseline if counter wrapped / server restarted
  if (iface.receive < iface.lastReceive) iface.lastReceive = iface.receive
  if (iface.send < iface.lastSend) iface.lastSend = iface.send
  if (!iface.lastReceive) iface.lastReceive = iface.receive
  if (!iface.lastSend) iface.lastSend = iface.send
  const rx = iface.receive - iface.lastReceive
  const tx = iface.send - iface.lastSend
  iface.lastReceive = iface.receive; iface.lastSend = iface.send
  pushPoint(name, rx, tx, ts(new Date(+time * 1000)))
}

// watchEffect re-registers listeners whenever appStore.source changes (SSE reconnect).
// onMounted/onUnmounted would leave listeners on the old dead EventSource after reconnect.
watchEffect((onCleanup) => {
  const src = appStore.source
  if (!src) return
  src.addEventListener('InterfaceCache', handleCache)
  src.addEventListener('InterfaceTraffic', handleTraffic)
  onCleanup(() => {
    src.removeEventListener('InterfaceCache', handleCache)
    src.removeEventListener('InterfaceTraffic', handleTraffic)
  })
})
</script>

<template>
  <motion.div
    :initial="{ opacity: 0, y: 16 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ type: 'spring', stiffness: 200, damping: 26 }"
    class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
  >
    <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
          <i class="fa-solid fa-wave-square text-blue-500 text-[10px]" />
        </div>
        <h2 class="text-sm font-semibold text-slate-700">{{ $t('server_bandwidth_graph') }}</h2>
      </div>
      <span class="text-[10px] font-medium text-slate-400 tabular-nums">
        {{ Object.keys(interfaces).length }} interface{{ Object.keys(interfaces).length !== 1 ? 's' : '' }}
      </span>
    </div>

    <div class="p-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
      <motion.div
        v-for="(iface, name) in interfaces"
        :key="name"
        :initial="{ opacity: 0, scale: 0.96, y: 8 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :transition="{ type: 'spring', stiffness: 200, damping: 24, delay: 0.08 }"
        class="rounded-xl border border-slate-200/80 overflow-hidden bg-white"
      >
        <!-- Interface header -->
        <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="relative flex h-1.5 w-1.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <i class="fa-solid fa-ethernet text-slate-300 text-[10px]" />
            <span class="font-mono text-xs font-semibold text-slate-600 tracking-tight">{{ name }}</span>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold border border-emerald-100">UP</span>
        </div>

        <!-- Live stats — AnimateNumber spring counter -->
        <div class="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
          <div class="px-4 py-3.5">
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="w-5 h-0.5 rounded bg-blue-400 inline-block" />
              <span class="text-[10px] font-semibold text-blue-500 uppercase tracking-widest">↓ RX</span>
            </div>
            <AnimateNumber
              :value="iface.rxRate"
              :format="(v) => formatBytes(v, 2, true)"
              class="font-mono text-xl font-bold text-slate-800 tabular-nums leading-none"
            />
            <div class="font-mono text-[10px] text-slate-400 mt-1.5 leading-none">
              {{ formatBytes(iface.receive) }} total
            </div>
          </div>
          <div class="px-4 py-3.5">
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="w-5 h-0.5 rounded bg-emerald-400 inline-block" />
              <span class="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">↑ TX</span>
            </div>
            <AnimateNumber
              :value="iface.txRate"
              :format="(v) => formatBytes(v, 2, true)"
              class="font-mono text-xl font-bold text-slate-800 tabular-nums leading-none"
            />
            <div class="font-mono text-[10px] text-slate-400 mt-1.5 leading-none">
              {{ formatBytes(iface.send) }} total
            </div>
          </div>
        </div>

        <!-- Chart -->
        <div class="px-2 pt-1 pb-2">
          <MotionChart :rxData="iface.rxData" :txData="iface.txData" :labels="iface.labels" />
        </div>
      </motion.div>
    </div>
  </motion.div>
</template>
