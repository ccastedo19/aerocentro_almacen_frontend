import { api } from "@/lib/api"

export const MECANICO_ESTADO_ELIMINADO = 0
export const MECANICO_ESTADO_ACTIVO = 1
export const MECANICO_ESTADO_FUERA_DE_SERVICIO = 2

export type Mecanico = {
  id: string
  nombre: string
  apellido: string
  nombre_completo: string
  nro_licencia: string
  cargo: string
  telefono: string | null
  imagen: string | null
  estado: number
  usuario_id: string
}

export type MecanicoFormValues = {
  nombre: string
  apellido: string
  nro_licencia: string
  cargo: string
  telefono: string
  imagen?: File | null
  eliminar_imagen?: boolean
}

type LaravelPaginated<T> = {
  data: T[]
}

type MecanicoResponse = {
  mecanico: Mecanico
}

const RESOURCE = "/api/mecanicos"

export function getInicialesMecanico(mecanico: Pick<Mecanico, "nombre" | "apellido">) {
  const nombre = mecanico.nombre.trim().charAt(0)
  const apellido = mecanico.apellido.trim().charAt(0)

  return `${nombre}${apellido}`.toUpperCase() || "M"
}

export function etiquetaEstadoMecanico(estado: number) {
  if (estado === MECANICO_ESTADO_FUERA_DE_SERVICIO) {
    return "Fuera de servicio"
  }

  if (estado === MECANICO_ESTADO_ELIMINADO) {
    return "Eliminado"
  }

  return "Activo"
}

export async function listarMecanicos() {
  const query = new URLSearchParams({ por_pagina: "100" })
  const respuesta = await api<LaravelPaginated<Mecanico>>(
    `${RESOURCE}?${query.toString()}`,
  )

  return respuesta.data
}

export async function crearMecanico(values: MecanicoFormValues) {
  const respuesta = await api<MecanicoResponse>(RESOURCE, {
    method: "POST",
    body: toFormData(values),
  })

  return respuesta.mecanico
}

export async function actualizarMecanico(id: string, values: MecanicoFormValues) {
  const respuesta = await api<MecanicoResponse>(`${RESOURCE}/${id}`, {
    method: "POST",
    body: toFormData(values),
  })

  return respuesta.mecanico
}

export async function eliminarMecanico(id: string) {
  await api(`${RESOURCE}/${id}`, { method: "DELETE" })
}

export async function cambiarEstadoMecanico(id: string, estado: number) {
  const respuesta = await api<MecanicoResponse>(`${RESOURCE}/${id}/estado`, {
    method: "PATCH",
    body: { estado },
  })

  return respuesta.mecanico
}

function toFormData(values: MecanicoFormValues) {
  const data = new FormData()

  data.append("nombre", values.nombre)
  data.append("apellido", values.apellido)
  data.append("nro_licencia", values.nro_licencia)
  data.append("cargo", values.cargo)
  data.append("telefono", values.telefono)

  if (values.imagen) {
    data.append("imagen", values.imagen)
  }

  if (values.eliminar_imagen) {
    data.append("eliminar_imagen", "1")
  }

  return data
}
