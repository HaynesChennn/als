import './assets/base.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from 'motion-v'
import App from './App.vue'
import { setupI18n } from './config/lang.js'

const app = createApp(App)
app.use(setupI18n())
app.use(createPinia())
app.use(MotionPlugin)
app.mount('#app')
