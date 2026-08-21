import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ModalConfirmarEliminarProps = {
  open: boolean
  singular: string
  nombre?: string
  descripcion?: string
  isSubmitting: boolean
  error: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ModalConfirmarEliminar({
  open,
  singular,
  nombre,
  descripcion,
  isSubmitting,
  error,
  onOpenChange,
  onConfirm,
}: ModalConfirmarEliminarProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar {singular}</DialogTitle>
          <DialogDescription>
            {descripcion
              ? descripcion
              : nombre
                ? `Se ocultará “${nombre}” del inventario. Puedes volver a activarla después si es necesario.`
                : `Se ocultará este registro del inventario.`}
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

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
