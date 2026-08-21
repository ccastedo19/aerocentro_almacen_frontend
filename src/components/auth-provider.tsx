import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { api, ApiError } from "@/lib/api"
import {
  clearSession,
  getStoredUsuario,
  getToken,
  setSession,
  type LoginResponse,
  type MeResponse,
  type Usuario,
} from "@/lib/auth"

type AuthContextValue = {
  usuario: Usuario | null
  isAuthenticated: boolean
  isReady: boolean
  login: (credencial: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUsuario: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => getStoredUsuario())
  const [isReady, setIsReady] = useState(() => !getToken())

  useEffect(() => {
    const token = getToken()

    if (!token) {
      setUsuario(null)
      setIsReady(true)
      return
    }

    let cancelled = false

    api<MeResponse>("/api/me")
      .then((data) => {
        if (cancelled || !data.usuario) return

        setUsuario(data.usuario)
        setSession(token, data.usuario)
      })
      .catch((error) => {
        if (cancelled) return

        if (
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403)
        ) {
          clearSession()
          setUsuario(null)
        }
      })
      .finally(() => {
        if (!cancelled) setIsReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credencial: string, password: string) => {
    const data = await api<LoginResponse>("/api/login", {
      method: "POST",
      body: {
        credencial,
        password,
        dispositivo: "panel-web",
      },
    })

    setSession(data.token, data.usuario)
    setUsuario(data.usuario)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api("/api/logout", { method: "POST" })
    } catch {
      // La sesión local se cierra aunque el servidor no responda.
    } finally {
      clearSession()
      setUsuario(null)
    }
  }, [])

  const refreshUsuario = useCallback(async () => {
    const token = getToken()

    if (!token) return

    const data = await api<MeResponse>("/api/me")

    if (!data.usuario) return

    setUsuario(data.usuario)
    setSession(token, data.usuario)
  }, [])

  const value = useMemo(
    () => ({
      usuario,
      isAuthenticated: Boolean(usuario && getToken()),
      isReady,
      login,
      logout,
      refreshUsuario,
    }),
    [isReady, login, logout, refreshUsuario, usuario],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.")
  }

  return context
}
