import { FileCheck2, FileText, Pencil, Plane, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  badgeColorEstadoOrden,
  etiquetaEstadoOrden,
  ORDEN_ESTADO_BORRADOR,
  type OrdenRecepcion,
} from "@/lib/ordenes-recepcion"

type ModalDetalleOrdenRecepcionProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orden: OrdenRecepcion | null
  onVerPdf: (orden: OrdenRecepcion) => void
  onFinalizar?: (orden: OrdenRecepcion) => void
  onEditarBorrador?: (orden: OrdenRecepcion) => void
}

export const ModalDetalleOrdenRecepcion = ({
  open,
  onOpenChange,
  orden,
  onVerPdf,
  onFinalizar,
  onEditarBorrador,
}: ModalDetalleOrdenRecepcionProps) => {
  if (!orden) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-5xl max-h-[90vh] flex flex-col p-5 sm:p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pr-6">
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <FileText className="size-5 text-primary" />
                Documento de Recepción {orden.numero_orden}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Registrado el{" "}
                {new Date(orden.created_at).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </DialogDescription>
            </div>

            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border w-fit ${badgeColorEstadoOrden(
                orden.estado,
              )}`}
            >
              {etiquetaEstadoOrden(orden.estado)}
            </span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Tarjeta Datos Cliente & Motor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/40 p-3.5 rounded-lg border text-xs">
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Cliente
              </div>
              <div className="text-sm font-semibold text-foreground">
                {orden.cliente?.nombre_completo || "Cliente no asignado"}
              </div>
              {orden.cliente?.nit && (
                <div className="text-muted-foreground">
                  NIT: <span className="font-mono">{orden.cliente.nit}</span>
                </div>
              )}
              {orden.cliente?.celular && (
                <div className="text-muted-foreground">
                  Tel: {orden.cliente.celular}
                </div>
              )}
            </div>

            <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l sm:pl-3 pt-2 sm:pt-0">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Plane className="size-3.5 text-primary" />
                Motor / Aeronave
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div>
                  <span className="text-muted-foreground">Marca: </span>
                  <strong className="capitalize">{orden.marca}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Modelo: </span>
                  <strong>{orden.modelo}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Serie: </span>
                  <strong className="font-mono">{orden.serie}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Matrícula: </span>
                  <strong>{orden.matricula || "-"}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Configuración: </span>
                  <span>
                    {orden.bimotor
                      ? `BiMotor (Motor ${orden.motor_posicion || "no especificado"})`
                      : "Monomotor"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Componentes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Wrench className="size-3.5 text-primary" />
                Componentes Recibidos ({orden.items?.length || 0})
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/70 border-b font-semibold text-muted-foreground">
                  <tr>
                    <th className="py-2 px-3 text-center w-8">#</th>
                    <th className="py-2 px-3">Part Number</th>
                    <th className="py-2 px-3">Componente</th>
                    <th className="py-2 px-3 text-center w-14">Cant.</th>
                    <th className="py-2 px-3">Serie</th>
                    <th className="py-2 px-3">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {!orden.items || orden.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-4 text-center text-muted-foreground"
                      >
                        No hay componentes registrados.
                      </td>
                    </tr>
                  ) : (
                    orden.items.map((item) => (
                      <tr key={item.id || item.numero_item}>
                        <td className="py-2 px-3 text-center font-semibold text-muted-foreground">
                          {item.numero_item}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px]">
                          {item.part_number || "-"}
                        </td>
                        <td className="py-2 px-3 font-medium text-foreground">
                          {item.componente}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold text-[11px]">
                            {item.cantidad}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px]">
                          {item.serie || "-"}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {item.observacion || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>

          <div className="flex items-center gap-2">
            {orden.estado === ORDEN_ESTADO_BORRADOR && onEditarBorrador && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditarBorrador(orden)}
                className="gap-1.5 text-amber-600 hover:text-amber-700"
              >
                <Pencil className="size-4" />
                Editar Borrador
              </Button>
            )}

            {orden.estado === ORDEN_ESTADO_BORRADOR && onFinalizar && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => onFinalizar(orden)}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <FileCheck2 className="size-4" />
                Finalizar Orden
              </Button>
            )}

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => onVerPdf(orden)}
              className="gap-1.5"
            >
              <FileText className="size-4" />
              Ver Documento PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
