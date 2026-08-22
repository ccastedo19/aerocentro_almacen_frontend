import { api } from "@/lib/api"

export const HERRAMIENTA_ESTADO_ELIMINADO = 0
export const HERRAMIENTA_ESTADO_ACTIVO = 1
export const HERRAMIENTA_ESTADO_INACTIVO = 2

export const UNIDAD_ESTADO_ELIMINADA = 0
export const UNIDAD_ESTADO_DISPONIBLE = 1
export const UNIDAD_ESTADO_PRESTADA = 2

export type HerramientaRelacion = {
  id: string
  nombre: string
}

export type HerramientaUnidad = {
  id: string
  herramienta_id: string
  marca_id: string
  ubicacion_id: string
  fecha_calibracion: string | null
  proxima_calibracion: string | null
  estado: number
  observaciones: string | null
  herramienta?: (HerramientaRelacion & {
    categoria_id?: string
    estado?: number
    categoria?: HerramientaRelacion | null
  }) | null
  marca?: HerramientaRelacion | null
  ubicacion?: HerramientaRelacion | null
}

export type Herramienta = {
  id: string
  nombre: string
  descripcion: string | null
  estado: number
  categoria_id: string
  categoria?: HerramientaRelacion | null
  unidades_total?: number
  unidades_disponibles?: number
  unidades_prestadas?: number
  unidades?: HerramientaUnidad[]
}

export type UnidadBorrador = {
  key: string
  marca_id: string
  ubicacion_id: string
  requiere_calibracion?: boolean
  fecha_calibracion: string
  proxima_calibracion: string
  observaciones: string
}

export type HerramientaFormValues = {
  nombre: string
  descripcion: string
  categoria_id: string
  unidades?: UnidadBorrador[]
}

export type UnidadFormValues = {
  herramienta_id?: string
  marca_id: string
  ubicacion_id: string
  fecha_calibracion: string
  proxima_calibracion: string
  observaciones: string
}

type LaravelPaginated<T> = {
  data: T[]
}

type HerramientaResponse = {
  herramienta: Herramienta
}

type UnidadResponse = {
  unidad: HerramientaUnidad
}

export function etiquetaEstadoHerramienta(estado: number) {
  if (estado === HERRAMIENTA_ESTADO_INACTIVO) return "Inactiva"
  if (estado === HERRAMIENTA_ESTADO_ELIMINADO) return "Eliminada"
  return "Activa"
}

export function etiquetaEstadoUnidad(estado: number) {
  if (estado === UNIDAD_ESTADO_PRESTADA) return "Prestada"
  if (estado === UNIDAD_ESTADO_ELIMINADA) return "Eliminada"
  return "Disponible"
}

export function toDateInput(value: string | null | undefined) {
  if (!value) return ""
  return value.slice(0, 10)
}

export async function listarHerramientas() {
  const query = new URLSearchParams({ por_pagina: "100" })
  const respuesta = await api<LaravelPaginated<Herramienta>>(
    `/api/herramientas?${query.toString()}`,
  )

  return respuesta.data
}

export async function crearHerramienta(values: HerramientaFormValues) {
  const respuesta = await api<HerramientaResponse>("/api/herramientas", {
    method: "POST",
    body: {
      nombre: values.nombre,
      descripcion: null,
      categoria_id: values.categoria_id,
      unidades: (values.unidades ?? []).map((unidad) => ({
        marca_id: unidad.marca_id,
        ubicacion_id: unidad.ubicacion_id,
        fecha_calibracion: unidad.fecha_calibracion || null,
        proxima_calibracion: unidad.proxima_calibracion || null,
        observaciones: null,
      })),
    },
  })

  return respuesta.herramienta
}

export async function actualizarHerramienta(
  id: string,
  values: HerramientaFormValues,
) {
  const respuesta = await api<HerramientaResponse>(`/api/herramientas/${id}`, {
    method: "PUT",
    body: {
      nombre: values.nombre,
      descripcion: null,
      categoria_id: values.categoria_id,
    },
  })

  return respuesta.herramienta
}

export async function eliminarHerramienta(id: string) {
  await api(`/api/herramientas/${id}`, { method: "DELETE" })
}

export async function cambiarEstadoHerramienta(id: string, estado: number) {
  const respuesta = await api<HerramientaResponse>(
    `/api/herramientas/${id}/estado`,
    {
      method: "PATCH",
      body: { estado },
    },
  )

  return respuesta.herramienta
}

export async function obtenerHerramienta(id: string) {
  const respuesta = await api<HerramientaResponse>(`/api/herramientas/${id}`)

  return respuesta.herramienta
}

export async function listarUnidades(herramientaId?: string) {
  const query = new URLSearchParams({ por_pagina: "100" })

  if (herramientaId) {
    query.set("herramienta_id", herramientaId)
  }

  const respuesta = await api<LaravelPaginated<HerramientaUnidad>>(
    `/api/herramientas-unidades?${query.toString()}`,
  )

  return respuesta.data
}

export async function crearUnidad(values: UnidadFormValues) {
  const respuesta = await api<UnidadResponse>("/api/herramientas-unidades", {
    method: "POST",
    body: unidadPayload(values),
  })

  return respuesta.unidad
}

export async function actualizarUnidad(id: string, values: UnidadFormValues) {
  const respuesta = await api<UnidadResponse>(
    `/api/herramientas-unidades/${id}`,
    {
      method: "PUT",
      body: {
        marca_id: values.marca_id,
        ubicacion_id: values.ubicacion_id,
        fecha_calibracion: values.fecha_calibracion || null,
        proxima_calibracion: values.proxima_calibracion || null,
        observaciones: null,
      },
    },
  )

  return respuesta.unidad
}

export async function eliminarUnidad(id: string) {
  await api(`/api/herramientas-unidades/${id}`, { method: "DELETE" })
}

function unidadPayload(values: UnidadFormValues) {
  return {
    herramienta_id: values.herramienta_id,
    marca_id: values.marca_id,
    ubicacion_id: values.ubicacion_id,
    fecha_calibracion: values.fecha_calibracion || null,
    proxima_calibracion: values.proxima_calibracion || null,
    observaciones: null,
  }
}
