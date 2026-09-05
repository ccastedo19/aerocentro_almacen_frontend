import { api } from "@/lib/api"
import {
  coloresUnidadVisibles,
  etiquetaColorUnidad,
  type ColorUnidad,
} from "@/lib/herramientas"
import type { ColorMecanico } from "@/lib/mecanicos"

export type RelacionNombre = {
  id: string
  nombre: string
}

export type MecanicoPunto = {
  id: string
  nombre: string
  apellido: string
  apodo: string | null
  nombre_completo: string
  cargo: string
  imagen: string | null
  color: ColorMecanico | null
  estado: number
  prestamos_activos: number
}

export type UnidadPrestamo = {
  id: string
  observaciones?: string | null
  color_primario?: ColorUnidad | null
  color_secundario?: ColorUnidad | null
  tamano?: string | null
  herramienta?: (RelacionNombre & {
    categoria?: RelacionNombre | null
  }) | null
  marca?: RelacionNombre | null
  ubicacion?: RelacionNombre | null
}

export type DetallePrestamoActivo = {
  id: string
  prestamo_id: string
  herramienta_unidad_id: string
  prestamo?: {
    id: string
    mecanico_id: string
    fecha_prestamo: string
    mecanico?: Pick<
      MecanicoPunto,
      "id" | "nombre" | "apellido" | "apodo" | "nombre_completo" | "cargo" | "imagen" | "color" | "estado"
    >
  } | null
  unidad?: UnidadPrestamo | null
}

export type PrestamoEnUso = {
  detalleId: string
  unidadId: string
  nombre: string
  detalle: string
  borrowedAt: string
  mechanicId: string
  mechanicName: string
  mechanicArea: string
  unidad?: UnidadPrestamo | null
}

export type HerramientaGeneral = {
  unidadId: string
  nombre: string
  detalle: string
  estado: "disponible" | "en_uso"
  unidad?: UnidadPrestamo | null
  detalleId?: string
  borrowedAt?: string
  mechanicId?: string
  mechanicName?: string
  mechanicArea?: string
}

const ESTILOS_TARJETA: Record<ColorMecanico, { accent: string; badge: string }> = {
  rojo: {
    accent: "border-red-500",
    badge: "bg-red-500/15 text-red-700 dark:text-red-300",
  },
  amarillo: {
    accent: "border-yellow-400",
    badge: "bg-yellow-400/20 text-yellow-800 dark:text-yellow-200",
  },
  verde_claro: {
    accent: "border-lime-400",
    badge: "bg-lime-400/20 text-lime-800 dark:text-lime-200",
  },
  verde_oscuro: {
    accent: "border-emerald-700",
    badge: "bg-emerald-700/15 text-emerald-800 dark:text-emerald-300",
  },
  celeste: {
    accent: "border-sky-400",
    badge: "bg-sky-400/20 text-sky-800 dark:text-sky-200",
  },
  azul: {
    accent: "border-blue-600",
    badge: "bg-blue-600/15 text-blue-700 dark:text-blue-300",
  },
  blanco: {
    accent: "border-zinc-200 dark:border-white",
    badge: "border bg-white text-zinc-700 dark:bg-white dark:text-zinc-900",
  },
  naranja: {
    accent: "border-orange-500",
    badge: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  },
}

const COLORES_FALLBACK = Object.keys(ESTILOS_TARJETA) as ColorMecanico[]

export function estiloTarjetaMecanico(color: ColorMecanico | null, index: number) {
  const colorElegido = color ?? COLORES_FALLBACK[index % COLORES_FALLBACK.length]

  return ESTILOS_TARJETA[colorElegido]
}

export function nombreUnidad(unidad?: UnidadPrestamo | null) {
  return unidad?.herramienta?.nombre ?? "Herramienta"
}

function esEtiquetaVacia(valor?: string | null) {
  const nombre = valor?.trim() ?? ""

  if (!nombre) return true

  return /^sin\s+(marca|color)$/i.test(nombre)
}

export function marcaUnidad(unidad?: Pick<UnidadFiltrable, "marca"> | null) {
  const nombre = unidad?.marca?.nombre?.trim() ?? ""

  return esEtiquetaVacia(nombre) ? null : nombre
}

export function coloresUnidad(unidad?: UnidadPrestamo | null) {
  return coloresUnidadVisibles(unidad?.color_primario, unidad?.color_secundario)
}

export function detalleUnidad(unidad?: UnidadPrestamo | null) {
  return [
    marcaUnidad(unidad),
    unidad?.ubicacion?.nombre,
    unidad?.tamano ? `Tamaño: ${unidad.tamano}` : null,
    coloresUnidad(unidad)
      .map((color) => etiquetaColorUnidad(color))
      .join(" + ") || null,
  ]
    .filter(Boolean)
    .join(" · ")
}

export function textoBusquedaUnidad(unidad?: UnidadPrestamo | null) {
  return [nombreUnidad(unidad), detalleUnidad(unidad)]
    .join(" ")
    .toLocaleLowerCase()
}

export function compararPorBusquedaCorta(nombreA: string, nombreB: string, query: string) {
  const q = query.trim().toLocaleLowerCase()
  const a = nombreA.toLocaleLowerCase()
  const b = nombreB.toLocaleLowerCase()

  const rango = (nombre: string) => {
    if (nombre === q) return 0
    if (nombre.startsWith(q)) return 1
    return 2
  }

  const rangoA = rango(a)
  const rangoB = rango(b)

  if (rangoA !== rangoB) return rangoA - rangoB
  if (a.length !== b.length) return a.length - b.length

  return a.localeCompare(b, "es")
}

export type FiltrosUnidadPrestamo = {
  color1: string
  color2: string
  color3: string
  marca: string
  tamano: string
  ubicacion: string
}

export const FILTROS_UNIDAD_VACIOS: FiltrosUnidadPrestamo = {
  color1: "",
  color2: "",
  color3: "",
  marca: "",
  tamano: "",
  ubicacion: "",
}

type UnidadFiltrable = {
  color_primario?: ColorUnidad | null
  color_secundario?: ColorUnidad | null
  tamano?: string | null
  marca?: RelacionNombre | null
  ubicacion?: RelacionNombre | null
}

function coincideTexto(valor: string | null | undefined, query: string) {
  const q = query.trim().toLocaleLowerCase()

  if (!q) return true

  return (valor ?? "").trim().toLocaleLowerCase().includes(q)
}

function etiquetaColorFiltrable(color: ColorUnidad | null | undefined) {
  return color ? etiquetaColorUnidad(color) : ""
}

export function unidadCoincideFiltros(
  unidad: UnidadFiltrable | null | undefined,
  filtros: FiltrosUnidadPrestamo,
) {
  const color1 = etiquetaColorFiltrable(unidad?.color_primario)
  const color2 = etiquetaColorFiltrable(unidad?.color_secundario)
  const colores = [color1, color2].filter(Boolean)

  if (filtros.color1.trim() && !colores.some((c) => coincideTexto(c, filtros.color1))) {
    return false
  }
  if (filtros.color2.trim() && !colores.some((c) => coincideTexto(c, filtros.color2))) {
    return false
  }
  if (filtros.color3.trim() && !colores.some((c) => coincideTexto(c, filtros.color3))) {
    return false
  }
  if (!coincideTexto(marcaUnidad(unidad as UnidadPrestamo), filtros.marca)) {
    return false
  }
  if (!coincideTexto(unidad?.tamano, filtros.tamano)) return false
  if (!coincideTexto(unidad?.ubicacion?.nombre, filtros.ubicacion)) return false

  return true
}

export function opcionesFiltroUnicas(valores: (string | null | undefined)[]) {
  return [...new Set(
    valores
      .map((valor) => valor?.trim() ?? "")
      .filter((valor) => valor && !esEtiquetaVacia(valor)),
  )].sort((a, b) => a.localeCompare(b, "es"))
}

export function filtrosUnidadVacios(filtros: FiltrosUnidadPrestamo) {
  return Object.values(filtros).every((valor) => !valor.trim())
}

export function filtrarUnidadesPorBusqueda<T extends UnidadPrestamo>(
  unidades: T[],
  search: string,
  filtros: FiltrosUnidadPrestamo = FILTROS_UNIDAD_VACIOS,
) {
  const query = search.trim().toLocaleLowerCase()

  if (!query && filtrosUnidadVacios(filtros)) return unidades

  return unidades
    .filter((unidad) => (query ? textoBusquedaUnidad(unidad).includes(query) : true))
    .filter((unidad) => unidadCoincideFiltros(unidad, filtros))
    .sort((a, b) => (query ? compararPorBusquedaCorta(nombreUnidad(a), nombreUnidad(b), query) : 0))
}

export function mapDetalleEnUso(detalle: DetallePrestamoActivo): PrestamoEnUso {
  const mecanico = detalle.prestamo?.mecanico

  return {
    detalleId: detalle.id,
    unidadId: detalle.unidad?.id ?? detalle.herramienta_unidad_id,
    nombre: nombreUnidad(detalle.unidad),
    detalle: detalleUnidad(detalle.unidad),
    borrowedAt: detalle.prestamo?.fecha_prestamo ?? "",
    mechanicId: mecanico?.id ?? detalle.prestamo?.mecanico_id ?? "",
    mechanicName: mecanico?.nombre_completo
      ?? [mecanico?.nombre, mecanico?.apellido].filter(Boolean).join(" "),
    mechanicArea: mecanico?.cargo ?? "",
    unidad: detalle.unidad,
  }
}

export function formatBorrowedAt(value: string) {
  if (!value) return ""

  const borrowedAt = new Date(value)
  const today = new Date()
  const borrowedDay = new Date(borrowedAt)

  today.setHours(0, 0, 0, 0)
  borrowedDay.setHours(0, 0, 0, 0)

  const daysAgo = Math.round(
    (today.getTime() - borrowedDay.getTime()) / 86_400_000,
  )
  const time = new Intl.DateTimeFormat("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(borrowedAt)

  if (Number.isNaN(borrowedAt.getTime())) return ""
  if (daysAgo === 0) return `hoy, ${time}`
  if (daysAgo === 1) return `ayer, ${time}`

  const date = new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(borrowedAt)

  return `${date}, ${time}`
}

export async function listarPuntoPrestamos() {
  const respuesta = await api<{ mecanicos: MecanicoPunto[] }>("/api/prestamos/punto")

  return respuesta.mecanicos
}

export async function listarUnidadesDisponibles() {
  const respuesta = await api<{ unidades: UnidadPrestamo[] }>(
    "/api/prestamos/unidades-disponibles",
  )

  return respuesta.unidades
}

export async function listarHerramientasEnUso() {
  const respuesta = await api<{ detalles: DetallePrestamoActivo[] }>(
    "/api/prestamos/en-uso",
  )

  return respuesta.detalles.map(mapDetalleEnUso)
}

export async function listarHerramientasGeneral() {
  const [disponibles, enUso] = await Promise.all([
    listarUnidadesDisponibles(),
    listarHerramientasEnUso(),
  ])

  const unidadesDisponibles: HerramientaGeneral[] = disponibles.map((unidad) => ({
    unidadId: unidad.id,
    nombre: nombreUnidad(unidad),
    detalle: detalleUnidad(unidad),
    estado: "disponible",
    unidad,
  }))

  const unidadesEnUso: HerramientaGeneral[] = enUso.map((item) => ({
    ...item,
    estado: "en_uso",
  }))

  return [...unidadesDisponibles, ...unidadesEnUso].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es"),
  )
}

export async function listarPrestamosDeMecanico(mecanicoId: string) {
  const respuesta = await api<{ detalles: DetallePrestamoActivo[] }>(
    `/api/prestamos/mecanicos/${mecanicoId}`,
  )

  return respuesta.detalles
}

export async function crearPrestamo(mecanicoId: string, unidadesIds: string[]) {
  await api("/api/prestamos", {
    method: "POST",
    body: {
      mecanico_id: mecanicoId,
      unidades_ids: unidadesIds,
    },
  })
}

export async function devolverMultiplesDetalles(detallesIds: string[]) {
  if (detallesIds.length === 0) return
  await api("/api/prestamos/detalles/devolver-multiples", {
    method: "POST",
    body: {
      detalles_ids: detallesIds,
    },
  })
}

export async function devolverUnidad(detalleId: string) {
  await api(`/api/prestamos/detalles/${detalleId}/devolver`, {
    method: "POST",
  })
}

export async function devolverTodasDeMecanico(mecanicoId: string) {
  await api(`/api/prestamos/mecanicos/${mecanicoId}/devolver-todas`, {
    method: "POST",
  })
}

export async function devolverTodasAbsoluto() {
  await api("/api/prestamos/devolver-todas-absoluto", {
    method: "POST",
  })
}

export async function intercambiarPrestamos(
  mecanicoDestinoId: string,
  unidadesIds: string[],
) {
  if (unidadesIds.length === 0) return
  await api("/api/prestamos/intercambiar", {
    method: "POST",
    body: {
      mecanico_destino_id: mecanicoDestinoId,
      unidades_ids: unidadesIds,
    },
  })
}
