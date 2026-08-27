import { useEffect, useMemo, useState } from "react"
import { Combine, Plus, Search } from "lucide-react"

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
import { DetalleUnidadPrestamo } from "@/components/prestamos/detalle-unidad-prestamo"
import {
  combinadaDisponible,
  filtrarCombinadasPorBusqueda,
  resumenCombinada,
  unidadesIdsCombinada,
  type Combinada,
} from "@/lib/combinadas"
import {
  filtrarUnidadesPorBusqueda,
  nombreUnidad,
  type MecanicoPunto,
  type UnidadPrestamo,
} from "@/lib/prestamos"

type ModalAgregarPrestamoProps = {
  open: boolean
  mechanic?: MecanicoPunto | null
  availableUnits: UnidadPrestamo[]
  combinadas?: Combinada[]
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
  combinadas = [],
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

  const filteredUnits = useMemo(
    () => filtrarUnidadesPorBusqueda(availableUnits, search),
    [availableUnits, search],
  )

  const availableIds = useMemo(
    () => new Set(availableUnits.map((unidad) => unidad.id)),
    [availableUnits],
  )

  const filteredCombinadas = useMemo(
    () =>
      filtrarCombinadasPorBusqueda(combinadas, search).filter((combinada) =>
        combinadaDisponible(combinada, availableIds),
      ),
    [availableIds, combinadas, search],
  )

  const toggleCombinada = (combinada: Combinada, checked: boolean) => {
    const ids = unidadesIdsCombinada(combinada)

    setSelectedIds((current) =>
      checked
        ? [...current, ...ids.filter((id) => !current.includes(id))]
        : current.filter((selectedId) => !ids.includes(selectedId)),
    )
  }

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
      <DialogContent className="flex h-[min(86vh,48rem)] w-[min(92vw,68rem)] max-w-none flex-col gap-4 overflow-hidden p-5 sm:max-w-none">
        <DialogHeader className="gap-2">
          <DialogTitle className="pr-10 text-xl font-semibold tracking-tight xl:text-2xl">
            Añadir préstamo a “{mechanic?.nombre_completo}”
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Busca y selecciona una o varias unidades disponibles para
            registrarlas en un solo préstamo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
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
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed py-16 text-center text-base text-muted-foreground">
              Cargando unidades disponibles...
            </div>
          ) : filteredUnits.length > 0 || filteredCombinadas.length > 0 ? (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {filteredCombinadas.map((combinada) => {
                const ids = unidadesIdsCombinada(combinada)
                const isSelected = ids.every((id) => selectedIds.includes(id))

                return (
                  <label
                    key={combinada.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-amber-400 bg-amber-400/5 p-3 transition-colors hover:bg-amber-400/10 has-data-checked:bg-amber-400/15 dark:border-amber-300/70"
                  >
                    <Checkbox
                      className="size-4"
                      checked={isSelected}
                      disabled={isSubmitting}
                      onCheckedChange={(checked) =>
                        toggleCombinada(combinada, checked === true)
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-base font-medium">
                        <Combine className="size-4 text-amber-600 dark:text-amber-300" />
                        {combinada.nombre}
                        <span className="inline-flex rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-200">
                          Combinada
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {resumenCombinada(combinada)} · {ids.length} unidades
                      </p>
                    </div>
                  </label>
                )
              })}

              {filteredUnits.map((unidad) => {
                const isSelected = selectedIds.includes(unidad.id)

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
                      <p className="truncate text-base font-medium">
                        {nombreUnidad(unidad)}
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
              <p className="text-lg font-medium">No hay unidades disponibles</p>
              <p className="mt-2 text-base text-muted-foreground">
                Prueba con otra búsqueda o espera a que se devuelva alguna
                unidad.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="-mx-5 -mb-5 p-5">
          <Button
            variant="outline"
            size="lg"
            className="h-10"
            disabled={isSubmitting}
            onClick={closeModal}
          >
            Cancelar
          </Button>
          <Button
            size="lg"
            className="h-10"
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
