<script setup lang="ts">
import { ref } from "vue"
import { RouterLink, useRoute, useRouter } from "vue-router"
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
const emailErro = ref("")
const senhaErro = ref("")
const feedback = ref<{ tipo: "erro" | "sucesso"; mensagem: string } | null>(null)

const emailValido = (valor: string) => /\S+@\S+\.\S+/.test(valor)

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
  const destino = typeof route.query.redirect === "string" ? route.query.redirect : "/app"
  await router.push(destino)
}
</script>

<template>
  <main class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_55%)] px-6 py-10">
    <div class="mx-auto flex min-h-screen max-w-lg items-center">
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
              <Input
                id="senha"
                v-model="senha"
                type="password"
                placeholder="Digite sua senha"
                autocomplete="current-password"
              />
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
              {{ authStore.loading ? "Entrando..." : "Entrar" }}
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
