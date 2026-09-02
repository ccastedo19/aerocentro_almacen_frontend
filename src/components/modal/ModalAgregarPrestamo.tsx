import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react"
import { Check, Combine, Plus, RotateCcw, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DetalleUnidadPrestamo } from "@/components/prestamos/detalle-unidad-prestamo"
import { etiquetaColorUnidad } from "@/lib/herramientas"
import {
  combinadaDisponible,
  filtrarCombinadasPorBusqueda,
  resumenCombinada,
  unidadesIdsCombinada,
  type Combinada,
} from "@/lib/combinadas"
import {
  FILTROS_UNIDAD_VACIOS,
  filtrarUnidadesPorBusqueda,
  filtrosUnidadVacios,
  marcaUnidad,
  nombreUnidad,
  opcionesFiltroUnicas,
  unidadCoincideFiltros,
  type FiltrosUnidadPrestamo,
  type MecanicoPunto,
  type UnidadPrestamo,
} from "@/lib/prestamos"

type Filtro = "todas" | "combinadas" | "seleccionadas"

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

// Componentes memoizados para evitar re-renders masivos al seleccionar o escribir
const UnidadItemRow = memo(function UnidadItemRow({
  unidad,
  isSelected,
  disabled,
  onToggle,
}: {
  unidad: UnidadPrestamo
  isSelected: boolean
  disabled: boolean
  onToggle: (id: string, checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-muted/50">
      <Checkbox
        className="size-4"
        checked={isSelected}
        disabled={disabled}
        onCheckedChange={(checked) => onToggle(unidad.id, checked === true)}
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
})

const CombinadaItemRow = memo(function CombinadaItemRow({
  combinada,
  isSelected,
  disabled,
  onToggle,
}: {
  combinada: Combinada
  isSelected: boolean
  disabled: boolean
  onToggle: (combinada: Combinada, checked: boolean) => void
}) {
  const ids = useMemo(() => unidadesIdsCombinada(combinada), [combinada])
  const resumen = useMemo(() => resumenCombinada(combinada), [combinada])

  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-amber-400 bg-amber-400/5 p-3 transition-colors hover:bg-amber-400/10 has-data-checked:bg-amber-400/15 dark:border-amber-300/70">
      <Checkbox
        className="size-4"
        checked={isSelected}
        disabled={disabled}
        onCheckedChange={(checked) => onToggle(combinada, checked === true)}
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
          {resumen} · {ids.length} unidades
        </p>
      </div>
    </label>
  )
})

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
  const [filtros, setFiltros] = useState<FiltrosUnidadPrestamo>(FILTROS_UNIDAD_VACIOS)
  const [filtro, setFiltro] = useState<Filtro>("todas")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Búsqueda en segundo plano usando useDeferredValue para fluidez extrema al escribir
  const deferredSearch = useDeferredValue(search)
  const deferredFiltros = useDeferredValue(filtros)

  useEffect(() => {
    if (!open) return
    setSearch("")
    setFiltros(FILTROS_UNIDAD_VACIOS)
    setFiltro("todas")
    setSelectedIds([])
  }, [mechanic?.id, open])

  // Conjunto Set de IDs seleccionados para búsqueda O(1) instantánea
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  // Opciones únicas para las sugerencias de los comboboxes
  const opcionesColor = useMemo(
    () =>
      opcionesFiltroUnicas(
        availableUnits.flatMap((u) => [
          u.color_primario ? etiquetaColorUnidad(u.color_primario) : null,
          u.color_secundario ? etiquetaColorUnidad(u.color_secundario) : null,
        ]),
      ),
    [availableUnits],
  )

  const opcionesMarca = useMemo(
    () => opcionesFiltroUnicas(availableUnits.map((u) => marcaUnidad(u))),
    [availableUnits],
  )

  const opcionesTamano = useMemo(
    () => opcionesFiltroUnicas(availableUnits.map((u) => u.tamano)),
    [availableUnits],
  )

  const opcionesUbicacion = useMemo(
    () => opcionesFiltroUnicas(availableUnits.map((u) => u.ubicacion?.nombre)),
    [availableUnits],
  )

  const filteredUnits = useMemo(
    () => filtrarUnidadesPorBusqueda(availableUnits, deferredSearch, deferredFiltros),
    [availableUnits, deferredSearch, deferredFiltros],
  )

  const availableIds = useMemo(
    () => new Set(availableUnits.map((unidad) => unidad.id)),
    [availableUnits],
  )

  const filteredCombinadas = useMemo(
    () =>
      filtrarCombinadasPorBusqueda(combinadas, deferredSearch).filter((combinada) => {
        if (!combinadaDisponible(combinada, availableIds)) return false
        if (filtro === "seleccionadas") {
          return (combinada.unidades ?? []).some((u) => selectedSet.has(u.id))
        }
        if (filtrosUnidadVacios(deferredFiltros)) return true
        return (combinada.unidades ?? []).some((unidad) =>
          unidadCoincideFiltros(unidad, deferredFiltros),
        )
      }),
    [availableIds, combinadas, deferredSearch, deferredFiltros, filtro, selectedSet],
  )

  const unidadesVisibles = useMemo(() => {
    if (filtro === "combinadas") return []
    if (filtro === "seleccionadas") {
      return filteredUnits.filter((unidad) => selectedSet.has(unidad.id))
    }
    return filteredUnits
  }, [filtro, filteredUnits, selectedSet])

  const hayResultados =
    unidadesVisibles.length > 0 || filteredCombinadas.length > 0

  // Reglas de deshabilitado jerárquico
  const hasGeneralSearch = Boolean(search.trim())
  const disabledGeneral = !hasGeneralSearch || isSubmitting
  const disabledColor2 = disabledGeneral || !filtros.color1.trim()

  const toggleCombinada = useCallback((combinada: Combinada, checked: boolean) => {
    const ids = unidadesIdsCombinada(combinada)

    setSelectedIds((current) => {
      const currentSet = new Set(current)
      if (checked) {
        ids.forEach((id) => currentSet.add(id))
      } else {
        ids.forEach((id) => currentSet.delete(id))
      }
      return Array.from(currentSet)
    })
  }, [])

  const closeModal = useCallback(() => {
    if (isSubmitting) return
    setSearch("")
    setFiltros(FILTROS_UNIDAD_VACIOS)
    setSelectedIds([])
    onOpenChange(false)
  }, [isSubmitting, onOpenChange])

  const toggleUnit = useCallback((unidadId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked
        ? [...current, unidadId]
        : current.filter((selectedId) => selectedId !== unidadId),
    )
  }, [])

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
      <DialogContent className="flex h-[min(88vh,52rem)] w-[min(96vw,84rem)] max-w-none flex-col gap-4 overflow-hidden p-5 sm:max-w-none">
        <DialogHeader className="gap-2">
          <DialogTitle className="pr-10 text-[18px] font-semibold tracking-tight">
            Añadir préstamo a “{mechanic?.nombre_completo}”
          </DialogTitle>
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

          <div className="space-y-3">
            {/* Buscador principal - 100% de ancho */}
            <div className="relative w-full">
              <label htmlFor="tool-search" className="sr-only">
                Buscar unidad
              </label>

              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="tool-search"
                className="h-10 pl-9 pr-9 text-base"
                placeholder="Escribe aquí para buscar por herramienta, marca o ubicación..."
                value={search}
                disabled={isSubmitting}
                onChange={(event) => {
                  const nextSearch = event.target.value
                  setSearch(nextSearch)
                  if (!nextSearch.trim()) {
                    setFiltros(FILTROS_UNIDAD_VACIOS)
                  }
                }}
              />

              {search ? (
                <button
                  type="button"
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => {
                    setSearch("")
                    setFiltros(FILTROS_UNIDAD_VACIOS)
                  }}
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>

            {/* Buscadores secundarios (Filtros/Comboboxes) en 6 columnas */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {/* Sugerencias de datalist */}
              <datalist id="list-color1">
                {opcionesColor.map((color) => (
                  <option key={color} value={color} />
                ))}
              </datalist>

              <datalist id="list-color2">
                {opcionesColor
                  .filter((c) => c.toLowerCase() !== filtros.color1.toLowerCase())
                  .map((color) => (
                    <option key={color} value={color} />
                  ))}
              </datalist>

              <datalist id="list-marca">
                {opcionesMarca.map((marca) => (
                  <option key={marca} value={marca} />
                ))}
              </datalist>

              <datalist id="list-tamano">
                {opcionesTamano.map((tamano) => (
                  <option key={tamano} value={tamano} />
                ))}
              </datalist>

              <datalist id="list-ubicacion">
                {opcionesUbicacion.map((ubicacion) => (
                  <option key={ubicacion} value={ubicacion} />
                ))}
              </datalist>

              {/* Color 1 */}
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-8 text-sm"
                  placeholder="Color 1"
                  value={filtros.color1}
                  list="list-color1"
                  disabled={disabledGeneral}
                  onChange={(e) => {
                    const val = e.target.value
                    setFiltros((prev) => ({
                      ...prev,
                      color1: val,
                      color2: val.trim() ? prev.color2 : "",
                      color3: val.trim() ? prev.color3 : "",
                    }))
                  }}
                />
              </div>

              {/* Color 2 */}
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-8 text-sm"
                  placeholder="Color 2"
                  value={filtros.color2}
                  list="list-color2"
                  disabled={disabledColor2}
                  onChange={(e) => {
                    const val = e.target.value
                    setFiltros((prev) => ({
                      ...prev,
                      color2: val,
                      color3: val.trim() ? prev.color3 : "",
                    }))
                  }}
                />
              </div>

              {/* Marca */}
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-8 text-sm"
                  placeholder="Marca"
                  value={filtros.marca}
                  list="list-marca"
                  disabled={disabledGeneral}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, marca: e.target.value }))
                  }
                />
              </div>

              {/* Tamaño */}
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-8 text-sm"
                  placeholder="Tamaño"
                  value={filtros.tamano}
                  list="list-tamano"
                  disabled={disabledGeneral}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, tamano: e.target.value }))
                  }
                />
              </div>

              {/* Ubicación */}
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-8 text-sm"
                  placeholder="Ubicación"
                  value={filtros.ubicacion}
                  list="list-ubicacion"
                  disabled={disabledGeneral}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, ubicacion: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Opciones de filtro y Botón Limpiar comboboxes */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={filtro === "todas" ? "default" : "outline"}
                aria-pressed={filtro === "todas"}
                disabled={isSubmitting}
                onClick={() => setFiltro("todas")}
              >
                Ver todas
              </Button>
              <Button
                size="sm"
                variant={filtro === "combinadas" ? "warning" : "outline"}
                className={
                  filtro === "combinadas"
                    ? "border-amber-500/40 dark:border-amber-300/40"
                    : undefined
                }
                aria-pressed={filtro === "combinadas"}
                disabled={isSubmitting}
                onClick={() => setFiltro("combinadas")}
              >
                <Combine data-icon="inline-start" />
                Solo combinadas
              </Button>

              <Button
                size="sm"
                variant={filtro === "seleccionadas" ? "success" : "outline"}
                aria-pressed={filtro === "seleccionadas"}
                disabled={isSubmitting}
                onClick={() => setFiltro("seleccionadas")}
              >
                <Check data-icon="inline-start" />
                Ver Seleccionadas
              </Button>

              {/* Botón para Limpiar los comboboxes */}
              <Button
                size="sm"
                variant="destructive"
                disabled={disabledGeneral || filtrosUnidadVacios(filtros)}
                onClick={() => setFiltros(FILTROS_UNIDAD_VACIOS)}
              >
                <RotateCcw data-icon="inline-start" className="size-3.5" />
                Limpiar Buscadores
              </Button>
            </div>

            <span className="text-sm text-muted-foreground">
              {selectedIds.length} seleccionadas
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed py-16 text-center text-base text-muted-foreground">
              Cargando unidades disponibles...
            </div>
          ) : hayResultados ? (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {unidadesVisibles.map((unidad) => (
                <UnidadItemRow
                  key={unidad.id}
                  unidad={unidad}
                  isSelected={selectedSet.has(unidad.id)}
                  disabled={isSubmitting}
                  onToggle={toggleUnit}
                />
              ))}

              {filteredCombinadas.map((combinada) => {
                const ids = unidadesIdsCombinada(combinada)
                const isSelected = ids.every((id) => selectedSet.has(id))

                return (
                  <CombinadaItemRow
                    key={combinada.id}
                    combinada={combinada}
                    isSelected={isSelected}
                    disabled={isSubmitting}
                    onToggle={toggleCombinada}
                  />
                )
              })}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
              <p className="text-lg font-medium">
                {filtro === "seleccionadas"
                  ? "No hay unidades seleccionadas"
                  : !hasGeneralSearch
                    ? "Ingresa un término en el buscador principal para comenzar la búsqueda"
                    : filtro === "combinadas"
                      ? "No hay combinadas disponibles para esta búsqueda"
                      : "No hay unidades disponibles para esta búsqueda"}
              </p>
              <p className="mt-2 text-base text-muted-foreground">
                {filtro === "seleccionadas"
                  ? "Marca la casilla de las herramientas que desees incluir para ver tu selección aquí."
                  : !hasGeneralSearch
                    ? "Escribe el nombre de la herramienta en la barra superior para activar los comboboxes y filtros."
                    : filtro === "combinadas"
                      ? "Una combinada solo aparece si todas sus unidades están libres. Prueba con “Ver todas”."
                      : "Prueba con otro término de búsqueda o limpia los comboboxes."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="-mx-5 -mb-5 p-5 pt-2.5 pb-2.5 ">
          <Button
            variant="outline"
            size="lg"
            className="h-9"
            disabled={isSubmitting}
            onClick={closeModal}
          >
            Cancelar
          </Button>
          <Button
            size="lg"
            className="h-9"
            disabled={selectedIds.length === 0 || isSubmitting || isLoading}
            onClick={submitUnits}
          >
            <Plus data-icon="inline-start" />
            {isSubmitting
              ? "Registrando..."
              : `Añadir ${selectedIds.length || ""} ${selectedIds.length === 1 ? "unidad" : "unidades"
              }`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
