<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query"
import { Loader2Icon, SaveIcon, UserIcon } from "lucide-vue-next"
import { useForm } from "vee-validate"
import { toTypedSchema } from "@vee-validate/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "vue-sonner"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth"
import {
  atualizarPerfil,
  gerarUrlAvatarPerfil,
  obterPerfil,
  removerAvatarPerfil,
  uploadAvatarPerfil,
} from "@/repositories/perfis"

const authStore = useAuthStore()
const queryClient = useQueryClient()

const idUsuario = computed(() => authStore.user?.id ?? "")
const emailAtual = computed(() => authStore.user?.email ?? "")

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
const avatarPath = computed(() => perfil.value?.foto_path ?? "")

const avatarQuery = useQuery({
  queryKey: computed(() => ["perfil-avatar", avatarPath.value]),
  queryFn: async () => {
    if (!avatarPath.value) return ""
    const { data, error } = await gerarUrlAvatarPerfil(avatarPath.value)
    if (error) {
      throw new Error(error)
    }
    return data ?? ""
  },
  enabled: computed(() => Boolean(avatarPath.value)),
})

const normalizarCpfCnpj = (valor: string) => valor.replace(/\D/g, "")

type PerfilFormValues = {
  nome: string
  cpfCnpj: string
  email: string
}

const perfilSchema = toTypedSchema(
  z.object({
    nome: z.string().min(1, "Informe o nome."),
    cpfCnpj: z
      .string()
      .min(1, "Informe um CPF ou CNPJ.")
      .refine((valor) => {
        const normalizado = normalizarCpfCnpj(valor)
        return normalizado.length === 11 || normalizado.length === 14
      }, "Informe um CPF ou CNPJ valido."),
    email: z.string().min(1, "Informe o email.").email("Informe um email valido."),
  }),
)

const { defineField, errors: erros, setValues, handleSubmit } =
  useForm<PerfilFormValues>({
    validationSchema: perfilSchema,
    initialValues: {
      nome: "",
      cpfCnpj: "",
      email: "",
    },
  })

const [nome, nomeAttrs] = defineField("nome")
const [cpfCnpj, cpfCnpjAttrs] = defineField("cpfCnpj")
const [email, emailAttrs] = defineField("email")
const avatarArquivo = ref<File | null>(null)
const avatarPreview = ref("")
const formInicializado = ref(false)

const avatarExibicao = computed(() => avatarPreview.value || avatarQuery.data.value || "")
const iniciaisUsuario = computed(() => {
  const texto = nome.value.trim() || "?"
  return texto.charAt(0).toUpperCase()
})

const limparPreview = () => {
  if (avatarPreview.value) {
    URL.revokeObjectURL(avatarPreview.value)
    avatarPreview.value = ""
  }
}

watch(
  [() => perfil.value, () => authStore.user],
  ([dados, usuario]) => {
    if (formInicializado.value) return
    if (!dados && !usuario) return
    setValues({
      nome:
        dados?.nome ??
        (usuario?.user_metadata?.nome as string | undefined) ??
        "",
      cpfCnpj:
        dados?.cpf_cnpj ??
        (usuario?.user_metadata?.cpf_cnpj as string | undefined) ??
        "",
      email: usuario?.email ?? "",
    })
    formInicializado.value = true
  },
  { immediate: true },
)

watch(avatarArquivo, (arquivo) => {
  limparPreview()
  if (arquivo) {
    avatarPreview.value = URL.createObjectURL(arquivo)
  }
})

onBeforeUnmount(() => {
  limparPreview()
})

const selecionarAvatar = (event: Event) => {
  const input = event.target as HTMLInputElement
  const arquivo = input.files?.[0]
  if (!arquivo) return
  if (!arquivo.type.startsWith("image/")) {
    toast.error("Selecione um arquivo de imagem.")
    return
  }
  avatarArquivo.value = arquivo
}

const salvarMutation = useMutation({
  mutationFn: async (values: PerfilFormValues) => {
    if (!idUsuario.value) {
      throw new Error("usuario")
    }

    const nomeFinal = values.nome.trim()
    if (!nomeFinal) {
      throw new Error("nome")
    }

    const cpfFinal = normalizarCpfCnpj(values.cpfCnpj)
    if (!cpfFinal || (cpfFinal.length !== 11 && cpfFinal.length !== 14)) {
      throw new Error("cpf_cnpj")
    }

    let novoPath = perfil.value?.foto_path ?? null
    const pathAntigo = perfil.value?.foto_path ?? null

    if (avatarArquivo.value) {
      const upload = await uploadAvatarPerfil(idUsuario.value, avatarArquivo.value)
      if (upload.error || !upload.data) {
        throw new Error(upload.error ?? "upload")
      }
      novoPath = upload.data.path
    }

    const { data, error } = await atualizarPerfil(idUsuario.value, {
      nome: nomeFinal,
      cpf_cnpj: cpfFinal,
      foto_path: novoPath,
    })

    if (error || !data) {
      if (avatarArquivo.value && novoPath && novoPath !== pathAntigo) {
        await removerAvatarPerfil(novoPath)
      }
      throw new Error(error ?? "perfil")
    }

    if (avatarArquivo.value && pathAntigo && pathAntigo !== novoPath) {
      await removerAvatarPerfil(pathAntigo)
    }

    queryClient.setQueryData(["perfil", idUsuario.value], data)
    queryClient.invalidateQueries({ queryKey: ["perfil-avatar"] })
    avatarArquivo.value = null
    limparPreview()

    const emailFinal = values.email.trim()
    const emailMudou = emailFinal && emailFinal !== emailAtual.value

    const { error: authError } = await supabase.auth.updateUser({
      email: emailMudou ? emailFinal : undefined,
      data: { nome: nomeFinal },
    })

    if (authError) {
      return { perfil: data, aviso: authError.message }
    }

    return { perfil: data, aviso: null }
  },
})

const salvando = computed(() => salvarMutation.isPending.value)

const salvarPerfil = handleSubmit(
  async (values) => {
    try {
      const resultado = await salvarMutation.mutateAsync(values)
      if (resultado.aviso) {
        toast.message("Dados salvos.", {
          description: "Email nao atualizado. Verifique sua caixa de entrada e tente novamente.",
        })
        return
      }
      toast.success("Perfil atualizado com sucesso.")
    } catch {
      toast.error("Nao foi possivel salvar o perfil.")
    }
  },
  () => {
    toast.error("Corrija os campos destacados antes de salvar.")
  },
)
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold">Perfil do cliente</h1>
      <p class="text-sm text-muted-foreground">
        Atualize seus dados e a foto do perfil.
      </p>
    </header>

    <Card>
      <CardHeader>
        <CardTitle>Informacoes pessoais</CardTitle>
        <CardDescription>
          Alterar o email pode exigir confirmacao na sua caixa de entrada.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="flex flex-wrap items-center gap-6">
          <div
            class="flex size-20 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-muted/60 text-lg font-semibold text-foreground"
          >
            <img
              v-if="avatarExibicao"
              :src="avatarExibicao"
              alt="Avatar do cliente"
              class="h-full w-full object-cover"
            />
            <UserIcon v-else class="size-8 text-muted-foreground" />
          </div>
          <div class="space-y-2">
            <Label for="avatar">Foto do perfil</Label>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              @change="selecionarAvatar"
            />
            <p class="text-xs text-muted-foreground">
              Use uma imagem quadrada para melhor resultado.
            </p>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="nome">Nome</Label>
            <Input id="nome" v-model="nome" v-bind="nomeAttrs" placeholder="Seu nome" />
            <p v-if="erros.nome" class="text-xs text-destructive">{{ erros.nome }}</p>
          </div>

          <div class="space-y-2">
            <Label for="cpf-cnpj">CPF ou CNPJ</Label>
            <Input
              id="cpf-cnpj"
              v-model="cpfCnpj"
              v-bind="cpfCnpjAttrs"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
            <p v-if="erros.cpfCnpj" class="text-xs text-destructive">
              {{ erros.cpfCnpj }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="email"
              v-bind="emailAttrs"
              type="email"
              placeholder="seu@email.com"
            />
            <p v-if="erros.email" class="text-xs text-destructive">{{ erros.email }}</p>
          </div>
        </div>

        <Button class="gap-2" :disabled="salvando" @click="salvarPerfil">
          <Loader2Icon v-if="salvando" class="size-4 animate-spin" />
          <SaveIcon v-else class="size-4" />
          <span>{{ salvando ? "Salvando..." : "Salvar alteracoes" }}</span>
        </Button>
      </CardContent>
    </Card>
  </section>
</template>
