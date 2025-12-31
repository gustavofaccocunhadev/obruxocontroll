import { supabase } from "@/lib/supabase"

export type ModeloCobranca = "antes" | "depois" | "plano" | "cortesia"

export type StatusPagamento = "pendente" | "paga" | "cortesia" | "plano"

export type FinanceiroArte = {
  id_arte: string
  modelo_cobranca: ModeloCobranca
  status_pagamento: StatusPagamento
  valor_centavos: number
  cobrado_em: string | null
  pago_em: string | null
  observacoes: string | null
  criado_em: string
  atualizado_em: string
}

export type FinanceiroComArte = FinanceiroArte & {
  arte: {
    id: string
    titulo: string
    id_cliente: string | null
    status: string
    criado_em: string
  } | null
  cliente: {
    id: string
    nome: string
  } | null
}

type FinanceiroArteInput = {
  modelo_cobranca?: ModeloCobranca
  status_pagamento?: StatusPagamento
  valor_centavos?: number
  cobrado_em?: string | null
  pago_em?: string | null
  observacoes?: string | null
}

const camposFinanceiro =
  "id_arte,modelo_cobranca,status_pagamento,valor_centavos,cobrado_em,pago_em,observacoes,criado_em,atualizado_em"

const camposArte = "id,titulo,id_cliente,status,criado_em"
const camposCliente = "id,nome"

export const obterFinanceiroArte = async (idArte: string, signal?: AbortSignal) => {
  const request = supabase
    .from("financeiro_artes")
    .select(camposFinanceiro)
    .eq("id_arte", idArte)

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request.maybeSingle()

  return { data: (data as FinanceiroArte | null) ?? null, error: error?.message ?? null }
}

export const criarFinanceiroArte = async (
  idArte: string,
  payload: FinanceiroArteInput = {},
  signal?: AbortSignal,
) => {
  const request = supabase
    .from("financeiro_artes")
    .insert({
      id_arte: idArte,
      modelo_cobranca: payload.modelo_cobranca ?? "antes",
      status_pagamento: payload.status_pagamento ?? "pendente",
      valor_centavos: payload.valor_centavos ?? 0,
      cobrado_em: payload.cobrado_em ?? null,
      pago_em: payload.pago_em ?? null,
      observacoes: payload.observacoes ?? null,
    })
    .select(camposFinanceiro)

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request.single()

  return { data: (data as FinanceiroArte | null) ?? null, error: error?.message ?? null }
}

export const garantirFinanceiroArte = async (
  idArte: string,
  payload: FinanceiroArteInput = {},
  signal?: AbortSignal,
) => {
  const request = supabase
    .from("financeiro_artes")
    .upsert(
      {
        id_arte: idArte,
        modelo_cobranca: payload.modelo_cobranca ?? "antes",
        status_pagamento: payload.status_pagamento ?? "pendente",
        valor_centavos: payload.valor_centavos ?? 0,
        cobrado_em: payload.cobrado_em ?? null,
        pago_em: payload.pago_em ?? null,
        observacoes: payload.observacoes ?? null,
      },
      {
        onConflict: "id_arte",
        ignoreDuplicates: true,
      },
    )
    .select(camposFinanceiro)

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request.maybeSingle()

  return { data: (data as FinanceiroArte | null) ?? null, error: error?.message ?? null }
}

export const atualizarFinanceiroArte = async (
  idArte: string,
  payload: FinanceiroArteInput,
  signal?: AbortSignal,
) => {
  const updates: Record<string, unknown> = {}

  if (payload.modelo_cobranca !== undefined) {
    updates.modelo_cobranca = payload.modelo_cobranca
  }

  if (payload.status_pagamento !== undefined) {
    updates.status_pagamento = payload.status_pagamento
  }

  if (payload.valor_centavos !== undefined) {
    updates.valor_centavos = payload.valor_centavos
  }

  if (payload.cobrado_em !== undefined) {
    updates.cobrado_em = payload.cobrado_em
  }

  if (payload.pago_em !== undefined) {
    updates.pago_em = payload.pago_em
  }

  if (payload.observacoes !== undefined) {
    updates.observacoes = payload.observacoes
  }

  const request = supabase
    .from("financeiro_artes")
    .update(updates)
    .eq("id_arte", idArte)
    .select(camposFinanceiro)

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request.single()

  return { data: (data as FinanceiroArte | null) ?? null, error: error?.message ?? null }
}

export const removerFinanceiroArte = async (idArte: string, signal?: AbortSignal) => {
  const request = supabase.from("financeiro_artes").delete().eq("id_arte", idArte)

  if (signal) {
    request.abortSignal(signal)
  }

  const { error } = await request

  return { error: error?.message ?? null }
}

export const listarFinanceiroConta = async (
  idConta: string,
  signal?: AbortSignal,
) => {
  let request = supabase
    .from("financeiro_artes")
    .select(
      `${camposFinanceiro}, arte:artes!inner (${camposArte}, cliente:clientes (${camposCliente}))`,
    )
    .eq("artes.id_conta", idConta)
    .order("criado_em", { ascending: false })

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request

  const lista =
    (data as (FinanceiroArte & {
      arte?: {
        id: string
        titulo: string
        id_cliente: string | null
        status: string
        criado_em: string
        cliente?: { id: string; nome: string } | null
      } | null
    })[] | null) ?? []

  const normalizado = lista.map((item) => {
    const arte = item.arte ?? null
    const cliente = arte?.cliente ?? null
    return {
      ...item,
      arte,
      cliente,
    }
  })

  return { data: normalizado as FinanceiroComArte[], error: error?.message ?? null }
}
