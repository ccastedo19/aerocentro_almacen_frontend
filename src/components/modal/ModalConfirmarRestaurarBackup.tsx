import { RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatFechaBackup, type BackupItem } from "@/lib/backups"

type ModalConfirmarRestaurarBackupProps = {
  backup: BackupItem | null
  open: boolean
  isSubmitting: boolean
  error: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ModalConfirmarRestaurarBackup({
  backup,
  open,
  isSubmitting,
  error,
  onOpenChange,
  onConfirm,
}: ModalConfirmarRestaurarBackupProps) {
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
          <DialogTitle>Usar este backup</DialogTitle>
          <DialogDescription>
            {backup
              ? `Se reemplazarán los datos actuales del almacén por la copia del ${formatFechaBackup(backup.fecha)} (${backup.nombre_archivo}). Al terminar se cerrará tu sesión y tendrás que volver a iniciar. Esta acción no se puede deshacer.`
              : "Se reemplazarán los datos actuales del almacén. Al terminar se cerrará tu sesión y tendrás que volver a iniciar. Esta acción no se puede deshacer."}
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
            <RotateCcw data-icon="inline-start" />
            {isSubmitting ? "Restaurando..." : "Usar backup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
