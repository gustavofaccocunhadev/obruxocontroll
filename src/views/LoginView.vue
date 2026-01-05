<script setup lang="ts">
import { ref } from "vue"
import { RouterLink, useRoute, useRouter } from "vue-router"
import { EyeIcon, EyeOffIcon, Loader2Icon, LogInIcon } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/stores/auth"

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref("")
const senha = ref("")
const mostrarSenha = ref(false)
const emailErro = ref("")
const senhaErro = ref("")
const feedback = ref<{ tipo: "erro" | "sucesso"; mensagem: string } | null>(null)

const emailValido = (valor: string) => /\S+@\S+\.\S+/.test(valor)

const normalizarRedirect = (valor: unknown) => {
  if (typeof valor !== "string") return "/app"
  if (!valor.startsWith("/") || valor.startsWith("//")) return "/app"
  return valor
}

const validar = () => {
  emailErro.value = ""
  senhaErro.value = ""
  feedback.value = null

  if (!email.value.trim()) {
    emailErro.value = "Informe seu email."
  } else if (!emailValido(email.value)) {
    emailErro.value = "Email invalido."
  }

  if (!senha.value.trim()) {
    senhaErro.value = "Informe sua senha."
  }

  return !emailErro.value && !senhaErro.value
}

const onSubmit = async () => {
  if (!validar()) return

  const { error } = await authStore.signIn(email.value.trim(), senha.value)

  if (error) {
    feedback.value = { tipo: "erro", mensagem: error }
    return
  }

  feedback.value = { tipo: "sucesso", mensagem: "Login realizado com sucesso." }
  const destino = normalizarRedirect(route.query.redirect)
  await router.push(destino)
}
</script>

<template>
  <main class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_55%)] px-6 py-10">
    <div class="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6">
      <div class="flex justify-center">
        <img
          src="/android-chrome-192x192.png"
          alt="Logo do BruxoControll"
          class="h-48 w-48"
        />
      </div>
      <Card class="w-full">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acesse sua conta para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form class="space-y-4" @submit.prevent="onSubmit">
            <div class="space-y-2">
              <Label for="email">Email</Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="voce@exemplo.com"
                autocomplete="email"
              />
              <p v-if="emailErro" class="text-xs text-destructive">{{ emailErro }}</p>
            </div>

            <div class="space-y-2">
              <Label for="senha">Senha</Label>
              <div class="relative">
                <Input
                  id="senha"
                  v-model="senha"
                  :type="mostrarSenha ? 'text' : 'password'"
                  class="pr-10"
                  placeholder="Digite sua senha"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  :aria-label="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
                  @click="mostrarSenha = !mostrarSenha"
                >
                  <EyeOffIcon v-if="mostrarSenha" class="size-4" />
                  <EyeIcon v-else class="size-4" />
                </button>
              </div>
              <p v-if="senhaErro" class="text-xs text-destructive">{{ senhaErro }}</p>
            </div>

            <div
              v-if="feedback"
              :class="[
                'rounded-lg border px-3 py-2 text-sm',
                feedback.tipo === 'erro'
                  ? 'border-destructive/40 bg-destructive/10 text-destructive'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700',
              ]"
            >
              {{ feedback.mensagem }}
            </div>

            <Button class="w-full" type="submit" :disabled="authStore.loading">
              <Loader2Icon v-if="authStore.loading" class="size-4 animate-spin" />
              <LogInIcon v-else class="size-4" />
              <span>{{ authStore.loading ? "Entrando..." : "Entrar" }}</span>
            </Button>
          </form>
        </CardContent>
        <CardFooter class="flex flex-col gap-3">
          <RouterLink class="text-sm text-muted-foreground underline-offset-4 hover:underline" to="/recuperar-senha">
            Esqueci minha senha
          </RouterLink>
          <p class="text-sm text-muted-foreground">
            Nao tem conta?
            <RouterLink class="font-semibold text-foreground underline-offset-4 hover:underline" to="/cadastro">
              Criar conta
            </RouterLink>
          </p>
        </CardFooter>
      </Card>
    </div>
  </main>
</template>
