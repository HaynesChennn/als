<script setup>
const props = defineProps({ value: String, text: Boolean })

const copied = ref(false)
const showTip = ref(false)

const copy = async (v) => {
  try { await navigator.clipboard.writeText(v) }
  catch {
    const el = document.createElement('textarea')
    document.body.appendChild(el)
    el.textContent = v
    el.select()
    document.execCommand('copy')
    el.remove()
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <button
    v-if="!props.text"
    @click="copy(props.value)"
    @mouseenter="showTip = true"
    @mouseleave="showTip = false"
    class="relative inline-flex items-center justify-center w-6 h-6 rounded transition-colors"
    :class="copied
      ? 'text-emerald-500 bg-emerald-50'
      : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'"
  >
    <i :class="['fa-solid text-xs', copied ? 'fa-check' : 'fa-copy']" />
    <span
      v-if="showTip"
      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-xs bg-slate-900 text-white rounded whitespace-nowrap z-10 pointer-events-none"
    >{{ copied ? 'Copied!' : 'Copy' }}</span>
  </button>

  <button v-else @click="copy(props.value)"
    class="text-left hover:text-blue-600 transition-colors w-full">
    <slot />
  </button>
</template>
