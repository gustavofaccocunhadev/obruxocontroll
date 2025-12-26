import { defineStore } from "pinia"
import { supabase } from "@/lib/supabase"

type Conta = {
  id: string
  nome: string
  criado_em: string
  atualizado_em: string
}

type ContaState = {
  contaAtual: Conta | null
  carregando: boolean
}

export const useContaStore = defineStore("conta", {
  state: (): ContaState => ({
    contaAtual: null,
    carregando: false,
  }),
  actions: {
    async garantirContaNoPrimeiroLogin() {
      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user?.id

      if (!userId) {
        return
      }

      const { data: membro, error } = await supabase
        .from("conta_membros")
        .select("id_conta")
        .eq("id_usuario", userId)
        .limit(1)
        .maybeSingle()

      if (error || membro) {
        return
      }

      const { data: contaCriada, error: contaErro } = await supabase
        .from("contas")
        .insert({ nome: "Minha conta" })
        .select("id")
        .single()

      if (contaErro || !contaCriada) {
        return
      }

      await supabase.from("conta_membros").insert({
        id_conta: contaCriada.id,
        id_usuario: userId,
        papel: "dono",
      })
    },
    async carregarContaAtual() {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user?.id

      if (!userId) {
        this.contaAtual = null
        return
      }

      const { data, error } = await supabase
        .from("contas")
        .select("id,nome,criado_em,atualizado_em")
        .limit(1)
        .maybeSingle()

      if (error) {
        this.contaAtual = null
        return
      }

      this.contaAtual = data ?? null
    },
    async inicializarConta() {
      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user?.id

      if (!userId) {
        this.contaAtual = null
        this.carregando = false
        return
      }

      this.carregando = true
      await this.garantirContaNoPrimeiroLogin()
      await this.carregarContaAtual()
      this.carregando = false
    },
    limparContaAtual() {
      this.contaAtual = null
      this.carregando = false
    },
  },
})
