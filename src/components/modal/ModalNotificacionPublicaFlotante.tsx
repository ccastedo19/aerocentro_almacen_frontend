import { useEffect, useState } from "react"
import { Bell, Megaphone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { NotificacionPublica } from "@/lib/notificaciones-publicas"

type ModalNotificacionPublicaFlotanteProps = {
  notificacion: NotificacionPublica | null
}

export function ModalNotificacionPublicaFlotante({
  notificacion,
}: ModalNotificacionPublicaFlotanteProps) {
  const [open, setOpen] = useState(false)
  const [lastDismissedId, setLastDismissedId] = useState<string | null>(null)

  useEffect(() => {
    if (
      notificacion &&
      notificacion.estado === 1 &&
      notificacion.id !== lastDismissedId &&
      (notificacion.mensaje || notificacion.imagen)
    ) {
      setOpen(true)
    } else if (!notificacion || notificacion.estado !== 1) {
      setOpen(false)
    }
  }, [notificacion, lastDismissedId])

  if (!notificacion || notificacion.estado !== 1) {
    return null
  }

  const tieneImagen = Boolean(notificacion.imagen)
  const tieneMensaje = Boolean(notificacion.mensaje?.trim())

  if (!tieneImagen && !tieneMensaje) {
    return null
  }

  const handleClose = () => {
    setOpen(false)
    if (notificacion) {
      setLastDismissedId(notificacion.id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="flex h-auto w-[min(94vw,34rem)] max-w-none flex-col gap-4 overflow-hidden p-5 dark bg-zinc-900 text-zinc-100 border-emerald-500/40 shadow-2xl rounded-2xl">
        <DialogHeader className="border-b border-zinc-800 pb-3">
          <div className="flex items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Megaphone className="size-4 animate-bounce" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Aviso Importante
              </span>
            </div>
          </div>

          <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-white mt-1">
            {notificacion.titulo}
          </DialogTitle>
        </DialogHeader>

        {/* Imagen adjunta si existe */}
        {tieneImagen ? (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black/60 max-h-72 flex items-center justify-center">
            <img
              src={notificacion.imagen!}
              alt={notificacion.titulo}
              className="w-full max-h-72 object-contain"
            />
          </div>
        ) : null}

        {/* Mensaje si existe */}
        {tieneMensaje ? (
          <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-line bg-zinc-800/50 p-3 rounded-xl border border-zinc-800">
            {notificacion.mensaje}
          </p>
        ) : null}

        {/* Pie del modal */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-3 mt-1">
          <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Bell className="size-3 text-emerald-400" />
            Notificación pública oficial
          </span>

          <Button
            type="button"
            variant="info"
            size="sm"
            className="h-8 text-xs font-semibold px-4"
            onClick={handleClose}
          >
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
