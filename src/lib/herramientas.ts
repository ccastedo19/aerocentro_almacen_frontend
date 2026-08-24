import { api } from "@/lib/api"

export const HERRAMIENTA_ESTADO_ELIMINADO = 0
export const HERRAMIENTA_ESTADO_ACTIVO = 1
export const HERRAMIENTA_ESTADO_INACTIVO = 2

export const UNIDAD_ESTADO_ELIMINADA = 0
export const UNIDAD_ESTADO_DISPONIBLE = 1
export const UNIDAD_ESTADO_PRESTADA = 2

export const SIN_COLOR = "sin_color" as const

export const COLORES_UNIDAD = [
  { value: SIN_COLOR, label: "Sin color" },
  { value: "rojo", label: "Rojo" },
  { value: "amarillo", label: "Amarillo" },
  { value: "verde", label: "Verde" },
  { value: "azul", label: "Azul" },
  { value: "celeste", label: "Celeste" },
  { value: "blanco", label: "Blanco" },
  { value: "negro", label: "Negro" },
  { value: "naranja", label: "Naranja" },
] as const

export type ColorUnidad = Exclude<
  (typeof COLORES_UNIDAD)[number]["value"],
  typeof SIN_COLOR
>
export type ColorUnidadSeleccion = ColorUnidad | typeof SIN_COLOR

export type HerramientaRelacion = {
  id: string
  nombre: string
}

export type HerramientaUnidad = {
  id: string
  herramienta_id: string
  marca_id: string
  ubicacion_id: string
  color_primario: ColorUnidad | null
  color_secundario: ColorUnidad | null
  tamano: string | null
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
  color_primario: ColorUnidadSeleccion
  color_secundario: ColorUnidadSeleccion
  tamano: string
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
  color_primario: ColorUnidadSeleccion
  color_secundario: ColorUnidadSeleccion
  tamano: string
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

export function etiquetaColoresUnidad(
  colorPrimario: ColorUnidad | null | undefined,
  colorSecundario: ColorUnidad | null | undefined,
) {
  const nombres = [colorPrimario, colorSecundario]
    .filter((color): color is ColorUnidad => Boolean(color))
    .map((color) => COLORES_UNIDAD.find((item) => item.value === color)?.label ?? color)

  return nombres.length > 0 ? nombres.join(" + ") : "Sin color"
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
        color_primario: colorPayload(unidad.color_primario),
        color_secundario: colorPayload(unidad.color_secundario),
        tamano: unidad.tamano.trim() || null,
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
        color_primario: colorPayload(values.color_primario),
        color_secundario: colorPayload(values.color_secundario),
        tamano: values.tamano.trim() || null,
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
    color_primario: colorPayload(values.color_primario),
    color_secundario: colorPayload(values.color_secundario),
    tamano: values.tamano.trim() || null,
    fecha_calibracion: values.fecha_calibracion || null,
    proxima_calibracion: values.proxima_calibracion || null,
    observaciones: null,
  }
}

function colorPayload(color: ColorUnidadSeleccion) {
  return color === SIN_COLOR ? null : color
}
