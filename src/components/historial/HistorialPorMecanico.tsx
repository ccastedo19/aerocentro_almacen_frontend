import { useCallback, useEffect, useMemo, useState } from "react"
import { Eye, Search } from "lucide-react"
import { createColumnHelper } from "@tanstack/react-table"

import { ModalHistorialPrestamo } from "@/components/modal/ModalHistorialPrestamo"
import { AlertError } from "@/components/ui/alert-error"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { type DataTableFeatures } from "@/components/ui/data-table-features"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api"
import {
  formatFechaHora,
  listarHistorialMecanicos,
  listarMovimientosMecanico,
  type MecanicoHistorial,
  type MovimientoPrestamo,
} from "@/lib/historial-prestamos"

export function HistorialPorMecanico() {
  const [items, setItems] = useState<MecanicoHistorial[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [viewingItem, setViewingItem] = useState<MecanicoHistorial | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoPrestamo[]>([])
  const [isLoadingMovimientos, setIsLoadingMovimientos] = useState(false)
  const [movimientosError, setMovimientosError] = useState("")

  const loadItems = useCallback(async () => {
    setItems(await listarHistorialMecanicos())
  }, [])

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setPageError("")

    loadItems()
      .catch((error) => {
        if (cancelled) return
        setPageError(
          error instanceof ApiError
            ? error.message
            : "No se pudo cargar el historial por mecánico.",
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [loadItems])

  useEffect(() => {
    if (!viewingItem) return

    let cancelled = false

    setIsLoadingMovimientos(true)
    setMovimientosError("")
    setMovimientos([])

    listarMovimientosMecanico(viewingItem.id)
      .then((detalle) => {
        if (!cancelled) setMovimientos(detalle.movimientos.data ?? [])
      })
      .catch((error) => {
        if (cancelled) return
        setMovimientosError(
          error instanceof ApiError
            ? error.message
            : "No se pudieron cargar los movimientos.",
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMovimientos(false)
      })

    return () => {
      cancelled = true
    }
  }, [viewingItem])

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<DataTableFeatures, MecanicoHistorial>()

    return columnHelper.columns([
      columnHelper.accessor("nombre_completo", {
        header: "Mecánico",
        sortFn: "text",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.nombre_completo}</p>
            {row.original.apodo ? (
              <p className="text-xs text-muted-foreground">“{row.original.apodo}”</p>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor("cargo", {
        header: "Cargo",
        sortFn: "text",
      }),
      columnHelper.accessor((row) => Number(row.movimientos_en_curso ?? 0), {
        id: "en_curso",
        header: "En préstamo",
        enableGlobalFilter: false,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-muted-foreground">{getValue()}</span>
        ),
      }),
      columnHelper.accessor((row) => Number(row.movimientos_devueltos ?? 0), {
        id: "devueltos",
        header: "Devueltos",
        enableGlobalFilter: false,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-muted-foreground">{getValue()}</span>
        ),
      }),
      columnHelper.accessor((row) => Number(row.movimientos_total ?? 0), {
        id: "total",
        header: "Total",
        enableGlobalFilter: false,
        cell: ({ getValue }) => (
          <span className="tabular-nums font-medium">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("ultimo_movimiento", {
        header: "Último movimiento",
        enableGlobalFilter: false,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-muted-foreground">
            {formatFechaHora(getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setViewingItem(row.original)}
          >
            <Eye data-icon="inline-start" />
            Ver historial
          </Button>
        ),
      }),
    ])
  }, [])

  const hasSearch = search.trim().length > 0

  return (
    <section className="space-y-4">
      {pageError ? (
        <AlertError onClose={() => setPageError("")}>{pageError}</AlertError>
      ) : null}

      <div className="relative w-full max-w-md">
        <label htmlFor="historial-mecanico-search" className="sr-only">
          Buscar mecánico
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="historial-mecanico-search"
          className="h-9 pl-9"
          placeholder="Buscar por nombre, apodo o cargo..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
          Cargando mecánicos...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={items}
          search={search}
          pageSizeOptions={[5, 10, 20, 50]}
          emptyMessage={
            hasSearch
              ? "No se encontraron mecánicos"
              : "No hay movimientos registrados"
          }
          emptyDescription={
            hasSearch
              ? "Intenta con otro nombre, apodo o cargo."
              : "Cuando un mecánico tome o devuelva una unidad, aparecerá aquí."
          }
        />
      )}

      <ModalHistorialPrestamo
        open={viewingItem !== null}
        titulo={`Historial de “${viewingItem?.nombre_completo ?? "el mecánico"}”`}
        descripcion="Préstamos y devoluciones registrados para este mecánico, con fecha y hora."
        modo="mecanico"
        movimientos={movimientos}
        isLoading={isLoadingMovimientos}
        error={movimientosError}
        onOpenChange={(open) => {
          if (!open) {
            setViewingItem(null)
            setMovimientos([])
            setMovimientosError("")
          }
        }}
      />
    </section>
  )
}
