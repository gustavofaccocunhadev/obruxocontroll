<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query"
import {
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-vue-next"
import { useForm } from "vee-validate"
import { toTypedSchema } from "@vee-validate/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
} from "@/repositories/clientes"
import {
  listarCategoriasClientes,
  type CategoriaCliente,
} from "@/repositories/categorias_clientes"

type ClientePayload = {
  nome: string
  whatsapp: string | null
  instagram: string | null
  id_categoria: string
  cidade: string | null
}

type ClienteFormValues = {
  nome: string
  whatsapp: string
  instagram: string
  id_categoria: string
  cidade: string
}

const contaStore = useContaStore()
const queryClient = useQueryClient()

const termoBusca = ref("")
const editandoId = ref<string | null>(null)
const dialogAberto = ref(false)

const valoresIniciais: ClienteFormValues = {
  nome: "",
  whatsapp: "",
  instagram: "",
  id_categoria: "",
  cidade: "",
}

const clienteSchema = toTypedSchema(
  z.object({
    nome: z.string().min(1, "Informe o nome do cliente."),
    whatsapp: z.string().optional(),
    instagram: z.string().optional(),
    id_categoria: z.string().min(1, "Selecione uma categoria."),
    cidade: z.string().optional(),
  }),
)

const { defineField, errors: erros, handleSubmit, resetForm, setValues } =
  useForm<ClienteFormValues>({
    validationSchema: clienteSchema,
    initialValues: valoresIniciais,
  })

const [nome, nomeAttrs] = defineField("nome")
const [whatsapp, whatsappAttrs] = defineField("whatsapp")
const [instagram, instagramAttrs] = defineField("instagram")
const [idCategoria, idCategoriaAttrs] = defineField("id_categoria")
const [cidade, cidadeAttrs] = defineField("cidade")

const idConta = computed(() => contaStore.contaAtual?.id ?? "")

const clientesQuery = useQuery({
  queryKey: computed(() => ["clientes", idConta.value]),
  queryFn: async ({ signal }) => {
    if (!idConta.value) return []
    const { data, error } = await listarClientes(idConta.value, signal)
    if (error) {
      throw new Error(error)
    }
    return data
  },
  enabled: computed(() => Boolean(idConta.value)),
})

const categoriasQuery = useQuery({
  queryKey: computed(() => ["categorias-clientes", idConta.value]),
  queryFn: async ({ signal }) => {
    if (!idConta.value) return []
    const { data, error } = await listarCategoriasClientes(idConta.value, signal)
    if (error) {
      throw new Error(error)
    }
    return data
  },
  enabled: computed(() => Boolean(idConta.value)),
})

const criarMutation = useMutation({
  mutationFn: async ({
    payload,
    signal,
  }: {
    payload: ClientePayload
    signal?: AbortSignal
  }) => {
    if (!idConta.value) {
      throw new Error("conta")
    }
    const { data, error } = await criarCliente(idConta.value, payload, signal)
    if (error || !data) {
      throw new Error(error ?? "erro")
    }
    return data
  },
})

const atualizarMutation = useMutation({
  mutationFn: async ({
    id,
    payload,
    signal,
  }: {
    id: string
    payload: ClientePayload
    signal?: AbortSignal
  }) => {
    if (!idConta.value) {
      throw new Error("conta")
    }
    const { data, error } = await atualizarCliente(idConta.value, id, payload, signal)
    if (error || !data) {
      throw new Error(error ?? "erro")
    }
    return data
  },
})

const removerMutation = useMutation({
  mutationFn: async ({ id, signal }: { id: string; signal?: AbortSignal }) => {
    if (!idConta.value) {
      throw new Error("conta")
    }
    const { error } = await removerCliente(idConta.value, id, signal)
    if (error) {
      throw new Error(error)
    }
    return id
  },
})

const withAbortTimeout = async <T,>(
  executor: (signal: AbortSignal) => Promise<T>,
  ms: number,
) => {
  const controller = new AbortController()
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  try {
    timeoutId = setTimeout(() => controller.abort(), ms)
    return await executor(controller.signal)
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

const clientes = computed(() => clientesQuery.data.value ?? [])
const categorias = computed(() => categoriasQuery.data.value ?? [])
const carregandoInicial = computed(() => clientesQuery.isLoading.value)
const carregandoCategorias = computed(() => categoriasQuery.isLoading.value)
const atualizando = computed(
  () => clientesQuery.isFetching.value && !clientesQuery.isLoading.value,
)
const erroListagem = computed(() => {
  if (!clientesQuery.isError.value) return ""
  return clientes.value.length
    ? "Falha ao atualizar a lista. Exibindo dados locais."
    : "Nao foi possivel carregar os clientes."
})
const salvando = computed(
  () => criarMutation.isPending.value || atualizarMutation.isPending.value,
)

const categoriasPorId = computed<Record<string, CategoriaCliente>>(() => {
  return categorias.value.reduce<Record<string, CategoriaCliente>>((acc, categoria) => {
    acc[categoria.id] = categoria
    return acc
  }, {})
})

const clientesFiltrados = computed(() => {
  const termo = termoBusca.value.trim().toLowerCase()
  if (!termo) return clientes.value

  return clientes.value.filter((cliente) => {
    const categoriaNome = categoriasPorId.value[cliente.id_categoria]?.nome ?? ""
    const campos = [
      cliente.nome,
      cliente.cidade ?? "",
      cliente.instagram ?? "",
      cliente.whatsapp ?? "",
      categoriaNome,
    ]
    return campos.some((campo) => campo.toLowerCase().includes(termo))
  })
})

const obterCategoriaNome = (idCategoria: string | null | undefined) => {
  if (!idCategoria) return "Categoria nao informada"
  return categoriasPorId.value[idCategoria]?.nome ?? "Categoria nao informada"
}

const definirCategoriaPadrao = () => {
  if (!categorias.value.length) return
  if (!idCategoria.value) {
    const primeira = categorias.value[0]
    if (primeira) {
      idCategoria.value = primeira.id
    }
  }
}

const limparFormulario = () => {
  resetForm({ values: valoresIniciais })
  editandoId.value = null
  definirCategoriaPadrao()
}

const abrirCadastro = () => {
  limparFormulario()
  dialogAberto.value = true
}

const normalizarTexto = (valor: string) => {
  const texto = valor.trim()
  return texto ? texto : null
}

const salvarCliente = handleSubmit(async (values) => {
  if (!idConta.value) {
    toast.error("Conta nao carregada. Recarregue a pagina.")
    return
  }
  if (!categorias.value.length) {
    toast.error("Cadastre uma categoria antes de salvar o cliente.")
    return
  }

  const payload: ClientePayload = {
    nome: values.nome.trim(),
    whatsapp: normalizarTexto(values.whatsapp),
    instagram: normalizarTexto(values.instagram),
    id_categoria: values.id_categoria,
    cidade: normalizarTexto(values.cidade),
  }

  try {
    if (editandoId.value) {
      const idEdicao = editandoId.value
      const data = await withAbortTimeout(
        (signal) =>
          atualizarMutation.mutateAsync({
            id: idEdicao,
            payload,
            signal,
          }),
        15000,
      )

      queryClient.setQueryData<Cliente[]>(
        ["clientes", idConta.value],
        (lista = []) => lista.map((cliente) => (cliente.id === data.id ? data : cliente)),
      )
      toast.success("Cliente atualizado com sucesso.")
      dialogAberto.value = false
      return
    }

    const data = await withAbortTimeout(
      (signal) =>
        criarMutation.mutateAsync({
          payload,
          signal,
        }),
      15000,
    )

    queryClient.setQueryData<Cliente[]>(
      ["clientes", idConta.value],
      (lista = []) => [data, ...lista],
    )
    toast.success("Cliente cadastrado com sucesso.")
    dialogAberto.value = false
  } catch (error) {
    const mensagem =
      error instanceof Error && /abort|timeout/i.test(error.message)
        ? "O servidor demorou para responder. Tente novamente."
        : "Erro inesperado ao salvar o cliente."
    toast.error(mensagem)
  }
})

const iniciarEdicao = (cliente: Cliente) => {
  resetForm({ values: valoresIniciais })
  setValues({
    nome: cliente.nome,
    whatsapp: cliente.whatsapp ?? "",
    instagram: cliente.instagram ?? "",
    id_categoria: cliente.id_categoria,
    cidade: cliente.cidade ?? "",
  })
  editandoId.value = cliente.id
  dialogAberto.value = true
}

const excluirCliente = async (cliente: Cliente) => {
  if (!idConta.value) return

  const confirmar = window.confirm(`Remover ${cliente.nome}? Essa acao nao pode ser desfeita.`)
  if (!confirmar) return

  try {
    const idRemovido = await withAbortTimeout(
      (signal) => removerMutation.mutateAsync({ id: cliente.id, signal }),
      15000,
    )
    queryClient.setQueryData<Cliente[]>(
      ["clientes", idConta.value],
      (lista = []) => lista.filter((item) => item.id !== idRemovido),
    )
    toast.success("Cliente removido com sucesso.")
  } catch (error) {
    const mensagem =
      error instanceof Error && /abort|timeout/i.test(error.message)
        ? "O servidor demorou para responder. Tente novamente."
        : "Nao foi possivel remover o cliente."
    toast.error(mensagem)
    return
  }

  if (editandoId.value === cliente.id) {
    dialogAberto.value = false
  }
}

watch(dialogAberto, (aberto) => {
  if (!aberto) {
    limparFormulario()
    return
  }
  if (!editandoId.value) {
    definirCategoriaPadrao()
  }
})

watch(categorias, (lista) => {
  if (!lista.length) return
  if (!dialogAberto.value || editandoId.value) return
  if (!idCategoria.value) {
    const primeira = lista[0]
    if (primeira) {
      idCategoria.value = primeira.id
    }
  }
})
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
      <Button type="button" size="sm" @click="abrirCadastro">
        <PlusIcon class="size-4" />
        <span>Adicionar cliente</span>
      </Button>
    </header>

    <Dialog v-model:open="dialogAberto">
      <DialogContent
        class="top-auto bottom-0 left-0 right-0 max-w-none translate-x-0 translate-y-0 rounded-t-2xl border-t sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:right-auto sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg"
      >
        <DialogHeader>
          <DialogTitle>{{ editandoId ? "Editar cliente" : "Novo cliente" }}</DialogTitle>
          <DialogDescription>Nome, contato e cidade para facilitar o atendimento.</DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="salvarCliente">
          <div class="space-y-2">
            <Label for="nome">Nome</Label>
            <Input id="nome" v-model="nome" v-bind="nomeAttrs" placeholder="Ex: Atletico Real" />
            <p v-if="erros.nome" class="text-xs text-destructive">{{ erros.nome }}</p>
          </div>

          <div class="space-y-2">
            <Label for="whatsapp">Whatsapp</Label>
            <Input
              id="whatsapp"
              v-model="whatsapp"
              v-bind="whatsappAttrs"
              type="tel"
              placeholder="(11) 99999-0000"
            />
          </div>

          <div class="space-y-2">
            <Label for="instagram">Instagram</Label>
            <Input
              id="instagram"
              v-model="instagram"
              v-bind="instagramAttrs"
              placeholder="@exemplo"
            />
          </div>

          <div class="space-y-2">
            <Label for="categoria">Categoria</Label>
            <select
              id="categoria"
              v-model="idCategoria"
              v-bind="idCategoriaAttrs"
              class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="" disabled>Selecione uma categoria</option>
              <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
                {{ categoria.nome }}
              </option>
            </select>
            <RouterLink to="/app/categorias" class="text-xs font-medium text-primary underline-offset-2 hover:underline">
              Gerenciar categorias
            </RouterLink>
            <p v-if="!categorias.length && !carregandoCategorias" class="text-xs text-muted-foreground">
              Nenhuma categoria cadastrada. Crie uma categoria antes de salvar.
            </p>
            <p v-if="erros.id_categoria" class="text-xs text-destructive">
              {{ erros.id_categoria }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="cidade">Cidade</Label>
            <Input
              id="cidade"
              v-model="cidade"
              v-bind="cidadeAttrs"
              placeholder="Ex: Sao Paulo"
            />
          </div>

          <DialogFooter class="pt-2">
            <DialogClose as-child>
              <Button type="button" variant="outline" :disabled="salvando">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" :disabled="salvando">
              <Loader2Icon v-if="salvando" class="size-4 animate-spin" />
              <SaveIcon v-else-if="editandoId" class="size-4" />
              <UserPlusIcon v-else class="size-4" />
              <span>
                {{ salvando ? "Salvando..." : editandoId ? "Salvar alteracoes" : "Cadastrar cliente" }}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <div class="grid gap-6">
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

          <div
            v-if="erroListagem"
            class="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive"
          >
            {{ erroListagem }}
          </div>

          <div
            v-if="atualizando"
            class="rounded-lg border border-dashed px-4 py-3 text-xs text-muted-foreground"
          >
            Atualizando lista...
          </div>

          <div v-if="carregandoInicial" class="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            Carregando clientes...
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
                    {{ obterCategoriaNome(cliente.id_categoria) }} -
                    {{ cliente.cidade || "Cidade nao informada" }}
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
