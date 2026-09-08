import { useEffect, useRef, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Pencil,
  Plus,
  Trash2,
  Wrench,
  X,
} from "lucide-react"

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
  TIPOS_RECEPCION,
  type ItemFormValues,
  type OrdenRecepcion,
  type TipoRecepcion,
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
  const [tipo, setTipo] = useState<TipoRecepcion>("motor")
  const [clienteId, setClienteId] = useState("")
  const [marca, setMarca] = useState("continental")
  const [modelo, setModelo] = useState("")
  const [serie, setSerie] = useState("")
  const [matricula, setMatricula] = useState("")

  const [items, setItems] = useState<ItemFormValues[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null)
  const [nuevoItem, setNewItem] = useState<ItemFormValues>({ ...itemVacio })
  const [itemInputError, setItemInputError] = useState("")
  const partNumberInputRef = useRef<HTMLInputElement>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (orden && open) {
      setTipo((orden.tipo as TipoRecepcion) || "motor")
      setClienteId(orden.cliente_id || "")
      setMarca(orden.marca || "continental")
      setModelo(orden.modelo || "")
      setSerie(orden.serie || "")
      setMatricula(orden.matricula || "")
      setItems(
        orden.items?.map((it, idx) => ({
          part_number: it.part_number || "",
          componente: it.componente || "",
          cantidad: it.cantidad || 1,
          serie: it.serie || "",
          observacion: it.observacion || "",
          _order: idx,
        })) || [],
      )
      setEditingIndex(null)
      setSortDirection(null)
      setNewItem({ ...itemVacio })
      setError("")
      setItemInputError("")
    }
  }, [orden, open])

  const handleCantidadChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "")
    if (digitsOnly === "") {
      setNewItem((prev) => ({ ...prev, cantidad: "" as unknown as number }))
      return
    }
    const parsed = parseInt(digitsOnly, 10)
    if (parsed === 0) {
      setNewItem((prev) => ({ ...prev, cantidad: 1 }))
    } else {
      setNewItem((prev) => ({ ...prev, cantidad: parsed }))
    }
  }

  const handleCantidadBlur = () => {
    if (!nuevoItem.cantidad || Number(nuevoItem.cantidad) < 1) {
      setNewItem((prev) => ({ ...prev, cantidad: 1 }))
    }
  }

  const handleAgregarItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setItemInputError("")

    if (!nuevoItem.componente.trim()) {
      setItemInputError("El componente es obligatorio.")
      return
    }

    const cant = Number(nuevoItem.cantidad) >= 1 ? Number(nuevoItem.cantidad) : 1

    const nextOrder =
      items.length > 0
        ? Math.max(...items.map((i) => i._order ?? 0)) + 1
        : 0

    const itemData: ItemFormValues = {
      part_number: nuevoItem.part_number.trim(),
      componente: nuevoItem.componente.trim(),
      cantidad: cant,
      serie: nuevoItem.serie.trim(),
      observacion: nuevoItem.observacion.trim(),
      _order:
        editingIndex !== null
          ? (items[editingIndex]._order ?? nextOrder)
          : nextOrder,
    }

    if (editingIndex !== null) {
      setItems((prev) =>
        prev.map((it, idx) => (idx === editingIndex ? itemData : it)),
      )
      setEditingIndex(null)
    } else {
      setItems((prev) => [...prev, itemData])
    }

    setNewItem({ ...itemVacio })
    setTimeout(() => {
      partNumberInputRef.current?.focus()
    }, 0)
  }

  const handleIniciarEditarItem = (index: number) => {
    setEditingIndex(index)
    setNewItem({ ...items[index] })
    setItemInputError("")
    setTimeout(() => {
      partNumberInputRef.current?.focus()
    }, 0)
  }

  const handleEliminarItem = (index: number) => {
    if (editingIndex === index) {
      setEditingIndex(null)
      setNewItem({ ...itemVacio })
    } else if (editingIndex !== null && index < editingIndex) {
      setEditingIndex(editingIndex - 1)
    }
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleOrdenarPorComponente = () => {
    if (items.length <= 1) return

    let nextDirection: "asc" | "desc" | null = null
    if (sortDirection === null) {
      nextDirection = "asc"
    } else if (sortDirection === "asc") {
      nextDirection = "desc"
    } else {
      nextDirection = null
    }

    setSortDirection(nextDirection)

    setItems((prev) => {
      const cloned = [...prev]
      if (nextDirection === "asc") {
        return cloned.sort((a, b) => {
          const compA = a.componente.trim().toLowerCase()
          const compB = b.componente.trim().toLowerCase()
          return compA.localeCompare(compB, "es", { sensitivity: "base" })
        })
      } else if (nextDirection === "desc") {
        return cloned.sort((a, b) => {
          const compA = a.componente.trim().toLowerCase()
          const compB = b.componente.trim().toLowerCase()
          return compB.localeCompare(compA, "es", { sensitivity: "base" })
        })
      } else {
        // Vuelve al estado predeterminado / original
        return cloned.sort((a, b) => (a._order ?? 0) - (b._order ?? 0))
      }
    })
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
        tipo,
        cliente_id: clienteId,
        marca,
        modelo: modelo.trim(),
        serie: serie.trim(),
        matricula: matricula.trim(),
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
            {/* Tipo de Recepción */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-black dark:text-white">
                Tipo de Recepción *
              </label>
              <div className="flex items-center gap-2">
                {TIPOS_RECEPCION.map((t) => (
                  <Button
                    key={t.value}
                    type="button"
                    size="sm"
                    variant={tipo === t.value ? "default" : "outline"}
                    className={`h-8 px-4 text-xs font-medium ${tipo === t.value && t.value === "ndt"
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : ""
                      }`}
                    onClick={() => setTipo(t.value as TipoRecepcion)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-semibold text-black dark:text-white">
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
                Número de Serie *
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
                  ref={partNumberInputRef}
                  placeholder="Part Number (P/N)"
                  value={nuevoItem.part_number}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, part_number: e.target.value }))
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="sm:col-span-5">
                <Input
                  placeholder="Componente *"
                  value={nuevoItem.componente}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, componente: e.target.value }))
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="sm:col-span-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="1"
                  value={nuevoItem.cantidad}
                  onChange={(e) => handleCantidadChange(e.target.value)}
                  onBlur={handleCantidadBlur}
                  className="h-8 text-xs text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="sm:col-span-3">
                <Input
                  placeholder="Serie"
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
              <div className="sm:col-span-3 flex items-center">
                {editingIndex !== null ? (
                  <div className="flex items-center gap-1 w-full">
                    <Button
                      type="submit"
                      size="sm"
                      className="flex-1 h-8 text-xs gap-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm"
                    >
                      <Pencil className="size-3" />
                      Actualizar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs shrink-0"
                      onClick={() => {
                        setEditingIndex(null)
                        setNewItem({ ...itemVacio })
                        setItemInputError("")
                      }}
                      title="Cancelar edición"
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ) : (
                  <Button type="submit" size="sm" className="w-full h-8 text-xs gap-1">
                    <Plus className="size-3.5" />
                    Agregar
                  </Button>
                )}
              </div>

              {itemInputError && (
                <div className="sm:col-span-12 text-[11px] font-medium text-destructive">
                  {itemInputError}
                </div>
              )}
            </form>

            {/* Tabla de items */}
            <div className="border rounded-lg overflow-hidden h-52 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted sticky top-0 z-10 border-b font-semibold text-muted-foreground shadow-xs">
                  <tr>
                    <th className="py-2 px-2.5 w-8 text-center">#</th>
                    <th className="py-2 px-2.5">P/N</th>
                    <th className="py-2 px-2.5">
                      <button
                        type="button"
                        onClick={handleOrdenarPorComponente}
                        className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none group"
                        title={
                          sortDirection === "asc"
                            ? "Orden A-Z (clic para ordenar Z-A)"
                            : sortDirection === "desc"
                            ? "Orden Z-A (clic para volver al orden predeterminado)"
                            : "Orden predeterminado (clic para ordenar A-Z)"
                        }
                      >
                        <span>Componente</span>
                        {sortDirection === "asc" ? (
                          <ArrowUp className="size-3.5 text-primary" />
                        ) : sortDirection === "desc" ? (
                          <ArrowDown className="size-3.5 text-primary" />
                        ) : (
                          <ArrowUpDown className="size-3.5 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                        )}
                      </button>
                    </th>
                    <th className="py-2 px-2.5 text-center w-12">Cant.</th>
                    <th className="py-2 px-2.5">Serie</th>
                    <th className="py-2 px-2.5">Observación</th>
                    <th className="py-2 px-2.5 text-right w-14"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-36 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-1 h-full">
                          <p className="text-xs">No hay componentes agregados.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-border transition-colors ${
                          editingIndex === idx
                            ? "bg-amber-500/20 border-l-4 border-l-amber-500 text-amber-950 dark:text-amber-100 font-medium"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        <td className="py-2 px-2.5 text-center font-semibold text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5 font-mono text-[11px]">
                          {item.part_number || "-"}
                        </td>
                        <td className="py-2 px-2.5 font-medium">{item.componente}</td>
                        <td className="py-2 px-2.5 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded font-semibold ${
                              editingIndex === idx
                                ? "bg-amber-500/30 text-amber-900 dark:text-amber-200"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {item.cantidad}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 font-mono text-[11px]">
                          {item.serie || "-"}
                        </td>
                        <td className="py-2 px-2.5 text-muted-foreground truncate max-w-[150px]">
                          {item.observacion || "-"}
                        </td>
                        <td className="py-2 px-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={`size-6 ${
                                editingIndex === idx
                                  ? "text-amber-600 bg-amber-500/25 hover:bg-amber-500/35"
                                  : "text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
                              }`}
                              onClick={() => handleIniciarEditarItem(idx)}
                              title="Editar ítem"
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-6 text-destructive hover:bg-destructive/10"
                              onClick={() => handleEliminarItem(idx)}
                              title="Eliminar ítem"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
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
