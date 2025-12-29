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
            await contaStore.inicializarConta()
          } else {
            contaStore.limparContaAtual()
          }

          supabase.auth.onAuthStateChange(async (_event, session) => {
            this.session = session
            this.user = session?.user ?? null

            try {
              if (session) {
                await contaStore.inicializarConta()
              } else {
                contaStore.limparContaAtual()
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
    async signUp(email: string, password: string) {
      this.loading = true
      try {
        const { data, error } = await supabase.auth.signUp({ email, password })
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
