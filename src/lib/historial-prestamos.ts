import { api, listarTodosPaginados } from "@/lib/api"

export const MOVIMIENTO_DEVUELTO = 0
export const MOVIMIENTO_EN_CURSO = 1

export type RelacionNombre = {
  id: string
  nombre: string
}

export type HerramientaHistorial = {
  id: string
  nombre: string
  descripcion: string | null
  estado: number
  categoria?: RelacionNombre | null
  movimientos_total: number
  movimientos_en_curso: number
  movimientos_devueltos: number
  ultimo_movimiento: string | null
}

export type MecanicoHistorial = {
  id: string
  nombre: string
  apellido: string
  nombre_completo: string
  apodo: string | null
  cargo: string
  estado: number
  movimientos_total: number
  movimientos_en_curso: number
  movimientos_devueltos: number
  ultimo_movimiento: string | null
}

export type MovimientoPrestamo = {
  id: string
  estado: number
  estado_etiqueta: string
  fecha_prestamo: string | null
  fecha_devolucion: string | null
  mecanico: {
    id: string
    nombre_completo: string
    apodo: string | null
    cargo: string
  } | null
  herramienta?: {
    id: string
    nombre: string
    categoria?: RelacionNombre | null
  } | null
  unidad: {
    id: string
    marca?: RelacionNombre | null
    ubicacion?: RelacionNombre | null
  } | null
}

export type LineaKardex = {
  id: string
  fecha: string
  tipo: "prestamo" | "devolucion"
  herramienta: string
  categoria: string
  unidad: string
  mecanico: string
  apodo: string | null
}

type LaravelPaginated<T> = {
  data: T[]
  current_page: number
  last_page: number
  total: number
}

type HistorialDetalleHerramientaResponse = {
  herramienta: {
    id: string
    nombre: string
    descripcion: string | null
    estado: number
    categoria?: RelacionNombre | null
  }
  movimientos: LaravelPaginated<MovimientoPrestamo>
}

type HistorialDetalleMecanicoResponse = {
  mecanico: {
    id: string
    nombre: string
    apellido: string
    nombre_completo: string
    apodo: string | null
    cargo: string
    estado: number
  }
  movimientos: LaravelPaginated<MovimientoPrestamo>
}

export function formatFechaHora(value: string | null | undefined) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

export function detalleUnidadHistorial(unidad?: MovimientoPrestamo["unidad"]) {
  return [unidad?.marca?.nombre, unidad?.ubicacion?.nombre]
    .filter(Boolean)
    .join(" · ")
}

export function toLineasKardex(movimientos: MovimientoPrestamo[]): LineaKardex[] {
  const lineas = movimientos.flatMap((movimiento) => {
    const base = {
      herramienta: movimiento.herramienta?.nombre ?? "Herramienta",
      categoria: movimiento.herramienta?.categoria?.nombre ?? "—",
      unidad: detalleUnidadHistorial(movimiento.unidad) || "—",
      mecanico: movimiento.mecanico?.nombre_completo ?? "—",
      apodo: movimiento.mecanico?.apodo ?? null,
    }

    const prestamo: LineaKardex = {
      ...base,
      id: `${movimiento.id}-prestamo`,
      fecha: movimiento.fecha_prestamo ?? "",
      tipo: "prestamo",
    }

    if (!movimiento.fecha_devolucion) {
      return [prestamo]
    }

    return [
      prestamo,
      {
        ...base,
        id: `${movimiento.id}-devolucion`,
        fecha: movimiento.fecha_devolucion,
        tipo: "devolucion" as const,
      },
    ]
  })

  return lineas.sort((a, b) => {
    const fechaA = new Date(a.fecha).getTime()
    const fechaB = new Date(b.fecha).getTime()

    if (Number.isNaN(fechaA) || Number.isNaN(fechaB)) return 0

    return fechaB - fechaA
  })
}

export async function listarHistorialHerramientas() {
  return listarTodosPaginados<HerramientaHistorial>("/api/prestamos/historial")
}

export async function listarHistorialMecanicos() {
  return listarTodosPaginados<MecanicoHistorial>(
    "/api/prestamos/historial/mecanicos",
  )
}

export async function listarHistorialGeneral() {
  return listarTodosPaginados<MovimientoPrestamo>(
    "/api/prestamos/historial/general",
  )
}

export async function listarMovimientosHerramienta(herramientaId: string) {
  return listarDetalleCompleto<HistorialDetalleHerramientaResponse>(
    `/api/prestamos/historial/${herramientaId}`,
  )
}

export async function listarMovimientosMecanico(mecanicoId: string) {
  return listarDetalleCompleto<HistorialDetalleMecanicoResponse>(
    `/api/prestamos/historial/mecanicos/${mecanicoId}`,
  )
}

async function listarDetalleCompleto<
  T extends { movimientos: LaravelPaginated<MovimientoPrestamo> },
>(path: string) {
  const crearRuta = (page: number) =>
    `${path}?${new URLSearchParams({
      por_pagina: "100",
      page: String(page),
    }).toString()}`
  const primera = await api<T>(crearRuta(1))

  if (primera.movimientos.last_page <= 1) return primera

  const restantes = await Promise.all(
    Array.from({ length: primera.movimientos.last_page - 1 }, (_, index) =>
      api<T>(crearRuta(index + 2)),
    ),
  )

  return {
    ...primera,
    movimientos: {
      ...primera.movimientos,
      data: [primera, ...restantes].flatMap(
        (respuesta) => respuesta.movimientos.data,
      ),
    },
  }
}
