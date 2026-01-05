import { registerSW } from 'virtual:pwa-register'

registerSW({
  immediate: true,
  onRegisterError(error) {
    console.warn('Falha ao registrar o PWA.', error)
  },
})
