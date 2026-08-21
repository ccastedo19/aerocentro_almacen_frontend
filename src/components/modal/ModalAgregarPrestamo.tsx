import { useEffect, useMemo, useState } from "react"
import { Plus, Search } from "lucide-react"

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
import {
  categoriaUnidad,
  detalleUnidad,
  nombreUnidad,
  type MecanicoPunto,
  type UnidadPrestamo,
} from "@/lib/prestamos"

type ModalAgregarPrestamoProps = {
  open: boolean
  mechanic?: MecanicoPunto | null
  availableUnits: UnidadPrestamo[]
  isLoading?: boolean
  isSubmitting?: boolean
  error?: string
  onOpenChange: (open: boolean) => void
  onSubmit: (unidadIds: string[]) => void
}

export function ModalAgregarPrestamo({
  open,
  mechanic,
  availableUnits,
  isLoading = false,
  isSubmitting = false,
  error = "",
  onOpenChange,
  onSubmit,
}: ModalAgregarPrestamoProps) {
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setSearch("")
    setSelectedIds([])
  }, [mechanic?.id, open])

  const filteredUnits = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()

    if (!query) return availableUnits

    return availableUnits.filter((unidad) => {
      const haystack = [
        nombreUnidad(unidad),
        categoriaUnidad(unidad),
        detalleUnidad(unidad),
      ]
        .join(" ")
        .toLocaleLowerCase()

      return haystack.includes(query)
    })
  }, [availableUnits, search])

  const closeModal = () => {
    if (isSubmitting) return
    setSearch("")
    setSelectedIds([])
    onOpenChange(false)
  }

  const toggleUnit = (unidadId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked
        ? [...current, unidadId]
        : current.filter((selectedId) => selectedId !== unidadId),
    )
  }

  const submitUnits = () => {
    if (selectedIds.length === 0 || isSubmitting) return
    onSubmit(selectedIds)
  }

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
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-lg">
            Añadir préstamo a “{mechanic?.nombre_completo}”
          </DialogTitle>
          <DialogDescription>
            Busca y selecciona una o varias unidades disponibles para
            registrarlas en un solo préstamo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {error ? (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div className="relative">
            <label htmlFor="tool-search" className="sr-only">
              Buscar unidad
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="tool-search"
              className="h-10 pl-9"
              placeholder="Buscar por herramienta, marca o ubicación..."
              value={search}
              disabled={isSubmitting}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Unidades disponibles</span>
            <span className="text-muted-foreground">
              {selectedIds.length} seleccionadas
            </span>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              Cargando unidades disponibles...
            </div>
          ) : filteredUnits.length > 0 ? (
            <div className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
              {filteredUnits.map((unidad) => {
                const isSelected = selectedIds.includes(unidad.id)
                const extra = detalleUnidad(unidad)

                return (
                  <label
                    key={unidad.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-muted/50"
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isSubmitting}
                      onCheckedChange={(checked) =>
                        toggleUnit(unidad.id, checked === true)
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{nombreUnidad(unidad)}</p>
                      <p className="text-xs text-muted-foreground">
                        {categoriaUnidad(unidad)}
                        {extra ? ` · ${extra}` : ""}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed py-8 text-center">
              <p className="font-medium">No hay unidades disponibles</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Prueba con otra búsqueda o espera a que se devuelva alguna
                unidad.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={closeModal}>
            Cancelar
          </Button>
          <Button
            disabled={selectedIds.length === 0 || isSubmitting || isLoading}
            onClick={submitUnits}
          >
            <Plus data-icon="inline-start" />
            {isSubmitting
              ? "Registrando..."
              : `Añadir ${selectedIds.length || ""} ${
                  selectedIds.length === 1 ? "unidad" : "unidades"
                }`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
