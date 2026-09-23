import { api } from "@/lib/api"

export type NotificacionPublica = {
  id: string
  titulo: string
  mensaje: string | null
  imagen: string | null
  estado: number // 0: oculto (no mostrar), 1: mostrar
  created_at?: string
  updated_at?: string
}

export async function obtenerNotificacionPublicaAdmin() {
  const respuesta = await api<{ notificacion: NotificacionPublica | null }>(
    "/api/notificacion-publica",
  )

  return respuesta.notificacion
}

export async function obtenerNotificacionPublicaLibre() {
  const respuesta = await api<{ notificacion: NotificacionPublica | null }>(
    "/api/publico/notificaciones",
  )

  return respuesta.notificacion
}

export async function guardarNotificacionPublica(formData: FormData) {
  const respuesta = await api<{
    message: string
    notificacion: NotificacionPublica
  }>("/api/notificacion-publica", {
    method: "POST",
    body: formData,
  })

  return respuesta
}

export async function cambiarEstadoNotificacionPublica(estado: number) {
  const respuesta = await api<{
    message: string
    notificacion: NotificacionPublica
  }>("/api/notificacion-publica/estado", {
    method: "PATCH",
    body: { estado },
  })

  return respuesta
}

export async function eliminarNotificacionPublica() {
  const respuesta = await api<{ message: string }>(
    "/api/notificacion-publica",
    {
      method: "DELETE",
    },
  )

  return respuesta
}
