import { supabase } from "@/lib/supabase"

export type TipoCliente = "time" | "empresa" | "atleta" | "outro"

export type Cliente = {
  id: string
  id_conta: string
  nome: string
  whatsapp: string | null
  instagram: string | null
  tipo: TipoCliente
  cidade: string | null
  criado_em: string
  atualizado_em: string
}

type ClienteInput = {
  nome: string
  whatsapp?: string | null
  instagram?: string | null
  tipo: TipoCliente
  cidade?: string | null
}

const camposCliente = "id,id_conta,nome,whatsapp,instagram,tipo,cidade,criado_em,atualizado_em"

export const listarClientes = async (idConta: string) => {
  const { data, error } = await supabase
    .from("clientes")
    .select(camposCliente)
    .eq("id_conta", idConta)
    .order("criado_em", { ascending: false })

  return { data: (data as Cliente[] | null) ?? [], error: error?.message ?? null }
}

export const criarCliente = async (idConta: string, payload: ClienteInput) => {
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      id_conta: idConta,
      nome: payload.nome,
      whatsapp: payload.whatsapp ?? null,
      instagram: payload.instagram ?? null,
      tipo: payload.tipo,
      cidade: payload.cidade ?? null,
    })
    .select(camposCliente)
    .single()

  return { data: (data as Cliente | null) ?? null, error: error?.message ?? null }
}

export const atualizarCliente = async (
  idConta: string,
  idCliente: string,
  payload: ClienteInput,
) => {
  const { data, error } = await supabase
    .from("clientes")
    .update({
      nome: payload.nome,
      whatsapp: payload.whatsapp ?? null,
      instagram: payload.instagram ?? null,
      tipo: payload.tipo,
      cidade: payload.cidade ?? null,
    })
    .eq("id", idCliente)
    .eq("id_conta", idConta)
    .select(camposCliente)
    .single()

  return { data: (data as Cliente | null) ?? null, error: error?.message ?? null }
}

export const removerCliente = async (idConta: string, idCliente: string) => {
  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", idCliente)
    .eq("id_conta", idConta)

  return { error: error?.message ?? null }
}
