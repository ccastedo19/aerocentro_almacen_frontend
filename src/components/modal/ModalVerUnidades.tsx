import { useCallback, useEffect, useState } from "react"

import { type NamedOption } from "@/components/form/named-select"
import { type CatalogoItem } from "@/lib/catalogo"
import {
  BotonAgregarUnidad,
  UnidadCampos,
  UnidadesMiniTabla,
  unidadCamposVacia,
  validarUnidadCampos,
  type UnidadCamposErrors,
  type UnidadCamposValues,
} from "@/components/herramientas/unidad-editor"
import { ModalConfirmarEliminar } from "@/components/modal/ModalConfirmarEliminar"
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
import { ApiError } from "@/lib/api"
import {
  actualizarUnidad,
  crearUnidad,
  eliminarUnidad,
  etiquetaColoresUnidad,
  etiquetaEstadoUnidad,
  listarUnidades,
  obtenerHerramienta,
  SIN_COLOR,
  toDateInput,
  UNIDAD_ESTADO_PRESTADA,
  type Herramienta,
  type HerramientaUnidad,
} from "@/lib/herramientas"

type ModalVerUnidadesProps = {
  open: boolean
  herramienta: Herramienta | null
  marcas: NamedOption[]
  ubicaciones: NamedOption[]
  onOpenChange: (open: boolean) => void
  onChanged: () => void
  onCreatedMarca: (item: CatalogoItem) => void
  onCreatedUbicacion: (item: CatalogoItem) => void
}

export function ModalVerUnidades({
  open,
  herramienta,
  marcas,
  ubicaciones,
  onOpenChange,
  onChanged,
  onCreatedMarca,
  onCreatedUbicacion,
}: ModalVerUnidadesProps) {
  const [unidades, setUnidades] = useState<HerramientaUnidad[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pageError, setPageError] = useState("")
  const [unidadCampos, setUnidadCampos] = useState<UnidadCamposValues>(
    unidadCamposVacia(marcas, ubicaciones),
  )
  const [unidadErrors, setUnidadErrors] = useState<UnidadCamposErrors>({})
  const [editingUnidad, setEditingUnidad] = useState<HerramientaUnidad | null>(
    null,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [deletingUnidad, setDeletingUnidad] = useState<HerramientaUnidad | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const loadUnidades = useCallback(async () => {
    if (!herramienta) return

    setIsLoading(true)
    setPageError("")

    try {
      const detalle = await obtenerHerramienta(herramienta.id)
      setUnidades(detalle.unidades ?? (await listarUnidades(herramienta.id)))
    } catch (error) {
      setPageError(
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar las unidades.",
      )
    } finally {
      setIsLoading(false)
    }
  }, [herramienta])

  useEffect(() => {
    if (!open || !herramienta) return

    setEditingUnidad(null)
    setUnidadCampos(unidadCamposVacia(marcas, ubicaciones))
    setUnidadErrors({})
    setDeleteError("")
    void loadUnidades()
  }, [herramienta?.id, loadUnidades, open])

  const resetCampos = () => {
    setUnidadCampos(unidadCamposVacia(marcas, ubicaciones))
    setUnidadErrors({})
    setEditingUnidad(null)
  }

  const handleGuardarUnidad = async () => {
    if (!herramienta) return

    const errors = validarUnidadCampos(unidadCampos)

    if (Object.keys(errors).length > 0) {
      setUnidadErrors(errors)
      return
    }

    setIsSaving(true)
    setPageError("")

    try {
      if (editingUnidad) {
        await actualizarUnidad(editingUnidad.id, unidadCampos)
      } else {
        await crearUnidad({
          herramienta_id: herramienta.id,
          ...unidadCampos,
        })
      }

      resetCampos()
      await loadUnidades()
      onChanged()
    } catch (error) {
      setPageError(
        error instanceof ApiError
          ? error.errors.unidad?.[0] || error.message
          : "No se pudo guardar la unidad.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingUnidad) return

    setIsDeleting(true)
    setDeleteError("")

    try {
      await eliminarUnidad(deletingUnidad.id)
      if (editingUnidad?.id === deletingUnidad.id) resetCampos()
      setDeletingUnidad(null)
      await loadUnidades()
      onChanged()
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.errors.unidad?.[0] || error.message
          : "No se pudo eliminar la unidad.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Unidades de {herramienta?.nombre ?? "la herramienta"}</DialogTitle>
            <DialogDescription>
              Cada fila es una pieza física. Marca y ubicación se pueden repetir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {pageError ? (
              <AlertError onClose={() => setPageError("")}>{pageError}</AlertError>
            ) : null}

            <div className="space-y-3 rounded-xl border p-4">
              <p className="text-sm font-medium">
                {editingUnidad ? "Editar unidad" : "Agregar unidad"}
              </p>
              <UnidadCampos
                idPrefix="ver-unidad"
                values={unidadCampos}
                marcas={marcas}
                ubicaciones={ubicaciones}
                errors={unidadErrors}
                disabled={isSaving}
                onChange={(values) => {
                  setUnidadCampos(values)
                  setUnidadErrors({})
                }}
                onCreatedMarca={onCreatedMarca}
                onCreatedUbicacion={onCreatedUbicacion}
              />
              <div className="flex flex-wrap gap-2">
                <BotonAgregarUnidad
                  disabled={isSaving}
                  isEditing={Boolean(editingUnidad)}
                  onClick={() => void handleGuardarUnidad()}
                />
                {editingUnidad ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSaving}
                    onClick={resetCampos}
                  >
                    Cancelar edición
                  </Button>
                ) : null}
              </div>
            </div>

            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Cargando unidades...
              </p>
            ) : (
              <UnidadesMiniTabla
                filas={unidades.map((unidad) => ({
                  id: unidad.id,
                  marca: unidad.marca?.nombre ?? "—",
                  ubicacion:
                    ubicaciones.find((item) => item.id === unidad.ubicacion_id)
                      ?.ruta
                    ?? unidad.ubicacion?.nombre
                    ?? "—",
                  colores: etiquetaColoresUnidad(
                    unidad.color_primario,
                    unidad.color_secundario,
                  ),
                  tamano: unidad.tamano ?? "",
                  calibracion:
                    toDateInput(unidad.proxima_calibracion) ||
                    toDateInput(unidad.fecha_calibracion),
                  estado: etiquetaEstadoUnidad(unidad.estado),
                  disableActions: unidad.estado === UNIDAD_ESTADO_PRESTADA,
                }))}
                emptyMessage="Esta herramienta aún no tiene unidades."
                onEdit={(id) => {
                  const unidad = unidades.find((item) => item.id === id)
                  if (!unidad || unidad.estado === UNIDAD_ESTADO_PRESTADA) return

                  setEditingUnidad(unidad)
                  setUnidadCampos({
                    marca_id: unidad.marca_id,
                    ubicacion_id: unidad.ubicacion_id,
                    color_primario: unidad.color_primario ?? SIN_COLOR,
                    color_secundario: unidad.color_secundario ?? SIN_COLOR,
                    tamano: unidad.tamano ?? "",
                    requiere_calibracion: Boolean(
                      unidad.fecha_calibracion || unidad.proxima_calibracion,
                    ),
                    fecha_calibracion: toDateInput(unidad.fecha_calibracion),
                    proxima_calibracion: toDateInput(unidad.proxima_calibracion),
                    observaciones: "",
                  })
                  setUnidadErrors({})
                }}
                onDelete={(id) => {
                  const unidad = unidades.find((item) => item.id === id)
                  if (!unidad || unidad.estado === UNIDAD_ESTADO_PRESTADA) return
                  setDeletingUnidad(unidad)
                  setDeleteError("")
                }}
              />
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModalConfirmarEliminar
        open={deletingUnidad !== null}
        singular="unidad"
        nombre={deletingUnidad?.marca?.nombre}
        descripcion={
          deletingUnidad
            ? `Se ocultará la unidad ${deletingUnidad.marca?.nombre ?? ""} en ${deletingUnidad.ubicacion?.nombre ?? ""}.`
            : undefined
        }
        isSubmitting={isDeleting}
        error={deleteError}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && isDeleting) return
          if (!nextOpen) setDeletingUnidad(null)
        }}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
