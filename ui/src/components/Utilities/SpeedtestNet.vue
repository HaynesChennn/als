<script setup>
import { onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { motion, AnimatePresence, useSpring } from 'motion-v'
import { formatBytes } from '@/helper/unit'

let abort = markRaw(new AbortController())
const appStore = useAppStore()
const working = ref(false)
const serverId = ref()
const isQueue = ref(false)
const isSpeedtest = ref(false)
const action = ref('')
const queue = ref({ pos: 0, total: 0 })

// Spring-animated progress bars
const subSpring = useSpring(0, { stiffness: 180, damping: 22 })
const fullSpring = useSpring(0, { stiffness: 180, damping: 22 })
const subPct = ref(0), fullPct = ref(0)
subSpring.on('change', v => { subPct.value = Math.max(0, v) })
fullSpring.on('change', v => { fullPct.value = Math.max(0, v) })

const result = ref({ ping: '', dl: '', ul: '', url: '', server: { id: '', name: '', pos: '' } })

const onMsg = (e) => {
  const d = JSON.parse(e.data)
  switch (d.type) {
    case 'queue':
      isQueue.value = true
      queue.value = { pos: d.pos, total: d.totalPos }
      break
    case 'testStart':
      isQueue.value = false; isSpeedtest.value = true
      result.value.server = { id: d.server.id, name: d.server.name, pos: d.server.country + ' — ' + d.server.location }
      break
    case 'ping':
      action.value = 'Ping'
      result.value.ping = d.ping.latency
      break
    case 'download':
      action.value = 'Download'
      result.value.dl = formatBytes(d.download.bandwidth, 2, true)
      subSpring.set(Math.round(d.download.progress * 100))
      fullSpring.set(Math.round(d.download.progress * 50))
      break
    case 'upload':
      action.value = 'Upload'
      result.value.ul = formatBytes(d.upload.bandwidth, 2, true)
      subSpring.set(Math.round(d.upload.progress * 100))
      fullSpring.set(50 + Math.round(d.upload.progress * 50))
      break
    case 'result':
      result.value.url = d.result.url
      result.value.dl = formatBytes(d.download.bandwidth, 2, true)
      result.value.ul = formatBytes(d.upload.bandwidth, 2, true)
      break
  }
}

const stopTest = () => {
  abort.abort()
  appStore.source.removeEventListener('SpeedtestStream', onMsg)
  isSpeedtest.value = false
}

const run = async () => {
  if (working.value) return
  abort = new AbortController()
  working.value = true; isSpeedtest.value = true; action.value = ''
  subSpring.jump(0); fullSpring.jump(0)
  result.value = { ping: '', dl: '', ul: '', url: '', server: { id: '', name: '', pos: '' } }
  appStore.source.addEventListener('SpeedtestStream', onMsg)
  try { await appStore.requestMethod('speedtest_dot_net', { node_id: serverId.value }, abort.signal) } catch {}
  appStore.source.removeEventListener('SpeedtestStream', onMsg)
  working.value = false
}

onUnmounted(stopTest)
</script>

<template>
  <div class="space-y-3">
    <div class="flex gap-2">
      <input :disabled="working" v-model="serverId" placeholder="Server ID (optional)" @keyup.enter="run"
        class="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:opacity-50 transition-all" />
      <motion.button
        :disabled="working"
        @click="run"
        :whileHover="{ scale: 1.03 }"
        :whileTap="{ scale: 0.97 }"
        :transition="{ type: 'spring', stiffness: 400, damping: 20 }"
        class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm shadow-blue-600/25 select-none"
      >
        <i v-if="working" class="fa-solid fa-spinner animate-spin text-xs" />
        <i v-else class="fa-solid fa-play text-xs" />
        Run
      </motion.button>
    </div>

    <!-- Queue -->
    <AnimatePresence>
      <motion.div
        v-if="isQueue"
        key="queue"
        :initial="{ opacity: 0, y: -8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -8 }"
        :transition="{ type: 'spring', stiffness: 280, damping: 24 }"
        class="flex items-center gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800"
      >
        <i class="fa-solid fa-hourglass-half animate-pulse text-amber-500" />
        Queue position <strong>{{ queue.pos }}</strong> of {{ queue.total }}
      </motion.div>
    </AnimatePresence>

    <!-- Initialising -->
    <AnimatePresence>
      <motion.div
        v-if="!isQueue && isSpeedtest && !action"
        key="init"
        :initial="{ opacity: 0, y: -8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -8 }"
        :transition="{ type: 'spring', stiffness: 280, damping: 24 }"
        class="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-500"
      >
        <i class="fa-solid fa-circle-notch animate-spin text-blue-500 text-xs" />
        Initialising…
      </motion.div>
    </AnimatePresence>

    <!-- Progress bars -->
    <AnimatePresence>
      <motion.div
        v-if="working && action"
        key="progress"
        :initial="{ opacity: 0, y: -8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0 }"
        :transition="{ type: 'spring', stiffness: 280, damping: 24 }"
        class="space-y-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100"
      >
        <div>
          <div class="flex justify-between text-xs text-slate-500 mb-1.5">
            <span class="font-medium">{{ action }}</span>
            <span class="font-mono tabular-nums">{{ Math.round(subPct) }}%</span>
          </div>
          <div class="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              :animate="{ width: subPct + '%' }"
              :transition="{ type: 'spring', stiffness: 180, damping: 22 }"
              class="h-full bg-blue-500 rounded-full"
            />
          </div>
        </div>
        <div>
          <div class="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Total</span>
            <span class="font-mono tabular-nums">{{ Math.round(fullPct) }}%</span>
          </div>
          <div class="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              :animate="{ width: fullPct + '%' }"
              :transition="{ type: 'spring', stiffness: 180, damping: 22 }"
              class="h-full bg-blue-300 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>

    <!-- Result image -->
    <AnimatePresence>
      <motion.div
        v-if="result.url"
        key="img"
        :initial="{ opacity: 0, scale: 0.95 }"
        :animate="{ opacity: 1, scale: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ type: 'spring', stiffness: 240, damping: 22 }"
        class="flex justify-center p-3 rounded-lg bg-slate-50 border border-slate-200"
      >
        <a :href="result.url" target="_blank" class="hover:opacity-90 transition-opacity">
          <img :src="result.url + '.png'" class="max-w-xs rounded-lg shadow-sm" />
        </a>
      </motion.div>
    </AnimatePresence>

    <!-- Results table -->
    <AnimatePresence>
      <motion.div
        v-if="isSpeedtest && (result.server.id || result.ping)"
        key="results"
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0 }"
        :transition="{ type: 'spring', stiffness: 240, damping: 22 }"
        class="rounded-lg border border-slate-200 overflow-hidden"
      >
        <table class="w-full text-sm">
          <tbody>
            <template v-if="result.server.id">
              <tr class="border-b border-slate-100">
                <td class="px-4 py-2.5 text-xs text-slate-400 font-medium w-1/3">Server</td>
                <td class="px-4 py-2.5 font-mono text-xs text-slate-700">{{ result.server.name }}</td>
              </tr>
              <tr class="border-b border-slate-100">
                <td class="px-4 py-2.5 text-xs text-slate-400 font-medium">Location</td>
                <td class="px-4 py-2.5 font-mono text-xs text-slate-700">{{ result.server.pos }}</td>
              </tr>
            </template>
            <tr v-if="result.ping" class="border-b border-slate-100">
              <td class="px-4 py-2.5 text-xs text-slate-400 font-medium">Ping</td>
              <td class="px-4 py-2.5 font-mono text-sm font-bold text-amber-600">{{ result.ping }} ms</td>
            </tr>
            <tr v-if="result.dl" class="border-b border-slate-100">
              <td class="px-4 py-2.5 text-xs text-slate-400 font-medium">Download</td>
              <td class="px-4 py-2.5 font-mono text-sm font-bold text-blue-600">{{ result.dl }}</td>
            </tr>
            <tr v-if="result.ul">
              <td class="px-4 py-2.5 text-xs text-slate-400 font-medium">Upload</td>
              <td class="px-4 py-2.5 font-mono text-sm font-bold text-emerald-600">{{ result.ul }}</td>
            </tr>
          </tbody>
        </table>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
