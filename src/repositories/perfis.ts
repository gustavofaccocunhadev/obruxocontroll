import { supabase } from "@/lib/supabase"

export type Perfil = {
  id: string
  nome: string | null
  cpf_cnpj: string | null
  foto_path: string | null
  criado_em: string
  atualizado_em: string
}

type PerfilInput = {
  nome?: string | null
  cpf_cnpj?: string | null
  foto_path?: string | null
}

const camposPerfil = "id,nome,cpf_cnpj,foto_path,criado_em,atualizado_em"

const BUCKET_PERFIL = "perfil-files"

const normalizarNomeArquivo = (nomeArquivo: string) => {
  const nomeLimpo = nomeArquivo.replace(/[\\/]/g, "-").trim()
  return nomeLimpo.length > 0 ? nomeLimpo : "foto"
}

export const montarPathAvatar = (idUsuario: string, nomeArquivo: string) => {
  const nomeFinal = normalizarNomeArquivo(nomeArquivo)
  return `${idUsuario}/avatar-${Date.now()}-${nomeFinal}`
}

export const obterPerfil = async (idUsuario: string, signal?: AbortSignal) => {
  const request = supabase
    .from("perfis")
    .select(camposPerfil)
    .eq("id", idUsuario)

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request.maybeSingle()

  return { data: (data as Perfil | null) ?? null, error: error?.message ?? null }
}

export const atualizarPerfil = async (
  idUsuario: string,
  payload: PerfilInput,
  signal?: AbortSignal,
) => {
  const dados = {
    id: idUsuario,
    nome: payload.nome ?? null,
    cpf_cnpj: payload.cpf_cnpj ?? null,
    foto_path: payload.foto_path ?? null,
  }

  const request = supabase
    .from("perfis")
    .upsert(dados, { onConflict: "id" })
    .select(camposPerfil)

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request.single()

  return { data: (data as Perfil | null) ?? null, error: error?.message ?? null }
}

export const uploadAvatarPerfil = async (
  idUsuario: string,
  arquivo: File,
) => {
  const path = montarPathAvatar(idUsuario, arquivo.name ?? "avatar")

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_PERFIL)
    .upload(path, arquivo, {
      upsert: false,
      contentType: arquivo.type || undefined,
    })

  if (uploadError) {
    return { data: null, error: uploadError.message ?? null }
  }

  return { data: { path }, error: null }
}

export const removerAvatarPerfil = async (path: string) => {
  const { error } = await supabase.storage.from(BUCKET_PERFIL).remove([path])

  return { error: error?.message ?? null }
}

export const gerarUrlAvatarPerfil = async (
  path: string,
  expiresInSeconds = 3600,
) => {
  const { data, error } = await supabase.storage
    .from(BUCKET_PERFIL)
    .createSignedUrl(path, expiresInSeconds)

  return { data: data?.signedUrl ?? null, error: error?.message ?? null }
}
