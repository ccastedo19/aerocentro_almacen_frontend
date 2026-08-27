import { Clock, PackageOpen, Plus, RotateCcw, Wrench } from "lucide-react"

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
import { useClosingSnapshot } from "@/hooks/use-closing-snapshot"
import { DetalleUnidadPrestamo } from "@/components/prestamos/detalle-unidad-prestamo"
import {
  formatBorrowedAt,
  nombreUnidad,
  type DetallePrestamoActivo,
  type MecanicoPunto,
} from "@/lib/prestamos"

type ModalVerPrestamosProps = {
  open: boolean
  mechanic?: MecanicoPunto | null
  loans: DetallePrestamoActivo[]
  isLoading?: boolean
  returningId?: string | null
  isReturningAll?: boolean
  error?: string
  canAdd?: boolean
  onDismissError?: () => void
  onOpenChange: (open: boolean) => void
  onAddTool: () => void
  onReturnTool: (detalleId: string) => void
  onReturnAll: () => void
}

export function ModalVerPrestamos({
  open,
  mechanic,
  loans,
  isLoading = false,
  returningId = null,
  isReturningAll = false,
  error = "",
  canAdd = true,
  onDismissError,
  onOpenChange,
  onAddTool,
  onReturnTool,
  onReturnAll,
}: ModalVerPrestamosProps) {
  const displayedMechanic = useClosingSnapshot(open, mechanic)
  const displayedLoans = useClosingSnapshot(open, loans)
  const displayedLoading = useClosingSnapshot(open, isLoading)
  const displayedError = useClosingSnapshot(open, error)
  const displayedCanAdd = useClosingSnapshot(open, canAdd)
  const isBusy = Boolean(returningId) || isReturningAll

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(86vh,48rem)] w-[min(92vw,68rem)] max-w-none flex-col gap-4 overflow-hidden p-5 sm:max-w-none">
        <DialogHeader>
          <DialogTitle className="pr-8 text-lg">
            Listado de herramientas prestadas de “{displayedMechanic?.nombre_completo}”
          </DialogTitle>
          <DialogDescription>
            Consulta los préstamos activos y registra la devolución de una o
            todas las unidades.
          </DialogDescription>
        </DialogHeader>

        {displayedError ? (
          <AlertError onClose={() => onDismissError?.()}>{displayedError}</AlertError>
        ) : null}

        <div className="flex flex-col gap-3 border-y py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium">
            {displayedLoans.length}{" "}
            {displayedLoans.length === 1
              ? "herramienta activa"
              : "herramientas activas"}
          </span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="success"
              size="sm"
              disabled={!displayedCanAdd || isBusy}
              onClick={onAddTool}
            >
              <Plus data-icon="inline-start" />
              Añadir herramienta
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={displayedLoans.length === 0 || isBusy}
              onClick={onReturnAll}
            >
              <RotateCcw data-icon="inline-start" />
              {isReturningAll ? "Devolviendo..." : "Devolver todas"}
            </Button>
          </div>
        </div>

        {displayedLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Cargando préstamos...
          </div>
        ) : displayedLoans.length > 0 ? (
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {displayedLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Wrench className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {nombreUnidad(loan.unidad)}
                      </p>
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
                  <Button
                    variant="destructive"
                    size="sm"
                    className="sm:shrink-0"
                    disabled={isBusy}
                    onClick={() => onReturnTool(loan.id)}
                  >
                    <RotateCcw data-icon="inline-start" />
                    {returningId === loan.id ? "Devolviendo..." : "Devolver"}
                  </Button>
                </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <PackageOpen className="mb-3 size-9 text-muted-foreground" />
            <p className="font-medium">No hay préstamos activos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Todas las unidades de este mecánico fueron devueltas.
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
