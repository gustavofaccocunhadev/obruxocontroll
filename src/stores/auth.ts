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
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          this.loading = false
          return
        }

        this.session = data.session ?? null
        this.user = data.session?.user ?? null
        this.loading = false

        const contaStore = useContaStore()
        if (this.session) {
          await contaStore.inicializarConta()
        } else {
          contaStore.limparContaAtual()
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
          this.session = session
          this.user = session?.user ?? null

          if (session) {
            await contaStore.inicializarConta()
          } else {
            contaStore.limparContaAtual()
          }
        })
      })()

      return initPromise
    },
    async signIn(email: string, password: string) {
      this.loading = true
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      this.loading = false

      return { error: error?.message ?? null }
    },
    async signUp(email: string, password: string) {
      this.loading = true
      const { data, error } = await supabase.auth.signUp({ email, password })
      this.loading = false

      if (error) {
        return { error: error.message, message: null }
      }

      const message = data.session
        ? "Conta criada e autenticada com sucesso."
        : "Conta criada. Verifique seu email para confirmar o acesso."

      return { error: null, message }
    },
    async signOut() {
      this.loading = true
      const { error } = await supabase.auth.signOut()
      this.loading = false

      if (!error) {
        this.session = null
        this.user = null
        useContaStore().limparContaAtual()
      }

      return { error: error?.message ?? null }
    },
    async resetPassword(email: string) {
      this.loading = true
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      this.loading = false

      return { error: error?.message ?? null }
    },
  },
})
