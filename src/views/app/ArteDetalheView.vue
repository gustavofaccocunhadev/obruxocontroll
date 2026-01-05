<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query"
import {
  ArrowLeftIcon,
  Loader2Icon,
  SaveIcon,
  Trash2Icon,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "vue-sonner"
import { useContaStore } from "@/stores/conta"
import { atualizarArte, obterArte, removerArte, type StatusArte } from "@/repositories/artes"
import { listarClientes } from "@/repositories/clientes"
import {
  atualizarFinanceiroArte,
  garantirFinanceiroArte,
  obterFinanceiroArte,
  removerFinanceiroArte,
  type FinanceiroArte,
  type ModeloCobranca,
  type StatusPagamento,
} from "@/repositories/financeiro"
import {
  gerarUrlArquivoArte,
  listarArquivosArte,
  renomearArquivoArte,
  removerArquivoArte,
  uploadArquivoArte,
  type ArquivoArte,
} from "@/repositories/arquivos"

const route = useRoute()
const router = useRouter()
const contaStore = useContaStore()
const queryClient = useQueryClient()

const idConta = computed(() => contaStore.contaAtual?.id ?? "")
const idArte = computed(() => String(route.params.id ?? ""))
const origemFinanceiro = computed(() => route.query.origem === "financeiro")

const statusOptions = [
  { value: "pendente", label: "PENDENTE" },
  { value: "em_producao", label: "EM PRODUCAO" },
  { value: "pronta", label: "PRONTA" },
  { value: "entregue", label: "ENTREGUE" },
  { value: "cancelada", label: "CANCELADA" },
]

const modeloCobrancaOptions = [
  { value: "padrao", label: "Padrao" },
  { value: "plano", label: "Plano" },
  { value: "cortesia", label: "Cortesia" },
  { value: "parceria", label: "Parceria" },
]

const statusPagamentoOptions = [
  { value: "pendente", label: "Pendente" },
  { value: "paga", label: "Paga" },
]

const arteForm = reactive({
  id_cliente: "",
  data_solicitacao: "",
  data_entrega: "",
  titulo: "",
  descricao: "",
  valor: "",
  link_download: "",
  status: "pendente" as StatusArte,
  prazo_entrega: "",
})

const financeiroForm = reactive({
  modelo_cobranca: "padrao" as ModeloCobranca,
  status_pagamento: "pendente" as StatusPagamento,
  valor: "",
  pago_em: "",
  observacoes: "",
})

const uploadandoArquivo = ref(false)

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

const formatarDataInput = (data: Date) => {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

const normalizarTexto = (valor: string) => {
  const texto = valor.trim()
  return texto ? texto : null
}

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

const arteQuery = useQuery({
  queryKey: computed(() => ["arte", idConta.value, idArte.value]),
  queryFn: async ({ signal }) => {
    if (!idConta.value || !idArte.value) return null
    const { data, error } = await obterArte(idConta.value, idArte.value, signal)
    if (error) {
      throw new Error(error)
    }
    return data
  },
  enabled: computed(() => Boolean(idConta.value && idArte.value)),
})

const financeiroQuery = useQuery({
  queryKey: computed(() => ["financeiro", idArte.value]),
  queryFn: async ({ signal }) => {
    if (!idArte.value) return null
    const { data, error } = await obterFinanceiroArte(idArte.value, signal)
    if (error) {
      throw new Error(error)
    }
    return data
  },
  enabled: computed(() => Boolean(idArte.value)),
})

const arquivosQuery = useQuery({
  queryKey: computed(() => ["arquivos", idArte.value]),
  queryFn: async ({ signal }) => {
    if (!idArte.value) return []
    const { data, error } = await listarArquivosArte(idArte.value, signal)
    if (error) {
      throw new Error(error)
    }
    return data
  },
  enabled: computed(() => Boolean(idArte.value)),
})

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
const arquivos = computed(() => arquivosQuery.data.value ?? [])
const carregandoArte = computed(() => arteQuery.isLoading.value)
const carregandoFinanceiro = computed(() => financeiroQuery.isLoading.value)
const carregandoArquivos = computed(() => arquivosQuery.isLoading.value)
const erroFinanceiro = computed(() =>
  financeiroQuery.isError.value ? "Nao foi possivel carregar o financeiro." : "",
)
const erroArquivos = computed(() =>
  arquivosQuery.isError.value ? "Nao foi possivel carregar os arquivos." : "",
)
const salvandoArte = computed(() => atualizarArteMutation.isPending.value)
const salvandoFinanceiroExtra = ref(false)
const salvandoFinanceiro = computed(
  () => atualizarFinanceiroMutation.isPending.value || salvandoFinanceiroExtra.value,
)

const atualizarArteMutation = useMutation({
  mutationFn: async ({
    payload,
    signal,
  }: {
    payload: {
      id_cliente?: string | null
      data_solicitacao: string
      data_entrega?: string | null
      titulo: string
      descricao?: string | null
      valor_centavos?: number
      link_download?: string | null
      status?: StatusArte
      prazo_entrega?: string | null
    }
    signal?: AbortSignal
  }) => {
    if (!idConta.value || !idArte.value) {
      throw new Error("conta")
    }
    const { data, error } = await atualizarArte(idConta.value, idArte.value, payload, signal)
    if (error || !data) {
      throw new Error(error ?? "erro")
    }
    return data
  },
})

const atualizarFinanceiroMutation = useMutation({
  mutationFn: async ({
    payload,
    signal,
  }: {
    payload: {
      modelo_cobranca?: ModeloCobranca
      status_pagamento?: StatusPagamento
      valor_centavos?: number
      pago_em?: string | null
      observacoes?: string | null
    }
    signal?: AbortSignal
  }) => {
    if (!idArte.value) {
      throw new Error("arte")
    }
    const { data, error } = await atualizarFinanceiroArte(idArte.value, payload, signal)
    if (error || !data) {
      throw new Error(error ?? "erro")
    }
    return data
  },
})

const removerArteMutation = useMutation({
  mutationFn: async ({ signal }: { signal?: AbortSignal }) => {
    if (!idConta.value || !idArte.value) {
      throw new Error("conta")
    }
    const { error } = await removerArte(idConta.value, idArte.value, signal)
    if (error) {
      throw new Error(error)
    }
    return idArte.value
  },
})

watch(
  () => arteQuery.data.value,
  (arte) => {
    if (!arte) return
    arteForm.id_cliente = arte.id_cliente ?? ""
    arteForm.data_solicitacao = arte.data_solicitacao ?? formatarDataInput(new Date())
    arteForm.data_entrega = arte.data_entrega ?? ""
    arteForm.titulo = arte.titulo
    arteForm.descricao = arte.descricao ?? ""
    arteForm.valor = (arte.valor_centavos / 100).toFixed(2)
    arteForm.link_download = arte.link_download ?? ""
    arteForm.status = arte.status
    arteForm.prazo_entrega = arte.prazo_entrega ?? ""
  },
  { immediate: true },
)

watch(
  () => financeiroQuery.data.value,
  (financeiro) => {
    if (!financeiro) return
    financeiroForm.modelo_cobranca = financeiro.modelo_cobranca
    financeiroForm.status_pagamento = financeiro.status_pagamento
    financeiroForm.valor = (financeiro.valor_centavos / 100).toFixed(2)
    financeiroForm.pago_em = financeiro.pago_em ?? ""
    financeiroForm.observacoes = financeiro.observacoes ?? ""
  },
  { immediate: true },
)

watch(
  () => financeiroForm.modelo_cobranca,
  (modelo) => {
    if (modelo === "cortesia") {
      financeiroForm.status_pagamento = "paga"
      financeiroForm.valor = "0"
    }
  },
)

watch(
  () => arteForm.status,
  (status) => {
    if (status === "entregue") {
      if (!arteForm.data_entrega) {
        arteForm.data_entrega = formatarDataInput(new Date())
      }
      return
    }
    arteForm.data_entrega = ""
  },
)

const salvarArte = async () => {
  if (!idConta.value || !idArte.value) return

  if (!arteForm.data_solicitacao) {
    toast.error("Informe a data da solicitacao.")
    return
  }

  if (!arteForm.titulo.trim()) {
    toast.error("Informe um titulo para a arte.")
    return
  }

  if (arteForm.status === "entregue" && !arteForm.data_entrega) {
    arteForm.data_entrega = formatarDataInput(new Date())
  }

  const dataEntrega =
    arteForm.status === "entregue" ? arteForm.data_entrega : null

  try {
    const payload = {
      id_cliente: arteForm.id_cliente || null,
      data_solicitacao: arteForm.data_solicitacao,
      data_entrega: dataEntrega,
      titulo: arteForm.titulo.trim(),
      descricao: normalizarTexto(arteForm.descricao),
      valor_centavos: parseValor(arteForm.valor),
      link_download: normalizarTexto(arteForm.link_download),
      status: arteForm.status,
      prazo_entrega: arteForm.prazo_entrega || null,
    }

    const data = await withAbortTimeout(
      (signal) => atualizarArteMutation.mutateAsync({ payload, signal }),
      15000,
    )

    queryClient.setQueriesData({ queryKey: ["arte", idConta.value, idArte.value] }, data)
    await queryClient.invalidateQueries({ queryKey: ["artes", idConta.value] })
    toast.success("Arte salva com sucesso.")
  } catch (error) {
    const mensagem =
      error instanceof Error && /abort|timeout/i.test(error.message)
        ? "O servidor demorou para responder. Tente novamente."
        : "Nao foi possivel atualizar a arte."
    toast.error(mensagem)
  }
}

const salvarFinanceiro = async () => {
  if (!idArte.value) return

  const payload: Partial<FinanceiroArte> = {
    modelo_cobranca: financeiroForm.modelo_cobranca,
    status_pagamento: financeiroForm.status_pagamento,
    valor_centavos: parseValor(financeiroForm.valor),
    pago_em: financeiroForm.pago_em || null,
    observacoes: normalizarTexto(financeiroForm.observacoes),
  }

  if (payload.modelo_cobranca === "cortesia") {
    payload.status_pagamento = "paga"
    payload.valor_centavos = 0
  }

  salvandoFinanceiroExtra.value = true
  try {
    if (!financeiroQuery.data.value) {
      const { error } = await withAbortTimeout(
        (signal) => garantirFinanceiroArte(idArte.value, payload, signal),
        15000,
      )
      if (error) {
        throw new Error(error)
      }
    } else {
      await withAbortTimeout(
        (signal) => atualizarFinanceiroMutation.mutateAsync({ payload, signal }),
        15000,
      )
    }

    await queryClient.invalidateQueries({ queryKey: ["financeiro", idArte.value] })
    await queryClient.invalidateQueries({ queryKey: ["financeiro-conta", idConta.value] })
    await queryClient.invalidateQueries({ queryKey: ["artes", idConta.value] })
    toast.success("Pagamento salvo com sucesso.")
  } catch (error) {
    const mensagem =
      error instanceof Error && /abort|timeout/i.test(error.message)
        ? "O servidor demorou para responder. Tente novamente."
        : "Nao foi possivel atualizar o financeiro."
    toast.error(mensagem)
  } finally {
    salvandoFinanceiroExtra.value = false
  }
}

const excluirArte = async () => {
  if (!idConta.value || !idArte.value) return
  const confirmar = window.confirm("Remover esta arte? Essa acao nao pode ser desfeita.")
  if (!confirmar) return

  try {
    await withAbortTimeout((signal) => removerArteMutation.mutateAsync({ signal }), 15000)
    toast.success("Arte removida.")
    router.push("/app/artes")
  } catch (error) {
    const mensagem =
      error instanceof Error && /abort|timeout/i.test(error.message)
        ? "O servidor demorou para responder. Tente novamente."
        : "Nao foi possivel remover a arte."
    toast.error(mensagem)
  }
}

const removerFinanceiro = async () => {
  if (!idArte.value) return
  const confirmar = window.confirm("Remover o registro financeiro desta arte?")
  if (!confirmar) return

  try {
    const { error } = await withAbortTimeout(
      (signal) => removerFinanceiroArte(idArte.value, signal),
      15000,
    )
    if (error) {
      throw new Error(error)
    }
    await queryClient.invalidateQueries({ queryKey: ["financeiro", idArte.value] })
    await queryClient.invalidateQueries({ queryKey: ["financeiro-conta", idConta.value] })
    await queryClient.invalidateQueries({ queryKey: ["artes", idConta.value] })
    financeiroForm.modelo_cobranca = "padrao"
    financeiroForm.status_pagamento = "pendente"
    financeiroForm.valor = ""
    financeiroForm.pago_em = ""
    financeiroForm.observacoes = ""
    toast.success("Financeiro removido.")
  } catch {
    toast.error("Nao foi possivel remover o financeiro.")
  }
}

const handleUploadArquivo = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const arquivo = input.files?.[0]
  if (!arquivo || !idConta.value || !idArte.value) {
    return
  }

  uploadandoArquivo.value = true
  try {
    const { error } = await uploadArquivoArte(idConta.value, idArte.value, arquivo, {})
    if (error) {
      throw new Error(error)
    }
    await queryClient.invalidateQueries({ queryKey: ["arquivos", idArte.value] })
    toast.success("Arquivo enviado com sucesso.")
  } catch (error) {
    toast.error("Nao foi possivel enviar o arquivo.")
  } finally {
    uploadandoArquivo.value = false
    input.value = ""
  }
}

const abrirArquivo = async (arquivo: ArquivoArte) => {
  try {
    const { data, error } = await gerarUrlArquivoArte(arquivo.path, 600, false)
    if (error || !data) {
      throw new Error(error ?? "erro")
    }
    window.open(data, "_blank", "noopener")
  } catch {
    toast.error("Nao foi possivel abrir o arquivo.")
  }
}

const excluirArquivo = async (arquivo: ArquivoArte) => {
  const confirmar = window.confirm(`Remover o arquivo "${arquivo.nome_arquivo}"?`)
  if (!confirmar) return

  try {
    const { error } = await removerArquivoArte(arquivo)
    if (error) {
      throw new Error(error)
    }
    await queryClient.invalidateQueries({ queryKey: ["arquivos", idArte.value] })
    toast.success("Arquivo removido.")
  } catch {
    toast.error("Nao foi possivel remover o arquivo.")
  }
}

const renomearArquivo = async (arquivo: ArquivoArte) => {
  if (!idConta.value) return
  const novoNome = window.prompt("Novo nome do arquivo:", arquivo.nome_arquivo)
  if (!novoNome) return

  try {
    const { error } = await renomearArquivoArte(idConta.value, arquivo, novoNome)
    if (error) {
      throw new Error(error)
    }
    await queryClient.invalidateQueries({ queryKey: ["arquivos", idArte.value] })
    toast.success("Arquivo renomeado.")
  } catch {
    toast.error("Nao foi possivel renomear o arquivo.")
  }
}
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold">Detalhe da arte</h1>
        <p class="text-sm text-muted-foreground">Ajuste dados da arte, financeiro e arquivos.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button
          v-if="origemFinanceiro"
          type="button"
          variant="outline"
          size="sm"
          @click="router.push('/app/financeiro')"
        >
          <ArrowLeftIcon class="size-4" />
          <span>Voltar para financeiro</span>
        </Button>
        <Button type="button" variant="outline" size="sm" @click="router.push('/app/artes')">
          <ArrowLeftIcon class="size-4" />
          <span>Voltar para artes</span>
        </Button>
      </div>
    </header>

    <div v-if="carregandoArte" class="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
      Carregando arte...
    </div>

    <div
      v-else-if="!arteQuery.data.value"
      class="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground"
    >
      Arte nao encontrada.
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Informacoes da arte</CardTitle>
          <CardDescription>Atualize titulo, status e prazo.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2 w-fit">
            <Label for="data-solicitacao">Data da solicitacao</Label>
            <Input
              id="data-solicitacao"
              v-model="arteForm.data_solicitacao"
              type="date"
              class="w-[160px]"
            />
          </div>

          <div class="space-y-2">
            <Label for="titulo">Titulo</Label>
            <Input id="titulo" v-model="arteForm.titulo" placeholder="Ex: Arte para Instagram" />
          </div>

          <div class="space-y-2">
            <Label for="cliente">Cliente</Label>
            <select
              id="cliente"
              v-model="arteForm.id_cliente"
              class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="">Sem cliente</option>
              <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                {{ cliente.nome }}
              </option>
            </select>
          </div>

          <div class="space-y-2">
            <Label for="valor">Valor</Label>
            <Input id="valor" v-model="arteForm.valor" type="number" step="0.01" min="0" />
          </div>

          <div class="space-y-2">
            <Label for="descricao">Descricao</Label>
            <textarea
              id="descricao"
              v-model="arteForm.descricao"
              rows="4"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="Detalhes do pedido"
            ></textarea>
          </div>

          <div class="space-y-2">
            <Label for="link">Endereco para baixar</Label>
            <Input id="link" v-model="arteForm.link_download" type="url" placeholder="https://..." />
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div class="space-y-2">
              <Label for="status">Status</Label>
              <select
                id="status"
                v-model="arteForm.status"
                class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                  {{ status.label }}
                </option>
              </select>
            </div>
            <div class="space-y-2 w-fit">
              <Label for="prazo">Prazo de entrega</Label>
              <Input
                id="prazo"
                v-model="arteForm.prazo_entrega"
                type="date"
                class="w-[160px]"
              />
            </div>

            <div v-if="arteForm.status === 'entregue'" class="space-y-2 w-fit">
              <Label for="data-entrega">Data de entrega</Label>
              <Input
                id="data-entrega"
                v-model="arteForm.data_entrega"
                type="date"
                class="w-[160px]"
              />
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button class="flex-1" type="button" :disabled="salvandoArte" @click="salvarArte">
              <Loader2Icon v-if="salvandoArte" class="size-4 animate-spin" />
              <SaveIcon v-else class="size-4" />
              <span>{{ salvandoArte ? "Salvando..." : "Salvar arte" }}</span>
            </Button>
            <Button type="button" variant="destructive" :disabled="salvandoArte" @click="excluirArte">
              <Trash2Icon class="size-4" />
              <span>Excluir</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financeiro</CardTitle>
          <CardDescription>Modelo, status e datas de pagamento.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="carregandoFinanceiro" class="text-sm text-muted-foreground">
            Carregando financeiro...
          </div>
          <div v-else class="space-y-4">
            <div
              v-if="erroFinanceiro"
              class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {{ erroFinanceiro }}
            </div>
            <div class="space-y-2">
              <Label for="modelo">Modelo de cobranca</Label>
              <select
                id="modelo"
                v-model="financeiroForm.modelo_cobranca"
                class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option v-for="modelo in modeloCobrancaOptions" :key="modelo.value" :value="modelo.value">
                  {{ modelo.label }}
                </option>
              </select>
            </div>

            <div class="space-y-2">
              <Label for="status-pagamento">Status pagamento</Label>
              <select
                id="status-pagamento"
                v-model="financeiroForm.status_pagamento"
                class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                :disabled="financeiroForm.modelo_cobranca === 'cortesia'"
              >
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
              <Label for="valor-fin">Valor</Label>
              <Input
                id="valor-fin"
                v-model="financeiroForm.valor"
                type="number"
                step="0.01"
                min="0"
                :disabled="financeiroForm.modelo_cobranca === 'cortesia'"
              />
            </div>

            <div class="space-y-2 w-fit">
              <Label for="pago">Pago em</Label>
              <Input
                id="pago"
                v-model="financeiroForm.pago_em"
                type="date"
                class="w-[160px]"
              />
            </div>

            <div class="space-y-2">
              <Label for="observacoes">Observacoes</Label>
              <textarea
                id="observacoes"
                v-model="financeiroForm.observacoes"
                rows="3"
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                placeholder="Notas do pagamento"
              ></textarea>
            </div>

            <div class="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Valor atual: {{ formatarValor(parseValor(financeiroForm.valor)) }}
            </div>

            <Button class="w-full" type="button" :disabled="salvandoFinanceiro" @click="salvarFinanceiro">
              <Loader2Icon v-if="salvandoFinanceiro" class="size-4 animate-spin" />
              <SaveIcon v-else class="size-4" />
              <span>{{ salvandoFinanceiro ? "Salvando..." : "Salvar financeiro" }}</span>
            </Button>
            <Button
              class="w-full"
              type="button"
              variant="destructive"
              :disabled="salvandoFinanceiro"
              @click="removerFinanceiro"
            >
              Remover financeiro
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Arquivos</CardTitle>
        <CardDescription>Envie e gerencie os arquivos da arte.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input type="file" :disabled="uploadandoArquivo" @change="handleUploadArquivo" />
        </div>

        <div
          v-if="erroArquivos"
          class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {{ erroArquivos }}
        </div>

        <div v-if="carregandoArquivos" class="text-sm text-muted-foreground">
          Carregando arquivos...
        </div>

        <div v-else-if="!arquivos.length" class="text-sm text-muted-foreground">
          Nenhum arquivo enviado ainda.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="arquivo in arquivos"
            :key="arquivo.id"
            class="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card/70 px-3 py-2"
          >
            <div>
              <p class="text-sm font-semibold">{{ arquivo.nome_arquivo }}</p>
              <p class="text-xs text-muted-foreground">
                {{ arquivo.tipo_mime || "Tipo desconhecido" }} •
                {{ arquivo.tamanho_bytes ? `${arquivo.tamanho_bytes} bytes` : "Tamanho nao informado" }}
              </p>
            </div>
            <div class="flex gap-2">
              <Button size="sm" variant="secondary" @click="abrirArquivo(arquivo)">
                Abrir
              </Button>
              <Button size="sm" variant="outline" @click="renomearArquivo(arquivo)">
                Renomear
              </Button>
              <Button size="sm" variant="destructive" @click="excluirArquivo(arquivo)">
                Remover
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </section>
</template>
