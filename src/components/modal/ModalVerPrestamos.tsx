import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { Check, Clock, PackageOpen, Plus, RotateCcw, Search, Undo2, Wrench, X } from "lucide-react"

import { AlertError } from "@/components/ui/alert-error"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useClosingSnapshot } from "@/hooks/use-closing-snapshot"
import { DetalleUnidadPrestamo } from "@/components/prestamos/detalle-unidad-prestamo"
import {
  compararPorBusquedaCorta,
  formatBorrowedAt,
  nombreUnidad,
  textoBusquedaUnidad,
  type DetallePrestamoActivo,
  type MecanicoPunto,
} from "@/lib/prestamos"

type ModalVerPrestamosProps = {
  open: boolean
  mechanic?: MecanicoPunto | null
  loans: DetallePrestamoActivo[]
  isLoading?: boolean
  isSavingReturns?: boolean
  error?: string
  canAdd?: boolean
  onDismissError?: () => void
  onOpenChange: (open: boolean) => void
  onAddTool: () => void
  onSaveReturns: (detalleIds: string[]) => Promise<void>
}

// Fila memoizada para cada préstamo activo
const LoanItemRow = memo(function LoanItemRow({
  loan,
  isPending,
  disabled,
  onToggle,
}: {
  loan: DetallePrestamoActivo
  isPending: boolean
  disabled: boolean
  onToggle: (loanId: string) => void
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${isPending
        ? "border-amber-500/50 bg-amber-500/[0.07] dark:bg-amber-500/[0.12]"
        : "border-border"
        }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Wrench className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">
              {nombreUnidad(loan.unidad)}
            </p>
            {isPending ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <RotateCcw className="size-3" />
                Marcada para devolver
              </span>
            ) : null}
          </div>
          <DetalleUnidadPrestamo
            unidad={loan.unidad}
            className="text-xs"
          />
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            Prestada {formatBorrowedAt(loan.prestamo?.fecha_prestamo ?? "")}
          </p>
        </div>
      </div>

      {isPending ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="sm:shrink-0 border-amber-500/40 text-amber-700 hover:bg-amber-500/15 hover:text-amber-800 dark:border-amber-400/40 dark:text-amber-300 dark:hover:bg-amber-400/15"
          disabled={disabled}
          onClick={() => onToggle(loan.id)}
        >
          <Undo2 data-icon="inline-start" className="size-3.5" />
          Cancelar Devolución
        </Button>
      ) : (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="sm:shrink-0"
          disabled={disabled}
          onClick={() => onToggle(loan.id)}
        >
          <RotateCcw data-icon="inline-start" className="size-3.5" />
          Devolver
        </Button>
      )}
    </div>
  )
})

export function ModalVerPrestamos({
  open,
  mechanic,
  loans,
  isLoading = false,
  isSavingReturns = false,
  error = "",
  canAdd = true,
  onDismissError,
  onOpenChange,
  onAddTool,
  onSaveReturns,
}: ModalVerPrestamosProps) {
  const [search, setSearch] = useState("")
  const [pendingReturnIds, setPendingReturnIds] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setSearch("")
      setPendingReturnIds([])
    }
  }, [open])

  useEffect(() => {
    setPendingReturnIds((prev) => prev.filter((id) => loans.some((loan) => loan.id === id)))
  }, [loans])

  const displayedMechanic = useClosingSnapshot(open, mechanic)
  const displayedLoans = useClosingSnapshot(open, loans)
  const displayedLoading = useClosingSnapshot(open, isLoading)
  const displayedError = useClosingSnapshot(open, error)
  const displayedCanAdd = useClosingSnapshot(open, canAdd)

  const filteredLoans = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    const source = displayedLoans

    if (!query) return source

    return source
      .filter((loan) => {
        const haystack = [
          textoBusquedaUnidad(loan.unidad),
          loan.unidad?.observaciones ?? "",
        ]
          .join(" ")
          .toLocaleLowerCase()

        return haystack.includes(query)
      })
      .sort((a, b) =>
        compararPorBusquedaCorta(
          nombreUnidad(a.unidad),
          nombreUnidad(b.unidad),
          query,
        ),
      )
  }, [displayedLoans, search])

  const areAllLoansMarked =
    displayedLoans.length > 0 &&
    displayedLoans.every((loan) => pendingReturnIds.includes(loan.id))

  const handleToggleStageReturn = useCallback((loanId: string) => {
    setPendingReturnIds((prev) =>
      prev.includes(loanId) ? prev.filter((id) => id !== loanId) : [...prev, loanId],
    )
  }, [])

  const handleToggleSelectAllLoans = () => {
    if (areAllLoansMarked) {
      setPendingReturnIds([])
    } else {
      setPendingReturnIds(displayedLoans.map((loan) => loan.id))
    }
  }

  const handleSave = async () => {
    if (pendingReturnIds.length === 0) return

    try {
      await onSaveReturns(pendingReturnIds)
      setPendingReturnIds([])
      onOpenChange(false)
    } catch {
      // Si ocurre un error, los IDs se mantienen para reintentar
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(93vh,48rem)] w-[min(92vw,68rem)] max-w-none flex-col gap-4 overflow-hidden p-5 sm:max-w-none">
        <DialogHeader>
          <DialogTitle className="pr-8 text-lg">
            Listado de herramientas prestadas de “{displayedMechanic?.nombre_completo}”
          </DialogTitle>
        </DialogHeader>

        {displayedError ? (
          <AlertError onClose={() => onDismissError?.()}>{displayedError}</AlertError>
        ) : null}

        {/* Buscador de herramientas prestadas */}
        <div className="relative">
          <label htmlFor="search-active-loans" className="sr-only">
            Buscar herramientas prestadas
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search-active-loans"
            className="h-10 pr-9 pl-9 text-sm"
            placeholder="Buscar por herramienta, marca o detalles..."
            value={search}
            disabled={displayedLoading}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search.trim() ? (
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
              aria-label="Limpiar búsqueda"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        {/* Acciones superiores: Añadir herramienta y Devolver todas */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-y py-2.5 text-sm">
          <div className="flex items-center gap-2">
            {displayedCanAdd ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddTool}
              >
                <Plus data-icon="inline-start" />
                Añadir herramienta
              </Button>
            ) : null}

            {displayedLoans.length > 0 ? (
              <Button
                type="button"
                variant={areAllLoansMarked ? "outline" : "destructive"}
                size="sm"
                disabled={isSavingReturns}
                onClick={handleToggleSelectAllLoans}
              >
                {areAllLoansMarked ? (
                  <>
                    <Undo2 data-icon="inline-start" className="size-3.5" />
                    Cancelar Devolver Todas
                  </>
                ) : (
                  <>
                    <RotateCcw data-icon="inline-start" className="size-3.5" />
                    Devolver todas ({displayedLoans.length})
                  </>
                )}
              </Button>
            ) : null}
          </div>

          <span className="text-muted-foreground text-xs">
            {displayedLoans.length}{" "}
            {displayedLoans.length === 1
              ? "herramienta prestada"
              : "herramientas prestadas"}
          </span>
        </div>

        {/* Listado de herramientas activas */}
        {displayedLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Cargando préstamos...
          </div>
        ) : displayedLoans.length > 0 ? (
          filteredLoans.length > 0 ? (
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {filteredLoans.map((loan) => (
                <LoanItemRow
                  key={loan.id}
                  loan={loan}
                  isPending={pendingReturnIds.includes(loan.id)}
                  disabled={isSavingReturns}
                  onToggle={handleToggleStageReturn}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="mb-3 size-9 text-muted-foreground" />
              <p className="font-medium">No se encontraron herramientas</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No hay préstamos activos que coincidan con &ldquo;{search}&rdquo;.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => setSearch("")}
              >
                Limpiar búsqueda
              </Button>
            </div>
          )
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <PackageOpen className="mb-3 size-10 text-muted-foreground" />
            <p className="text-base font-medium">No tiene herramientas prestadas</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Este mecánico no cuenta con ningún préstamo activo actualmente.
            </p>
            {displayedCanAdd ? (
              <Button
                type="button"
                className="mt-4"
                size="sm"
                onClick={onAddTool}
              >
                <Plus data-icon="inline-start" />
                Registrar primer préstamo
              </Button>
            ) : null}
          </div>
        )}

        {/* Pie del modal */}
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
                Presiona &ldquo;Devolver&rdquo; en cada herramienta o &ldquo;Devolver todas&rdquo; para marcar las unidades a devolver.
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSavingReturns}
              onClick={() => onOpenChange(false)}
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
