import './style.css'

import { createApp } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import router, { setupRouterGuards } from './router'
import { createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useConnectionStore } from '@/stores/connection'

const app = createApp(App)

const pinia = createPinia()
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: 'always',
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

const connectionStore = useConnectionStore(pinia)

const handleAppFocus = async () => {
  const precisaReautenticar = await authStore.revalidarSessao()
  if (precisaReautenticar && router.currentRoute.value.meta?.requiresAuth) {
    await router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  await queryClient.cancelQueries({
    predicate: (query) => query.state.fetchStatus === 'fetching',
  })
  await queryClient.refetchQueries({ type: 'active' }, { cancelRefetch: true })
  connectionStore.checkPulse()
}

window.addEventListener('focus', handleAppFocus, { passive: true })
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    queryClient.cancelQueries({
      predicate: (query) => query.state.fetchStatus === 'fetching',
    })
    return
  }

  if (document.visibilityState === 'visible') {
    handleAppFocus()
  }
})

app.mount('#app')
