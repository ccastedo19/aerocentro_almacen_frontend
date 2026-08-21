import { Navigate, Outlet } from "react-router-dom"

import { useAuth } from "@/hooks/use-auth"
import { esAdministrador } from "@/lib/auth"

function AuthSplash() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Cargando sesión...</p>
    </div>
  )
}

export function RequireAuth() {
  const { isAuthenticated, isReady } = useAuth()

  if (!isReady) return <AuthSplash />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <Outlet />
}

export function RequireGuest() {
  const { isAuthenticated, isReady } = useAuth()

  if (!isReady) return <AuthSplash />
  if (isAuthenticated) return <Navigate to="/" replace />

  return <Outlet />
}

export function RequireAdmin() {
  const { isAuthenticated, isReady, usuario } = useAuth()

  if (!isReady) return <AuthSplash />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!esAdministrador(usuario)) return <Navigate to="/inicio" replace />

  return <Outlet />
}
