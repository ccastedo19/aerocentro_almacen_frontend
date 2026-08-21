import { api } from "@/lib/api"
import { type Rol, type Usuario } from "@/lib/auth"

export const USUARIO_ESTADO_ELIMINADO = 0
export const USUARIO_ESTADO_ACTIVO = 1
export const USUARIO_ESTADO_INACTIVO = 2

export type UsuarioFormValues = {
  nombre: string
  apellido: string
  nombre_usuario: string
  email: string
  rol_id: string
  password?: string
  password_confirmation?: string
}

type LaravelPaginated<T> = {
  data: T[]
}

type UsuarioResponse = {
  usuario: Usuario
}

type RolesResponse = {
  roles: Rol[]
}

const RESOURCE = "/api/usuarios"

export function etiquetaEstadoUsuario(estado: number) {
  if (estado === USUARIO_ESTADO_INACTIVO) return "Inactivo"
  if (estado === USUARIO_ESTADO_ELIMINADO) return "Eliminado"
  return "Activo"
}

export async function listarUsuarios() {
  const query = new URLSearchParams({ por_pagina: "100" })
  const respuesta = await api<LaravelPaginated<Usuario>>(
    `${RESOURCE}?${query.toString()}`,
  )

  return respuesta.data.filter(
    (usuario) => usuario.estado !== USUARIO_ESTADO_ELIMINADO,
  )
}

export async function listarRoles() {
  const respuesta = await api<RolesResponse>("/api/roles")

  return respuesta.roles
}

export async function crearUsuario(values: UsuarioFormValues) {
  const respuesta = await api<UsuarioResponse>(RESOURCE, {
    method: "POST",
    body: values,
  })

  return respuesta.usuario
}

export async function actualizarUsuario(id: string, values: UsuarioFormValues) {
  const body: Record<string, string> = {
    nombre: values.nombre,
    apellido: values.apellido,
    nombre_usuario: values.nombre_usuario,
    email: values.email,
    rol_id: values.rol_id,
  }

  if (values.password) {
    body.password = values.password
    body.password_confirmation = values.password_confirmation ?? ""
  }

  const respuesta = await api<UsuarioResponse>(`${RESOURCE}/${id}`, {
    method: "PUT",
    body,
  })

  return respuesta.usuario
}

export async function eliminarUsuario(id: string) {
  await api(`${RESOURCE}/${id}`, { method: "DELETE" })
}

export async function cambiarEstadoUsuario(id: string, estado: number) {
  const respuesta = await api<UsuarioResponse>(`${RESOURCE}/${id}/estado`, {
    method: "PATCH",
    body: { estado },
  })

  return respuesta.usuario
}
