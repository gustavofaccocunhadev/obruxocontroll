import { supabase } from "@/lib/supabase"
import type { FinanceiroArte, ModeloCobranca, StatusPagamento } from "@/repositories/financeiro"

export type StatusArte = "pendente" | "em_producao" | "pronta" | "entregue" | "cancelada"

export type Arte = {
  id: string
  id_conta: string
  id_cliente: string | null
  titulo: string
  descricao: string | null
  valor_centavos: number
  link_download: string | null
  status: StatusArte
  prazo_entrega: string | null
  criado_em: string
  atualizado_em: string
}

export type ArteFiltro = {
  idCliente?: string | null
  status?: StatusArte
  periodoInicio?: string
  periodoFim?: string
  modeloCobranca?: ModeloCobranca
  statusPagamento?: StatusPagamento
}

type ArteInput = {
  id_cliente?: string | null
  titulo: string
  descricao?: string | null
  valor_centavos?: number
  link_download?: string | null
  status?: StatusArte
  prazo_entrega?: string | null
}

const camposArte =
  "id,id_conta,id_cliente,titulo,descricao,valor_centavos,link_download,status,prazo_entrega,criado_em,atualizado_em"

const camposFinanceiro =
  "id_arte,modelo_cobranca,status_pagamento,valor_centavos,cobrado_em,pago_em,observacoes,criado_em,atualizado_em"

export type ArteComFinanceiro = Arte & {
  financeiro: FinanceiroArte | null
}

export const listarArtes = async (
  idConta: string,
  filtro: ArteFiltro = {},
  signal?: AbortSignal,
) => {
  const precisaFiltroFinanceiro = Boolean(filtro.modeloCobranca || filtro.statusPagamento)
  const join = precisaFiltroFinanceiro ? "!inner" : ""
  let request = supabase
    .from("artes")
    .select(`${camposArte}, financeiro:financeiro_artes${join}(${camposFinanceiro})`)
    .eq("id_conta", idConta)
    .order("criado_em", { ascending: false })

  if (filtro.idCliente) {
    request = request.eq("id_cliente", filtro.idCliente)
  }

  if (filtro.status) {
    request = request.eq("status", filtro.status)
  }

  if (filtro.periodoInicio) {
    request = request.gte("criado_em", filtro.periodoInicio)
  }

  if (filtro.periodoFim) {
    request = request.lte("criado_em", filtro.periodoFim)
  }

  if (filtro.modeloCobranca) {
    request = request.eq("financeiro_artes.modelo_cobranca", filtro.modeloCobranca)
  }

  if (filtro.statusPagamento) {
    request = request.eq("financeiro_artes.status_pagamento", filtro.statusPagamento)
  }

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request

  const lista = ((data as (Arte & { financeiro?: FinanceiroArte[] | FinanceiroArte | null })[] | null) ?? [])
    .map((item) => {
      const financeiro = Array.isArray(item.financeiro)
        ? item.financeiro[0] ?? null
        : item.financeiro ?? null
      return { ...item, financeiro }
    })

  return { data: lista, error: error?.message ?? null }
}

export const criarArte = async (
  idConta: string,
  payload: ArteInput,
  signal?: AbortSignal,
) => {
  const request = supabase
    .from("artes")
    .insert({
      id_conta: idConta,
      id_cliente: payload.id_cliente ?? null,
      titulo: payload.titulo,
      descricao: payload.descricao ?? null,
      valor_centavos: payload.valor_centavos ?? 0,
      link_download: payload.link_download ?? null,
      status: payload.status ?? "pendente",
      prazo_entrega: payload.prazo_entrega ?? null,
    })
    .select(camposArte)

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request.single()

  return { data: (data as Arte | null) ?? null, error: error?.message ?? null }
}

export const atualizarArte = async (
  idConta: string,
  idArte: string,
  payload: ArteInput,
  signal?: AbortSignal,
) => {
  const request = supabase
    .from("artes")
    .update({
      id_cliente: payload.id_cliente ?? null,
      titulo: payload.titulo,
      descricao: payload.descricao ?? null,
      valor_centavos: payload.valor_centavos ?? 0,
      link_download: payload.link_download ?? null,
      status: payload.status ?? "pendente",
      prazo_entrega: payload.prazo_entrega ?? null,
    })
    .eq("id", idArte)
    .eq("id_conta", idConta)
    .select(camposArte)

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request.single()

  return { data: (data as Arte | null) ?? null, error: error?.message ?? null }
}

export const removerArte = async (
  idConta: string,
  idArte: string,
  signal?: AbortSignal,
) => {
  const request = supabase
    .from("artes")
    .delete()
    .eq("id", idArte)
    .eq("id_conta", idConta)

  if (signal) {
    request.abortSignal(signal)
  }

  const { error } = await request

  return { error: error?.message ?? null }
}

export const obterArte = async (
  idConta: string,
  idArte: string,
  signal?: AbortSignal,
) => {
  const request = supabase
    .from("artes")
    .select(camposArte)
    .eq("id", idArte)
    .eq("id_conta", idConta)

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request.single()

  return { data: (data as Arte | null) ?? null, error: error?.message ?? null }
}
