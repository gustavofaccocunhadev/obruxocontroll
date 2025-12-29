<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query"
import {
  ArrowLeftIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "vue-sonner"
import { useContaStore } from "@/stores/conta"
import {
  atualizarCliente,
  criarCliente,
  listarClientes,
  removerCliente,
  type Cliente,
  type TipoCliente,
} from "@/repositories/clientes"

type ClientePayload = {
  nome: string
  whatsapp: string | null
  instagram: string | null
  tipo: TipoCliente
  cidade: string | null
}

const contaStore = useContaStore()
const queryClient = useQueryClient()

const termoBusca = ref("")
const editandoId = ref<string | null>(null)
const modo = ref<"lista" | "form">("lista")

const formulario = reactive({
  nome: "",
  whatsapp: "",
  instagram: "",
  tipo: "outro" as TipoCliente,
  cidade: "",
})

const erros = reactive({
  nome: "",
  tipo: "",
})

const tipos = [
  { value: "time", label: "Time" },
  { value: "empresa", label: "Empresa" },
  { value: "atleta", label: "Atleta" },
  { value: "outro", label: "Outro" },
]

const idConta = computed(() => contaStore.contaAtual?.id ?? "")

const clientesQuery = useQuery({
  queryKey: computed(() => ["clientes", idConta.value]),
  queryFn: async () => {
    if (!idConta.value) return []
    const { data, error } = await listarClientes(idConta.value)
    if (error) {
      throw new Error(error)
    }
    return data
  },
  enabled: computed(() => Boolean(idConta.value)),
})

const criarMutation = useMutation({
  mutationFn: async (payload: ClientePayload) => {
    if (!idConta.value) {
      throw new Error("conta")
    }
    const { data, error } = await criarCliente(idConta.value, payload)
    if (error || !data) {
      throw new Error(error ?? "erro")
    }
    return data
  },
})

const atualizarMutation = useMutation({
  mutationFn: async ({ id, payload }: { id: string; payload: ClientePayload }) => {
    if (!idConta.value) {
      throw new Error("conta")
    }
    const { data, error } = await atualizarCliente(idConta.value, id, payload)
    if (error || !data) {
      throw new Error(error ?? "erro")
    }
    return data
  },
})

const removerMutation = useMutation({
  mutationFn: async (id: string) => {
    if (!idConta.value) {
      throw new Error("conta")
    }
    const { error } = await removerCliente(idConta.value, id)
    if (error) {
      throw new Error(error)
    }
    return id
  },
})

const withTimeout = async <T,>(promise: Promise<T>, ms: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeoutId = setTimeout(() => reject(new Error("timeout")), ms)
      }),
    ])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

const clientes = computed(() => clientesQuery.data.value ?? [])
const carregando = computed(
  () => clientesQuery.isLoading.value || clientesQuery.isFetching.value,
)
const erroListagem = computed(() =>
  clientesQuery.isError.value ? "Nao foi possivel carregar os clientes." : "",
)
const salvando = computed(
  () => criarMutation.isPending.value || atualizarMutation.isPending.value,
)

const clientesFiltrados = computed(() => {
  const termo = termoBusca.value.trim().toLowerCase()
  if (!termo) return clientes.value

  return clientes.value.filter((cliente) => {
    const campos = [
      cliente.nome,
      cliente.cidade ?? "",
      cliente.instagram ?? "",
      cliente.whatsapp ?? "",
      cliente.tipo,
    ]
    return campos.some((campo) => campo.toLowerCase().includes(termo))
  })
})

const obterTipoLabel = (tipo: TipoCliente) => {
  return tipos.find((item) => item.value === tipo)?.label ?? tipo
}

const limparFormulario = () => {
  formulario.nome = ""
  formulario.whatsapp = ""
  formulario.instagram = ""
  formulario.tipo = "outro"
  formulario.cidade = ""
  editandoId.value = null
  erros.nome = ""
  erros.tipo = ""
}

const abrirCadastro = () => {
  limparFormulario()
  modo.value = "form"
}

const validar = () => {
  erros.nome = ""
  erros.tipo = ""

  if (!formulario.nome.trim()) {
    erros.nome = "Informe o nome do cliente."
  }

  if (!formulario.tipo) {
    erros.tipo = "Selecione um tipo."
  }

  return !erros.nome && !erros.tipo
}

const salvarCliente = async () => {
  if (!idConta.value) {
    toast.error("Conta nao carregada. Recarregue a pagina.")
    return
  }
  if (!validar()) return

  try {
    if (editandoId.value) {
      const data = await withTimeout(
        atualizarMutation.mutateAsync({
          id: editandoId.value,
          payload: {
            nome: formulario.nome.trim(),
            whatsapp: formulario.whatsapp.trim() || null,
            instagram: formulario.instagram.trim() || null,
            tipo: formulario.tipo,
            cidade: formulario.cidade.trim() || null,
          },
        }),
        15000,
      )

      queryClient.setQueryData<Cliente[]>(
        ["clientes", idConta.value],
        (lista = []) => lista.map((cliente) => (cliente.id === data.id ? data : cliente)),
      )
      toast.success("Cliente atualizado com sucesso.")
      limparFormulario()
      modo.value = "lista"
      return
    }

    const data = await withTimeout(
      criarMutation.mutateAsync({
        nome: formulario.nome.trim(),
        whatsapp: formulario.whatsapp.trim() || null,
        instagram: formulario.instagram.trim() || null,
        tipo: formulario.tipo,
        cidade: formulario.cidade.trim() || null,
      }),
      15000,
    )

    queryClient.setQueryData<Cliente[]>(
      ["clientes", idConta.value],
      (lista = []) => [data, ...lista],
    )
    toast.success("Cliente cadastrado com sucesso.")
    limparFormulario()
    modo.value = "lista"
  } catch (error) {
    const mensagem =
      error instanceof Error && error.message === "timeout"
        ? "O servidor demorou para responder. Tente novamente."
        : "Erro inesperado ao salvar o cliente."
    toast.error(mensagem)
  }
}

const iniciarEdicao = (cliente: Cliente) => {
  formulario.nome = cliente.nome
  formulario.whatsapp = cliente.whatsapp ?? ""
  formulario.instagram = cliente.instagram ?? ""
  formulario.tipo = cliente.tipo
  formulario.cidade = cliente.cidade ?? ""
  editandoId.value = cliente.id
  erros.nome = ""
  erros.tipo = ""
  modo.value = "form"
}

const cancelarEdicao = () => {
  limparFormulario()
  modo.value = "lista"
}

const excluirCliente = async (cliente: Cliente) => {
  if (!idConta.value) return

  const confirmar = window.confirm(`Remover ${cliente.nome}? Essa acao nao pode ser desfeita.`)
  if (!confirmar) return

  try {
    const idRemovido = await withTimeout(removerMutation.mutateAsync(cliente.id), 15000)
    queryClient.setQueryData<Cliente[]>(
      ["clientes", idConta.value],
      (lista = []) => lista.filter((item) => item.id !== idRemovido),
    )
    toast.success("Cliente removido com sucesso.")
  } catch (error) {
    const mensagem =
      error instanceof Error && error.message === "timeout"
        ? "O servidor demorou para responder. Tente novamente."
        : "Nao foi possivel remover o cliente."
    toast.error(mensagem)
    return
  }

  if (editandoId.value === cliente.id) {
    limparFormulario()
  }
}
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold">Clientes</h1>
        <p class="text-sm text-muted-foreground">
          Cadastre pessoas ou empresas que contratam os servicos da sua conta.
        </p>
      </div>
      <Button
        v-if="modo === 'lista'"
        type="button"
        size="sm"
        @click="abrirCadastro"
      >
        <PlusIcon class="size-4" />
        <span>Adicionar cliente</span>
      </Button>
    </header>

    <div v-if="modo === 'form'" class="grid gap-6">
      <Card>
        <CardHeader>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{{ editandoId ? "Editar cliente" : "Novo cliente" }}</CardTitle>
            <Button type="button" variant="outline" size="sm" @click="cancelarEdicao">
              <ArrowLeftIcon class="size-4" />
              <span>Voltar para lista</span>
            </Button>
          </div>
          <CardDescription>Nome, contato e cidade para facilitar o atendimento.</CardDescription>
        </CardHeader>
        <CardContent>
          <form class="space-y-4" @submit.prevent="salvarCliente">
            <div class="space-y-2">
              <Label for="nome">Nome</Label>
              <Input id="nome" v-model="formulario.nome" placeholder="Ex: Atletico Real" />
              <p v-if="erros.nome" class="text-xs text-destructive">{{ erros.nome }}</p>
            </div>

            <div class="space-y-2">
              <Label for="whatsapp">Whatsapp</Label>
              <Input
                id="whatsapp"
                v-model="formulario.whatsapp"
                type="tel"
                placeholder="(11) 99999-0000"
              />
            </div>

            <div class="space-y-2">
              <Label for="instagram">Instagram</Label>
              <Input id="instagram" v-model="formulario.instagram" placeholder="@exemplo" />
            </div>

            <div class="space-y-2">
              <Label for="tipo">Tipo</Label>
              <select
                id="tipo"
                v-model="formulario.tipo"
                class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option v-for="tipo in tipos" :key="tipo.value" :value="tipo.value">
                  {{ tipo.label }}
                </option>
              </select>
              <p v-if="erros.tipo" class="text-xs text-destructive">{{ erros.tipo }}</p>
            </div>

            <div class="space-y-2">
              <Label for="cidade">Cidade</Label>
              <Input id="cidade" v-model="formulario.cidade" placeholder="Ex: Sao Paulo" />
            </div>

            <div class="flex flex-wrap gap-2">
              <Button class="flex-1" type="submit" :disabled="salvando">
                <Loader2Icon v-if="salvando" class="size-4 animate-spin" />
                <SaveIcon v-else-if="editandoId" class="size-4" />
                <UserPlusIcon v-else class="size-4" />
                <span>
                  {{ salvando ? "Salvando..." : editandoId ? "Salvar alteracoes" : "Cadastrar cliente" }}
                </span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>

    <div v-else class="grid gap-6">
      <Card>
        <CardHeader>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Lista de clientes</CardTitle>
              <CardDescription>{{ clientes.length }} clientes cadastrados.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="busca">Buscar</Label>
            <Input id="busca" v-model="termoBusca" placeholder="Nome, cidade ou contato" />
          </div>

          <div v-if="carregando" class="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            Carregando clientes...
          </div>

          <div
            v-else-if="erroListagem"
            class="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-6 text-sm text-destructive"
          >
            {{ erroListagem }}
          </div>

          <div
            v-else-if="!clientesFiltrados.length"
            class="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground"
          >
            Nenhum cliente encontrado. Cadastre o primeiro cliente.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="cliente in clientesFiltrados"
              :key="cliente.id"
              class="rounded-lg border bg-card/70 p-4 shadow-sm"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="space-y-1">
                  <p class="text-sm font-semibold">{{ cliente.nome }}</p>
                  <p class="text-xs uppercase tracking-wide text-muted-foreground">
                    {{ obterTipoLabel(cliente.tipo) }} - {{ cliente.cidade || "Cidade nao informada" }}
                  </p>
                  <div class="text-xs text-muted-foreground">
                    <span v-if="cliente.whatsapp">WhatsApp: {{ cliente.whatsapp }}</span>
                    <span v-else>WhatsApp nao informado</span>
                  </div>
                  <div class="text-xs text-muted-foreground">
                    <span v-if="cliente.instagram">Instagram: {{ cliente.instagram }}</span>
                    <span v-else>Instagram nao informado</span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <Button size="sm" variant="outline" @click="iniciarEdicao(cliente)">
                    <PencilIcon class="size-4" />
                    <span>Editar</span>
                  </Button>
                  <Button size="sm" variant="destructive" @click="excluirCliente(cliente)">
                    <Trash2Icon class="size-4" />
                    <span>Deletar</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
