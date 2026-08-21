import { api } from "@/lib/api"
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
  categoria: string
  detalle: string
  borrowedAt: string
  mechanicId: string
  mechanicName: string
  mechanicArea: string
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

export function categoriaUnidad(unidad?: UnidadPrestamo | null) {
  return unidad?.herramienta?.categoria?.nombre ?? "Sin categoría"
}

export function detalleUnidad(unidad?: UnidadPrestamo | null) {
  return [unidad?.marca?.nombre, unidad?.ubicacion?.nombre]
    .filter(Boolean)
    .join(" · ")
}

export function mapDetalleEnUso(detalle: DetallePrestamoActivo): PrestamoEnUso {
  const mecanico = detalle.prestamo?.mecanico

  return {
    detalleId: detalle.id,
    unidadId: detalle.unidad?.id ?? detalle.herramienta_unidad_id,
    nombre: nombreUnidad(detalle.unidad),
    categoria: categoriaUnidad(detalle.unidad),
    detalle: detalleUnidad(detalle.unidad),
    borrowedAt: detalle.prestamo?.fecha_prestamo ?? "",
    mechanicId: mecanico?.id ?? detalle.prestamo?.mecanico_id ?? "",
    mechanicName: mecanico?.nombre_completo
      ?? [mecanico?.nombre, mecanico?.apellido].filter(Boolean).join(" "),
    mechanicArea: mecanico?.cargo ?? "",
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
