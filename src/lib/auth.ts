export type Rol = {
  id: string
  nombre: string
}

export type Usuario = {
  id: string
  nombre: string
  apellido: string
  nombre_usuario: string
  email: string
  estado: number
  rol_id: string
  rol?: Rol | null
}

export type LoginResponse = {
  message: string
  token: string
  token_type: string
  usuario: Usuario
}

export type MeResponse = {
  usuario: Usuario
}

const TOKEN_KEY = "aerocentro.token"
const USER_KEY = "aerocentro.usuario"

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUsuario(): Usuario | null {
  const raw = localStorage.getItem(USER_KEY)

  if (!raw) return null

  try {
    return JSON.parse(raw) as Usuario
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function setSession(token: string, usuario: Usuario) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(usuario))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getNombreCompleto(usuario: Pick<Usuario, "nombre" | "apellido">) {
  return `${usuario.nombre} ${usuario.apellido}`.trim()
}

export function getIniciales(usuario: Pick<Usuario, "nombre" | "apellido">) {
  const nombre = usuario.nombre.trim().charAt(0)
  const apellido = usuario.apellido.trim().charAt(0)

  return `${nombre}${apellido}`.toUpperCase() || "U"
}

export function esAdministrador(usuario: Usuario | null | undefined) {
  return usuario?.rol?.nombre === "Administrador"
}
