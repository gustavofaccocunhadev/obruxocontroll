import { supabase } from "@/lib/supabase"

export type ArquivoArte = {
  id: string
  id_arte: string
  nome_arquivo: string
  path: string
  tamanho_bytes: number | null
  tipo_mime: string | null
  criado_em: string
  atualizado_em: string
}

type ArquivoArteInput = {
  nome_arquivo: string
  path: string
  tamanho_bytes?: number | null
  tipo_mime?: string | null
}

type UploadArquivoOptions = {
  nomeArquivo?: string
  upsert?: boolean
}

const BUCKET_ART_FILES = "art-files"

const camposArquivo =
  "id,id_arte,nome_arquivo,path,tamanho_bytes,tipo_mime,criado_em,atualizado_em"

const normalizarNomeArquivo = (nomeArquivo: string) => {
  const nomeLimpo = nomeArquivo.replace(/[\\/]/g, "-").trim()
  return nomeLimpo.length > 0 ? nomeLimpo : "arquivo"
}

export const montarPathArquivo = (idConta: string, idArte: string, nomeArquivo: string) =>
  `${idConta}/${idArte}/${normalizarNomeArquivo(nomeArquivo)}`

export const listarArquivosArte = async (idArte: string, signal?: AbortSignal) => {
  const request = supabase
    .from("arquivos_artes")
    .select(camposArquivo)
    .eq("id_arte", idArte)
    .order("criado_em", { ascending: false })

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request

  return { data: (data as ArquivoArte[] | null) ?? [], error: error?.message ?? null }
}

export const criarArquivoArte = async (
  idArte: string,
  payload: ArquivoArteInput,
  signal?: AbortSignal,
) => {
  const request = supabase
    .from("arquivos_artes")
    .insert({
      id_arte: idArte,
      nome_arquivo: payload.nome_arquivo,
      path: payload.path,
      tamanho_bytes: payload.tamanho_bytes ?? null,
      tipo_mime: payload.tipo_mime ?? null,
    })
    .select(camposArquivo)

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request.single()

  return { data: (data as ArquivoArte | null) ?? null, error: error?.message ?? null }
}

export const uploadArquivoArte = async (
  idConta: string,
  idArte: string,
  arquivo: File,
  options: UploadArquivoOptions = {},
  signal?: AbortSignal,
) => {
  const nomeArquivo = normalizarNomeArquivo(options.nomeArquivo ?? arquivo.name ?? "arquivo")
  const path = montarPathArquivo(idConta, idArte, nomeArquivo)

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_ART_FILES)
    .upload(path, arquivo, {
      upsert: options.upsert ?? false,
      contentType: arquivo.type || undefined,
    })

  if (uploadError) {
    return { data: null, error: uploadError.message ?? null }
  }

  const { data, error } = await criarArquivoArte(
    idArte,
    {
      nome_arquivo: nomeArquivo,
      path,
      tamanho_bytes: arquivo.size ?? null,
      tipo_mime: arquivo.type || null,
    },
    signal,
  )

  if (error) {
    await supabase.storage.from(BUCKET_ART_FILES).remove([path])
    return { data: null, error }
  }

  return { data, error: null }
}

export const renomearArquivoArte = async (
  idConta: string,
  arquivo: ArquivoArte,
  novoNomeArquivo: string,
  signal?: AbortSignal,
) => {
  const nomeArquivo = normalizarNomeArquivo(novoNomeArquivo)
  const novoPath = montarPathArquivo(idConta, arquivo.id_arte, nomeArquivo)

  if (novoPath === arquivo.path && nomeArquivo === arquivo.nome_arquivo) {
    return { data: arquivo, error: null }
  }

  const { error: moveError } = await supabase.storage
    .from(BUCKET_ART_FILES)
    .move(arquivo.path, novoPath)

  if (moveError) {
    return { data: null, error: moveError.message ?? null }
  }

  const request = supabase
    .from("arquivos_artes")
    .update({ nome_arquivo: nomeArquivo, path: novoPath })
    .eq("id", arquivo.id)
    .select(camposArquivo)

  if (signal) {
    request.abortSignal(signal)
  }

  const { data, error } = await request.single()

  if (error) {
    await supabase.storage.from(BUCKET_ART_FILES).move(novoPath, arquivo.path)
    return { data: null, error: error?.message ?? null }
  }

  return { data: (data as ArquivoArte | null) ?? null, error: null }
}

export const removerArquivoArte = async (
  arquivo: Pick<ArquivoArte, "id" | "path">,
  signal?: AbortSignal,
) => {
  const { error: storageError } = await supabase.storage
    .from(BUCKET_ART_FILES)
    .remove([arquivo.path])

  if (storageError) {
    return { error: storageError.message ?? null }
  }

  const request = supabase.from("arquivos_artes").delete().eq("id", arquivo.id)

  if (signal) {
    request.abortSignal(signal)
  }

  const { error } = await request

  return { error: error?.message ?? null }
}

export const gerarUrlArquivoArte = async (
  path: string,
  expiresInSeconds = 600,
  download = false,
) => {
  const { data, error } = await supabase.storage
    .from(BUCKET_ART_FILES)
    .createSignedUrl(path, expiresInSeconds, { download })

  return { data: data?.signedUrl ?? null, error: error?.message ?? null }
}
