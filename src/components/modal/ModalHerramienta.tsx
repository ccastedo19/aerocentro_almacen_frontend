import { useEffect, useState, type FormEvent } from "react"

import { CreatableNamedSelect } from "@/components/form/creatable-named-select"
import { type NamedOption } from "@/components/form/named-select"
import {
  BotonAgregarUnidad,
  UnidadCampos,
  UnidadesMiniTabla,
  unidadCamposVacia,
  validarUnidadCampos,
  type UnidadCamposErrors,
  type UnidadCamposValues,
} from "@/components/herramientas/unidad-editor"
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
import { type CatalogoItem } from "@/lib/catalogo"
import {
  etiquetaColoresUnidad,
  SIN_COLOR,
  type Herramienta,
  type HerramientaFormValues,
  type UnidadBorrador,
} from "@/lib/herramientas"

export type HerramientaFieldErrors = {
  nombre?: string
  descripcion?: string
  categoria_id?: string
  unidades?: string
}

type ModalHerramientaProps = {
  open: boolean
  item?: Herramienta | null
  categorias: NamedOption[]
  marcas: NamedOption[]
  ubicaciones: NamedOption[]
  isSubmitting: boolean
  formError: string
  fieldErrors: HerramientaFieldErrors
  onOpenChange: (open: boolean) => void
  onSubmit: (values: HerramientaFormValues) => void
  onCreatedCategoria: (item: CatalogoItem) => void
  onCreatedMarca: (item: CatalogoItem) => void
  onCreatedUbicacion: (item: CatalogoItem) => void
}

export function ModalHerramienta({
  open,
  item,
  categorias,
  marcas,
  ubicaciones,
  isSubmitting,
  formError,
  fieldErrors,
  onOpenChange,
  onSubmit,
  onCreatedCategoria,
  onCreatedMarca,
  onCreatedUbicacion,
}: ModalHerramientaProps) {
  const isEditing = Boolean(item)
  const [nombre, setNombre] = useState("")
  const [categoriaId, setCategoriaId] = useState("")
  const [unidades, setUnidades] = useState<UnidadBorrador[]>([])
  const [unidadCampos, setUnidadCampos] = useState<UnidadCamposValues>(
    unidadCamposVacia(marcas, ubicaciones),
  )
  const [unidadErrors, setUnidadErrors] = useState<UnidadCamposErrors>({})
  const [editingUnidadKey, setEditingUnidadKey] = useState<string | null>(null)
  const [localErrors, setLocalErrors] = useState<HerramientaFieldErrors>({})

  useEffect(() => {
    if (!open) return

    setNombre(item?.nombre ?? "")
    setCategoriaId(item?.categoria_id ?? categorias[0]?.id ?? "")
    setUnidades([])
    setUnidadCampos(unidadCamposVacia(marcas, ubicaciones))
    setUnidadErrors({})
    setEditingUnidadKey(null)
    setLocalErrors({})
  }, [item?.id, open])

  const closeModal = () => {
    if (isSubmitting) return
    onOpenChange(false)
  }

  const nombreMarca = (id: string) =>
    marcas.find((marca) => marca.id === id)?.nombre ?? "—"
  const nombreUbicacion = (id: string) =>
    ubicaciones.find((ubicacion) => ubicacion.id === id)?.ruta
      ?? ubicaciones.find((ubicacion) => ubicacion.id === id)?.nombre
      ?? "—"

  const handleAgregarUnidad = () => {
    const errors = validarUnidadCampos(unidadCampos)

    if (Object.keys(errors).length > 0) {
      setUnidadErrors(errors)
      return
    }

    const borrador: UnidadBorrador = {
      key: editingUnidadKey ?? crypto.randomUUID(),
      ...unidadCampos,
    }

    setUnidades((current) =>
      editingUnidadKey
        ? current.map((unidad) =>
            unidad.key === editingUnidadKey ? borrador : unidad,
          )
        : [...current, borrador],
    )
    setUnidadCampos({
      ...unidadCampos,
      requiere_calibracion: false,
      tamano: "",
      fecha_calibracion: "",
      proxima_calibracion: "",
      observaciones: "",
    })
    setUnidadErrors({})
    setEditingUnidadKey(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: HerramientaFieldErrors = {}
    const nombreValue = nombre.trim()

    if (!nombreValue) nextErrors.nombre = "El nombre es obligatorio."
    if (!categoriaId) nextErrors.categoria_id = "Selecciona una categoría."

    if (Object.keys(nextErrors).length > 0) {
      setLocalErrors(nextErrors)
      return
    }

    onSubmit({
      nombre: nombreValue,
      descripcion: "",
      categoria_id: categoriaId,
      unidades: isEditing ? undefined : unidades,
    })
  }

  const shownErrors: HerramientaFieldErrors = {
    nombre: localErrors.nombre || fieldErrors.nombre,
    descripcion: localErrors.descripcion || fieldErrors.descripcion,
    categoria_id: localErrors.categoria_id || fieldErrors.categoria_id,
    unidades: localErrors.unidades || fieldErrors.unidades,
  }
  const firstFieldError = Object.values(shownErrors).find(Boolean) ?? ""
  const shownFormError =
    formError && formError !== firstFieldError ? formError : ""

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeModal()
          return
        }

        onOpenChange(true)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar herramienta" : "Agregar herramienta"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza los datos del tipo de herramienta. Las unidades se gestionan en Ver unidades."
              : "Registra el tipo de herramienta y agrégale cada unidad física con marca y ubicación."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="herramienta-form"
          className="space-y-5"
          onSubmit={handleSubmit}
          noValidate
        >
          {shownFormError ? (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {shownFormError}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 mb-1">
            <div className="space-y-2">
              <label htmlFor="herramienta-nombre" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="herramienta-nombre"
                className="h-8"
                placeholder="Ej. Llave 3/8"
                value={nombre}
                disabled={isSubmitting}
                aria-invalid={Boolean(shownErrors.nombre)}
                onChange={(event) => {
                  setNombre(event.target.value)
                  if (localErrors.nombre) {
                    setLocalErrors((current) => ({ ...current, nombre: undefined }))
                  }
                }}
              />
              {shownErrors.nombre ? (
                <p className="text-sm text-destructive">{shownErrors.nombre}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="herramienta-categoria" className="text-sm font-medium">
                Categoría
              </label>
              <CreatableNamedSelect
                id="herramienta-categoria"
                value={categoriaId}
                options={categorias}
                placeholder="Selecciona o busca una categoría"
                createNoun="categoría"
                resourcePath="/api/categorias"
                className="h-9"
                disabled={isSubmitting}
                error={shownErrors.categoria_id}
                onChange={(value) => {
                  setCategoriaId(value)
                  if (localErrors.categoria_id) {
                    setLocalErrors((current) => ({
                      ...current,
                      categoria_id: undefined,
                    }))
                  }
                }}
                onCreated={onCreatedCategoria}
              />
            </div>
          </div>

          {!isEditing ? (
            <div className="space-y-3 rounded-xl border p-4">
              <div>
                <p className="text-sm font-medium">Unidades</p>
                <p className="text-xs text-muted-foreground">
                  Completa marca y ubicación y pulsa Agregar unidad. Puedes
                  repetir marca o ubicación.
                </p>
              </div>

              <UnidadCampos
                idPrefix="nueva-unidad"
                values={unidadCampos}
                marcas={marcas}
                ubicaciones={ubicaciones}
                errors={unidadErrors}
                disabled={isSubmitting}
                onChange={(values) => {
                  setUnidadCampos(values)
                  setUnidadErrors({})
                }}
                onCreatedMarca={onCreatedMarca}
                onCreatedUbicacion={onCreatedUbicacion}
              />
              <BotonAgregarUnidad
                disabled={isSubmitting}
                isEditing={Boolean(editingUnidadKey)}
                onClick={handleAgregarUnidad}
              />

              <UnidadesMiniTabla
                filas={unidades.map((unidad) => ({
                  id: unidad.key,
                  herramienta: nombre.trim() || "Nueva herramienta",
                  marca: nombreMarca(unidad.marca_id),
                  ubicacion: nombreUbicacion(unidad.ubicacion_id),
                  colores: etiquetaColoresUnidad(
                    unidad.color_primario === SIN_COLOR ? null : unidad.color_primario,
                    unidad.color_secundario === SIN_COLOR ? null : unidad.color_secundario,
                  ),
                  tamano: unidad.tamano,
                  calibracion: unidad.proxima_calibracion || unidad.fecha_calibracion,
                  observaciones: unidad.observaciones,
                  editing: editingUnidadKey === unidad.key,
                }))}
                emptyMessage="Aún no hay unidades. Agrégalas antes de guardar, o déjalo vacío y añádelas después."
                onEdit={(key) => {
                  const unidad = unidades.find((item) => item.key === key)
                  if (!unidad) return
                  setUnidadCampos({
                    marca_id: unidad.marca_id,
                    ubicacion_id: unidad.ubicacion_id,
                    color_primario: unidad.color_primario,
                    color_secundario: unidad.color_secundario,
                    tamano: unidad.tamano,
                    requiere_calibracion: Boolean(
                      unidad.fecha_calibracion || unidad.proxima_calibracion,
                    ),
                    fecha_calibracion: unidad.fecha_calibracion,
                    proxima_calibracion: unidad.proxima_calibracion,
                    observaciones: "",
                  })
                  setEditingUnidadKey(key)
                  setUnidadErrors({})
                }}
                onDelete={(key) => {
                  setUnidades((current) =>
                    current.filter((unidad) => unidad.key !== key),
                  )
                  if (editingUnidadKey === key) {
                    setEditingUnidadKey(null)
                    setUnidadCampos(unidadCamposVacia(marcas, ubicaciones))
                  }
                }}
              />
            </div>
          ) : null}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={closeModal}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="herramienta-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
