<script setup lang="ts">
import { computed } from "vue"
import { useRoute } from "vue-router"
import { Toaster } from "@/components/ui/sonner"
import { useAuthStore } from "@/stores/auth"
import { useContaStore } from "@/stores/conta"
import { useConnectionStore } from "@/stores/connection"
import { WifiOff, AlertTriangle, RefreshCw } from "lucide-vue-next"

const route = useRoute()
const authStore = useAuthStore()
const contaStore = useContaStore()
const connection = useConnectionStore()

const mostrarLoading = computed(() => {
  return Boolean(route.meta.requiresAuth && authStore.session && contaStore.carregando)
})

async function handleRetryPulse() {
  await connection.checkPulse()
}
</script>

<template>
  <!-- Global Connection Banner -->
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform -translate-y-full opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform -translate-y-full opacity-0"
  >
    <div
      v-if="!connection.isOnline || !connection.isPulseHealthy"
      class="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-3 px-4 py-2 text-sm font-medium shadow-lg animate-pulse"
      :class="!connection.isOnline ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'"
    >
      <WifiOff v-if="!connection.isOnline" class="h-4 w-4" />
      <AlertTriangle v-else class="h-4 w-4" />

      <span>{{
        !connection.isOnline
          ? "Você está offline. Verifique sua rede."
          : "Conexão instável detectada."
      }}</span>

      <button
        @click="handleRetryPulse"
        class="ml-4 flex items-center gap-1 rounded-md bg-white/20 px-3 py-1 transition-colors hover:bg-white/30"
        :disabled="connection.isConnecting"
      >
        <RefreshCw class="h-3 w-3" :class="{ 'animate-spin': connection.isConnecting }" />
        Tentar Reconectar
      </button>
    </div>
  </Transition>

  <main v-if="mostrarLoading" class="min-h-screen bg-muted/20 px-6 py-10">
    <div class="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-2">
      <div
        class="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-transparent"
      ></div>
      <p class="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </main>
  <RouterView v-else />
  <Toaster position="top-center" :duration="3500" />
</template>
