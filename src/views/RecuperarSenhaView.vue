<script setup lang="ts">
import { ref } from "vue"
import { RouterLink } from "vue-router"
import { Loader2Icon, MailIcon } from "lucide-vue-next"
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

const email = ref("")
const emailErro = ref("")
const feedback = ref<{ tipo: "erro" | "sucesso"; mensagem: string } | null>(null)

const emailValido = (valor: string) => /\S+@\S+\.\S+/.test(valor)

const validar = () => {
  emailErro.value = ""
  feedback.value = null

  if (!email.value.trim()) {
    emailErro.value = "Informe seu email."
  } else if (!emailValido(email.value)) {
    emailErro.value = "Email invalido."
  }

  return !emailErro.value
}

const onSubmit = async () => {
  if (!validar()) return

  const { error } = await authStore.resetPassword(email.value.trim())

  if (error) {
    feedback.value = { tipo: "erro", mensagem: error }
    return
  }

  feedback.value = {
    tipo: "sucesso",
    mensagem: "Email de recuperacao enviado. Verifique sua caixa de entrada.",
  }
}
</script>

<template>
  <main class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_55%)] px-6 py-10">
    <div class="mx-auto flex min-h-screen max-w-lg items-center">
      <Card class="w-full">
        <CardHeader>
          <CardTitle>Recuperar senha</CardTitle>
          <CardDescription>Enviaremos um link para redefinir sua senha.</CardDescription>
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
              <MailIcon v-else class="size-4" />
              <span>{{ authStore.loading ? "Enviando..." : "Enviar link" }}</span>
            </Button>
          </form>
        </CardContent>
        <CardFooter class="flex flex-col gap-3">
          <RouterLink class="text-sm text-muted-foreground underline-offset-4 hover:underline" to="/login">
            Voltar para login
          </RouterLink>
        </CardFooter>
      </Card>
    </div>
  </main>
</template>
