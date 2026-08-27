import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Search } from "lucide-react"

import { DetalleUnidadPrestamo } from "@/components/prestamos/detalle-unidad-prestamo"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { type Combinada, type CombinadaFormValues } from "@/lib/combinadas"
import {
  UNIDAD_ESTADO_PRESTADA,
  type HerramientaUnidad,
} from "@/lib/herramientas"
import { filtrarUnidadesPorBusqueda, nombreUnidad } from "@/lib/prestamos"

export type CombinadaFieldErrors = {
  nombre?: string
  descripcion?: string
  unidades_ids?: string
}

type ModalCombinadaProps = {
  open: boolean
  item?: Combinada | null
  unidades: HerramientaUnidad[]
  isLoadingUnidades?: boolean
  isSubmitting: boolean
  formError: string
  fieldErrors: CombinadaFieldErrors
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CombinadaFormValues) => void
}

export function ModalCombinada({
  open,
  item,
  unidades,
  isLoadingUnidades = false,
  isSubmitting,
  formError,
  fieldErrors,
  onOpenChange,
  onSubmit,
}: ModalCombinadaProps) {
  const isEditing = Boolean(item)
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [localErrors, setLocalErrors] = useState<CombinadaFieldErrors>({})

  useEffect(() => {
    if (!open) return

    setNombre(item?.nombre ?? "")
    setDescripcion(item?.descripcion ?? "")
    setSearch("")
    setSelectedIds((item?.unidades ?? []).map((unidad) => unidad.id))
    setLocalErrors({})
  }, [item?.id, open])

  const filteredUnits = useMemo(
    () => filtrarUnidadesPorBusqueda(unidades, search),
    [unidades, search],
  )

  const selectedUnits = useMemo(
    () =>
      selectedIds
        .map((id) => unidades.find((unidad) => unidad.id === id))
        .filter((unidad): unidad is HerramientaUnidad => Boolean(unidad)),
    [selectedIds, unidades],
  )

  const closeModal = () => {
    if (isSubmitting) return
    onOpenChange(false)
  }

  const toggleUnit = (unidadId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked
        ? [...current, unidadId]
        : current.filter((selectedId) => selectedId !== unidadId),
    )
    setLocalErrors((current) => ({ ...current, unidades_ids: undefined }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: CombinadaFieldErrors = {}
    const nombreValue = nombre.trim()

    if (!nombreValue) nextErrors.nombre = "El nombre es obligatorio."
    if (selectedIds.length < 2) {
      nextErrors.unidades_ids = "Selecciona al menos dos unidades."
    }

    if (Object.keys(nextErrors).length > 0) {
      setLocalErrors(nextErrors)
      return
    }

    onSubmit({
      nombre: nombreValue,
      descripcion,
      unidades_ids: selectedIds,
    })
  }

  const shownErrors: CombinadaFieldErrors = {
    nombre: localErrors.nombre || fieldErrors.nombre,
    descripcion: localErrors.descripcion || fieldErrors.descripcion,
    unidades_ids: localErrors.unidades_ids || fieldErrors.unidades_ids,
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
      <DialogContent className="flex h-[min(86vh,48rem)] w-[min(92vw,68rem)] max-w-none flex-col gap-4 overflow-hidden p-5 sm:max-w-none">
        <DialogHeader className="gap-2">
          <DialogTitle className="pr-10 text-xl font-semibold tracking-tight">
            {isEditing ? "Editar combinada" : "Agregar combinada"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Dale un nombre al conjunto y elige las unidades que lo forman. Por
            ejemplo, “Llave de bujía” puede ser una chicharra, una extensión y
            un dado de 11 mm.
          </DialogDescription>
        </DialogHeader>

        <form
          id="combinada-form"
          className="flex min-h-0 flex-1 flex-col gap-4"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="combinada-nombre" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="combinada-nombre"
                className="h-9"
                placeholder="Ej. Llave de bujía"
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
              <label
                htmlFor="combinada-descripcion"
                className="text-sm font-medium"
              >
                Descripción <span className="text-muted-foreground">(opcional)</span>
              </label>
              <Input
                id="combinada-descripcion"
                className="h-9"
                placeholder="Para qué se usa este conjunto"
                value={descripcion}
                disabled={isSubmitting}
                onChange={(event) => setDescripcion(event.target.value)}
              />
              {shownErrors.descripcion ? (
                <p className="text-sm text-destructive">
                  {shownErrors.descripcion}
                </p>
              ) : null}
            </div>
          </div>

          <div className="relative">
            <label htmlFor="combinada-search" className="sr-only">
              Buscar unidad
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="combinada-search"
              className="h-10 pl-9"
              placeholder="Buscar por herramienta, marca o ubicación..."
              value={search}
              disabled={isSubmitting}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">Unidades del conjunto</span>
            <span className="text-muted-foreground">
              {selectedIds.length} seleccionadas
            </span>
          </div>

          {shownErrors.unidades_ids ? (
            <p className="text-sm text-destructive">{shownErrors.unidades_ids}</p>
          ) : null}

          {selectedUnits.length > 0 ? (
            <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm">
              {selectedUnits.map((unidad) => nombreUnidad(unidad)).join(" + ")}
            </p>
          ) : null}

          {isLoadingUnidades ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed py-16 text-center text-base text-muted-foreground">
              Cargando unidades...
            </div>
          ) : filteredUnits.length > 0 ? (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {filteredUnits.map((unidad) => {
                const isSelected = selectedIds.includes(unidad.id)
                const estaPrestada = unidad.estado === UNIDAD_ESTADO_PRESTADA

                return (
                  <label
                    key={unidad.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-muted/50"
                  >
                    <Checkbox
                      className="size-4"
                      checked={isSelected}
                      disabled={isSubmitting}
                      onCheckedChange={(checked) =>
                        toggleUnit(unidad.id, checked === true)
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-base font-medium">
                        {nombreUnidad(unidad)}
                        {estaPrestada ? (
                          <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                            Prestada
                          </span>
                        ) : null}
                      </p>
                      <DetalleUnidadPrestamo
                        unidad={unidad}
                        className="mt-0.5 text-sm"
                      />
                    </div>
                  </label>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
              <p className="text-lg font-medium">No hay unidades para mostrar</p>
              <p className="mt-2 text-base text-muted-foreground">
                Prueba con otra búsqueda o registra primero las herramientas.
              </p>
            </div>
          )}
        </form>

        <DialogFooter className="-mx-5 -mb-5 mt-auto p-5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-10"
            disabled={isSubmitting}
            onClick={closeModal}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="combinada-form"
            size="lg"
            className="h-10"
            disabled={isSubmitting || isLoadingUnidades}
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
