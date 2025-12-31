import { supabase } from "@/lib/supabase"

export type Cliente = {
  id: string
  id_conta: string
  nome: string
  whatsapp: string | null
  instagram: string | null
  id_categoria: string
  cidade: string | null
  criado_em: string
  atualizado_em: string
}

type ClienteInput = {
  nome: string
  whatsapp?: string | null
  instagram?: string | null
  id_categoria: string
  cidade?: string | null
}

const camposCliente =
  "id,id_conta,nome,whatsapp,instagram,id_categoria,cidade,criado_em,atualizado_em"

export const listarClientes = async (idConta: string, signal?: AbortSignal) => {
  const request = supabase
    .from("clientes")
    .select(camposCliente)
    .eq("id_conta", idConta)
    .order("criado_em", { ascending: false })

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request

  return { data: (data as Cliente[] | null) ?? [], error: error?.message ?? null }
}

export const criarCliente = async (
  idConta: string,
  payload: ClienteInput,
  signal?: AbortSignal,
) => {
  const request = supabase
    .from("clientes")
    .insert({
      id_conta: idConta,
      nome: payload.nome,
      whatsapp: payload.whatsapp ?? null,
      instagram: payload.instagram ?? null,
      id_categoria: payload.id_categoria,
      cidade: payload.cidade ?? null,
    })
    .select(camposCliente)

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request.single()

  return { data: (data as Cliente | null) ?? null, error: error?.message ?? null }
}

export const atualizarCliente = async (
  idConta: string,
  idCliente: string,
  payload: ClienteInput,
  signal?: AbortSignal,
) => {
  const request = supabase
    .from("clientes")
    .update({
      nome: payload.nome,
      whatsapp: payload.whatsapp ?? null,
      instagram: payload.instagram ?? null,
      id_categoria: payload.id_categoria,
      cidade: payload.cidade ?? null,
    })
    .eq("id", idCliente)
    .eq("id_conta", idConta)
    .select(camposCliente)

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request.single()

  return { data: (data as Cliente | null) ?? null, error: error?.message ?? null }
}

export const removerCliente = async (
  idConta: string,
  idCliente: string,
  signal?: AbortSignal,
) => {
  const request = supabase
    .from("clientes")
    .delete()
    .eq("id", idCliente)
    .eq("id_conta", idConta)

  if (signal) {
    request.abortSignal(signal)
  }

  const { error } = await request

  return { error: error?.message ?? null }
}
