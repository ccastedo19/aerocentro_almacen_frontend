import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, Search } from "lucide-react"
import { createColumnHelper } from "@tanstack/react-table"

import { AlertError } from "@/components/ui/alert-error"
import { DataTable } from "@/components/ui/data-table"
import { type DataTableFeatures } from "@/components/ui/data-table-features"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api"
import {
  formatFechaHora,
  listarHistorialGeneral,
  toLineasKardex,
  type LineaKardex,
} from "@/lib/historial-prestamos"

export function HistorialGeneral() {
  const [lineas, setLineas] = useState<LineaKardex[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState("")

  const loadItems = useCallback(async () => {
    const movimientos = await listarHistorialGeneral()
    setLineas(toLineasKardex(movimientos))
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
            : "No se pudo cargar el historial general.",
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [loadItems])

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<DataTableFeatures, LineaKardex>()

    return columnHelper.columns([
      columnHelper.accessor("fecha", {
        header: "Fecha y hora",
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatFechaHora(getValue())}</span>
        ),
      }),
      columnHelper.accessor("tipo", {
        header: "Movimiento",
        cell: ({ getValue }) => {
          const esPrestamo = getValue() === "prestamo"

          return (
            <span
              className={
                esPrestamo
                  ? "inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300"
                  : "inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
              }
            >
              {esPrestamo ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownLeft className="size-3.5" />
              )}
              {esPrestamo ? "Préstamo" : "Devolución"}
            </span>
          )
        },
      }),
      columnHelper.accessor("herramienta", {
        header: "Herramienta",
        sortFn: "text",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.herramienta}</p>
            <p className="text-xs text-muted-foreground">{row.original.categoria}</p>
          </div>
        ),
      }),
      columnHelper.accessor("unidad", {
        header: "Unidad",
        sortFn: "text",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("mecanico", {
        header: "Mecánico",
        sortFn: "text",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.mecanico}</p>
            {row.original.apodo ? (
              <p className="text-xs text-muted-foreground">“{row.original.apodo}”</p>
            ) : null}
          </div>
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
        <label htmlFor="kardex-search" className="sr-only">
          Buscar movimiento
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="kardex-search"
          className="h-9 pl-9"
          placeholder="Buscar por herramienta, mecánico o unidad..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
          Cargando kardex...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={lineas}
          search={search}
          pageSizeOptions={[5, 10, 20, 50]}
          emptyMessage={
            hasSearch
              ? "No se encontraron movimientos"
              : "No hay movimientos registrados"
          }
          emptyDescription={
            hasSearch
              ? "Intenta con otra herramienta, mecánico o unidad."
              : "Los préstamos y devoluciones aparecerán aquí como un kardex."
          }
        />
      )}
    </section>
  )
}
