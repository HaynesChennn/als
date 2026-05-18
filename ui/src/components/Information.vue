<script setup>
import { useAppStore } from '@/stores/app'
import { motion } from 'motion-v'
import Copy from './Copy.vue'
import Markdown from 'vue3-markdown-it'

const appStore = useAppStore()
const configKeyMap = {
  location: 'server_location',
  my_ip: 'my_address',
  public_ipv4: 'ipv4_address',
  public_ipv6: 'ipv6_address',
}
const icons = {
  location: 'fa-location-dot',
  my_ip: 'fa-circle-user',
  public_ipv4: 'fa-server',
  public_ipv6: 'fa-server',
}
const accents = {
  location:    { text: 'text-violet-500', bg: 'bg-violet-50' },
  my_ip:       { text: 'text-amber-500',  bg: 'bg-amber-50' },
  public_ipv4: { text: 'text-blue-500',   bg: 'bg-blue-50' },
  public_ipv6: { text: 'text-emerald-500',bg: 'bg-emerald-50' },
}

const entries = computed(() =>
  Object.entries(configKeyMap)
    .filter(([k]) => appStore.config?.[k])
    .map(([k, v]) => ({ configKey: k, labelKey: v }))
)
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
    <div class="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
      <div class="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
        <i class="fa-solid fa-circle-info text-blue-500 text-[10px]" />
      </div>
      <h2 class="text-sm font-semibold text-slate-700">{{ $t('server_info') }}</h2>
    </div>

    <div class="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3" v-if="appStore.config">
      <motion.div
        v-for="({ configKey, labelKey }, i) in entries"
        :key="configKey"
        :initial="{ opacity: 0, y: 14, scale: 0.95 }"
        :animate="{ opacity: 1, y: 0, scale: 1 }"
        :transition="{ type: 'spring', stiffness: 260, damping: 22, delay: i * 0.06 }"
        :whileHover="{ y: -2, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.08)' }"
        :whileTap="{ scale: 0.97 }"
        class="group relative bg-slate-50 rounded-xl px-4 py-3.5 border border-slate-100 cursor-default"
        style="transition: border-color 0.15s"
      >
        <div class="flex items-center gap-2 mb-2.5">
          <div :class="['w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0', accents[configKey].bg]">
            <i :class="['fa-solid text-[9px]', icons[configKey], accents[configKey].text]" />
          </div>
          <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-widest leading-none">
            {{ $t(labelKey) }}
          </span>
        </div>
        <div class="flex items-start justify-between gap-2">
          <span class="font-mono text-sm font-semibold text-slate-900 break-all leading-snug">
            {{ appStore.config[configKey] }}
          </span>
          <Copy
            :value="appStore.config[configKey]"
            class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 mt-0.5"
          />
        </div>
      </motion.div>
    </div>
  </div>

  <motion.div
    v-if="appStore.config?.sponsor_message?.length > 0"
    :initial="{ opacity: 0, y: 16 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ type: 'spring', stiffness: 180, damping: 22, delay: 0.24 }"
    class="bg-white rounded-2xl border border-blue-100/80 shadow-sm overflow-hidden"
  >
    <div class="px-5 py-3.5 border-b border-blue-50 flex items-center gap-2">
      <div class="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
        <i class="fa-solid fa-star text-blue-500 text-[10px]" />
      </div>
      <h2 class="text-sm font-semibold text-slate-700">{{ $t('sponsor_message') }}</h2>
    </div>
    <div class="p-5 text-sm text-slate-600 leading-relaxed sponsor">
      <Markdown :source="appStore.config.sponsor_message" />
    </div>
  </motion.div>
</template>

<style>
.sponsor a { color: #3b82f6; text-decoration: none; }
.sponsor a:hover { text-decoration: underline; }
.sponsor p { margin: 0; }
</style>
