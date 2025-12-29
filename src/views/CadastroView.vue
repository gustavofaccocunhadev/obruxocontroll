<script setup lang="ts">
import { ref } from "vue"
import { RouterLink, useRouter } from "vue-router"
import { Loader2Icon, UserPlusIcon } from "lucide-vue-next"
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

const authStore = useAuthStore()
const router = useRouter()

const email = ref("")
const senha = ref("")
const confirmacao = ref("")
const emailErro = ref("")
const senhaErro = ref("")
const confirmacaoErro = ref("")
const feedback = ref<{ tipo: "erro" | "sucesso"; mensagem: string } | null>(null)

const emailValido = (valor: string) => /\S+@\S+\.\S+/.test(valor)

const validar = () => {
  emailErro.value = ""
  senhaErro.value = ""
  confirmacaoErro.value = ""
  feedback.value = null

  if (!email.value.trim()) {
    emailErro.value = "Informe seu email."
  } else if (!emailValido(email.value)) {
    emailErro.value = "Email invalido."
  }

  if (!senha.value.trim()) {
    senhaErro.value = "Crie uma senha."
  } else if (senha.value.length < 6) {
    senhaErro.value = "A senha precisa de pelo menos 6 caracteres."
  }

  if (!confirmacao.value.trim()) {
    confirmacaoErro.value = "Confirme sua senha."
  } else if (confirmacao.value !== senha.value) {
    confirmacaoErro.value = "As senhas nao conferem."
  }

  return !emailErro.value && !senhaErro.value && !confirmacaoErro.value
}

const onSubmit = async () => {
  if (!validar()) return

  const { error, message } = await authStore.signUp(email.value.trim(), senha.value)

  if (error) {
    feedback.value = { tipo: "erro", mensagem: error }
    return
  }

  feedback.value = {
    tipo: "sucesso",
    mensagem: message ?? "Conta criada com sucesso.",
  }

  if (message?.includes("autenticada")) {
    await router.push("/app")
  }
}
</script>

<template>
  <main class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_55%)] px-6 py-10">
    <div class="mx-auto flex min-h-screen max-w-lg items-center">
      <Card class="w-full">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>Comece agora com seu email e senha.</CardDescription>
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
                placeholder="Crie uma senha"
                autocomplete="new-password"
              />
              <p v-if="senhaErro" class="text-xs text-destructive">{{ senhaErro }}</p>
            </div>

            <div class="space-y-2">
              <Label for="confirmacao">Confirmar senha</Label>
              <Input
                id="confirmacao"
                v-model="confirmacao"
                type="password"
                placeholder="Repita sua senha"
                autocomplete="new-password"
              />
              <p v-if="confirmacaoErro" class="text-xs text-destructive">
                {{ confirmacaoErro }}
              </p>
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
              <UserPlusIcon v-else class="size-4" />
              <span>{{ authStore.loading ? "Criando..." : "Criar conta" }}</span>
            </Button>
          </form>
        </CardContent>
        <CardFooter class="flex flex-col gap-3">
          <p class="text-sm text-muted-foreground">
            Ja tem conta?
            <RouterLink class="font-semibold text-foreground underline-offset-4 hover:underline" to="/login">
              Entrar
            </RouterLink>
          </p>
        </CardFooter>
      </Card>
    </div>
  </main>
</template>
