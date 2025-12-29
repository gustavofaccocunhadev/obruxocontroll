<script setup lang="ts">
import { computed } from "vue"
import { useRoute } from "vue-router"
import { Toaster } from "@/components/ui/sonner"
import { useAuthStore } from "@/stores/auth"
import { useContaStore } from "@/stores/conta"

const route = useRoute()
const authStore = useAuthStore()
const contaStore = useContaStore()

const mostrarLoading = computed(() => {
  return Boolean(route.meta.requiresAuth && authStore.session && contaStore.carregando)
})
</script>

<template>
  <main v-if="mostrarLoading" class="min-h-screen bg-muted/20 px-6 py-10">
    <div class="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-2">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-transparent"></div>
      <p class="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </main>
  <RouterView v-else />
  <Toaster />
</template>
