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
  formatBorrowedAt,
  type Loan,
  type Mechanic,
  type Tool,
} from "@/lib/prestamos-data"

type ModalVerPrestamosProps = {
  open: boolean
  mechanic?: Mechanic
  loans: Loan[]
  tools: Tool[]
  onOpenChange: (open: boolean) => void
  onAddTool: () => void
  onReturnTool: (toolId: number) => void
  onReturnAll: () => void
}

export function ModalVerPrestamos({
  open,
  mechanic,
  loans,
  tools,
  onOpenChange,
  onAddTool,
  onReturnTool,
  onReturnAll,
}: ModalVerPrestamosProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-lg">
            Listado de herramientas prestadas de “{mechanic?.name}”
          </DialogTitle>
          <DialogDescription>
            Consulta los préstamos activos y registra la devolución de una o
            todas las herramientas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 border-y py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium">
            {loans.length}{" "}
            {loans.length === 1
              ? "herramienta activa"
              : "herramientas activas"}
          </span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="sm" onClick={onAddTool}>
              <Plus data-icon="inline-start" />
              Añadir herramienta
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={loans.length === 0}
              onClick={onReturnAll}
            >
              <RotateCcw data-icon="inline-start" />
              Devolver todas
            </Button>
          </div>
        </div>

        {loans.length > 0 ? (
          <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
            {loans.map((loan) => {
              const tool = tools.find((item) => item.id === loan.toolId)

              if (!tool) return null

              return (
                <div
                  key={loan.toolId}
                  className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Wrench className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{tool.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tool.category}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        Prestada {formatBorrowedAt(loan.borrowedAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="sm:shrink-0"
                    onClick={() => onReturnTool(loan.toolId)}
                  >
                    <RotateCcw data-icon="inline-start" />
                    Devolver
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
              Todas las herramientas de este mecánico fueron devueltas.
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
