import { api, listarTodosPaginados } from "@/lib/api"
import type { HerramientaUnidad } from "@/lib/herramientas"
import { compararPorBusquedaCorta } from "@/lib/prestamos"

export const COMBINADA_ESTADO_ELIMINADA = 0
export const COMBINADA_ESTADO_ACTIVA = 1
export const COMBINADA_ESTADO_INACTIVA = 2

export type Combinada = {
  id: string
  nombre: string
  descripcion: string | null
  estado: number
  unidades_total?: number
  unidades?: HerramientaUnidad[]
}

export type CombinadaFormValues = {
  nombre: string
  descripcion: string
  unidades_ids: string[]
}

type CombinadaResponse = {
  combinada: Combinada
}

export function etiquetaEstadoCombinada(estado: number) {
  if (estado === COMBINADA_ESTADO_INACTIVA) return "Inactiva"
  if (estado === COMBINADA_ESTADO_ELIMINADA) return "Eliminada"
  return "Activa"
}

export function resumenCombinada(combinada: Combinada) {
  const nombres = (combinada.unidades ?? []).map(
    (unidad) => unidad.herramienta?.nombre?.trim() || "Herramienta",
  )

  return nombres.join(" + ")
}

export function unidadesIdsCombinada(combinada: Combinada) {
  return (combinada.unidades ?? []).map((unidad) => unidad.id)
}

export function combinadaDisponible(combinada: Combinada, unidadesDisponiblesIds: Set<string>) {
  const ids = unidadesIdsCombinada(combinada)

  return ids.length > 0 && ids.every((id) => unidadesDisponiblesIds.has(id))
}

export function filtrarCombinadasPorBusqueda(combinadas: Combinada[], search: string) {
  const query = search.trim().toLocaleLowerCase()

  if (!query) return combinadas

  return combinadas
    .filter((combinada) =>
      `${combinada.nombre} ${combinada.descripcion ?? ""} ${resumenCombinada(combinada)}`
        .toLocaleLowerCase()
        .includes(query),
    )
    .sort((a, b) => compararPorBusquedaCorta(a.nombre, b.nombre, query))
}

export async function listarCombinadas() {
  return listarTodosPaginados<Combinada>("/api/herramientas-combinadas")
}

export async function listarCombinadasActivas() {
  const combinadas = await listarCombinadas()

  return combinadas.filter((combinada) => combinada.estado === COMBINADA_ESTADO_ACTIVA)
}

export async function crearCombinada(values: CombinadaFormValues) {
  const respuesta = await api<CombinadaResponse>("/api/herramientas-combinadas", {
    method: "POST",
    body: payload(values),
  })

  return respuesta.combinada
}

export async function actualizarCombinada(id: string, values: CombinadaFormValues) {
  const respuesta = await api<CombinadaResponse>(
    `/api/herramientas-combinadas/${id}`,
    {
      method: "PUT",
      body: payload(values),
    },
  )

  return respuesta.combinada
}

export async function eliminarCombinada(id: string) {
  await api(`/api/herramientas-combinadas/${id}`, { method: "DELETE" })
}

export async function cambiarEstadoCombinada(id: string, estado: number) {
  const respuesta = await api<CombinadaResponse>(
    `/api/herramientas-combinadas/${id}/estado`,
    {
      method: "PATCH",
      body: { estado },
    },
  )

  return respuesta.combinada
}

function payload(values: CombinadaFormValues) {
  return {
    nombre: values.nombre.trim(),
    descripcion: values.descripcion.trim() || null,
    unidades_ids: values.unidades_ids,
  }
}
