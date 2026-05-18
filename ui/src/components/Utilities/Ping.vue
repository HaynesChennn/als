<script setup>
import { onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { motion, AnimatePresence } from 'motion-v'

const appStore = useAppStore()
const working = ref(false)
const records = ref([])
const host = ref('')
let abort = markRaw(new AbortController())

const onMsg = (e) => {
  const d = JSON.parse(e.data)
  records.value.push({
    seq: d.seq,
    host: d.is_timeout ? '—' : d.from,
    ttl: d.is_timeout ? '—' : d.ttl,
    latency: d.is_timeout ? null : d.latency / 1e6,
  })
}

onUnmounted(stop)
function stop() {
  appStore.source.removeEventListener('Ping', onMsg)
  abort.abort()
}
async function ping() {
  if (working.value) return
  abort = new AbortController()
  records.value = []
  working.value = true
  appStore.source.addEventListener('Ping', onMsg)
  try { await appStore.requestMethod('ping', { ip: host.value }, abort.signal) } catch {}
  stop()
  working.value = false
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex gap-2">
      <input
        :disabled="working" v-model="host"
        placeholder="IP address or hostname" @keyup.enter="ping"
        class="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:opacity-50 transition-all"
      />
      <motion.button
        @click="working ? stop() : ping()"
        :whileHover="{ scale: 1.03 }"
        :whileTap="{ scale: 0.97 }"
        :transition="{ type: 'spring', stiffness: 400, damping: 20 }"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 select-none',
          working ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/25'
        ]"
      >
        <i v-if="working" class="fa-solid fa-spinner animate-spin text-xs" />
        {{ working ? 'Stop' : 'Ping' }}
      </motion.button>
    </div>

    <!-- Results table with AnimatePresence rows -->
    <div v-if="records.length" class="rounded-lg border border-slate-200 overflow-hidden">
      <table class="w-full text-xs">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="text-left px-3 py-2 font-medium text-slate-500 w-10">#</th>
            <th class="text-left px-3 py-2 font-medium text-slate-500">Host</th>
            <th class="text-left px-3 py-2 font-medium text-slate-500 w-14">TTL</th>
            <th class="text-left px-3 py-2 font-medium text-slate-500 w-28">Latency</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            <motion.tr
              v-for="r in records"
              :key="r.seq"
              :initial="{ opacity: 0, x: -10 }"
              :animate="{ opacity: 1, x: 0 }"
              :exit="{ opacity: 0 }"
              :transition="{ type: 'spring', stiffness: 300, damping: 26 }"
              class="border-t border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td class="px-3 py-2 font-mono text-slate-400">{{ r.seq }}</td>
              <td class="px-3 py-2 font-mono text-slate-700">{{ r.host }}</td>
              <td class="px-3 py-2 font-mono text-slate-500">{{ r.ttl }}</td>
              <td class="px-3 py-2 font-mono font-semibold"
                  :class="r.latency === null ? 'text-slate-300'
                         : r.latency < 50   ? 'text-emerald-600'
                         : r.latency < 150  ? 'text-amber-500' : 'text-red-500'">
                {{ r.latency !== null ? r.latency.toFixed(2) + ' ms' : 'timeout' }}
              </td>
            </motion.tr>
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  </div>
</template>
