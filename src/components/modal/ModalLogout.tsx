import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ModalLogoutProps = {
  open: boolean
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ModalLogout({
  open,
  isSubmitting = false,
  onOpenChange,
  onConfirm,
}: ModalLogoutProps) {
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
          <DialogTitle>Salir del sistema</DialogTitle>
          <DialogDescription>
            ¿Deseas cerrar tu sesión? Tendrás que iniciar sesión de nuevo para
            entrar al almacén.
          </DialogDescription>
        </DialogHeader>

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
            <LogOut data-icon="inline-start" />
            {isSubmitting ? "Saliendo..." : "Salir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
