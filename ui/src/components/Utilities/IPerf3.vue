<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { motion, AnimatePresence } from 'motion-v'
import 'xterm/css/xterm.css'
import { Terminal } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
import Copy from '../Copy.vue'

const appStore = useAppStore()
const working = ref(false)
const port = ref(null)
const termRef = ref()
const term = new Terminal({
  theme: { background: '#0f172a', foreground: '#e2e8f0', cursor: '#3b82f6' },
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: 13,
})
const fit = new FitAddon()

onMounted(() => {
  term.loadAddon(fit)
  term.open(toRaw(termRef.value))
  fit.fit()
})

let abort = markRaw(new AbortController())

const start = async () => {
  working.value = true
  term.clear()
  port.value = null
  abort = new AbortController()
  appStore.source.addEventListener('Iperf3', (e) => (port.value = e.data))
  appStore.source.addEventListener('Iperf3Stream', (e) => {
    fit.fit()
    e.data.split('\n').forEach((l) => term.writeln(l))
  })
  try { await appStore.requestMethod('iperf3/server', {}, abort.signal) } catch {}
  working.value = false
}

const stop = () => {
  appStore.source.removeEventListener('Iperf3', () => {})
  appStore.source.removeEventListener('Iperf3Stream', () => {})
  abort.abort()
  term.writeln('\x1b[33mServer stopped.\x1b[0m')
}

onUnmounted(stop)
</script>

<template>
  <div class="flex flex-col gap-3 h-full">
    <motion.button
      @click="!working ? start() : stop()"
      :whileHover="{ scale: 1.02 }"
      :whileTap="{ scale: 0.98 }"
      :transition="{ type: 'spring', stiffness: 400, damping: 20 }"
      :class="[
        'w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 select-none',
        working ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20'
      ]"
    >
      <i :class="['fa-solid text-xs', working ? 'fa-stop' : 'fa-play']" />
      {{ working ? 'Stop iPerf3 Server' : 'Start iPerf3 Server' }}
    </motion.button>

    <AnimatePresence>
      <motion.div
        v-if="working && port"
        key="port-info"
        :initial="{ opacity: 0, y: -8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -8 }"
        :transition="{ type: 'spring', stiffness: 280, damping: 24 }"
        class="rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs space-y-2"
      >
        <div class="font-medium text-blue-800 flex items-center gap-1.5">
          <i class="fa-solid fa-circle-info text-blue-500" />
          Connect with:
        </div>
        <div v-if="appStore.config.public_ipv4" class="flex items-center gap-2">
          <span class="text-slate-400 w-7">IPv4</span>
          <Copy :value="'iperf3 -c ' + appStore.config.public_ipv4 + ' -p ' + port" text>
            <code class="font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-800 hover:text-blue-600 hover:border-blue-200 transition-colors block">
              iperf3 -c {{ appStore.config.public_ipv4 }} -p {{ port }}
            </code>
          </Copy>
        </div>
        <div v-if="appStore.config.public_ipv6" class="flex items-center gap-2">
          <span class="text-slate-400 w-7">IPv6</span>
          <Copy :value="'iperf3 -c ' + appStore.config.public_ipv6 + ' -p ' + port" text>
            <code class="font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-800 hover:text-blue-600 hover:border-blue-200 transition-colors block">
              iperf3 -c {{ appStore.config.public_ipv6 }} -p {{ port }}
            </code>
          </Copy>
        </div>
      </motion.div>
    </AnimatePresence>

    <div ref="termRef" class="rounded-lg overflow-hidden flex-1" style="min-height:320px" />
  </div>
</template>
