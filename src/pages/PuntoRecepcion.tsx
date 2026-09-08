import { useCallback, useEffect, useState } from "react"
import {
  FileCheck2,
  FileText,
  History,
  Pencil,
  Plane,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Wrench,
  X,
} from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { ClienteCombobox } from "@/components/form/ClienteCombobox"
import {
  ModalCliente,
  type ClienteFieldErrors,
} from "@/components/modal/ModalCliente"
import { ModalVerPdfRecepcion } from "@/components/modal/ModalVerPdfRecepcion"
import { AlertError } from "@/components/ui/alert-error"
import { PagePreloader } from "@/components/ui/page-preloader"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiError } from "@/lib/api"
import {
  crearCliente,
  listarClientes,
  type Cliente,
  type ClienteFormValues,
} from "@/lib/clientes"
import {
  actualizarOrdenRecepcion,
  crearOrdenRecepcion,
  finalizarOrdenRecepcion,
  obtenerOrdenRecepcion,
  MARCAS_MOTOR,
  ORDEN_ESTADO_FINALIZADO,
  TIPOS_RECEPCION,
  type ItemFormValues,
  type OrdenRecepcion,
  type TipoRecepcion,
} from "@/lib/ordenes-recepcion"
import { toastExito } from "@/lib/toast"

const itemVacio: ItemFormValues = {
  part_number: "",
  componente: "",
  cantidad: 1,
  serie: "",
  observacion: "",
}

export const PuntoRecepcion = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const editId = searchParams.get("id") || searchParams.get("editar")

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [pageError, setPageError] = useState("")

  // Orden en modo edición
  const [editingOrden, setEditingOrden] = useState<OrdenRecepcion | null>(null)
  const [isLoadingDraft, setIsLoadingDraft] = useState(false)

  // Form principal
  const [tipo, setTipo] = useState<TipoRecepcion>("motor")
  const [clienteId, setClienteId] = useState("")
  const [marca, setMarca] = useState("continental")
  const [modelo, setModelo] = useState("")
  const [serie, setSerie] = useState("")
  const [matricula, setMatricula] = useState("")

  // Modal nuevo cliente
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isSavingClient, setIsSavingClient] = useState(false)
  const [clientFormError, setClientFormError] = useState("")
  const [clientFieldErrors, setClientFieldErrors] = useState<ClienteFieldErrors>({})

  // Lista de items
  const [items, setItems] = useState<ItemFormValues[]>([])

  // Item en edición/creación rápida
  const [nuevoItem, setNewItem] = useState<ItemFormValues>({ ...itemVacio })
  const [itemInputError, setItemInputError] = useState("")

  // Estados de guardado
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [formError, setFormError] = useState("")

  // Modal PDF
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [pdfNumeroOrden, setPdfNumeroOrden] = useState("")

  const loadClientes = useCallback(async () => {
    const data = await listarClientes()
    setClientes(data.filter((c) => c.estado === 1))
  }, [])

  // Cargar borrador si viene parámetro en URL
  useEffect(() => {
    if (!editId) {
      setEditingOrden(null)
      return
    }

    let cancelled = false
    setIsLoadingDraft(true)
    setFormError("")

    obtenerOrdenRecepcion(editId)
      .then((orden) => {
        if (cancelled) return
        if (orden.estado === ORDEN_ESTADO_FINALIZADO) {
          setFormError(
            `El documento ${orden.numero_orden} ya fue finalizado y no se puede editar.`,
          )
          setEditingOrden(null)
          return
        }

        setEditingOrden(orden)
        setTipo((orden.tipo as TipoRecepcion) || "motor")
        setClienteId(orden.cliente_id)
        setMarca(orden.marca || "continental")
        setModelo(orden.modelo || "")
        setSerie(orden.serie || "")
        setMatricula(orden.matricula || "")
        setItems(
          orden.items?.map((item) => ({
            part_number: item.part_number || "",
            componente: item.componente || "",
            cantidad: item.cantidad || 1,
            serie: item.serie || "",
            observacion: item.observacion || "",
          })) || [],
        )
      })
      .catch((err) => {
        if (cancelled) return
        setFormError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el borrador para edición.",
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDraft(false)
      })

    return () => {
      cancelled = true
    }
  }, [editId])

  const handleCreateClient = async (values: ClienteFormValues) => {
    try {
      setIsSavingClient(true)
      setClientFormError("")
      setClientFieldErrors({})
      const nuevoCliente = await crearCliente(values)
      setClientes((prev) => [nuevoCliente, ...prev])
      setClienteId(nuevoCliente.id)
      setIsClientModalOpen(false)
      toastExito(`Cliente "${nuevoCliente.nombre_completo}" creado y seleccionado`)
    } catch (err) {
      if (err instanceof ApiError) {
        setClientFieldErrors({
          nombre_completo: err.errors.nombre_completo?.[0],
          apodo: err.errors.apodo?.[0],
          nit: err.errors.nit?.[0],
          correo: err.errors.correo?.[0],
          celular: err.errors.celular?.[0],
        })
        setClientFormError(err.message)
      } else {
        setClientFormError("Error al crear el cliente.")
      }
    } finally {
      setIsSavingClient(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setIsLoadingInitial(true)
    setPageError("")

    loadClientes()
      .catch((error) => {
        if (cancelled) return
        setPageError(
          error instanceof ApiError
            ? error.message
            : "No se pudieron cargar los clientes.",
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoadingInitial(false)
      })

    return () => {
      cancelled = true
    }
  }, [loadClientes])

  const handleAgregarItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setItemInputError("")

    if (!nuevoItem.componente.trim()) {
      setItemInputError("El nombre o descripción del componente es obligatorio.")
      return
    }

    if (nuevoItem.cantidad < 1) {
      setItemInputError("La cantidad debe ser al menos 1.")
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

  const handleLimpiarFormulario = () => {
    setTipo("motor")
    setClienteId("")
    setMarca("continental")
    setModelo("")
    setSerie("")
    setMatricula("")
    setItems([])
    setNewItem({ ...itemVacio })
    setItemInputError("")
    setFormError("")
    setEditingOrden(null)
    if (editId) {
      navigate("/punto-recepcion", { replace: true })
    }
  }

  const validarFormulario = () => {
    setFormError("")
    if (!clienteId) {
      setFormError("Debes seleccionar un cliente.")
      return false
    }
    if (!marca) {
      setFormError("Debes seleccionar la marca del motor.")
      return false
    }
    if (!modelo.trim()) {
      setFormError("El modelo es obligatorio.")
      return false
    }
    if (!serie.trim()) {
      setFormError("El número de serie es obligatorio.")
      return false
    }
    if (!matricula.trim()) {
      setFormError("La matrícula de la aeronave es obligatoria.")
      return false
    }
    if (items.length === 0) {
      setFormError("Debes agregar al menos un componente a la lista antes de guardar.")
      return false
    }
    return true
  }

  const handleGuardarBorrador = async () => {
    if (!validarFormulario()) return

    try {
      setIsSavingDraft(true)
      setFormError("")

      const payload = {
        tipo,
        cliente_id: clienteId,
        marca,
        modelo: modelo.trim(),
        serie: serie.trim(),
        matricula: matricula.trim(),
        items,
      }

      if (editingOrden) {
        const ordenActualizada = await actualizarOrdenRecepcion(editingOrden.id, payload)
        setEditingOrden(ordenActualizada)
        toastExito(`Borrador ${ordenActualizada.numero_orden} actualizado correctamente`)
      } else {
        const ordenCreada = await crearOrdenRecepcion(payload)
        toastExito(`Documento ${ordenCreada.numero_orden} guardado como borrador`)
        handleLimpiarFormulario()
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message)
      } else {
        setFormError("Error al guardar el documento de recepción.")
      }
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleFinalizarYGenerarPdf = async () => {
    if (!validarFormulario()) return

    try {
      setIsFinalizing(true)
      setFormError("")

      const payload = {
        tipo,
        cliente_id: clienteId,
        marca,
        modelo: modelo.trim(),
        serie: serie.trim(),
        matricula: matricula.trim(),
        items,
      }

      let ordenId: string
      let numeroOrden: string

      if (editingOrden) {
        const ordenActualizada = await actualizarOrdenRecepcion(editingOrden.id, payload)
        ordenId = ordenActualizada.id
        numeroOrden = ordenActualizada.numero_orden
      } else {
        const ordenCreada = await crearOrdenRecepcion(payload)
        ordenId = ordenCreada.id
        numeroOrden = ordenCreada.numero_orden
      }

      // Finalizamos y obtenemos el PDF en base64
      const resFinalizar = await finalizarOrdenRecepcion(ordenId)

      toastExito(`Documento ${numeroOrden} finalizado exitosamente`)

      // Mostramos el modal con el PDF
      setPdfNumeroOrden(numeroOrden)
      setPdfBase64(resFinalizar.pdf_base64)
      setPdfModalOpen(true)

      handleLimpiarFormulario()
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message)
      } else {
        setFormError("Error al finalizar el documento y generar el PDF.")
      }
    } finally {
      setIsFinalizing(false)
    }
  }

  if (isLoadingInitial || isLoadingDraft) {
    return <PagePreloader recurso="punto de recepción" />
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Punto de Recepción
          </h1>
          <p className="text-sm text-muted-foreground">
            Registra el ingreso de motores y componentes para servicio o mantenimiento aeronáutico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/historial-recepcion">
            <Button variant="outline" size="sm" className="gap-1.5">
              <History className="size-4" />
              Historial de Recepción
            </Button>
          </Link>
        </div>
      </div>

      {editingOrden && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
              <Pencil className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                <span>Modo Edición de Borrador:</span>
                <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded text-xs font-bold text-amber-800 dark:text-amber-200">
                  {editingOrden.numero_orden}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Estás editando este documento. Los cambios y componentes se guardarán sobre este mismo borrador.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLimpiarFormulario}
            className="text-xs shrink-0 gap-1.5 border-amber-500/30 hover:bg-amber-500/20"
          >
            <X className="size-3.5" />
            Cancelar Edición / Nuevo
          </Button>
        </div>
      )}

      {pageError && (
        <AlertError onClose={() => setPageError("")}>{pageError}</AlertError>
      )}
      {formError && (
        <AlertError onClose={() => setFormError("")}>{formError}</AlertError>
      )}

      {/* Contenedor Vertical */}
      <div className="flex flex-col gap-6">
        {/* Sección Superior: Datos de Recepción */}
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Plane className="size-4 text-primary" />
                  Datos de Recepción
                </CardTitle>
                <CardDescription className="text-xs">
                  Información del cliente y especificaciones del motor o componentes.
                </CardDescription>
              </div>

              {/* Selector de Tipo de Recepción */}
              <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border w-fit">

                {TIPOS_RECEPCION.map((t) => {
                  const isSelected = tipo === t.value
                  return (
                    <Button
                      key={t.value}
                      type="button"
                      size="sm"
                      variant={isSelected ? "default" : "ghost"}
                      className={`h-7 px-3 text-xs font-semibold transition-all ${isSelected
                        ? t.value === "ndt"
                          ? "default"
                          : "shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                      onClick={() => setTipo(t.value as TipoRecepcion)}
                    >
                      {t.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Cliente */}
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                <div className="flex items-center justify-between mb-0">
                  <label className="text-sm font-medium text-black dark:text-white relative top-[3px]">
                    Cliente *
                  </label>
                  <Button
                    type="button"
                    variant="warning"
                    size="sm"
                    className="h-6 text-xs gap-1 font-medium relative bottom-[3px]"
                    onClick={() => {
                      setClientFormError("")
                      setClientFieldErrors({})
                      setIsClientModalOpen(true)
                    }}
                  >
                    <Plus className="size-3.5" />
                    Nuevo Cliente
                  </Button>
                </div>
                <ClienteCombobox
                  value={clienteId}
                  clientes={clientes}
                  onChange={setClienteId}
                />
              </div>

              {/* Marca */}
              <div className="space-y-4 relative top-[3px]">
                <label className="text-sm font-medium text-black dark:text-white">
                  Marca del Motor *
                </label>
                <Select
                  value={marca}
                  onValueChange={(val) => setMarca(val ?? "continental")}
                >
                  <SelectTrigger className="!h-9 w-full">
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

              {/* Modelo */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-black dark:text-white">
                  Modelo *
                </label>
                <Input
                  placeholder="Ej: O-360-A1A, IO-520"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Serie */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-black dark:text-white">
                  Número de Serie *
                </label>
                <Input
                  placeholder="Ej: L-28491-36A"
                  value={serie}
                  onChange={(e) => setSerie(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Matrícula */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-black dark:text-white">
                  Matrícula de Aeronave *
                </label>
                <Input
                  placeholder="Ej: CP-2841"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección Inferior: Tabla y Agregador de Componentes */}
        <div className="space-y-4">
          {/* Tarjeta de agregar componente */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Wrench className="size-4 text-primary" />
                  Componentes y Partes Recibidas
                </span>
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                  {items.length} {items.length === 1 ? "ítem" : "ítems"} agregados
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Ingresa cada componente o accesorio entregado junto al motor.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Form de entrada de un ítem */}
              <form
                onSubmit={handleAgregarItem}
                className="bg-muted/30 rounded-lg p-3 border space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-3">
                    <label className="text-sm font-medium text-black dark:text-white block mb-1 relative top-[5px] relative top-[5px]">
                      Part Number
                    </label>
                    <Input
                      placeholder="Ej: 646275-1"
                      value={nuevoItem.part_number}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          part_number: e.target.value,
                        }))
                      }
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-sm font-medium text-black dark:text-white block mb-1 relative top-[5px]">
                      Componente / Descripción *
                    </label>
                    <Input
                      placeholder="Ej: Magneto Izquierdo, Cilindro #1"
                      value={nuevoItem.componente}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          componente: e.target.value,
                        }))
                      }
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-black dark:text-white block mb-1 relative top-[5px]">
                      Cant. *
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={nuevoItem.cantidad}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          cantidad: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="h-9 text-xs text-center"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-sm font-medium text-black dark:text-white block mb-1 relative top-[5px]">
                      N° Serie
                    </label>
                    <Input
                      placeholder="Ej: SN-9402"
                      value={nuevoItem.serie}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          serie: e.target.value,
                        }))
                      }
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-9">
                    <label className="text-sm font-medium text-black dark:text-white block mb-1 relative top-[5px]">
                      Observación / Estado
                    </label>
                    <Input
                      placeholder="Ej: Presenta fuga leve en retén, con bujías"
                      value={nuevoItem.observacion}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          observacion: e.target.value,
                        }))
                      }
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-end">
                    <Button
                      type="submit"
                      className="w-full h-8 gap-1.5 text-sm font-semibold "
                    >
                      <Plus className="size-4.5" />
                      Agregar Item
                    </Button>
                  </div>
                </div>

                {itemInputError && (
                  <p className="text-[11px] font-medium text-destructive">
                    {itemInputError}
                  </p>
                )}
              </form>

              {/* Tabla de ítems */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[350px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-muted/70 sticky top-0 border-b font-semibold text-muted-foreground">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Part Number</th>
                        <th className="py-2.5 px-3">Componente</th>
                        <th className="py-2.5 px-3 text-center w-16">Cant.</th>
                        <th className="py-2.5 px-3">Serie</th>
                        <th className="py-2.5 px-3">Observación</th>
                        <th className="py-2.5 px-3 text-right w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-8 text-center text-muted-foreground"
                          >
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <FileText className="size-8 text-muted-foreground/40" />
                              <p className="text-xs">
                                No se han agregado componentes aún.
                              </p>
                              <p className="text-[11px] text-muted-foreground/70">
                                Usa el formulario superior para añadir partes recibidas.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-2.5 px-3 text-center font-semibold text-muted-foreground">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">
                              {item.part_number || (
                                <span className="text-muted-foreground/60">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-foreground">
                              {item.componente}
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold">
                              <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded">
                                {item.cantidad}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">
                              {item.serie || (
                                <span className="text-muted-foreground/60">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground max-w-[200px] truncate">
                              {item.observacion || (
                                <span className="text-muted-foreground/60">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive hover:bg-destructive/10"
                                onClick={() => handleEliminarItem(idx)}
                                title="Eliminar ítem"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Barra de Acciones Finales */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card border rounded-lg p-3.5 shadow-sm">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleLimpiarFormulario}
              disabled={isSavingDraft || isFinalizing}
              className="gap-1.5"
            >
              <RotateCcw className="size-4" />
              {editingOrden ? "Descartar / Nuevo" : "Limpiar Formulario"}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleGuardarBorrador}
                disabled={isSavingDraft || isFinalizing}
                className="gap-1.5"
              >
                <Save className="size-4" />
                {isSavingDraft
                  ? "Guardando..."
                  : editingOrden
                    ? "Actualizar Borrador"
                    : "Guardar Borrador"}
              </Button>

              <Button
                type="button"
                variant="default"
                size="lg"
                onClick={handleFinalizarYGenerarPdf}
                disabled={isSavingDraft || isFinalizing}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                <FileCheck2 className="size-4" />
                {isFinalizing ? "Finalizando..." : "Finalizar y Generar PDF"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal PDF */}
      <ModalVerPdfRecepcion
        open={pdfModalOpen}
        onOpenChange={setPdfModalOpen}
        pdfBase64={pdfBase64}
        numeroOrden={pdfNumeroOrden}
      />

      {/* Modal Crear Cliente */}
      <ModalCliente
        open={isClientModalOpen}
        isSubmitting={isSavingClient}
        formError={clientFormError}
        fieldErrors={clientFieldErrors}
        onOpenChange={(open) => {
          if (!open && isSavingClient) return
          setIsClientModalOpen(open)
        }}
        onSubmit={handleCreateClient}
      />
    </div>
  )
}
