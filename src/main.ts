import './style.css'

import { createApp } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import router, { setupRouterGuards } from './router'
import { createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)

const pinia = createPinia()
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

app.use(router)
app.use(pinia)
app.use(VueQueryPlugin, { queryClient })

setupRouterGuards(router, pinia)

const authStore = useAuthStore(pinia)
authStore.init()

app.mount('#app')
