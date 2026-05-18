import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import fs from 'node:fs'
import path from 'node:path'

export default defineConfig(({ command }) => {
  return {
    base: './',
    server: {
      proxy: {
        '/session': { target: 'http://127.0.0.1:8080', ws: true },
        '/method': { target: 'http://127.0.0.1:8080', ws: true }
      }
    },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
    },
    plugins: [
      vue(),
      AutoImport({ imports: ['vue'] }),
      {
        name: 'build-script',
        buildStart() {
          if (command === 'build') {
            const dirPath = path.join(__dirname, 'public')
            const fileBuildRequired = {
              'speedtest_worker.js': '../speedtest/speedtest_worker.js'
            }
            for (const dest in fileBuildRequired) {
              const source = fileBuildRequired[dest]
              const srcPath = dirPath + '/' + source
              const dstPath = dirPath + '/' + dest
              if (fs.existsSync(srcPath)) {
                if (fs.existsSync(dstPath)) fs.unlinkSync(dstPath)
                fs.copyFileSync(srcPath, dstPath)
              }
            }
          }
        }
      },
      Components()
    ]
  }
})
