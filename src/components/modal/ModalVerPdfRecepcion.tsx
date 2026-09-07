import { useMemo } from "react"
import { Download, ExternalLink, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ModalVerPdfRecepcionProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pdfBase64: string | null
  numeroOrden: string
}

export const ModalVerPdfRecepcion = ({
  open,
  onOpenChange,
  pdfBase64,
  numeroOrden,
}: ModalVerPdfRecepcionProps) => {
  const pdfBlobUrl = useMemo(() => {
    if (!pdfBase64) return null
    try {
      const byteCharacters = atob(pdfBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "application/pdf" })
      return URL.createObjectURL(blob)
    } catch {
      return null
    }
  }, [pdfBase64])

  const handleDownload = () => {
    if (!pdfBlobUrl) return
    const link = document.createElement("a")
    link.href = pdfBlobUrl
    link.download = `Recepcion_${numeroOrden || "documento"}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenNewTab = () => {
    if (!pdfBlobUrl) return
    window.open(pdfBlobUrl, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] max-w-[80vw] sm:max-w-[80vw] max-h-[95vh] h-[92vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <div className="space-y-0.5">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
              <FileText className="size-5 text-primary" />
              Documento de Recepción - {numeroOrden}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Previsualización oficial del documento en formato PDF listo para imprimir o archivar.
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2 pr-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5"
              disabled={!pdfBlobUrl}
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">Descargar</span>
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleOpenNewTab}
              className="gap-1.5"
              disabled={!pdfBlobUrl}
            >
              <ExternalLink className="size-4" />
              <span className="hidden sm:inline">Abrir en pestaña</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 w-full h-full min-h-0 bg-muted/40 rounded-lg overflow-hidden border">
          {pdfBlobUrl ? (
            <iframe
              src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
              title={`PDF ${numeroOrden}`}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <FileText className="size-12 animate-pulse text-muted-foreground/50" />
              <p className="text-sm">Generando documento PDF...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
