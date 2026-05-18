<script setup>
/**
 * MotionChart — SVG line chart inspired by motion.dev line graph example.
 * Spring-animated cursor tracks latest value, AnimateNumber shows current speed.
 * pathLength draws the line on first render.
 */
import { motion, useMotionValue, useSpring } from 'motion-v'
import AnimateNumber from '@/components/AnimateNumber.vue'
import { formatBytes } from '@/helper/unit'

const props = defineProps({
  rxData:  { type: Array, default: () => [] },
  txData:  { type: Array, default: () => [] },
  labels:  { type: Array, default: () => [] },
  rxColor: { type: String, default: '#3b82f6' },
  txColor: { type: String, default: '#10b981' },
})

// SVG layout constants
const W = 560, H = 160
const PAD = { t: 10, r: 18, b: 22, l: 50 }
const IW = W - PAD.l - PAD.r
const IH = H - PAD.t - PAD.b
const BOT = PAD.t + IH

// Y scale — shared between rx and tx
const yMax = computed(() => Math.max(...props.rxData, ...props.txData, 1))

const sy = (v) => PAD.t + IH - (Math.max(0, v) / yMax.value) * IH
const sx = (i, n) => PAD.l + (i / Math.max(n - 1, 1)) * IW

// Convert data array → SVG points [{x, y, v}]
const mkPts = (data) =>
  data.map((v, i) => ({ x: sx(i, data.length), y: sy(v), v }))

// Smooth cubic-bezier path string
const linePath = (pts) => {
  if (pts.length < 2) return ''
  return pts.reduce((d, p, i) => {
    if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`
    const prev = pts[i - 1]
    const cp = (p.x - prev.x) * 0.4
    return `${d} C${(prev.x + cp).toFixed(1)},${prev.y.toFixed(1)} ${(p.x - cp).toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }, '')
}

const areaPath = (line, pts) => {
  if (!line || !pts.length) return ''
  return `${line} L${pts.at(-1).x.toFixed(1)},${BOT} L${pts[0].x.toFixed(1)},${BOT} Z`
}

const rxPts = computed(() => mkPts(props.rxData))
const txPts = computed(() => mkPts(props.txData))
const rxLine = computed(() => linePath(rxPts.value))
const txLine = computed(() => linePath(txPts.value))
const rxArea = computed(() => areaPath(rxLine.value, rxPts.value))
const txArea = computed(() => areaPath(txLine.value, txPts.value))

// Y-axis ticks — 3 nice levels
const yTicks = computed(() => {
  const max = yMax.value
  if (!max) return []
  const raw = max / 3
  // Round to nearest power-of-2 * nice unit
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const nice = [1, 2, 5, 10].map(n => n * mag).find(n => n >= raw) || mag
  const ticks = []
  for (let v = nice; v < max * 1.05; v += nice) ticks.push(v)
  return ticks.slice(0, 4).map(v => ({ v, y: sy(v) }))
})

// X-axis labels — sample ~4 evenly
const xLabels = computed(() => {
  const n = props.labels.length
  if (!n) return []
  const step = Math.max(1, Math.floor(n / 4))
  const out = []
  for (let i = 0; i < n; i += step) out.push({ label: props.labels[i], x: sx(i, n) })
  return out
})

// ── Cursor (spring-animated to latest data point) ──────────────────────────
const cursorXMV  = useMotionValue(PAD.l + IW)
const rxCursorYMV = useMotionValue(BOT)
const txCursorYMV = useMotionValue(BOT)

const CURSOR_SPRING = { stiffness: 160, damping: 24 }
const cursorXS   = useSpring(cursorXMV,   CURSOR_SPRING)
const rxCursorYS = useSpring(rxCursorYMV, CURSOR_SPRING)
const txCursorYS = useSpring(txCursorYMV, CURSOR_SPRING)

// Latest values for AnimateNumber badge — plain Vue refs so prop updates are reactive
const rxLatest = ref(0)
const txLatest = ref(0)

watch([rxPts, txPts], ([rx, tx]) => {
  if (!rx.length) return
  const last = rx[rx.length - 1]
  cursorXMV.set(last.x)
  rxCursorYMV.set(last.y)
  rxLatest.value = last.v
  if (tx.length) {
    txCursorYMV.set(tx[tx.length - 1].y)
    txLatest.value = tx[tx.length - 1].v
  }
}, { immediate: true })

// Track cursor spring X for label position
const cursorLabelX = ref(PAD.l + IW)
cursorXS.on('change', v => { cursorLabelX.value = v })
</script>

<template>
  <div class="relative w-full" :style="{ height: H + 'px' }">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full h-full overflow-visible"
      preserveAspectRatio="none"
    >
      <defs>
        <!-- RX gradient -->
        <linearGradient :id="`rx-fill`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="rxColor" stop-opacity="0.15" />
          <stop offset="100%" :stop-color="rxColor" stop-opacity="0" />
        </linearGradient>
        <!-- TX gradient -->
        <linearGradient :id="`tx-fill`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="txColor" stop-opacity="0.12" />
          <stop offset="100%" :stop-color="txColor" stop-opacity="0" />
        </linearGradient>
        <!-- Clip to chart area -->
        <clipPath id="chart-clip">
          <rect :x="PAD.l" :y="PAD.t" :width="IW" :height="IH + 1" />
        </clipPath>
      </defs>

      <!-- Y-axis grid + labels -->
      <g v-for="tick in yTicks" :key="tick.v">
        <line
          :x1="PAD.l" :y1="tick.y.toFixed(1)"
          :x2="PAD.l + IW" :y2="tick.y.toFixed(1)"
          stroke="rgba(148,163,184,0.12)" stroke-width="1"
        />
        <text
          :x="PAD.l - 6" :y="tick.y + 4"
          text-anchor="end" class="fill-slate-400"
          style="font-size:9px;font-family:JetBrains Mono,monospace"
        >{{ formatBytes(tick.v, 0, true) }}</text>
      </g>

      <!-- X-axis labels -->
      <g v-for="lbl in xLabels" :key="lbl.label">
        <text
          :x="lbl.x" :y="H - 4"
          text-anchor="middle" class="fill-slate-400"
          style="font-size:9px;font-family:JetBrains Mono,monospace"
        >{{ lbl.label }}</text>
      </g>

      <g clip-path="url(#chart-clip)">
        <!-- TX area + line -->
        <path v-if="txArea" :d="txArea" :fill="`url(#tx-fill)`" />
        <motion.path
          v-if="txLine"
          :d="txLine"
          :fill="'none'"
          :stroke="txColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          :initial="{ pathLength: 0, opacity: 0 }"
          :animate="{ pathLength: 1, opacity: 1 }"
          :transition="{ pathLength: { type: 'spring', stiffness: 40, damping: 18, restDelta: 0.001 }, opacity: { duration: 0.3 } }"
        />

        <!-- RX area + line -->
        <path v-if="rxArea" :d="rxArea" :fill="`url(#rx-fill)`" />
        <motion.path
          v-if="rxLine"
          :d="rxLine"
          :fill="'none'"
          :stroke="rxColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          :initial="{ pathLength: 0, opacity: 0 }"
          :animate="{ pathLength: 1, opacity: 1 }"
          :transition="{ pathLength: { type: 'spring', stiffness: 40, damping: 18, restDelta: 0.001 }, opacity: { duration: 0.3 } }"
        />

        <!-- Cursor vertical line (spring-animated) -->
        <motion.line
          :x1="cursorXS.get()"
          :y1="PAD.t"
          :x2="cursorXS.get()"
          :y2="BOT"
          stroke="rgba(148,163,184,0.5)"
          stroke-width="1"
          stroke-dasharray="3 3"
          :style="{ x: cursorXS }"
        />

        <!-- TX cursor dot -->
        <motion.circle
          r="4"
          :fill="txColor"
          stroke="white"
          stroke-width="1.5"
          :style="{ x: cursorXS, y: txCursorYS }"
        />

        <!-- RX cursor dot -->
        <motion.circle
          r="4"
          :fill="rxColor"
          stroke="white"
          stroke-width="1.5"
          :style="{ x: cursorXS, y: rxCursorYS }"
        />
      </g>
    </svg>

    <!-- Cursor value badge — positioned via cursorLabelX -->
    <div
      class="absolute top-0 pointer-events-none flex flex-col items-center gap-0.5"
      :style="{ left: cursorLabelX + 'px', transform: 'translateX(-50%)', paddingTop: '2px' }"
    >
      <div class="flex items-center gap-1 bg-white/90 border border-slate-200 rounded-md px-1.5 py-0.5 shadow-sm">
        <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: rxColor }" />
        <AnimateNumber
          :value="rxLatest"
          :format="(v) => formatBytes(v, 1, true)"
          class="font-mono text-[10px] font-semibold text-slate-700 tabular-nums"
        />
      </div>
      <div class="flex items-center gap-1 bg-white/90 border border-slate-200 rounded-md px-1.5 py-0.5 shadow-sm">
        <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: txColor }" />
        <AnimateNumber
          :value="txLatest"
          :format="(v) => formatBytes(v, 1, true)"
          class="font-mono text-[10px] font-semibold text-slate-700 tabular-nums"
        />
      </div>
    </div>
  </div>
</template>
