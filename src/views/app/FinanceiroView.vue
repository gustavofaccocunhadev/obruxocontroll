<script setup lang="ts">
import { computed } from "vue"
import { useQuery } from "@tanstack/vue-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useContaStore } from "@/stores/conta"
import { listarFinanceiroConta, type FinanceiroComArte } from "@/repositories/financeiro"

const contaStore = useContaStore()
const idConta = computed(() => contaStore.contaAtual?.id ?? "")

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

const mesAtual = computed(() => {
  const hoje = new Date()
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(hoje)
})

const obterDataReferencia = (item: FinanceiroComArte) => {
  if (item.status_pagamento === "paga" && item.pago_em) {
    return item.pago_em
  }
  if (item.cobrado_em) {
    return item.cobrado_em
  }
  return item.criado_em
}

const isNoMesAtual = (dataTexto: string) => {
  const data = new Date(dataTexto)
  if (Number.isNaN(data.getTime())) return false
  const hoje = new Date()
  return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear()
}

const totais = computed(() => {
  let recebido = 0
  let pendente = 0
  let cortesia = 0
  let plano = 0

  itens.value.forEach((item) => {
    const dataRef = obterDataReferencia(item)
    if (!isNoMesAtual(dataRef)) return

    switch (item.status_pagamento) {
      case "paga":
        recebido += item.valor_centavos
        break
      case "cortesia":
        cortesia += item.valor_centavos
        break
      case "plano":
        plano += item.valor_centavos
        break
      case "pendente":
      default:
        pendente += item.valor_centavos
        break
    }
  })

  return { recebido, pendente, cortesia, plano }
})

const formatarValor = (valorCentavos: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorCentavos / 100)
}

const modeloCobrancaLabel = (modelo: FinanceiroComArte["modelo_cobranca"]) => {
  switch (modelo) {
    case "antes":
      return "Antes"
    case "depois":
      return "Depois"
    case "plano":
      return "Plano"
    case "cortesia":
      return "Cortesia"
    default:
      return modelo
  }
}

const statusPagamentoLabel = (status: FinanceiroComArte["status_pagamento"]) => {
  switch (status) {
    case "paga":
      return "Paga"
    case "cortesia":
      return "Cortesia"
    case "plano":
      return "Plano"
    case "pendente":
    default:
      return "Pendente"
  }
}
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold">Financeiro</h1>
      <p class="text-sm text-muted-foreground">Resumo do mes e listagem de cobrancas.</p>
    </header>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Recebido</CardTitle>
          <CardDescription>{{ mesAtual }}</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-lg font-semibold">{{ formatarValor(totais.recebido) }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pendente</CardTitle>
          <CardDescription>{{ mesAtual }}</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-lg font-semibold">{{ formatarValor(totais.pendente) }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cortesia</CardTitle>
          <CardDescription>{{ mesAtual }}</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-lg font-semibold">{{ formatarValor(totais.cortesia) }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Plano</CardTitle>
          <CardDescription>{{ mesAtual }}</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-lg font-semibold">{{ formatarValor(totais.plano) }}</p>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Listagem do financeiro</CardTitle>
            <CardDescription>{{ itens.length }} registros encontrados.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
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
          v-else-if="!itens.length"
          class="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground"
        >
          Nenhum registro financeiro encontrado.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in itens"
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
                  Modelo: {{ modeloCobrancaLabel(item.modelo_cobranca) }} • Pagamento:
                  {{ statusPagamentoLabel(item.status_pagamento) }}
                </p>
                <p class="text-xs text-muted-foreground">
                  Cobrado em: {{ item.cobrado_em || "Nao informado" }} • Pago em:
                  {{ item.pago_em || "Nao informado" }}
                </p>
              </div>
              <div class="flex flex-col items-end gap-2">
                <p class="text-sm font-semibold">{{ formatarValor(item.valor_centavos) }}</p>
                <Button size="sm" variant="outline" as-child>
                  <RouterLink :to="`/app/artes/${item.id_arte}`">Ver arte</RouterLink>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </section>
</template>
