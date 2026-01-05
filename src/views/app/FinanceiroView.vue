<script setup lang="ts">
import { computed, ref } from "vue"
import { useQuery } from "@tanstack/vue-query"
import { ChevronsUpDownIcon } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useContaStore } from "@/stores/conta"
import { listarClientes, type Cliente } from "@/repositories/clientes"
import { listarFinanceiroConta, type FinanceiroComArte } from "@/repositories/financeiro"

const contaStore = useContaStore()
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

const clientes = computed(() => clientesQuery.data.value ?? [])

const financeiroQuery = useQuery({
  queryKey: computed(() => ["financeiro-conta", idConta.value]),
  queryFn: async ({ signal }) => {
    if (!idConta.value) return []
    const { data, error } = await listarFinanceiroConta(idConta.value, signal)
    if (error) {
      throw new Error(error)
    }
    return data
  },
  enabled: computed(() => Boolean(idConta.value)),
})

const itens = computed(() => financeiroQuery.data.value ?? [])
const carregando = computed(() => financeiroQuery.isLoading.value)
const atualizando = computed(
  () => financeiroQuery.isFetching.value && !financeiroQuery.isLoading.value,
)
const erroListagem = computed(() => {
  if (!financeiroQuery.isError.value) return ""
  return itens.value.length
    ? "Falha ao atualizar o financeiro. Exibindo dados locais."
    : "Nao foi possivel carregar o financeiro."
})

const meses = [
  { value: "todos", label: "Todos" },
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Marco" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
]

const mesSelecionado = ref("todos")
const anoSelecionado = ref("todos")

const mesReferencia = computed(() => {
  if (mesSelecionado.value === "todos" && anoSelecionado.value === "todos") {
    return "Todos os meses"
  }
  if (mesSelecionado.value === "todos" && anoSelecionado.value !== "todos") {
    return `Ano ${anoSelecionado.value}`
  }
  const mesLabel = meses.find((item) => item.value === mesSelecionado.value)?.label ?? ""
  if (anoSelecionado.value === "todos") {
    return `${mesLabel} (todos os anos)`
  }
  return `${mesLabel} de ${anoSelecionado.value}`
})

const obterDataReferencia = (item: FinanceiroComArte) => {
  if (item.status_pagamento === "paga" && item.pago_em) {
    return item.pago_em
  }
  return item.criado_em
}

const isNoMesSelecionado = (dataTexto: string) => {
  const data = new Date(dataTexto)
  if (Number.isNaN(data.getTime())) return false
  const mesTodos = mesSelecionado.value === "todos"
  const anoTodos = anoSelecionado.value === "todos"
  const mes = Number(mesSelecionado.value)
  const ano = Number(anoSelecionado.value)
  if (mesTodos && anoTodos) return true
  if (!mesTodos && anoTodos) {
    return data.getMonth() === mes - 1
  }
  if (mesTodos && !anoTodos) {
    return data.getFullYear() === ano
  }
  if (!ano || !mes) return false
  return data.getMonth() === mes - 1 && data.getFullYear() === ano
}

const clienteFiltroTexto = ref("")
const clienteFiltroId = ref<string | null>(null)
const clienteFiltroDropdownAberto = ref(false)
const statusPagamentoFiltro = ref<FinanceiroComArte["status_pagamento"] | "">("pendente")
const modeloCobrancaFiltro = ref<FinanceiroComArte["modelo_cobranca"] | "">("")

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

const itensFiltrados = computed(() => {
  let lista = itens.value

  lista = lista.filter((item) => isNoMesSelecionado(obterDataReferencia(item)))

  if (statusPagamentoFiltro.value) {
    lista = lista.filter((item) => item.status_pagamento === statusPagamentoFiltro.value)
  }

  if (modeloCobrancaFiltro.value) {
    lista = lista.filter((item) => item.modelo_cobranca === modeloCobrancaFiltro.value)
  }

  if (clienteFiltroId.value) {
    lista = lista.filter((item) => {
      const idCliente = item.arte?.id_cliente ?? item.cliente?.id ?? ""
      return idCliente === clienteFiltroId.value
    })
  } else if (clienteFiltroTexto.value.trim()) {
    const termo = clienteFiltroTexto.value.trim().toLowerCase()
    lista = lista.filter((item) =>
      (item.cliente?.nome ?? "").toLowerCase().includes(termo),
    )
  }

  return lista
})

const anosDisponiveis = computed(() => {
  const anos = new Set<string>()
  itens.value.forEach((item) => {
    const dataRef = obterDataReferencia(item)
    const data = new Date(dataRef)
    if (!Number.isNaN(data.getTime())) {
      anos.add(String(data.getFullYear()))
    }
  })
  anos.add(String(new Date().getFullYear()))
  return Array.from(anos).sort((a, b) => Number(b) - Number(a))
})

const totais = computed(() => {
  let recebido = 0
  let pendente = 0
  itensFiltrados.value.forEach((item) => {
    switch (item.status_pagamento) {
      case "paga":
        recebido += item.valor_centavos
        break
      case "pendente":
      default:
        pendente += item.valor_centavos
        break
    }
  })

  return { recebido, pendente }
})

const limparFiltros = () => {
  clienteFiltroTexto.value = ""
  clienteFiltroId.value = null
  clienteFiltroDropdownAberto.value = false
  statusPagamentoFiltro.value = "pendente"
  modeloCobrancaFiltro.value = ""
  mesSelecionado.value = "todos"
  anoSelecionado.value = "todos"
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

const formatarValor = (valorCentavos: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorCentavos / 100)
}

const modeloCobrancaLabel = (modelo: FinanceiroComArte["modelo_cobranca"]) => {
  switch (modelo) {
    case "padrao":
      return "Padrao"
    case "plano":
      return "Plano"
    case "cortesia":
      return "Cortesia"
    case "parceria":
      return "Parceria"
    default:
      return modelo
  }
}

const statusPagamentoLabel = (status: FinanceiroComArte["status_pagamento"]) => {
  switch (status) {
    case "paga":
      return "Paga"
    case "pendente":
    default:
      return "Pendente"
  }
}

const statusPagamentoClasse = (status: FinanceiroComArte["status_pagamento"]) => {
  switch (status) {
    case "paga":
      return "text-emerald-700"
    case "pendente":
    default:
      return "text-rose-700"
  }
}
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold">Financeiro</h1>
      <p class="text-sm text-muted-foreground">Resumo do mes e listagem de cobrancas.</p>
    </header>

    <div class="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Recebido</CardTitle>
          <CardDescription>{{ mesReferencia || "Mes selecionado" }}</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-lg font-semibold">{{ formatarValor(totais.recebido) }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pendente</CardTitle>
          <CardDescription>{{ mesReferencia || "Mes selecionado" }}</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-lg font-semibold">{{ formatarValor(totais.pendente) }}</p>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Listagem do financeiro</CardTitle>
            <CardDescription>{{ itensFiltrados.length }} registros encontrados.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <div class="space-y-1">
            <Label for="filtro-mes">Mes</Label>
            <select
              id="filtro-mes"
              v-model="mesSelecionado"
              class="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option v-for="mes in meses" :key="mes.value" :value="mes.value">
                {{ mes.label }}
              </option>
            </select>
          </div>
          <div class="space-y-1">
            <Label for="filtro-ano">Ano</Label>
            <select
              id="filtro-ano"
              v-model="anoSelecionado"
              class="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="todos">Todos</option>
              <option v-for="ano in anosDisponiveis" :key="ano" :value="ano">
                {{ ano }}
              </option>
            </select>
          </div>
          <div class="space-y-1 lg:col-span-2">
            <Label for="filtro-cliente">Cliente</Label>
            <div
              class="relative"
              data-cliente-filtro-dropdown
              @focusout="handleClienteFiltroFocusOut"
            >
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
          <div class="space-y-1">
            <Label for="filtro-status">Status pagamento</Label>
            <select
              id="filtro-status"
              v-model="statusPagamentoFiltro"
              class="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="paga">Paga</option>
            </select>
          </div>
          <div class="space-y-1">
            <Label for="filtro-modelo">Modelo cobranca</Label>
            <select
              id="filtro-modelo"
              v-model="modeloCobrancaFiltro"
              class="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="">Todos</option>
              <option value="padrao">Padrao</option>
              <option value="plano">Plano</option>
              <option value="cortesia">Cortesia</option>
              <option value="parceria">Parceria</option>
            </select>
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
          v-if="carregando"
          class="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground"
        >
          Carregando financeiro...
        </div>

        <div
          v-else-if="!itensFiltrados.length"
          class="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground"
        >
          Nenhum registro encontrado para os filtros informados.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in itensFiltrados"
            :key="item.id_arte"
            class="rounded-lg border bg-card/70 p-4 shadow-sm"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="space-y-1">
                <p class="text-sm font-semibold">
                  {{ item.arte?.titulo || "Arte sem titulo" }}
                </p>
                <p class="text-xs text-muted-foreground">
                  Cliente: {{ item.cliente?.nome || "Nao informado" }}
                </p>
                <p class="text-xs text-muted-foreground">
                  Modelo: {{ modeloCobrancaLabel(item.modelo_cobranca) }} - Pagamento:
                  <span :class="statusPagamentoClasse(item.status_pagamento)">
                    {{ statusPagamentoLabel(item.status_pagamento) }}
                  </span>
                </p>
                <p class="text-xs text-muted-foreground">
                  Pago em: {{ item.pago_em || "Nao informado" }}
                </p>
              </div>
              <div class="flex flex-col items-end gap-2">
                <p class="text-sm font-semibold">{{ formatarValor(item.valor_centavos) }}</p>
                <Button size="sm" variant="outline" as-child>
                  <RouterLink
                    :to="{
                      path: `/app/artes/${item.id_arte}`,
                      query: { origem: 'financeiro' },
                    }"
                  >
                    Ver arte
                  </RouterLink>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </section>
</template>
