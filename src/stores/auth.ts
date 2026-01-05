import type { Session, User } from "@supabase/supabase-js"
import { defineStore } from "pinia"
import { supabase } from "@/lib/supabase"
import { useContaStore } from "@/stores/conta"

type AuthState = {
  session: Session | null
  user: User | null
  loading: boolean
}

let initPromise: Promise<void> | null = null
let lastRevalidateAt = 0
const REVALIDATE_MIN_INTERVAL_MS = 15000
const REFRESH_GRACE_MS = 60000

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    session: null,
    user: null,
    loading: false,
  }),
  actions: {
    async init() {
      if (initPromise) return initPromise

      initPromise = (async () => {
        this.loading = true
        try {
          const { data, error } = await supabase.auth.getSession()
          if (error) {
            return
          }

          this.session = data.session ?? null
          this.user = data.session?.user ?? null

          const contaStore = useContaStore()
          if (this.session) {
            await contaStore.inicializarConta(this.session.user.id)
          } else {
            contaStore.limparContaAtual()
          }

          supabase.auth.onAuthStateChange(async (event, session) => {
            this.session = session
            this.user = session?.user ?? null

            try {
              if (!session || event === "SIGNED_OUT") {
                contaStore.limparContaAtual()
                return
              }

              const deveRecarregarConta =
                event === "SIGNED_IN" || event === "USER_UPDATED"

              if (
                deveRecarregarConta &&
                !contaStore.contaAtual &&
                !contaStore.carregando
              ) {
                await contaStore.inicializarConta(session.user.id)
              }
            } catch {
              contaStore.limparContaAtual()
            }
          })
        } finally {
          this.loading = false
        }
      })()

      return initPromise
    },
    async revalidarSessao() {
      const agora = Date.now()
      if (agora - lastRevalidateAt < REVALIDATE_MIN_INTERVAL_MS) {
        return false
      }
      lastRevalidateAt = agora

      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          return false
        }

        if (!data.session) {
          this.session = null
          this.user = null
          useContaStore().limparContaAtual()
          return true
        }

        let session = data.session
        const expiraEm = session.expires_at ? session.expires_at * 1000 : 0

        if (expiraEm && expiraEm - agora < REFRESH_GRACE_MS) {
          const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError || !refreshed.session) {
            try {
              await supabase.auth.signOut({ scope: "local" })
            } catch {
              // Ignora erro de logout local e limpa o estado mesmo assim.
            }
            this.session = null
            this.user = null
            useContaStore().limparContaAtual()
            return true
          }
          session = refreshed.session
        }

        this.session = session
        this.user = session.user ?? null

        const contaStore = useContaStore()
        if (!contaStore.contaAtual && !contaStore.carregando) {
          await contaStore.inicializarConta(session.user.id)
        }
        return false
      } catch {
        return false
      }
    },
    async signIn(email: string, password: string) {
      this.loading = true
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error?.message ?? null }
      } catch (error) {
        const mensagem = error instanceof Error ? error.message : "Falha ao conectar ao servidor."
        return { error: mensagem }
      } finally {
        this.loading = false
      }
    },
    async signUp(email: string, password: string, nome: string, cpfCnpj: string) {
      this.loading = true
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome,
              cpf_cnpj: cpfCnpj,
            },
          },
        })
        if (error) {
          return { error: error.message, message: null }
        }

        const message = data.session
          ? "Conta criada e autenticada com sucesso."
          : "Conta criada. Verifique seu email para confirmar o acesso."

        return { error: null, message }
      } catch (error) {
        const mensagem = error instanceof Error ? error.message : "Falha ao conectar ao servidor."
        return { error: mensagem, message: null }
      } finally {
        this.loading = false
      }
    },
    async signOut() {
      this.loading = true
      try {
        const { error } = await supabase.auth.signOut()
        if (!error) {
          this.session = null
          this.user = null
          useContaStore().limparContaAtual()
        }
        return { error: error?.message ?? null }
      } catch (error) {
        const mensagem = error instanceof Error ? error.message : "Falha ao conectar ao servidor."
        return { error: mensagem }
      } finally {
        this.loading = false
      }
    },
    async resetPassword(email: string) {
      this.loading = true
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        })
        return { error: error?.message ?? null }
      } catch (error) {
        const mensagem = error instanceof Error ? error.message : "Falha ao conectar ao servidor."
        return { error: mensagem }
      } finally {
        this.loading = false
      }
    },
  },
})
