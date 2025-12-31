<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query"
import {
  ArrowLeftIcon,
  ChevronsUpDownIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "vue-sonner"
import { useContaStore } from "@/stores/conta"
import {
  atualizarArte,
  criarArte,
  listarArtes,
  removerArte,
  type ArteComFinanceiro,
  type StatusArte,
} from "@/repositories/artes"
import {
  garantirFinanceiroArte,
  type ModeloCobranca,
  type StatusPagamento,
} from "@/repositories/financeiro"
import { listarClientes, type Cliente } from "@/repositories/clientes"

type ArtePayload = {
  id_cliente: string | null
  titulo: string
  descricao: string | null
  valor_centavos: number
  link_download: string | null
  status: StatusArte
  prazo_entrega: string | null
}

const contaStore = useContaStore()
const queryClient = useQueryClient()

const termoBusca = ref("")
const editandoId = ref<string | null>(null)
const modo = ref<"lista" | "form">("lista")

const formulario = reactive({
  id_cliente: "",
  titulo: "",
  descricao: "",
  valor: "",
  link_download: "",
  status: "pendente" as StatusArte,
  prazo_entrega: "",
})

const erros = reactive({
  titulo: "",
})

const statusOptions = [
  { value: "pendente", label: "PENDENTE" },
  { value: "em_producao", label: "EM PRODUCAO" },
  { value: "pronta", label: "PRONTA" },
  { value: "entregue", label: "ENTREGUE" },
  { value: "cancelada", label: "CANCELADA" },
]

const modeloCobrancaOptions = [
  { value: "antes", label: "Antes" },
  { value: "depois", label: "Depois" },
  { value: "plano", label: "Plano" },
  { value: "cortesia", label: "Cortesia" },
]

const statusPagamentoOptions = [
  { value: "pendente", label: "Pendente" },
  { value: "paga", label: "Paga" },
  { value: "cortesia", label: "Cortesia" },
  { value: "plano", label: "Plano" },
]

const idConta = computed(() => contaStore.contaAtual?.id ?? "")

const formatarDataInput = (data: Date) => {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

const calcularPrazoPadrao = () => {
  const data = new Date()
  let diasUteis = 0
  const prazo = new Date(data)
  while (diasUteis < 3) {
    prazo.setDate(prazo.getDate() + 1)
    const diaSemana = prazo.getDay()
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasUteis += 1
    }
  }
  return formatarDataInput(prazo)
}

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

const criarMutation = useMutation({
  mutationFn: async ({
    payload,
    signal,
  }: {
    payload: ArtePayload
    signal?: AbortSignal
  }) => {
    if (!idConta.value) {
      throw new Error("conta")
    }
    const { data, error } = await criarArte(idConta.value, payload, signal)
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
    payload: ArtePayload
    signal?: AbortSignal
  }) => {
    if (!idConta.value) {
      throw new Error("conta")
    }
    const { data, error } = await atualizarArte(idConta.value, id, payload, signal)
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
    const { error } = await removerArte(idConta.value, id, signal)
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

const artes = computed(() => artesQuery.data.value ?? [])
const clientes = computed(() => clientesQuery.data.value ?? [])
const carregandoInicial = computed(() => artesQuery.isLoading.value)
const atualizando = computed(
  () => artesQuery.isFetching.value && !artesQuery.isLoading.value,
)
const erroListagem = computed(() => {
  if (!artesQuery.isError.value) return ""
  return artes.value.length
    ? "Falha ao atualizar a lista. Exibindo dados locais."
    : "Nao foi possivel carregar as artes."
})
const salvando = computed(
  () => criarMutation.isPending.value || atualizarMutation.isPending.value,
)

const clientesPorId = computed<Record<string, Cliente>>(() => {
  return clientes.value.reduce<Record<string, Cliente>>((acc, cliente) => {
    acc[cliente.id] = cliente
    return acc
  }, {})
})

const statusFiltro = ref<StatusArte | "">("")
const clienteFiltroTexto = ref("")
const clienteFiltroId = ref<string | null>(null)
const periodoInicio = ref("")
const periodoFim = ref("")
const modeloCobrancaFiltro = ref<ModeloCobranca | "">("")
const statusPagamentoFiltro = ref<StatusPagamento | "">("")
const clienteFiltroDropdownAberto = ref(false)

const filtroQuery = computed(() => ({
  idCliente: clienteFiltroId.value || undefined,
  status: statusFiltro.value || undefined,
  periodoInicio: periodoInicio.value || undefined,
  periodoFim: periodoFim.value || undefined,
  modeloCobranca: modeloCobrancaFiltro.value || undefined,
  statusPagamento: statusPagamentoFiltro.value || undefined,
}))

const artesQuery = useQuery({
  queryKey: computed(() => ["artes", idConta.value, filtroQuery.value]),
  queryFn: async ({ signal }) => {
    if (!idConta.value) return []
    const { data, error } = await listarArtes(idConta.value, filtroQuery.value, signal)
    if (error) {
      throw new Error(error)
    }
    return data
  },
  enabled: computed(() => Boolean(idConta.value)),
})

const clienteBusca = ref("")
const clienteDropdownAberto = ref(false)
const clientesFiltradosSelect = computed(() => {
  const termo = clienteBusca.value.trim().toLowerCase()
  const lista = clientes.value
  if (!termo) {
    return lista.slice(0, 10)
  }
  return lista
    .filter((cliente) => {
      const campos = [cliente.nome, cliente.cidade ?? "", cliente.instagram ?? ""]
      return campos.some((campo) => campo.toLowerCase().includes(termo))
    })
    .slice(0, 12)
})

const clientesFiltradosFiltro = computed(() => {
  const termo = clienteFiltroTexto.value.trim().toLowerCase()
  const lista = clientes.value
  if (!termo) {
    return lista.slice(0, 10)
  }
  return lista
    .filter((cliente) => {
      const campos = [cliente.nome, cliente.cidade ?? "", cliente.instagram ?? ""]
      return campos.some((campo) => campo.toLowerCase().includes(termo))
    })
    .slice(0, 12)
})

const artesFiltradas = computed(() => {
  const termo = termoBusca.value.trim().toLowerCase()
  let lista = statusFiltro.value
    ? artes.value.filter((arte) => arte.status === statusFiltro.value)
    : artes.value
  const termoCliente = clienteFiltroTexto.value.trim().toLowerCase()
  if (termoCliente) {
    lista = lista.filter((arte) => {
      const nomeCliente = clientesPorId.value[arte.id_cliente ?? ""]?.nome ?? ""
      return nomeCliente.toLowerCase().includes(termoCliente)
    })
  }
  if (periodoInicio.value) {
    lista = lista.filter((arte) => arte.criado_em >= periodoInicio.value)
  }
  if (periodoFim.value) {
    lista = lista.filter((arte) => arte.criado_em <= periodoFim.value)
  }
  if (modeloCobrancaFiltro.value) {
    lista = lista.filter(
      (arte) => arte.financeiro?.modelo_cobranca === modeloCobrancaFiltro.value,
    )
  }
  if (statusPagamentoFiltro.value) {
    lista = lista.filter(
      (arte) => arte.financeiro?.status_pagamento === statusPagamentoFiltro.value,
    )
  }
  if (!termo) return lista

  return lista.filter((arte) => {
    const campos = [
      arte.titulo,
      arte.descricao ?? "",
      arte.status,
      arte.link_download ?? "",
      clientesPorId.value[arte.id_cliente ?? ""]?.nome ?? "",
    ]
    return campos.some((campo) => campo.toLowerCase().includes(termo))
  })
})

const formatarValor = (valorCentavos: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorCentavos / 100)
}

const parseValor = (valor: string) => {
  const normalizado = valor.replace(",", ".")
  const numero = Number(normalizado)
  if (!Number.isFinite(numero) || numero < 0) {
    return 0
  }
  return Math.round(numero * 100)
}

const obterStatusLabel = (status: StatusArte) => {
  return statusOptions.find((item) => item.value === status)?.label ?? status
}

const obterModeloLabel = (modelo: ModeloCobranca | null | undefined) => {
  if (!modelo) return "Nao informado"
  return modeloCobrancaOptions.find((item) => item.value === modelo)?.label ?? modelo
}

const obterStatusPagamentoLabel = (status: StatusPagamento | null | undefined) => {
  if (!status) return "Nao informado"
  return statusPagamentoOptions.find((item) => item.value === status)?.label ?? status
}

const obterClasseStatus = (status: StatusArte) => {
  switch (status) {
    case "entregue":
      return "bg-emerald-100 text-emerald-700"
    case "pronta":
      return "bg-blue-100 text-blue-700"
    case "em_producao":
      return "bg-amber-100 text-amber-700"
    case "cancelada":
      return "bg-rose-100 text-rose-700"
    case "pendente":
    default:
      return "bg-amber-100 text-amber-700"
  }
}

const limparFiltros = () => {
  termoBusca.value = ""
  statusFiltro.value = ""
  clienteFiltroTexto.value = ""
  clienteFiltroId.value = null
  periodoInicio.value = ""
  periodoFim.value = ""
  modeloCobrancaFiltro.value = ""
  statusPagamentoFiltro.value = ""
  clienteFiltroDropdownAberto.value = false
}

const limparFormulario = () => {
  formulario.id_cliente = ""
  clienteBusca.value = ""
  clienteDropdownAberto.value = false
  formulario.titulo = ""
  formulario.descricao = ""
  formulario.valor = ""
  formulario.link_download = ""
  formulario.status = "pendente"
  formulario.prazo_entrega = calcularPrazoPadrao()
  editandoId.value = null
  erros.titulo = ""
}

const abrirCadastro = () => {
  limparFormulario()
  modo.value = "form"
}

const validar = () => {
  erros.titulo = ""

  if (!formulario.titulo.trim()) {
    erros.titulo = "Informe um titulo para a arte."
  }

  return !erros.titulo
}

const salvarArte = async () => {
  if (!idConta.value) {
    toast.error("Conta nao carregada. Recarregue a pagina.")
    return
  }
  if (!validar()) return

  const payload: ArtePayload = {
    id_cliente: formulario.id_cliente || null,
    titulo: formulario.titulo.trim(),
    descricao: formulario.descricao.trim() || null,
    valor_centavos: parseValor(formulario.valor),
    link_download: formulario.link_download.trim() || null,
    status: formulario.status,
    prazo_entrega: formulario.prazo_entrega || null,
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

      queryClient.setQueriesData<ArteComFinanceiro[]>(
        { queryKey: ["artes", idConta.value] },
        (lista = []) =>
          lista.map((arte) => (arte.id === data.id ? { ...arte, ...data } : arte)),
      )
      toast.success("Arte atualizada com sucesso.")
      limparFormulario()
      modo.value = "lista"
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

    const financeiroCriado = await withAbortTimeout(
      (signal) => garantirFinanceiroArte(data.id, {}, signal),
      15000,
    )

    if (financeiroCriado.error) {
      toast.error("Arte criada, mas nao foi possivel criar o financeiro.")
    }

    const arteComFinanceiro: ArteComFinanceiro = {
      ...data,
      financeiro: financeiroCriado.data ?? null,
    }

    queryClient.setQueriesData<ArteComFinanceiro[]>(
      { queryKey: ["artes", idConta.value] },
      (lista = []) => [arteComFinanceiro, ...lista],
    )
    await queryClient.invalidateQueries({ queryKey: ["artes", idConta.value] })
    toast.success("Arte cadastrada com sucesso.")
    limparFormulario()
    modo.value = "lista"
  } catch (error) {
    const mensagem =
      error instanceof Error && /abort|timeout/i.test(error.message)
        ? "O servidor demorou para responder. Tente novamente."
        : "Erro inesperado ao salvar a arte."
    toast.error(mensagem)
  }
}

const iniciarEdicao = (arte: ArteComFinanceiro) => {
  formulario.id_cliente = arte.id_cliente ?? ""
  clienteBusca.value = arte.id_cliente
    ? clientesPorId.value[arte.id_cliente]?.nome ?? ""
    : ""
  clienteDropdownAberto.value = false
  formulario.titulo = arte.titulo
  formulario.descricao = arte.descricao ?? ""
  formulario.valor = (arte.valor_centavos / 100).toFixed(2)
  formulario.link_download = arte.link_download ?? ""
  formulario.status = arte.status
  formulario.prazo_entrega = arte.prazo_entrega ?? ""
  editandoId.value = arte.id
  erros.titulo = ""
  modo.value = "form"
}

const abrirDropdownClienteFiltro = () => {
  clienteFiltroDropdownAberto.value = true
}

const alternarDropdownClienteFiltro = () => {
  clienteFiltroDropdownAberto.value = !clienteFiltroDropdownAberto.value
}

const fecharDropdownClienteFiltro = () => {
  clienteFiltroDropdownAberto.value = false
}

const selecionarClienteFiltro = (cliente: Cliente | null) => {
  if (cliente) {
    clienteFiltroTexto.value = cliente.nome
    clienteFiltroId.value = cliente.id
  } else {
    clienteFiltroTexto.value = ""
    clienteFiltroId.value = null
  }
  clienteFiltroDropdownAberto.value = false
}

const handleClienteFiltroFocusOut = (event: FocusEvent) => {
  const alvo = event.relatedTarget as HTMLElement | null
  if (alvo && alvo.closest?.("[data-cliente-filtro-dropdown]")) {
    return
  }
  fecharDropdownClienteFiltro()
}

const abrirDropdownCliente = () => {
  clienteDropdownAberto.value = true
}

const alternarDropdownCliente = () => {
  clienteDropdownAberto.value = !clienteDropdownAberto.value
}

const fecharDropdownCliente = () => {
  clienteDropdownAberto.value = false
}

const selecionarCliente = (cliente: Cliente | null) => {
  if (cliente) {
    formulario.id_cliente = cliente.id
    clienteBusca.value = cliente.nome
  } else {
    formulario.id_cliente = ""
    clienteBusca.value = ""
  }
  clienteDropdownAberto.value = false
}

const handleClienteFocusOut = (event: FocusEvent) => {
  const alvo = event.relatedTarget as HTMLElement | null
  if (alvo && alvo.closest?.("[data-cliente-dropdown]")) {
    return
  }
  fecharDropdownCliente()
}

const cancelarEdicao = () => {
  limparFormulario()
  modo.value = "lista"
}

const excluirArte = async (arte: ArteComFinanceiro) => {
  if (!idConta.value) return

  const confirmar = window.confirm(`Remover "${arte.titulo}"? Essa acao nao pode ser desfeita.`)
  if (!confirmar) return

  try {
    const idRemovido = await withAbortTimeout(
      (signal) => removerMutation.mutateAsync({ id: arte.id, signal }),
      15000,
    )
    queryClient.setQueriesData<ArteComFinanceiro[]>(
      { queryKey: ["artes", idConta.value] },
      (lista = []) => lista.filter((item) => item.id !== idRemovido),
    )
    toast.success("Arte removida com sucesso.")
  } catch (error) {
    const mensagem =
      error instanceof Error && /abort|timeout/i.test(error.message)
        ? "O servidor demorou para responder. Tente novamente."
        : "Nao foi possivel remover a arte."
    toast.error(mensagem)
    return
  }

  if (editandoId.value === arte.id) {
    limparFormulario()
  }
}
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold">Artes</h1>
        <p class="text-sm text-muted-foreground">
          Cadastre serviços, controle status e prazos de entrega.
        </p>
      </div>
      <Button v-if="modo === 'lista'" type="button" size="sm" @click="abrirCadastro">
        <PlusIcon class="size-4" />
        <span>Nova arte</span>
      </Button>
      <Button v-else type="button" variant="outline" size="sm" @click="cancelarEdicao">
        <ArrowLeftIcon class="size-4" />
        <span>Voltar para lista</span>
      </Button>
    </header>

    <div v-if="modo === 'form'" class="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{{ editandoId ? "Editar arte" : "Nova arte" }}</CardTitle>
          <CardDescription>Defina o titulo, status e prazo do servico.</CardDescription>
        </CardHeader>
        <CardContent>
          <form class="space-y-4" @submit.prevent="salvarArte">
            <div class="space-y-2">
              <Label for="titulo">Titulo</Label>
              <Input id="titulo" v-model="formulario.titulo" placeholder="Ex: Arte para Instagram" />
              <p v-if="erros.titulo" class="text-xs text-destructive">{{ erros.titulo }}</p>
            </div>

            <div class="space-y-2">
              <Label for="cliente">Cliente</Label>
              <div
                class="relative"
                data-cliente-dropdown
                @focusout="handleClienteFocusOut"
              >
                <Input
                  id="cliente"
                  v-model="clienteBusca"
                  placeholder="Buscar cliente"
                  @focus="abrirDropdownCliente"
                  @input="formulario.id_cliente = ''"
                  @keydown.down="abrirDropdownCliente"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  @click="alternarDropdownCliente"
                >
                  <ChevronsUpDownIcon class="size-4" />
                </button>

                <div
                  v-if="clienteDropdownAberto"
                  class="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-lg"
                >
                  <div class="max-h-56 overflow-auto p-1">
                    <button
                      type="button"
                      data-cliente-dropdown
                      class="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-muted/60"
                      @click="selecionarCliente(null)"
                    >
                      <span>Sem cliente</span>
                    </button>
                    <div v-if="!clientesFiltradosSelect.length" class="px-2 py-2 text-xs text-muted-foreground">
                      Nenhum cliente encontrado.
                    </div>
                    <button
                      v-for="cliente in clientesFiltradosSelect"
                      :key="cliente.id"
                      type="button"
                      data-cliente-dropdown
                      class="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-muted/60"
                      @click="selecionarCliente(cliente)"
                    >
                      <span class="font-medium">{{ cliente.nome }}</span>
                      <span class="text-xs text-muted-foreground">
                        {{ cliente.cidade || "Cidade nao informada" }}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <p class="text-xs text-muted-foreground">
                Digite para filtrar e selecione na lista.
              </p>
            </div>

            <div class="space-y-2">
              <Label for="valor">Valor</Label>
              <Input
                id="valor"
                v-model="formulario.valor"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
              />
            </div>

            <div class="space-y-2">
              <Label for="descricao">Descricao</Label>
              <textarea
                id="descricao"
                v-model="formulario.descricao"
                rows="4"
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                placeholder="Detalhes do pedido, resumo e observacoes"
              ></textarea>
            </div>

            <div class="space-y-2">
              <Label for="link">Endereco para baixar</Label>
              <Input
                id="link"
                v-model="formulario.link_download"
                type="url"
                placeholder="https://exemplo.com/arquivo"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2">
                <Label for="status">Status</Label>
                <select
                  id="status"
                  v-model="formulario.status"
                  class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                    {{ status.label }}
                  </option>
                </select>
              </div>

              <div class="space-y-2">
                <Label for="prazo">Prazo de entrega</Label>
                <Input id="prazo" v-model="formulario.prazo_entrega" type="date" />
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <Button class="flex-1" type="submit" :disabled="salvando">
                <Loader2Icon v-if="salvando" class="size-4 animate-spin" />
                <SaveIcon v-else class="size-4" />
                <span>{{ salvando ? "Salvando..." : "Salvar arte" }}</span>
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
              <CardTitle>Lista de artes</CardTitle>
              <CardDescription>{{ artes.length }} artes cadastradas.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="busca">Buscar</Label>
            <Input id="busca" v-model="termoBusca" placeholder="Titulo, descricao ou status" />
          </div>

          <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div class="space-y-2">
              <Label for="filtro-status">Status</Label>
              <select
                id="filtro-status"
                v-model="statusFiltro"
                class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">Todos</option>
                <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                  {{ status.label }}
                </option>
              </select>
            </div>

            <div class="space-y-2">
              <Label for="filtro-cliente">Cliente</Label>
              <div class="relative" data-cliente-filtro-dropdown @focusout="handleClienteFiltroFocusOut">
                <Input
                  id="filtro-cliente"
                  v-model="clienteFiltroTexto"
                  placeholder="Buscar cliente"
                  @focus="abrirDropdownClienteFiltro"
                  @input="clienteFiltroId = null; abrirDropdownClienteFiltro()"
                  @keydown.down="abrirDropdownClienteFiltro"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  @click="alternarDropdownClienteFiltro"
                >
                  <ChevronsUpDownIcon class="size-4" />
                </button>

                <div
                  v-if="clienteFiltroDropdownAberto"
                  class="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-lg"
                >
                  <div class="max-h-56 overflow-auto p-1">
                    <button
                      type="button"
                      data-cliente-filtro-dropdown
                      class="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-muted/60"
                      @click="selecionarClienteFiltro(null)"
                    >
                      <span>Todos</span>
                    </button>
                    <div
                      v-if="!clientesFiltradosFiltro.length"
                      class="px-2 py-2 text-xs text-muted-foreground"
                    >
                      Nenhum cliente encontrado.
                    </div>
                    <button
                      v-for="cliente in clientesFiltradosFiltro"
                      :key="cliente.id"
                      type="button"
                      data-cliente-filtro-dropdown
                      class="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-muted/60"
                      @click="selecionarClienteFiltro(cliente)"
                    >
                      <span class="font-medium">{{ cliente.nome }}</span>
                      <span class="text-xs text-muted-foreground">
                        {{ cliente.cidade || "Cidade nao informada" }}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <Label for="filtro-modelo">Modelo de cobranca</Label>
              <select
                id="filtro-modelo"
                v-model="modeloCobrancaFiltro"
                class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">Todos</option>
                <option
                  v-for="modelo in modeloCobrancaOptions"
                  :key="modelo.value"
                  :value="modelo.value"
                >
                  {{ modelo.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div class="space-y-2">
              <Label for="filtro-pagamento">Status pagamento</Label>
              <select
                id="filtro-pagamento"
                v-model="statusPagamentoFiltro"
                class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">Todos</option>
                <option
                  v-for="statusPagamento in statusPagamentoOptions"
                  :key="statusPagamento.value"
                  :value="statusPagamento.value"
                >
                  {{ statusPagamento.label }}
                </option>
              </select>
            </div>

            <div class="space-y-2">
              <Label for="filtro-inicio">Periodo inicio</Label>
              <Input id="filtro-inicio" v-model="periodoInicio" type="date" />
            </div>

            <div class="space-y-2">
              <Label for="filtro-fim">Periodo fim</Label>
              <Input id="filtro-fim" v-model="periodoFim" type="date" />
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" @click="limparFiltros">
              Limpar filtros
            </Button>
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

          <div
            v-if="carregandoInicial"
            class="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground"
          >
            Carregando artes...
          </div>

          <div
            v-else-if="!artesFiltradas.length"
            class="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground"
          >
            Nenhuma arte encontrada. Cadastre a primeira arte.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="arte in artesFiltradas"
              :key="arte.id"
              class="rounded-lg border bg-card/70 p-4 shadow-sm"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-sm font-semibold">{{ arte.titulo }}</p>
                    <span
                      class="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                      :class="obterClasseStatus(arte.status)"
                    >
                      {{ obterStatusLabel(arte.status) }}
                    </span>
                  </div>
                  <p v-if="arte.descricao" class="text-xs text-muted-foreground">
                    {{ arte.descricao }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    Cliente: {{
                      arte.id_cliente
                        ? clientesPorId[arte.id_cliente]?.nome ?? "Cliente nao encontrado"
                        : "Nao informado"
                    }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    Valor: {{ formatarValor(arte.valor_centavos) }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    Cobranca: {{ obterModeloLabel(arte.financeiro?.modelo_cobranca) }} • Pagamento:
                    {{ obterStatusPagamentoLabel(arte.financeiro?.status_pagamento) }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    Prazo: {{ arte.prazo_entrega || "Nao informado" }}
                  </p>
                  <a
                    v-if="arte.link_download"
                    :href="arte.link_download"
                    class="text-xs font-medium text-primary underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Endereco para baixar
                  </a>
                </div>
                <div class="flex gap-2">
                  <Button size="sm" variant="secondary" as-child>
                    <RouterLink :to="`/app/artes/${arte.id}`">Detalhes</RouterLink>
                  </Button>
                  <Button size="sm" variant="outline" @click="iniciarEdicao(arte)">
                    <PencilIcon class="size-4" />
                    <span>Editar</span>
                  </Button>
                  <Button size="sm" variant="destructive" @click="excluirArte(arte)">
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
