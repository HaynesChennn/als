<script setup>
import FileSpeedtest from '@/components/Speedtest/FileSpeedtest.vue'
import Librespeed from '@/components/Speedtest/Librespeed.vue'
import { useAppStore } from '@/stores/app'
const appStore = useAppStore()
</script>

<template>
  <div
    v-if="appStore.config?.feature_librespeed || appStore.config?.feature_filespeedtest"
    class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
  >
    <div class="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
      <i class="fa-solid fa-gauge-high text-blue-500 text-xs" />
      <h2 class="text-sm font-semibold text-slate-700">{{ $t('server_speedtest') }}</h2>
    </div>

    <div class="p-5 space-y-5">
      <Librespeed v-if="appStore.config.feature_librespeed" />
      <hr v-if="appStore.config.feature_filespeedtest && appStore.config.feature_librespeed"
          class="border-slate-100" />
      <FileSpeedtest v-if="appStore.config.feature_filespeedtest" />
    </div>
  </div>
</template>
