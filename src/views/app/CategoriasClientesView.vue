<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query"
import { Loader2Icon, PencilIcon, PlusIcon, SaveIcon, TagIcon, Trash2Icon } from "lucide-vue-next"
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
  atualizarCategoriaCliente,
  criarCategoriaCliente,
  listarCategoriasClientes,
  removerCategoriaCliente,
  type CategoriaCliente,
} from "@/repositories/categorias_clientes"

type CategoriaPayload = {
  nome: string
  descricao: string | null
}

type CategoriaFormValues = {
  nome: string
  descricao: string
}

const contaStore = useContaStore()
const queryClient = useQueryClient()

const termoBusca = ref("")
const editandoId = ref<string | null>(null)
const dialogAberto = ref(false)

const valoresIniciais: CategoriaFormValues = {
  nome: "",
  descricao: "",
}

const categoriaSchema = toTypedSchema(
  z.object({
    nome: z.string().min(1, "Informe o nome da categoria."),
    descricao: z.string().optional(),
  }),
)

const { defineField, errors: erros, handleSubmit, resetForm, setValues } =
  useForm<CategoriaFormValues>({
    validationSchema: categoriaSchema,
    initialValues: valoresIniciais,
  })

const [nome, nomeAttrs] = defineField("nome")
const [descricao, descricaoAttrs] = defineField("descricao")

const idConta = computed(() => contaStore.contaAtual?.id ?? "")

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
    payload: CategoriaPayload
    signal?: AbortSignal
  }) => {
    if (!idConta.value) {
      throw new Error("conta")
    }
    const { data, error } = await criarCategoriaCliente(idConta.value, payload, signal)
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
    payload: CategoriaPayload
    signal?: AbortSignal
  }) => {
    if (!idConta.value) {
      throw new Error("conta")
    }
    const { data, error } = await atualizarCategoriaCliente(idConta.value, id, payload, signal)
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
    const { error } = await removerCategoriaCliente(idConta.value, id, signal)
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

const categorias = computed(() => categoriasQuery.data.value ?? [])
const carregandoInicial = computed(() => categoriasQuery.isLoading.value)
const atualizando = computed(
  () => categoriasQuery.isFetching.value && !categoriasQuery.isLoading.value,
)
const erroListagem = computed(() => {
  if (!categoriasQuery.isError.value) return ""
  return categorias.value.length
    ? "Falha ao atualizar a lista. Exibindo dados locais."
    : "Nao foi possivel carregar as categorias."
})
const salvando = computed(
  () => criarMutation.isPending.value || atualizarMutation.isPending.value,
)

const ordenarCategorias = (lista: CategoriaCliente[]) => {
  return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
}

const categoriasFiltradas = computed(() => {
  const termo = termoBusca.value.trim().toLowerCase()
  if (!termo) return categorias.value
  return categorias.value.filter((categoria) => {
    const campos = [categoria.nome, categoria.descricao ?? ""]
    return campos.some((campo) => campo.toLowerCase().includes(termo))
  })
})

const limparFormulario = () => {
  resetForm({ values: valoresIniciais })
  editandoId.value = null
}

const abrirCadastro = () => {
  limparFormulario()
  dialogAberto.value = true
}

const normalizarTexto = (valor: string) => {
  const texto = valor.trim()
  return texto ? texto : null
}

const salvarCategoria = handleSubmit(async (values) => {
  if (!idConta.value) {
    toast.error("Conta nao carregada. Recarregue a pagina.")
    return
  }

  const payload: CategoriaPayload = {
    nome: values.nome.trim(),
    descricao: normalizarTexto(values.descricao),
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

      queryClient.setQueryData<CategoriaCliente[]>(
        ["categorias-clientes", idConta.value],
        (lista = []) => ordenarCategorias(lista.map((item) => (item.id === data.id ? data : item))),
      )
      toast.success("Categoria atualizada com sucesso.")
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

    queryClient.setQueryData<CategoriaCliente[]>(
      ["categorias-clientes", idConta.value],
      (lista = []) => ordenarCategorias([data, ...lista]),
    )
    toast.success("Categoria cadastrada com sucesso.")
    dialogAberto.value = false
  } catch (error) {
    const mensagem =
      error instanceof Error && /abort|timeout/i.test(error.message)
        ? "O servidor demorou para responder. Tente novamente."
        : "Erro inesperado ao salvar a categoria."
    toast.error(mensagem)
  }
})

const iniciarEdicao = (categoria: CategoriaCliente) => {
  resetForm({ values: valoresIniciais })
  setValues({
    nome: categoria.nome,
    descricao: categoria.descricao ?? "",
  })
  editandoId.value = categoria.id
  dialogAberto.value = true
}

const excluirCategoria = async (categoria: CategoriaCliente) => {
  if (!idConta.value) return

  const confirmar = window.confirm(
    `Remover ${categoria.nome}? Essa acao nao pode ser desfeita.`,
  )
  if (!confirmar) return

  try {
    const idRemovido = await withAbortTimeout(
      (signal) => removerMutation.mutateAsync({ id: categoria.id, signal }),
      15000,
    )
    queryClient.setQueryData<CategoriaCliente[]>(
      ["categorias-clientes", idConta.value],
      (lista = []) => lista.filter((item) => item.id !== idRemovido),
    )
    toast.success("Categoria removida com sucesso.")
  } catch (error) {
    const mensagem =
      error instanceof Error && /foreign key|violates/i.test(error.message)
        ? "Nao foi possivel remover. Existem clientes usando essa categoria."
        : "Nao foi possivel remover a categoria."
    toast.error(mensagem)
    return
  }

  if (editandoId.value === categoria.id) {
    dialogAberto.value = false
  }
}

watch(dialogAberto, (aberto) => {
  if (!aberto) {
    limparFormulario()
  }
})
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold">Categorias de clientes</h1>
        <p class="text-sm text-muted-foreground">
          Organize os clientes por categoria para agilizar os cadastros.
        </p>
      </div>
      <Button type="button" size="sm" @click="abrirCadastro">
        <PlusIcon class="size-4" />
        <span>Adicionar categoria</span>
      </Button>
    </header>

    <Dialog v-model:open="dialogAberto">
      <DialogContent
        class="top-auto bottom-0 left-0 right-0 max-w-none translate-x-0 translate-y-0 rounded-t-2xl border-t sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:right-auto sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg"
      >
        <DialogHeader>
          <DialogTitle>{{ editandoId ? "Editar categoria" : "Nova categoria" }}</DialogTitle>
          <DialogDescription>Nome e descricao da categoria.</DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="salvarCategoria">
          <div class="space-y-2">
            <Label for="nome">Nome</Label>
            <Input id="nome" v-model="nome" v-bind="nomeAttrs" placeholder="Ex: Time" />
            <p v-if="erros.nome" class="text-xs text-destructive">{{ erros.nome }}</p>
          </div>

          <div class="space-y-2">
            <Label for="descricao">Descricao</Label>
            <Input
              id="descricao"
              v-model="descricao"
              v-bind="descricaoAttrs"
              placeholder="Opcional"
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
              <TagIcon v-else class="size-4" />
              <span>{{ salvando ? "Salvando..." : editandoId ? "Salvar alteracoes" : "Cadastrar categoria" }}</span>
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
              <CardTitle>Lista de categorias</CardTitle>
              <CardDescription>{{ categorias.length }} categorias cadastradas.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="busca">Buscar</Label>
            <Input id="busca" v-model="termoBusca" placeholder="Nome ou descricao" />
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
            Carregando categorias...
          </div>

          <div
            v-else-if="!categoriasFiltradas.length"
            class="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground"
          >
            Nenhuma categoria encontrada. Cadastre a primeira categoria.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="categoria in categoriasFiltradas"
              :key="categoria.id"
              class="rounded-lg border bg-card/70 p-4 shadow-sm"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="space-y-1">
                  <p class="text-sm font-semibold">{{ categoria.nome }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ categoria.descricao || "Sem descricao cadastrada" }}
                  </p>
                </div>
                <div class="flex gap-2">
                  <Button size="sm" variant="outline" @click="iniciarEdicao(categoria)">
                    <PencilIcon class="size-4" />
                    <span>Editar</span>
                  </Button>
                  <Button size="sm" variant="destructive" @click="excluirCategoria(categoria)">
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
