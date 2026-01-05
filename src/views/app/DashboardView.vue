<script setup lang="ts">
import { computed, provide, ref, type Ref } from "vue"
import { useQuery } from "@tanstack/vue-query"
import * as echarts from "echarts"
import VChart from "vue-echarts"
import {
  BadgeDollarSignIcon,
  ClipboardListIcon,
  CreditCardIcon,
  PaletteIcon,
  UsersIcon,
} from "lucide-vue-next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useContaStore } from "@/stores/conta"
import { listarClientes } from "@/repositories/clientes"
import { listarArtes } from "@/repositories/artes"
import { listarFinanceiroConta } from "@/repositories/financeiro"

const contaStore = useContaStore()
const idConta = computed(() => contaStore.contaAtual?.id ?? "")
provide("echarts", echarts)

const clientesQuery = useQuery({
  queryKey: computed(() => ["dashboard-clientes", idConta.value]),
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

const artesQuery = useQuery({
  queryKey: computed(() => ["dashboard-artes", idConta.value]),
  queryFn: async ({ signal }) => {
    if (!idConta.value) return []
    const { data, error } = await listarArtes(idConta.value, {}, signal)
    if (error) {
      throw new Error(error)
    }
    return data
  },
  enabled: computed(() => Boolean(idConta.value)),
})

const financeiroQuery = useQuery({
  queryKey: computed(() => ["dashboard-financeiro", idConta.value]),
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


const carregandoResumo = computed(
  () =>
    clientesQuery.isLoading.value ||
    artesQuery.isLoading.value ||
    financeiroQuery.isLoading.value,
)


const parseData = (dataTexto: string | null | undefined) => {
  if (!dataTexto) return null
  if (dataTexto.includes("T")) {
    const data = new Date(dataTexto)
    return Number.isNaN(data.getTime()) ? null : data
  }
  const [ano, mes, dia] = dataTexto.split("-")
  if (!ano || !mes || !dia) return null
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia))
  return Number.isNaN(data.getTime()) ? null : data
}

const formatarDataInput = (data: Date) => {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

const formatarDataCurta = (dataTexto: string) => {
  const data = parseData(dataTexto)
  if (!data) return dataTexto
  return data.toLocaleDateString("pt-BR")
}

const isNoMesAtual = (dataTexto: string | null | undefined) => {
  const data = parseData(dataTexto)
  if (!data) return false
  const hoje = new Date()
  return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear()
}

const hoje = new Date()
const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
const dataInicioRendimento = ref(formatarDataInput(inicioMes))
const dataFimRendimento = ref(formatarDataInput(hoje))
const dataInicioEntregas = ref(formatarDataInput(inicioMes))
const dataFimEntregas = ref(formatarDataInput(hoje))

const clientesMesAtual = computed(() => {
  const lista = clientesQuery.data.value ?? []
  return lista.filter((cliente) => isNoMesAtual(cliente.criado_em)).length
})

const artesMesAtual = computed(() => {
  const lista = artesQuery.data.value ?? []
  return lista.filter((arte) =>
    isNoMesAtual(arte.data_solicitacao ?? arte.criado_em),
  ).length
})

const pendentes = computed(() => {
  const lista = financeiroQuery.data.value ?? []
  return lista.filter((item) => item.status_pagamento === "pendente")
})

const totalPendentes = computed(() => {
  return pendentes.value.reduce((acc, item) => acc + item.valor_centavos, 0)
})

const mesAtualLabel = computed(() => {
  const hoje = new Date()
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(hoje)
})

const criarIntervaloDatas = (inicioRef: Ref<string>, fimRef: Ref<string>) =>
  computed(() => {
    const inicioPadrao = inicioMes
    const fimPadrao = hoje
    const inicioRaw = parseData(inicioRef.value) ?? inicioPadrao
    const fimRaw = parseData(fimRef.value) ?? fimPadrao
    let inicio = new Date(inicioRaw.getFullYear(), inicioRaw.getMonth(), inicioRaw.getDate())
    let fim = new Date(fimRaw.getFullYear(), fimRaw.getMonth(), fimRaw.getDate())
    if (inicio > fim) {
      const temp = inicio
      inicio = fim
      fim = temp
    }
    return { inicio, fim }
  })

const criarDiasNoIntervalo = (intervaloRef: Ref<{ inicio: Date; fim: Date }>) =>
  computed(() => {
    const { inicio, fim } = intervaloRef.value
    const dias: { data: Date; chave: string }[] = []
    const data = new Date(inicio)
    while (data <= fim) {
      dias.push({ data: new Date(data), chave: formatarDataInput(data) })
      data.setDate(data.getDate() + 1)
    }
    return dias
  })

const criarPeriodoGraficoLabel = (intervaloRef: Ref<{ inicio: Date; fim: Date }>) =>
  computed(() => {
    const { inicio, fim } = intervaloRef.value
    const inicioTexto = formatarDataInput(inicio)
    const fimTexto = formatarDataInput(fim)
    return `${formatarDataCurta(inicioTexto)} ate ${formatarDataCurta(fimTexto)}`
  })

const intervaloRendimento = criarIntervaloDatas(dataInicioRendimento, dataFimRendimento)
const intervaloEntregas = criarIntervaloDatas(dataInicioEntregas, dataFimEntregas)
const diasRendimento = criarDiasNoIntervalo(intervaloRendimento)
const diasEntregas = criarDiasNoIntervalo(intervaloEntregas)
const periodoRendimentoLabel = criarPeriodoGraficoLabel(intervaloRendimento)
const periodoEntregasLabel = criarPeriodoGraficoLabel(intervaloEntregas)

const recebidoMes = computed(() => {
  const hoje = new Date()
  const lista = financeiroQuery.data.value ?? []
  return lista.reduce((acc, item) => {
    if (item.status_pagamento !== "paga" || !item.pago_em) return acc
    const data = parseData(item.pago_em)
    if (!data) return acc
    if (data.getMonth() !== hoje.getMonth() || data.getFullYear() !== hoje.getFullYear()) {
      return acc
    }
    return acc + item.valor_centavos
  }, 0)
})


const rendimentoDiario = computed(() => {
  const dias = diasRendimento.value
  const mapa = new Map(dias.map((dia) => [dia.chave, 0]))
  const lista = financeiroQuery.data.value ?? []

  lista.forEach((item) => {
    if (item.status_pagamento !== "paga" || !item.pago_em) return
    const data = parseData(item.pago_em)
    if (!data) return
    const chave = formatarDataInput(data)
    if (!mapa.has(chave)) return
    mapa.set(chave, (mapa.get(chave) ?? 0) + item.valor_centavos)
  })

  return dias.map((dia) => ({
    dia: dia.data.getDate(),
    valor: mapa.get(dia.chave) ?? 0,
  }))
})

const rendimentoTotal = computed(() => {
  return rendimentoDiario.value.reduce((acc, item) => acc + item.valor, 0)
})

const rendimentoMedia = computed(() => {
  const dias = diasRendimento.value.length
  if (!dias) return 0
  return Math.round(rendimentoTotal.value / dias)
})

const entregasDiarias = computed(() => {
  const dias = diasEntregas.value
  const mapa = new Map(dias.map((dia) => [dia.chave, 0]))
  const lista = artesQuery.data.value ?? []

  lista.forEach((arte) => {
    if (arte.status !== "entregue" || !arte.data_entrega) return
    const data = parseData(arte.data_entrega)
    if (!data) return
    const chave = formatarDataInput(data)
    if (!mapa.has(chave)) return
    mapa.set(chave, (mapa.get(chave) ?? 0) + 1)
  })

  return dias.map((dia) => ({
    dia: dia.data.getDate(),
    valor: mapa.get(dia.chave) ?? 0,
  }))
})

const entregasTotal = computed(() => {
  return entregasDiarias.value.reduce((acc, item) => acc + item.valor, 0)
})

const entregasMedia = computed(() => {
  const dias = diasEntregas.value.length
  if (!dias) return 0
  return Math.round(entregasTotal.value / dias)
})

const formatarValor = (valorCentavos: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorCentavos / 100)
}

const categoriasGraficoRendimento = computed(() => {
  return diasRendimento.value.map((dia) =>
    dia.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  )
})

const categoriasGraficoEntregas = computed(() => {
  return diasEntregas.value.map((dia) =>
    dia.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  )
})

const graficoRendimentoOption = computed(() => ({
  animation: false,
  grid: { left: 12, right: 12, top: 18, bottom: 20, containLabel: true },
  tooltip: {
    trigger: "axis",
    confine: true,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 0,
    textStyle: { color: "#f8fafc", fontSize: 12 },
    formatter: (params: { axisValueLabel?: string; value?: number }[]) => {
      const info = params?.[0]
      const valor = Number(info?.value ?? 0)
      const label = info?.axisValueLabel ?? ""
      return `${label}<br/>${formatarValor(valor)}`
    },
  },
  xAxis: {
    type: "category",
    data: categoriasGraficoRendimento.value,
    boundaryGap: false,
    axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.3)" } },
    axisTick: { show: false },
    axisLabel: { color: "#6b7280", fontSize: 10 },
  },
  yAxis: {
    type: "value",
    min: 0,
    interval: 2000,
    axisLabel: {
      color: "#6b7280",
      fontSize: 10,
      formatter: (value: number) => formatarValor(Number(value)),
    },
    splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.2)" } },
  },
  series: [
    {
      type: "line",
      data: rendimentoDiario.value.map((item) => item.valor),
      smooth: true,
      showSymbol: false,
      lineStyle: { color: "#10b981", width: 2 },
      areaStyle: { color: "rgba(16, 185, 129, 0.2)" },
    },
  ],
}))

const graficoEntregasOption = computed(() => ({
  animation: false,
  grid: { left: 12, right: 12, top: 18, bottom: 20, containLabel: true },
  tooltip: {
    trigger: "axis",
    confine: true,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderWidth: 0,
    textStyle: { color: "#f8fafc", fontSize: 12 },
    formatter: (params: { axisValueLabel?: string; value?: number }[]) => {
      const info = params?.[0]
      const valor = Number(info?.value ?? 0)
      const label = info?.axisValueLabel ?? ""
      return `${label}<br/>${valor} entregas`
    },
  },
  xAxis: {
    type: "category",
    data: categoriasGraficoEntregas.value,
    boundaryGap: false,
    axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.3)" } },
    axisTick: { show: false },
    axisLabel: { color: "#6b7280", fontSize: 10 },
  },
  yAxis: {
    type: "value",
    min: 0,
    minInterval: 1,
    axisLabel: { color: "#6b7280", fontSize: 10 },
    splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.2)" } },
  },
  series: [
    {
      type: "line",
      data: entregasDiarias.value.map((item) => item.valor),
      smooth: true,
      showSymbol: false,
      lineStyle: { color: "#2563eb", width: 2 },
      areaStyle: { color: "rgba(37, 99, 235, 0.2)" },
    },
  ],
}))


const atalhos = [
  {
    titulo: "Novo cliente",
    descricao: "Cadastre clientes e organize suas contas.",
    to: { path: "/app/clientes", query: { acao: "novo" } },
    icon: UsersIcon,
    destaque: "from-emerald-50 via-white to-emerald-100/40",
    iconBg: "bg-emerald-500/10 text-emerald-700",
  },
  {
    titulo: "Nova arte",
    descricao: "Inicie um pedido e defina prazos.",
    to: { path: "/app/artes", query: { acao: "novo" } },
    icon: PaletteIcon,
    destaque: "from-blue-50 via-white to-indigo-100/50",
    iconBg: "bg-indigo-500/10 text-indigo-700",
  },
  {
    titulo: "Lancar pagamento",
    descricao: "Veja pendentes e registre recebimentos.",
    to: { path: "/app/financeiro" },
    icon: CreditCardIcon,
    destaque: "from-amber-50 via-white to-amber-100/60",
    iconBg: "bg-amber-500/10 text-amber-700",
  },
]
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold">Dashboard</h1>
    </header>

    <div class="space-y-6">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card class="relative overflow-hidden">
          <CardHeader class="space-y-1">
            <CardDescription>Novos clientes no mes</CardDescription>
            <CardTitle class="text-2xl font-semibold sm:text-3xl">
              {{ carregandoResumo ? "--" : clientesMesAtual }}
            </CardTitle>
          </CardHeader>
          <CardContent class="flex items-end justify-between">
            <p class="text-xs text-muted-foreground">{{ mesAtualLabel }}</p>
            <div class="rounded-full bg-blue-500/10 p-2 text-blue-600">
              <UsersIcon class="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card class="relative overflow-hidden">
          <CardHeader class="space-y-1">
            <CardDescription>Artes no mes atual</CardDescription>
            <CardTitle class="text-2xl font-semibold sm:text-3xl">
              {{ carregandoResumo ? "--" : artesMesAtual }}
            </CardTitle>
          </CardHeader>
          <CardContent class="flex items-end justify-between">
            <p class="text-xs text-muted-foreground">{{ mesAtualLabel }}</p>
            <div class="rounded-full bg-purple-500/10 p-2 text-purple-600">
              <ClipboardListIcon class="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card class="relative overflow-hidden">
          <CardHeader class="space-y-1">
            <CardDescription>Pagamentos pendentes</CardDescription>
            <CardTitle class="text-2xl font-semibold sm:text-3xl">
              {{ carregandoResumo ? "--" : pendentes.length }}
            </CardTitle>
          </CardHeader>
          <CardContent class="flex items-end justify-between">
            <p class="text-xs text-muted-foreground">
              {{ carregandoResumo ? "--" : formatarValor(totalPendentes) }}
            </p>
            <div class="rounded-full bg-rose-500/10 p-2 text-rose-600">
              <CreditCardIcon class="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card class="relative overflow-hidden">
          <CardHeader class="space-y-1">
            <CardDescription>Recebido no mes</CardDescription>
            <CardTitle class="text-2xl font-semibold sm:text-3xl">
              {{ carregandoResumo ? "--" : formatarValor(recebidoMes) }}
            </CardTitle>
          </CardHeader>
          <CardContent class="flex items-end justify-between">
            <p class="text-xs text-muted-foreground">{{ mesAtualLabel }}</p>
            <div class="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
              <BadgeDollarSignIcon class="size-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atalhos rapidos</CardTitle>
          <CardDescription>Abra os atalhos principais em um toque.</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <RouterLink
              v-for="atalho in atalhos"
              :key="atalho.titulo"
              :to="atalho.to"
              class="group relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 transition-transform duration-200 hover:-translate-y-0.5"
              :class="atalho.destaque"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-foreground">{{ atalho.titulo }}</p>
                  <p class="text-xs text-muted-foreground">{{ atalho.descricao }}</p>
                </div>
                <div class="rounded-full p-2" :class="atalho.iconBg">
                  <component :is="atalho.icon" class="size-5" />
                </div>
              </div>
            </RouterLink>
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader class="space-y-1">
            <CardTitle>Rendimento diario das artes</CardTitle>
            <CardDescription>{{ periodoRendimentoLabel }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex flex-wrap items-end gap-3">
              <div class="space-y-1">
                <Label for="grafico-rendimento-inicio">Data inicial</Label>
                <Input
                  id="grafico-rendimento-inicio"
                  v-model="dataInicioRendimento"
                  type="date"
                  class="w-[150px] sm:w-[160px]"
                />
              </div>
              <div class="space-y-1">
                <Label for="grafico-rendimento-fim">Data final</Label>
                <Input
                  id="grafico-rendimento-fim"
                  v-model="dataFimRendimento"
                  type="date"
                  class="w-[150px] sm:w-[160px]"
                />
              </div>
            </div>

            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-xs text-muted-foreground">Total no periodo</p>
                <p class="text-lg font-semibold">
                  {{ carregandoResumo ? "--" : formatarValor(rendimentoTotal) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Media diaria</p>
                <p class="text-lg font-semibold">
                  {{ carregandoResumo ? "--" : formatarValor(rendimentoMedia) }}
                </p>
              </div>
            </div>

            <div class="relative h-44 w-full overflow-hidden rounded-lg bg-muted/40 p-3 sm:h-52">
              <VChart
                v-if="!carregandoResumo && rendimentoTotal > 0"
                class="h-full w-full"
                :option="graficoRendimentoOption"
                :autoresize="true"
              />
              <div
                v-else
                class="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground"
              >
                {{ carregandoResumo ? "Carregando grafico..." : "Nenhum pagamento no periodo." }}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="space-y-1">
            <CardTitle>Artes entregues por dia</CardTitle>
            <CardDescription>{{ periodoEntregasLabel }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex flex-wrap items-end gap-3">
              <div class="space-y-1">
                <Label for="grafico-entregas-inicio">Data inicial</Label>
                <Input
                  id="grafico-entregas-inicio"
                  v-model="dataInicioEntregas"
                  type="date"
                  class="w-[150px] sm:w-[160px]"
                />
              </div>
              <div class="space-y-1">
                <Label for="grafico-entregas-fim">Data final</Label>
                <Input
                  id="grafico-entregas-fim"
                  v-model="dataFimEntregas"
                  type="date"
                  class="w-[150px] sm:w-[160px]"
                />
              </div>
            </div>

            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-xs text-muted-foreground">Total entregue</p>
                <p class="text-lg font-semibold">
                  {{ carregandoResumo ? "--" : entregasTotal }}
                </p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Media diaria</p>
                <p class="text-lg font-semibold">
                  {{ carregandoResumo ? "--" : entregasMedia }}
                </p>
              </div>
            </div>

            <div class="relative h-44 w-full overflow-hidden rounded-lg bg-muted/40 p-3 sm:h-52">
              <VChart
                v-if="!carregandoResumo && entregasTotal > 0"
                class="h-full w-full"
                :option="graficoEntregasOption"
                :autoresize="true"
              />
              <div
                v-else
                class="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground"
              >
                {{ carregandoResumo ? "Carregando grafico..." : "Nenhuma entrega no periodo." }}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
</template>
