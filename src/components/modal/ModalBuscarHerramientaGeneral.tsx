import { useEffect, useMemo, useState } from "react"
import {
  CircleCheck,
  PackageSearch,
  RotateCcw,
  Search,
  UserRound,
  Wrench,
} from "lucide-react"

import { DetalleUnidadPrestamo } from "@/components/prestamos/detalle-unidad-prestamo"
import { AlertError } from "@/components/ui/alert-error"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useClosingSnapshot } from "@/hooks/use-closing-snapshot"
import {
  compararPorBusquedaCorta,
  formatBorrowedAt,
  type HerramientaGeneral,
} from "@/lib/prestamos"

type ModalBuscarHerramientaGeneralProps = {
  open: boolean
  tools: HerramientaGeneral[]
  isLoading?: boolean
  returningId?: string | null
  error?: string
  onOpenChange: (open: boolean) => void
  onDismissError?: () => void
  onReturnTool: (detalleId: string) => void
}

export function ModalBuscarHerramientaGeneral({
  open,
  tools,
  isLoading = false,
  returningId = null,
  error = "",
  onOpenChange,
  onDismissError,
  onReturnTool,
}: ModalBuscarHerramientaGeneralProps) {
  const [search, setSearch] = useState("")
  const displayedTools = useClosingSnapshot(open, tools)
  const displayedLoading = useClosingSnapshot(open, isLoading)
  const displayedError = useClosingSnapshot(open, error)

  useEffect(() => {
    if (open) setSearch("")
  }, [open])

  const filteredTools = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es")
    const source = search.trim() ? tools : displayedTools

    if (!query) return source

    return source
      .filter((item) =>
        [
          item.nombre,
          item.detalle,
          item.mechanicName,
          item.mechanicArea,
          item.estado === "en_uso" ? "en uso prestada" : "disponible",
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("es")
          .includes(query),
      )
      .sort((a, b) => compararPorBusquedaCorta(a.nombre, b.nombre, query))
  }, [displayedTools, search, tools])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(86vh,48rem)] w-[min(92vw,68rem)] max-w-none flex-col gap-4 overflow-hidden p-5 sm:max-w-none">
        <DialogHeader>
          <DialogTitle className="pr-8 text-lg">
            Buscar herramienta en general
          </DialogTitle>
          <DialogDescription>
            Consulta la ubicación y disponibilidad de todas las unidades del
            almacén.
          </DialogDescription>
        </DialogHeader>

        {displayedError ? (
          <AlertError onClose={() => onDismissError?.()}>{displayedError}</AlertError>
        ) : null}

        <div className="relative">
          <label htmlFor="general-tool-search" className="sr-only">
            Buscar herramienta en general
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="general-tool-search"
            className="h-10 pl-9"
            placeholder="Buscar por herramienta, marca, ubicación, estado o mecánico..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="flex items-center justify-between border-b pb-3 text-sm">
          <span className="font-medium">Todas las herramientas</span>
          <span className="text-muted-foreground">
            {filteredTools.length} unidades
          </span>
        </div>

        {displayedLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Cargando herramientas...
          </div>
        ) : filteredTools.length > 0 ? (
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {filteredTools.map((item) => {
              const estaEnUso = item.estado === "en_uso"

              return (
                <div
                  key={item.unidadId}
                  className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Wrench className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{item.nombre}</p>
                        <span
                          className={
                            estaEnUso
                              ? "rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300"
                              : "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                          }
                        >
                          {estaEnUso ? "En uso" : "Disponible"}
                        </span>
                      </div>
                      <DetalleUnidadPrestamo
                        unidad={item.unidad}
                        className="text-xs"
                      />
                      {estaEnUso && item.borrowedAt ? (
                        <p className="text-xs text-muted-foreground">
                          Prestada {formatBorrowedAt(item.borrowedAt)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {estaEnUso ? (
                    <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
                        <UserRound className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            En préstamo con
                          </p>
                          <p className="text-sm font-medium">{item.mechanicName}</p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={Boolean(returningId)}
                        onClick={() => item.detalleId && onReturnTool(item.detalleId)}
                      >
                        <RotateCcw data-icon="inline-start" />
                        {returningId === item.detalleId
                          ? "Devolviendo..."
                          : "Devolver"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-300">
                      <CircleCheck className="size-4" />
                      <span className="text-sm font-medium">En almacén</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <PackageSearch className="mb-3 size-9 text-muted-foreground" />
            <p className="font-medium">No se encontró la herramienta</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Verifica el nombre, la marca o la ubicación.
            </p>
          </div>
        )}

        <DialogFooter className="mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
