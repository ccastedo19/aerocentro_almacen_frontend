import { useEffect, useState } from "react"
import { Plus, Trash2, Wrench } from "lucide-react"

import { ClienteCombobox } from "@/components/form/ClienteCombobox"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiError } from "@/lib/api"
import { type Cliente } from "@/lib/clientes"
import {
  actualizarOrdenRecepcion,
  MARCAS_MOTOR,
  POSICIONES_MOTOR,
  type ItemFormValues,
  type OrdenRecepcion,
} from "@/lib/ordenes-recepcion"
import { toastExito } from "@/lib/toast"

type ModalEditarOrdenRecepcionProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orden: OrdenRecepcion | null
  clientes: Cliente[]
  onSuccess: (ordenActualizada: OrdenRecepcion) => void
}

const itemVacio: ItemFormValues = {
  part_number: "",
  componente: "",
  cantidad: 1,
  serie: "",
  observacion: "",
}

export const ModalEditarOrdenRecepcion = ({
  open,
  onOpenChange,
  orden,
  clientes,
  onSuccess,
}: ModalEditarOrdenRecepcionProps) => {
  const [clienteId, setClienteId] = useState("")
  const [marca, setMarca] = useState("continental")
  const [modelo, setModelo] = useState("")
  const [serie, setSerie] = useState("")
  const [matricula, setMatricula] = useState("")
  const [bimotor, setBimotor] = useState(false)
  const [motorPosicion, setMotorPosicion] = useState("izquierdo")

  const [items, setItems] = useState<ItemFormValues[]>([])
  const [nuevoItem, setNewItem] = useState<ItemFormValues>({ ...itemVacio })
  const [itemInputError, setItemInputError] = useState("")

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (orden && open) {
      setClienteId(orden.cliente_id || "")
      setMarca(orden.marca || "continental")
      setModelo(orden.modelo || "")
      setSerie(orden.serie || "")
      setMatricula(orden.matricula || "")
      setBimotor(Boolean(orden.bimotor))
      setMotorPosicion(orden.motor_posicion || "izquierdo")
      setItems(
        orden.items?.map((it) => ({
          part_number: it.part_number || "",
          componente: it.componente || "",
          cantidad: it.cantidad || 1,
          serie: it.serie || "",
          observacion: it.observacion || "",
        })) || [],
      )
      setNewItem({ ...itemVacio })
      setError("")
      setItemInputError("")
    }
  }, [orden, open])

  const handleAgregarItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setItemInputError("")

    if (!nuevoItem.part_number.trim()) {
      setItemInputError("El Part Number (P/N) es obligatorio.")
      return
    }

    if (!nuevoItem.componente.trim()) {
      setItemInputError("El componente es obligatorio.")
      return
    }

    if (nuevoItem.cantidad < 1) {
      setItemInputError("La cantidad debe ser mayor a 0.")
      return
    }

    if (!nuevoItem.serie.trim()) {
      setItemInputError("El número de serie (S/N) es obligatorio.")
      return
    }

    setItems((prev) => [
      ...prev,
      {
        part_number: nuevoItem.part_number.trim(),
        componente: nuevoItem.componente.trim(),
        cantidad: Number(nuevoItem.cantidad) || 1,
        serie: nuevoItem.serie.trim(),
        observacion: nuevoItem.observacion.trim(),
      },
    ])
    setNewItem({ ...itemVacio })
  }

  const handleEliminarItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGuardar = async () => {
    if (!orden) return
    setError("")

    if (!clienteId) {
      setError("Debes seleccionar un cliente.")
      return
    }
    if (!marca) {
      setError("Debes seleccionar la marca.")
      return
    }
    if (!modelo.trim()) {
      setError("El modelo es obligatorio.")
      return
    }
    if (!serie.trim()) {
      setError("El número de serie es obligatorio.")
      return
    }
    if (!matricula.trim()) {
      setError("La matrícula de la aeronave es obligatoria.")
      return
    }
    if (items.length === 0) {
      setError("Debes incluir al menos un componente en la orden.")
      return
    }

    try {
      setIsSaving(true)
      const payload = {
        cliente_id: clienteId,
        marca,
        modelo: modelo.trim(),
        serie: serie.trim(),
        matricula: matricula.trim(),
        bimotor,
        motor_posicion: bimotor ? motorPosicion : null,
        items,
      }

      const actualizada = await actualizarOrdenRecepcion(orden.id, payload)
      toastExito(`Orden ${actualizada.numero_orden} actualizada correctamente`)
      onSuccess(actualizada)
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Error al guardar los cambios de la orden.")
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (!orden) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-5 sm:p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-lg font-bold">
            Editar Documento de Recepción - {orden.numero_orden}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Modifica la información general o la lista de componentes recibidos.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <AlertError onClose={() => setError("")}>{error}</AlertError>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Datos del Cliente y Motor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/20 p-3.5 rounded-lg border text-xs">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-black dark:text-white">
                Cliente *
              </label>
              <ClienteCombobox
                value={clienteId}
                clientes={clientes}
                onChange={setClienteId}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-black dark:text-white">
                Marca del Motor *
              </label>
              <Select
                value={marca}
                onValueChange={(val) => setMarca(val ?? "continental")}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue>
                    {marca === "lycoming" ? "Lycoming" : "Continental"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MARCAS_MOTOR.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-black dark:text-white">
                Modelo *
              </label>
              <Input
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-black dark:text-white">
                Número de Serie (S/N) *
              </label>
              <Input
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-black dark:text-white">
                Matrícula de Aeronave *
              </label>
              <Input
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between border-t pt-2 mt-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-bimotor"
                  checked={bimotor}
                  onChange={(e) => setBimotor(e.target.checked)}
                  className="size-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="edit-bimotor" className="text-xs font-semibold text-black dark:text-white cursor-pointer">
                  Aeronave BiMotor
                </label>
              </div>

              {bimotor && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-black dark:text-white">Posición:</span>
                  <Select
                    value={motorPosicion}
                    onValueChange={(val) => setMotorPosicion(val ?? "izquierdo")}
                  >
                    <SelectTrigger className="h-8 w-44 text-xs">
                      <SelectValue>
                        {motorPosicion === "derecho" ? "Motor Derecho" : "Motor Izquierdo"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {POSICIONES_MOTOR.map((p) => (
                        <SelectItem key={p.value} value={p.value} className="text-xs">
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Componentes */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-black dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wrench className="size-3.5 text-primary" />
                Componentes Recibidos ({items.length})
              </span>
            </div>

            {/* Input para añadir item */}
            <form
              onSubmit={handleAgregarItem}
              className="bg-muted/30 rounded-lg p-2.5 border grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs"
            >
              <div className="sm:col-span-3">
                <Input
                  placeholder="Part Number *"
                  value={nuevoItem.part_number}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, part_number: e.target.value }))
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="sm:col-span-4">
                <Input
                  placeholder="Componente *"
                  value={nuevoItem.componente}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, componente: e.target.value }))
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  type="number"
                  min={1}
                  placeholder="Cant. *"
                  value={nuevoItem.cantidad}
                  onChange={(e) =>
                    setNewItem((p) => ({
                      ...p,
                      cantidad: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="h-8 text-xs text-center"
                />
              </div>
              <div className="sm:col-span-3">
                <Input
                  placeholder="Serie (S/N) *"
                  value={nuevoItem.serie}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, serie: e.target.value }))
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="sm:col-span-9">
                <Input
                  placeholder="Observación"
                  value={nuevoItem.observacion}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, observacion: e.target.value }))
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="sm:col-span-3">
                <Button type="submit" size="sm" className="w-full h-8 text-xs gap-1">
                  <Plus className="size-3.5" />
                  Agregar
                </Button>
              </div>

              {itemInputError && (
                <div className="sm:col-span-12 text-[11px] font-medium text-destructive">
                  {itemInputError}
                </div>
              )}
            </form>

            {/* Tabla de items */}
            <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/70 sticky top-0 border-b font-semibold text-muted-foreground">
                  <tr>
                    <th className="py-2 px-2.5 w-8 text-center">#</th>
                    <th className="py-2 px-2.5">P/N</th>
                    <th className="py-2 px-2.5">Componente</th>
                    <th className="py-2 px-2.5 text-center w-12">Cant.</th>
                    <th className="py-2 px-2.5">Serie</th>
                    <th className="py-2 px-2.5">Observación</th>
                    <th className="py-2 px-2.5 text-right w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="py-2 px-2.5 text-center font-semibold text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-[11px]">
                        {item.part_number || "-"}
                      </td>
                      <td className="py-2 px-2.5 font-medium">{item.componente}</td>
                      <td className="py-2 px-2.5 text-center">{item.cantidad}</td>
                      <td className="py-2 px-2.5 font-mono text-[11px]">
                        {item.serie || "-"}
                      </td>
                      <td className="py-2 px-2.5 text-muted-foreground truncate max-w-[150px]">
                        {item.observacion || "-"}
                      </td>
                      <td className="py-2 px-2.5 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6 text-destructive hover:bg-destructive/10"
                          onClick={() => handleEliminarItem(idx)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleGuardar}
            disabled={isSaving}
          >
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
