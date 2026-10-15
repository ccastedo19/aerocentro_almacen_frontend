import { useEffect, useState } from "react"
import { Clock, Loader2, NotebookPen, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { actualizarNota, obtenerNota, type Nota } from "@/lib/nota"
import { toastExito } from "@/lib/toast"
import { cn } from "@/lib/utils"

type ModalNotaProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModalNota({ open, onOpenChange }: ModalNotaProps) {
  const [nota, setNota] = useState<Nota | null>(null)
  const [contenido, setContenido] = useState("")
  const [titulo, setTitulo] = useState("Anotaciones del Almacén")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  // Cargar nota al abrir el modal
  useEffect(() => {
    if (!open) return

    let isMounted = true
    setIsLoading(true)
    setError("")

    obtenerNota()
      .then((data) => {
        if (!isMounted) return
        setNota(data)
        setContenido(data.contenido ?? "")
        setTitulo(data.titulo || "Anotaciones del Almacén")
      })
      .catch(() => {
        if (!isMounted) return
        setError("No se pudo cargar la nota. Intenta nuevamente.")
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [open])

  const handleCerrar = async () => {
    if (isSaving) return

    // Si aún está cargando la nota original y el contenido está vacío, cerrar sin sobreescribir
    if (isLoading && !contenido.trim()) {
      onOpenChange(false)
      return
    }

    setIsSaving(true)
    setError("")

    try {
      await actualizarNota(contenido, titulo)
      toastExito("Nota guardada", "Las anotaciones se guardaron automáticamente.")
      onOpenChange(false)
    } catch {
      setError("No se pudo guardar la nota automáticamente. Revisa tu conexión.")
    } finally {
      setIsSaving(false)
    }
  }

  const palabras = contenido.trim() ? contenido.trim().split(/\s+/).length : 0
  const caracteres = contenido.length

  const formatearFecha = (fechaIso?: string) => {
    if (!fechaIso) return ""
    try {
      return new Intl.DateTimeFormat("es-VE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(fechaIso))
    } catch {
      return fechaIso
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen, details) => {
        if (!nextOpen) {
          // Evitar cerrar si se hizo clic afuera del modal
          if (details?.reason === "outside-press") {
            return
          }
          void handleCerrar()
          return
        }
        onOpenChange(true)
      }}
      disablePointerDismissal={true}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex h-[min(88vh,48rem)] w-[min(94vw,56rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none",
          "border-amber-200/60 bg-[#fffdfa] shadow-2xl dark:border-zinc-800 dark:bg-[#181920]",
        )}
      >
        {/* Cabecera estilo cuaderno / libreta legal */}
        <div className="relative border-b border-amber-900/10 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent px-6 py-4 dark:border-zinc-800 dark:from-amber-500/5">
          <div className="flex items-center justify-between gap-4">
            <DialogHeader className="gap-1 text-left">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                  <NotebookPen className="size-4" />
                </span>
                <DialogTitle className="text-lg font-bold tracking-tight text-amber-950 dark:text-amber-100">
                  {titulo || "Anotaciones del Almacén"}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Bloc de notas interno para registro de novedades, recordatorios y turnos de almacén.
              </DialogDescription>
            </DialogHeader>

            {/* Metadatos de última edición */}
            {nota?.updated_at ? (
              <div className="hidden text-right text-xs text-muted-foreground sm:block">
                <p className="flex items-center justify-end gap-1.5 font-medium">
                  <Clock className="size-3 text-amber-600 dark:text-amber-400" />
                  Última actualización: {formatearFecha(nota.updated_at)}
                </p>
                {nota.usuario ? (
                  <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px]">
                    <User className="size-3" />
                    Por {nota.usuario.nombre} {nota.usuario.apellido}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Línea perforada decorativa */}
          <div className="absolute -bottom-[1px] left-0 right-0 h-[1px] border-b border-dashed border-amber-400/40 dark:border-zinc-700" />
        </div>

        {error ? (
          <div className="border-b border-destructive/20 bg-destructive/10 px-6 py-2 text-xs font-medium text-destructive">
            {error}
          </div>
        ) : null}

        {/* Cuerpo estilo Hoja de Papel con líneas guía y margen rojo */}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Margen izquierdo con orificios de libreta */}
          <div className="relative flex w-12 shrink-0 flex-col items-center justify-around border-r-2 border-rose-400/50 bg-[#fffdfa]/80 py-8 select-none dark:border-rose-900/60 dark:bg-[#181920]/80">
            <span className="size-3.5 rounded-full border border-slate-300 bg-muted/70 shadow-inner dark:border-zinc-700" />
            <span className="size-3.5 rounded-full border border-slate-300 bg-muted/70 shadow-inner dark:border-zinc-700" />
            <span className="size-3.5 rounded-full border border-slate-300 bg-muted/70 shadow-inner dark:border-zinc-700" />
          </div>

          {/* Área de escritura con renglones de papel */}
          <div className="relative flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin text-amber-600" />
                Cargando anotaciones...
              </div>
            ) : (
              <div
                className="relative min-h-full w-full"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(transparent, transparent 31px, rgba(148, 163, 184, 0.22) 31px, rgba(148, 163, 184, 0.22) 32px)",
                  backgroundAttachment: "local",
                }}
              >
                <textarea
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  placeholder="Escribe tus anotaciones, pendientes o novedades aquí..."
                  className={cn(
                    "h-full min-h-[28rem] w-full bg-transparent px-5 pt-2 text-sm sm:text-base",
                    "leading-[32px] font-normal text-slate-800 placeholder:text-slate-400/70 dark:text-zinc-100 dark:placeholder:text-zinc-600",
                    "resize-none border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0",
                  )}
                  style={{
                    lineHeight: "32px",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Pie del modal más espacioso con contador y único botón Cerrar */}
        <DialogFooter className="flex flex-col-reverse items-center justify-between border-t border-amber-900/10 bg-[#fbf9f4] px-6 py-5 sm:flex-row sm:px-8 sm:py-6 dark:border-zinc-800 dark:bg-[#14151a]">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              {palabras} {palabras === 1 ? "palabra" : "palabras"}
            </span>
            <span>·</span>
            <span>
              {caracteres} {caracteres === 1 ? "carácter" : "caracteres"}
            </span>
          </div>

          <div className="flex w-full items-center justify-end sm:w-auto">
            <Button
              type="button"
              variant="default"
              disabled={isSaving}
              onClick={handleCerrar}
              className="h-10 w-full sm:w-auto px-7 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 shadow-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Cerrar"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
