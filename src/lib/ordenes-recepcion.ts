import { api, listarTodosPaginados } from "@/lib/api"

export const ORDEN_ESTADO_ELIMINADO = 0
export const ORDEN_ESTADO_BORRADOR = 1
export const ORDEN_ESTADO_FINALIZADO = 2

export const TIPOS_RECEPCION = [
  { value: "motor", label: "Motores" },
  { value: "ndt", label: "NDT" },
] as const

export type TipoRecepcion = (typeof TIPOS_RECEPCION)[number]["value"]

export const MARCAS_MOTOR = [
  { value: "continental", label: "Continental" },
  { value: "lycoming", label: "Lycoming" },
] as const

export const POSICIONES_MOTOR = [
  { value: "izquierdo", label: "Motor Izquierdo" },
  { value: "derecho", label: "Motor Derecho" },
] as const

export type MarcaMotor = (typeof MARCAS_MOTOR)[number]["value"]
export type PosicionMotor = (typeof POSICIONES_MOTOR)[number]["value"]

export type OrdenRecepcionItem = {
  id?: string
  orden_id?: string
  numero_item: number
  part_number: string | null
  componente: string
  cantidad: number
  serie: string | null
  observacion: string | null
  created_at?: string
  updated_at?: string
}

export type OrdenRecepcion = {
  id: string
  numero_orden: string
  tipo: TipoRecepcion | string
  marca: MarcaMotor | string
  modelo: string
  serie: string
  matricula: string | null
  cliente_id: string
  estado: number
  usuario_id: string
  created_at: string
  updated_at: string
  cliente?: {
    id: string
    nombre_completo: string
    nit: string | null
    correo: string | null
    celular: string | null
  }
  usuario?: {
    id: string
    nombre: string
    apellido: string
  }
  items?: OrdenRecepcionItem[]
}

export type ItemFormValues = {
  part_number: string
  componente: string
  cantidad: number
  serie: string
  observacion: string
  _order?: number
}

export type OrdenRecepcionFormValues = {
  tipo?: TipoRecepcion | string
  marca: string
  modelo: string
  serie: string
  matricula: string
  cliente_id: string
  items: ItemFormValues[]
}

type OrdenResponse = {
  message?: string
  orden: OrdenRecepcion
}

type FinalizarResponse = {
  message: string
  orden: OrdenRecepcion
  pdf_base64: string
}

type PdfResponse = {
  pdf_base64: string
}

const RESOURCE = "/api/ordenes-recepcion"

export function etiquetaEstadoOrden(estado: number) {
  switch (estado) {
    case ORDEN_ESTADO_FINALIZADO:
      return "Finalizado"
    case ORDEN_ESTADO_BORRADOR:
      return "Borrador"
    case ORDEN_ESTADO_ELIMINADO:
      return "Eliminado"
    default:
      return "Desconocido"
  }
}

export function badgeColorEstadoOrden(estado: number) {
  switch (estado) {
    case ORDEN_ESTADO_FINALIZADO:
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400"
    case ORDEN_ESTADO_BORRADOR:
      return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400"
    case ORDEN_ESTADO_ELIMINADO:
      return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function etiquetaTipoOrden(tipo?: string) {
  if (tipo === "ndt") return "NDT"
  return "Motores"
}

export function badgeColorTipoOrden(tipo?: string) {
  if (tipo === "ndt") {
    return "bg-purple-500/10 text-purple-700 border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-300"
  }
  return "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:bg-sky-500/20 dark:text-sky-300"
}

export async function listarOrdenesRecepcion(filtros?: {
  buscar?: string
  tipo?: string
  estado?: number
}) {
  const query = new URLSearchParams()
  if (filtros?.buscar) query.set("buscar", filtros.buscar)
  if (filtros?.tipo) query.set("tipo", filtros.tipo)
  if (filtros?.estado !== undefined) query.set("estado", String(filtros.estado))

  return listarTodosPaginados<OrdenRecepcion>(RESOURCE, query)
}

export async function obtenerOrdenRecepcion(id: string) {
  const respuesta = await api<OrdenResponse>(`${RESOURCE}/${id}`)
  return respuesta.orden
}

export async function crearOrdenRecepcion(values: OrdenRecepcionFormValues) {
  const respuesta = await api<OrdenResponse>(RESOURCE, {
    method: "POST",
    body: values,
  })
  return respuesta.orden
}

export async function actualizarOrdenRecepcion(
  id: string,
  values: Partial<OrdenRecepcionFormValues>,
) {
  const respuesta = await api<OrdenResponse>(`${RESOURCE}/${id}`, {
    method: "PUT",
    body: values,
  })
  return respuesta.orden
}

export async function eliminarOrdenRecepcion(id: string) {
  await api(`${RESOURCE}/${id}`, { method: "DELETE" })
}

export async function finalizarOrdenRecepcion(id: string) {
  return api<FinalizarResponse>(`${RESOURCE}/${id}/finalizar`, {
    method: "POST",
  })
}

export async function obtenerPdfOrden(id: string) {
  const respuesta = await api<PdfResponse>(`${RESOURCE}/${id}/pdf`)
  return respuesta.pdf_base64
}
