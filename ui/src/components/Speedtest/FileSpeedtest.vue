<script setup>
import { useAppStore } from '@/stores/app'
const appStore = useAppStore()
const url = ref(new URL(location.href))
</script>

<template>
  <template
    v-if="(appStore.config.public_ipv4 == '' && appStore.config.public_ipv6 == '') ||
          (appStore.config.filetest_follow_domain && appStore.config.filetest_follow_domain != '')"
  >
    <div>
      <div class="flex items-center gap-1.5 mb-3">
        <i class="fa-solid fa-download text-slate-400 text-xs" />
        <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ $t('file_speedtest') }}</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <a
          v-for="s in appStore.config.speedtest_files" :key="s"
          :href="'./session/' + appStore.sessionId + '/speedtest/file//' + s + '.test'"
          target="blank"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium font-mono hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
        >
          <i class="fa-solid fa-arrow-down text-xs opacity-60" />{{ s }}
        </a>
      </div>
    </div>
  </template>

  <template v-else>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div v-if="appStore.config.public_ipv4">
        <div class="flex items-center gap-1.5 mb-3">
          <span class="inline-flex items-center justify-center w-4 h-4 rounded text-xs font-bold bg-blue-100 text-blue-600">4</span>
          <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ $t('file_ipv4_speedtest') }}</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <a
            v-for="s in appStore.config.speedtest_files" :key="s"
            :href="url.protocol + '//' + appStore.config.public_ipv4 + ':' + url.port + '/session/' + appStore.sessionId + '/speedtest/file/' + s + '.test'"
            target="blank"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium font-mono hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
          >
            <i class="fa-solid fa-arrow-down text-xs opacity-60" />{{ s }}
          </a>
        </div>
      </div>

      <div v-if="appStore.config.public_ipv6">
        <div class="flex items-center gap-1.5 mb-3">
          <span class="inline-flex items-center justify-center w-4 h-4 rounded text-xs font-bold bg-violet-100 text-violet-600">6</span>
          <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ $t('file_ipv6_speedtest') }}</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <a
            v-for="s in appStore.config.speedtest_files" :key="s"
            :href="url.protocol + '//[' + appStore.config.public_ipv6 + ']:' + url.port + '/session/' + appStore.sessionId + '/speedtest/file/' + s + '.test'"
            target="blank"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium font-mono hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-colors"
          >
            <i class="fa-solid fa-arrow-down text-xs opacity-60" />{{ s }}
          </a>
        </div>
      </div>
    </div>
  </template>
</template>
