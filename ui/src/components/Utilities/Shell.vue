<script setup>
import 'xterm/css/xterm.css'
import { Terminal } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
import { onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'

const term = new Terminal({
  theme: { background: '#0f172a', foreground: '#e2e8f0', cursor: '#3b82f6' },
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: 13,
})
const termRef = ref()
const fit = new FitAddon()
const emit = defineEmits(['closed'])
let ws
let buf = []

const flush = () => {
  if (buf.length > 0) term.write(new Uint8Array(buf.shift()), flush)
}

let resizeTimer
const resize = () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    fit.fit()
    ws.send(new TextEncoder().encode('2' + term.rows + ';' + term.cols))
  }, 100)
}

onMounted(() => {
  term.loadAddon(fit)
  term.open(toRaw(termRef.value))
  fit.fit()
  const url = new URL(location.href)
  const proto = url.protocol === 'http:' ? 'ws:' : 'wss:'
  ws = new WebSocket(proto + '//' + url.host + url.pathname + 'session/' + useAppStore().sessionId + '/shell')
  ws.binaryType = 'arraybuffer'
  ws.addEventListener('message', (e) => { buf.push(e.data); flush() })
  ws.addEventListener('open', () => {
    window.addEventListener('resize', resize)
    resize()
    setTimeout(resize, 1000)
  })
  ws.addEventListener('close', () => emit('closed'))
  term.onData((d) => ws.send(new TextEncoder().encode('1' + d)))
})

onUnmounted(() => { if (ws) ws.close() })
</script>

<template>
  <div ref="termRef" class="terminal" style="flex-grow:1; height:100%; min-height:420px;" />
</template>

<style>
div:has(> div.terminal) { padding: 0 !important; }
</style>
