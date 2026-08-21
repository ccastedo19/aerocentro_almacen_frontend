import { api } from "@/lib/api"

export type RelacionNombre = {
  id: string
  nombre: string
}

export type MecanicoPunto = {
  id: string
  nombre: string
  apellido: string
  nombre_completo: string
  cargo: string
  imagen: string | null
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
      "id" | "nombre" | "apellido" | "nombre_completo" | "cargo" | "imagen" | "estado"
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

const ESTILOS_TARJETA = [
  {
    accent: "border-blue-500",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  {
    accent: "border-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  {
    accent: "border-amber-500",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  {
    accent: "border-violet-500",
    badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  },
  {
    accent: "border-rose-500",
    badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  },
  {
    accent: "border-cyan-500",
    badge: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  },
] as const

export function estiloTarjetaMecanico(index: number) {
  return ESTILOS_TARJETA[index % ESTILOS_TARJETA.length]
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
