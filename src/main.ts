import './style.css'

import { createApp } from 'vue'
import App from './App.vue'
import router, { setupRouterGuards } from './router'
import { createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)

const pinia = createPinia()

app.use(router)
app.use(pinia)

setupRouterGuards(router, pinia)

const authStore = useAuthStore(pinia)
authStore.init()

app.mount('#app')
