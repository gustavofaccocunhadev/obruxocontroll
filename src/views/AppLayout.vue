<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoute, RouterLink, RouterView } from "vue-router"
import {
  CreditCardIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  PaletteIcon,
  UsersIcon,
  XIcon,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth"
import { useContaStore } from "@/stores/conta"

const route = useRoute()
const authStore = useAuthStore()
const contaStore = useContaStore()
const menuAberto = ref(false)

const contaNome = computed(() => contaStore.contaAtual?.nome ?? "Conta")

const itens = [
  { label: "Dashboard", to: "/app", icon: LayoutDashboardIcon },
  { label: "Clientes", to: "/app/clientes", icon: UsersIcon },
  { label: "Artes", to: "/app/artes", icon: PaletteIcon },
  { label: "Financeiro", to: "/app/financeiro", icon: CreditCardIcon },
]

const isAtivo = (path: string) => route.path === path

const sair = async () => {
  await authStore.signOut()
}
</script>

<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_60%)]">
    <div class="flex min-h-screen">
      <aside
        class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card/95 shadow-sm transition-transform duration-200 md:static md:translate-x-0"
        :class="[menuAberto ? 'translate-x-0' : '-translate-x-full']"
      >
        <div class="flex items-center justify-between border-b px-4 py-4 md:justify-center">
          <span class="text-sm font-semibold tracking-wide">BruxoControl</span>
          <Button
            class="gap-2 md:hidden"
            size="sm"
            variant="ghost"
            @click="menuAberto = false"
          >
            <XIcon class="size-4" />
            Fechar
          </Button>
        </div>
        <nav class="flex-1 space-y-1 px-3 py-4">
          <RouterLink
            v-for="item in itens"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition"
            :class="[
              isAtivo(item.to)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            ]"
            @click="menuAberto = false"
          >
            <component :is="item.icon" class="size-4" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>
      </aside>

      <div
        v-if="menuAberto"
        class="fixed inset-0 z-30 bg-black/40 md:hidden"
        @click="menuAberto = false"
      ></div>

      <div class="flex min-h-screen flex-1 flex-col">
        <header class="sticky top-0 z-20 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-6">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <Button
                class="gap-2 md:hidden"
                size="sm"
                variant="ghost"
                @click="menuAberto = true"
              >
                <MenuIcon class="size-4" />
                Menu
              </Button>
              <div>
                <p class="text-xs uppercase tracking-wide text-muted-foreground">Conta atual</p>
                <p class="text-sm font-semibold">{{ contaNome }}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" class="gap-2" @click="sair">
              <LogOutIcon class="size-4" />
              <span>Sair</span>
            </Button>
          </div>
        </header>

        <main class="flex-1 px-4 py-6 md:px-6">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>
