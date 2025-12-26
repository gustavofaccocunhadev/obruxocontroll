<script setup lang="ts">
import { RouterLink } from "vue-router"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth"

const authStore = useAuthStore()

const onSignOut = async () => {
  await authStore.signOut()
}
</script>

<template>
  <main class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_55%)]">
    <div class="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
      <header class="flex items-center justify-between">
        <div class="text-base font-semibold tracking-wide">BruxoControl</div>
        <div class="flex items-center gap-2">
          <template v-if="authStore.user">
            <Button variant="outline" size="sm" @click="onSignOut">
              Sair
            </Button>
          </template>
          <template v-else>
            <Button variant="ghost" as-child>
              <RouterLink to="/login">Entrar</RouterLink>
            </Button>
            <Button as-child>
              <RouterLink to="/cadastro">Criar conta</RouterLink>
            </Button>
          </template>
        </div>
      </header>

      <section class="mt-16 flex flex-1 flex-col gap-8">
        <div class="space-y-5">
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Gestao para artistas e estudios
          </p>
          <h1 class="text-3xl font-semibold leading-tight sm:text-5xl">
            Centralize clientes, artes e pagamentos sem planilhas.
          </h1>
          <p class="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Uma base simples e rapida para acompanhar pedidos, prazos e recebimentos.
            Feito para quem precisa controlar o fluxo de artes pelo celular.
          </p>
          <div class="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" as-child>
              <RouterLink to="/cadastro">Comecar agora</RouterLink>
            </Button>
            <Button variant="outline" size="lg" as-child>
              <RouterLink to="/login">Ja tenho conta</RouterLink>
            </Button>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-xl border bg-card/80 p-5 shadow-sm">
            <p class="text-sm font-semibold">Controle em tempo real</p>
            <p class="mt-2 text-sm text-muted-foreground">
              Veja status, prazos e pagamentos em uma linha do tempo simples.
            </p>
          </div>
          <div class="rounded-xl border bg-card/80 p-5 shadow-sm">
            <p class="text-sm font-semibold">Tudo em um lugar</p>
            <p class="mt-2 text-sm text-muted-foreground">
              Clientes, arquivos e financeiro conectados para evitar retrabalho.
            </p>
          </div>
        </div>
      </section>

      <footer class="mt-12 border-t pt-6 text-xs text-muted-foreground">
        Feito para artistas que precisam de clareza no dia a dia.
      </footer>
    </div>
  </main>
</template>
