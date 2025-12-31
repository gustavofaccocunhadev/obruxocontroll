import { supabase } from "@/lib/supabase"

export type CategoriaCliente = {
  id: string
  id_conta: string
  nome: string
  descricao: string | null
  criado_em: string
  atualizado_em: string
}

type CategoriaClienteInput = {
  nome: string
  descricao?: string | null
}

const camposCategoria =
  "id,id_conta,nome,descricao,criado_em,atualizado_em"

export const listarCategoriasClientes = async (
  idConta: string,
  signal?: AbortSignal,
) => {
  const request = supabase
    .from("categorias_clientes")
    .select(camposCategoria)
    .eq("id_conta", idConta)
    .order("nome", { ascending: true })

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request

  return { data: (data as CategoriaCliente[] | null) ?? [], error: error?.message ?? null }
}

export const criarCategoriaCliente = async (
  idConta: string,
  payload: CategoriaClienteInput,
  signal?: AbortSignal,
) => {
  const request = supabase
    .from("categorias_clientes")
    .insert({
      id_conta: idConta,
      nome: payload.nome,
      descricao: payload.descricao ?? null,
    })
    .select(camposCategoria)

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request.single()

  return { data: (data as CategoriaCliente | null) ?? null, error: error?.message ?? null }
}

export const atualizarCategoriaCliente = async (
  idConta: string,
  idCategoria: string,
  payload: CategoriaClienteInput,
  signal?: AbortSignal,
) => {
  const request = supabase
    .from("categorias_clientes")
    .update({
      nome: payload.nome,
      descricao: payload.descricao ?? null,
    })
    .eq("id", idCategoria)
    .eq("id_conta", idConta)
    .select(camposCategoria)

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request.single()

  return { data: (data as CategoriaCliente | null) ?? null, error: error?.message ?? null }
}

export const removerCategoriaCliente = async (
  idConta: string,
  idCategoria: string,
  signal?: AbortSignal,
) => {
  const request = supabase
    .from("categorias_clientes")
    .delete()
    .eq("id", idCategoria)
    .eq("id_conta", idConta)

  if (signal) {
    request.abortSignal(signal)
  }

  const { error } = await request

  return { error: error?.message ?? null }
}
