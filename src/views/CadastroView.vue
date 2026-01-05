<script setup lang="ts">
import { ref } from "vue"
import { RouterLink, useRouter } from "vue-router"
import { EyeIcon, EyeOffIcon, Loader2Icon, UserPlusIcon } from "lucide-vue-next"
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
import { toast } from "vue-sonner"
import { useAuthStore } from "@/stores/auth"

const authStore = useAuthStore()
const router = useRouter()

const nome = ref("")
const email = ref("")
const cpfCnpj = ref("")
const senha = ref("")
const confirmacao = ref("")
const mostrarSenha = ref(false)
const mostrarConfirmacao = ref(false)
const nomeErro = ref("")
const emailErro = ref("")
const cpfCnpjErro = ref("")
const senhaErro = ref("")
const confirmacaoErro = ref("")
const feedback = ref<{ tipo: "erro" | "sucesso"; mensagem: string } | null>(null)

const emailValido = (valor: string) => /\S+@\S+\.\S+/.test(valor)
const normalizarCpfCnpj = (valor: string) => valor.replace(/\D/g, "")

const validar = () => {
  nomeErro.value = ""
  emailErro.value = ""
  cpfCnpjErro.value = ""
  senhaErro.value = ""
  confirmacaoErro.value = ""
  feedback.value = null

  if (!nome.value.trim()) {
    nomeErro.value = "Informe seu nome."
  }

  if (!email.value.trim()) {
    emailErro.value = "Informe seu email."
  } else if (!emailValido(email.value)) {
    emailErro.value = "Email invalido."
  }

  const cpfCnpjFinal = normalizarCpfCnpj(cpfCnpj.value)
  if (!cpfCnpjFinal) {
    cpfCnpjErro.value = "Informe seu CPF ou CNPJ."
  } else if (cpfCnpjFinal.length !== 11 && cpfCnpjFinal.length !== 14) {
    cpfCnpjErro.value = "CPF ou CNPJ invalido."
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

  return !nomeErro.value && !emailErro.value && !cpfCnpjErro.value && !senhaErro.value && !confirmacaoErro.value
}

const onSubmit = async () => {
  if (!validar()) return

  const cpfCnpjFinal = normalizarCpfCnpj(cpfCnpj.value)
  const { error, message } = await authStore.signUp(
    email.value.trim(),
    senha.value,
    nome.value.trim(),
    cpfCnpjFinal,
  )

  if (error) {
    feedback.value = { tipo: "erro", mensagem: error }
    toast.error(error)
    return
  }

  feedback.value = {
    tipo: "sucesso",
    mensagem: message ?? "Conta criada com sucesso.",
  }
  toast.success(message ?? "Conta criada com sucesso.")

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
              <Label for="nome">Nome</Label>
              <Input
                id="nome"
                v-model="nome"
                type="text"
                placeholder="Seu nome"
                autocomplete="name"
              />
              <p v-if="nomeErro" class="text-xs text-destructive">{{ nomeErro }}</p>
            </div>

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
              <Label for="cpf-cnpj">CPF ou CNPJ</Label>
              <Input
                id="cpf-cnpj"
                v-model="cpfCnpj"
                type="text"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                autocomplete="off"
              />
              <p v-if="cpfCnpjErro" class="text-xs text-destructive">{{ cpfCnpjErro }}</p>
            </div>

            <div class="space-y-2">
              <Label for="senha">Senha</Label>
              <div class="relative">
                <Input
                  id="senha"
                  v-model="senha"
                  :type="mostrarSenha ? 'text' : 'password'"
                  class="pr-10"
                  placeholder="Crie uma senha"
                  autocomplete="new-password"
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

            <div class="space-y-2">
              <Label for="confirmacao">Confirmar senha</Label>
              <div class="relative">
                <Input
                  id="confirmacao"
                  v-model="confirmacao"
                  :type="mostrarConfirmacao ? 'text' : 'password'"
                  class="pr-10"
                  placeholder="Repita sua senha"
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  :aria-label="mostrarConfirmacao ? 'Ocultar senha' : 'Mostrar senha'"
                  @click="mostrarConfirmacao = !mostrarConfirmacao"
                >
                  <EyeOffIcon v-if="mostrarConfirmacao" class="size-4" />
                  <EyeIcon v-else class="size-4" />
                </button>
              </div>
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
