import { useEffect, useMemo, useState } from "react"
import { Check, RotateCcw, Search, Undo2, UserRound, Wrench } from "lucide-react"

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
import { formatBorrowedAt, compararPorBusquedaCorta, type PrestamoEnUso } from "@/lib/prestamos"
import { DetalleUnidadPrestamo } from "@/components/prestamos/detalle-unidad-prestamo"

type ModalBuscarHerramientaEnUsoProps = {
  open: boolean
  usedTools: PrestamoEnUso[]
  isLoading?: boolean
  isSavingReturns?: boolean
  error?: string
  onOpenChange: (open: boolean) => void
  onDismissError?: () => void
  onSaveReturns: (detalleIds: string[]) => Promise<void>
}

export function ModalBuscarHerramientaEnUso({
  open,
  usedTools,
  isLoading = false,
  isSavingReturns = false,
  error = "",
  onOpenChange,
  onDismissError,
  onSaveReturns,
}: ModalBuscarHerramientaEnUsoProps) {
  const [search, setSearch] = useState("")
  const [pendingReturnIds, setPendingReturnIds] = useState<string[]>([])

  const displayedTools = useClosingSnapshot(open, usedTools)
  const displayedLoading = useClosingSnapshot(open, isLoading)
  const displayedError = useClosingSnapshot(open, error)

  useEffect(() => {
    if (open) {
      setSearch("")
      setPendingReturnIds([])
    }
  }, [open])

  useEffect(() => {
    setPendingReturnIds((prev) =>
      prev.filter((id) => usedTools.some((tool) => tool.detalleId === id)),
    )
  }, [usedTools])

  const filteredTools = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    const source = search.trim() ? usedTools : displayedTools

    if (!query) return source

    return source
      .filter((item) => {
        const haystack = [
          item.nombre,
          item.detalle,
          item.mechanicName,
          item.mechanicArea,
        ]
          .join(" ")
          .toLocaleLowerCase()

        return haystack.includes(query)
      })
      .sort((a, b) => compararPorBusquedaCorta(a.nombre, b.nombre, query))
  }, [displayedTools, search, usedTools])

  const handleToggleStage = (detalleId: string) => {
    setPendingReturnIds((prev) =>
      prev.includes(detalleId)
        ? prev.filter((id) => id !== detalleId)
        : [...prev, detalleId],
    )
  }

  const handleSave = async () => {
    if (pendingReturnIds.length === 0) return
    try {
      await onSaveReturns(pendingReturnIds)
      setPendingReturnIds([])
      closeModal()
    } catch {
      // Se preservan los IDs si falla
    }
  }

  const closeModal = () => {
    setPendingReturnIds([])
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeModal()
          return
        }

        onOpenChange(true)
      }}
    >
      <DialogContent className="flex h-[min(86vh,48rem)] w-[min(92vw,68rem)] max-w-none flex-col gap-4 overflow-hidden p-5 sm:max-w-none">
        <DialogHeader>
          <DialogTitle className="pr-8 text-lg">
            Buscar herramienta en uso
          </DialogTitle>
          <DialogDescription>
            Consulta qué mecánico tiene una unidad prestada y selecciona las que deseas registrar como devueltas.
          </DialogDescription>
        </DialogHeader>

        {displayedError ? (
          <AlertError onClose={() => onDismissError?.()}>{displayedError}</AlertError>
        ) : null}

        <div className="relative">
          <label htmlFor="used-tool-search" className="sr-only">
            Buscar herramienta en uso
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="used-tool-search"
            className="h-10 pl-9"
            placeholder="Buscar por herramienta, marca, ubicación o mecánico..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="flex items-center justify-between border-b pb-3 text-sm">
          <span className="font-medium">Herramientas prestadas</span>
          <span className="text-muted-foreground">
            {filteredTools.length} en uso
          </span>
        </div>

        {displayedLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Cargando herramientas en uso...
          </div>
        ) : filteredTools.length > 0 ? (
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {filteredTools.map((item) => {
              const isPending = pendingReturnIds.includes(item.detalleId)

              return (
                <div
                  key={item.detalleId}
                  className={`flex flex-col gap-3 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                    isPending
                      ? "border-amber-500/50 bg-amber-500/[0.07] dark:bg-amber-500/[0.12]"
                      : "border-border"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Wrench className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{item.nombre}</p>
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                            <RotateCcw className="size-3" />
                            Marcada para devolver
                          </span>
                        ) : null}
                      </div>
                      <DetalleUnidadPrestamo
                        unidad={item.unidad}
                        className="text-xs"
                      />
                      {item.borrowedAt ? (
                        <p className="text-xs text-muted-foreground">
                          Prestada {formatBorrowedAt(item.borrowedAt)}
                        </p>
                      ) : null}
                    </div>
                  </div>

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

                    {isPending ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-amber-500/40 text-amber-700 hover:bg-amber-500/15 hover:text-amber-800 dark:border-amber-400/40 dark:text-amber-300 dark:hover:bg-amber-400/15"
                        disabled={isSavingReturns}
                        onClick={() => handleToggleStage(item.detalleId)}
                      >
                        <Undo2 data-icon="inline-start" className="size-3.5" />
                        Cancelar Devolución
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isSavingReturns}
                        onClick={() => handleToggleStage(item.detalleId)}
                      >
                        <RotateCcw data-icon="inline-start" className="size-3.5" />
                        Devolver
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Search className="mb-3 size-9 text-muted-foreground" />
            <p className="font-medium">
              {usedTools.length === 0
                ? "No hay herramientas prestadas"
                : "No se encontró la herramienta"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {usedTools.length === 0
                ? "Cuando un mecánico tome una unidad, aparecerá aquí."
                : "Verifica el nombre o busca otra herramienta en uso."}
            </p>
          </div>
        )}

        <DialogFooter className="mt-auto flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {pendingReturnIds.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-medium text-foreground">
                  {pendingReturnIds.length}{" "}
                  {pendingReturnIds.length === 1
                    ? "devolución pendiente por guardar"
                    : "devoluciones pendientes por guardar"}
                </span>
              </div>
            ) : (
              <span>
                Presiona &ldquo;Devolver&rdquo; en las herramientas que quieras devolver y luego guarda.
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSavingReturns}
              onClick={closeModal}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              variant="success"
              disabled={pendingReturnIds.length === 0 || isSavingReturns}
              onClick={() => void handleSave()}
            >
              <Check data-icon="inline-start" className="size-4" />
              {isSavingReturns
                ? "Guardando devoluciones..."
                : pendingReturnIds.length > 0
                  ? `Guardar Devoluciones (${pendingReturnIds.length})`
                  : "Guardar Devoluciones"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
