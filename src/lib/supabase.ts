import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Variaveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY sao obrigatorias.")
}

const DEFAULT_TIMEOUT_MS = 15000

const fetchWithTimeout: typeof fetch = async (input, init = {}) => {
  const controller = new AbortController()
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  if (init.signal) {
    if (init.signal.aborted) {
      controller.abort()
    } else {
      init.signal.addEventListener("abort", () => controller.abort(), { once: true })
    }
  }

  try {
    const fetchPromise = fetch(input, { ...init, signal: controller.signal })
    fetchPromise.catch(() => undefined)

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort()
        reject(new Error("Timeout"))
      }, DEFAULT_TIMEOUT_MS)
    })

    return await Promise.race([fetchPromise, timeoutPromise])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: fetchWithTimeout,
  },
})
