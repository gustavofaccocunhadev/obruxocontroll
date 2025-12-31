import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useConnectionStore = defineStore('connection', () => {
  const isOnline = ref(navigator.onLine)
  const isPulseHealthy = ref(true)
  const isConnecting = ref(false)
  const lastPulse = ref<number>(Date.now())

  // Watch for browser online/offline events
  window.addEventListener('online', () => {
    isOnline.value = true
    checkPulse()
  })

  window.addEventListener('offline', () => {
    isOnline.value = false
    isPulseHealthy.value = false
  })

  /**
   * Check if Supabase is actually reachable
   * This detects "zombie" connections where OS says online but server is unreachable
   */
  async function checkPulse() {
    if (!isOnline.value) return false

    isConnecting.value = true
    try {
      // Simple low-cost query to verify connection (using perfis or any light table)
      // Limit 0 is enough to check connection without data transfer overhead
      const { error } = await supabase.from('perfis').select('id').limit(1)

      if (error) {
        // If it's a fetch error (network), mark as unhealthy
        if (
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('Abort') ||
          error.message.includes('Failed to fetch')
        ) {
          isPulseHealthy.value = false
        }
        console.warn('Conexão instável detectada pelo pulso:', error.message)
        return false
      }

      isPulseHealthy.value = true
      lastPulse.value = Date.now()
      return true
    } catch (e) {
      isPulseHealthy.value = false
      return false
    } finally {
      isConnecting.value = false
    }
  }

  // Proactive heart-beat (every 60 seconds)
  setInterval(() => {
    checkPulse()
  }, 60000)

  return {
    isOnline,
    isPulseHealthy,
    isConnecting,
    lastPulse,
    checkPulse,
  }
})
