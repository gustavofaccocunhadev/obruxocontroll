<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoute, RouterLink, RouterView } from "vue-router"
import { useQuery } from "@tanstack/vue-query"
import {
  CreditCardIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  PaletteIcon,
  TagIcon,
  UsersIcon,
  XIcon,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth"
import { gerarUrlAvatarPerfil, obterPerfil } from "@/repositories/perfis"

const route = useRoute()
const authStore = useAuthStore()
const menuAberto = ref(false)

const idUsuario = computed(() => authStore.user?.id ?? "")

const perfilQuery = useQuery({
  queryKey: computed(() => ["perfil", idUsuario.value]),
  queryFn: async ({ signal }) => {
    if (!idUsuario.value) return null
    const { data, error } = await obterPerfil(idUsuario.value, signal)
    if (error) {
      throw new Error(error)
    }
    return data
  },
  enabled: computed(() => Boolean(idUsuario.value)),
})

const perfil = computed(() => perfilQuery.data.value)
const nomeUsuario = computed(() => {
  return (
    perfil.value?.nome ||
    (authStore.user?.user_metadata?.nome as string | undefined) ||
    "Usuario"
  )
})
const emailUsuario = computed(() => authStore.user?.email ?? "")
const avatarPath = computed(() => perfil.value?.foto_path ?? "")

const avatarQuery = useQuery({
  queryKey: computed(() => ["perfil-avatar", avatarPath.value]),
  queryFn: async () => {
    if (!avatarPath.value) return null
    const { data, error } = await gerarUrlAvatarPerfil(avatarPath.value)
    if (error) {
      throw new Error(error)
    }
    return data
  },
  enabled: computed(() => Boolean(avatarPath.value)),
})

const avatarUrl = computed(() => avatarQuery.data.value ?? "")
const iniciaisUsuario = computed(() => {
  const letra = nomeUsuario.value.trim().charAt(0) || "?"
  return letra.toUpperCase()
})

const itens = [
  { label: "Dashboard", to: "/app", icon: LayoutDashboardIcon },
  { label: "Clientes", to: "/app/clientes", icon: UsersIcon },
  { label: "Categorias", to: "/app/categorias", icon: TagIcon },
  { label: "Artes", to: "/app/artes", icon: PaletteIcon },
  { label: "Financeiro", to: "/app/financeiro", icon: CreditCardIcon },
]

const isAtivo = (path: string) => {
  if (path === "/app") {
    return route.path === "/app"
  }
  return route.path === path || route.path.startsWith(`${path}/`)
}

const sair = async () => {
  await authStore.signOut()
}
</script>

<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_60%)]">
    <div class="flex min-h-screen">
      <aside
        class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-primary/40 bg-gradient-to-b from-primary via-primary to-primary/90 text-primary-foreground shadow-sm transition-transform duration-200 md:static md:translate-x-0"
        :class="[menuAberto ? 'translate-x-0' : '-translate-x-full']"
      >
        <div class="flex items-center justify-between border-b border-primary/40 px-4 py-4 md:justify-center">
          <span class="text-sm font-semibold tracking-wide text-primary-foreground">
            BruxoControll
          </span>
          <Button
            class="gap-2 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground md:hidden"
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
            class="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
            :class="[
              isAtivo(item.to)
                ? 'bg-primary-foreground/15 text-primary-foreground shadow-sm'
                : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground',
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
              <RouterLink to="/app/perfil" class="group flex items-center gap-3">
                <div
                  class="flex size-10 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-muted/60 text-sm font-semibold text-foreground"
                >
                  <img
                    v-if="avatarUrl"
                    :src="avatarUrl"
                    alt="Avatar do cliente"
                    class="h-full w-full object-cover"
                  />
                  <span v-else>{{ iniciaisUsuario }}</span>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p>
                  <p class="text-sm font-semibold">{{ nomeUsuario }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ emailUsuario || "Email nao informado" }}
                  </p>
                </div>
              </RouterLink>
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
