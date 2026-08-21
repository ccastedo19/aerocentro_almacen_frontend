import { Clock, PackageOpen, Plus, RotateCcw, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  categoriaUnidad,
  detalleUnidad,
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
  onOpenChange,
  onAddTool,
  onReturnTool,
  onReturnAll,
}: ModalVerPrestamosProps) {
  const isBusy = Boolean(returningId) || isReturningAll

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-lg">
            Listado de herramientas prestadas de “{mechanic?.nombre_completo}”
          </DialogTitle>
          <DialogDescription>
            Consulta los préstamos activos y registra la devolución de una o
            todas las unidades.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-y py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium">
            {loans.length}{" "}
            {loans.length === 1
              ? "herramienta activa"
              : "herramientas activas"}
          </span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              disabled={!canAdd || isBusy}
              onClick={onAddTool}
            >
              <Plus data-icon="inline-start" />
              Añadir herramienta
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={loans.length === 0 || isBusy}
              onClick={onReturnAll}
            >
              <RotateCcw data-icon="inline-start" />
              {isReturningAll ? "Devolviendo..." : "Devolver todas"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Cargando préstamos...
          </div>
        ) : loans.length > 0 ? (
          <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
            {loans.map((loan) => {
              const extra = detalleUnidad(loan.unidad)

              return (
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
                      <p className="text-xs text-muted-foreground">
                        {categoriaUnidad(loan.unidad)}
                        {extra ? ` · ${extra}` : ""}
                      </p>
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
              )
            })}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
