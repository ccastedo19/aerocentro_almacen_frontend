import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react"
import {
  ArrowLeftRight,
  Check,
  Combine,
  Plus,
  RotateCcw,
  Search,
  UserRound,
  Wrench,
  X,
} from "lucide-react"

import { ComboboxFiltro } from "@/components/form/combobox-filtro"
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
import { useClosingSnapshot } from "@/hooks/use-closing-snapshot"
import {
  combinadaDisponible,
  filtrarCombinadasPorBusqueda,
  resumenCombinada,
  unidadesIdsCombinada,
  type Combinada,
} from "@/lib/combinadas"
import { etiquetaColorUnidad } from "@/lib/herramientas"
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
  type PrestamoEnUso,
  type UnidadPrestamo,
} from "@/lib/prestamos"

type Filtro = "todas" | "en_uso" | "combinadas" | "seleccionadas"

type ModalAgregarPrestamoProps = {
  open: boolean
  mechanic?: MecanicoPunto | null
  availableUnits: UnidadPrestamo[]
  loansInUse?: PrestamoEnUso[]
  combinadas?: Combinada[]
  isLoading?: boolean
  isSubmitting?: boolean
  error?: string
  onOpenChange: (open: boolean) => void
  onSubmit: (unidadIds: string[]) => void
  onExchange?: (unidadId: string) => Promise<void>
}

// Fila de unidad disponible (checkbox de selección)
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

// Fila de herramienta en uso por otro mecánico (botón de intercambio)
const PrestamoEnUsoItemRow = memo(function PrestamoEnUsoItemRow({
  item,
  disabled,
  onExchange,
}: {
  item: PrestamoEnUso
  disabled: boolean
  onExchange: (item: PrestamoEnUso) => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-3 transition-colors hover:bg-amber-500/[0.08] sm:flex-row sm:items-center sm:justify-between dark:border-amber-400/30 dark:bg-amber-500/[0.07]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
          <Wrench className="size-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-medium">{item.nombre}</p>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              En préstamo
            </span>
          </div>
          <DetalleUnidadPrestamo
            unidad={item.unidad}
            className="mt-0.5 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <div className="flex items-center gap-2 rounded-lg bg-muted/80 px-2.5 py-1.5 text-xs">
          <UserRound className="size-3.5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground leading-tight">Lo tiene</p>
            <p className="truncate font-semibold text-foreground leading-tight">
              {item.mechanicName}
              {item.mechanicArea ? ` (${item.mechanicArea})` : ""}
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-amber-500/40 text-amber-700 hover:bg-amber-500/15 hover:text-amber-800 dark:border-amber-400/40 dark:text-amber-300"
          disabled={disabled}
          onClick={() => onExchange(item)}
        >
          <ArrowLeftRight data-icon="inline-start" className="size-3.5" />
          Intercambiar
        </Button>
      </div>
    </div>
  )
})

// Fila de kit o combinada
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
  loansInUse = [],
  combinadas = [],
  isLoading = false,
  isSubmitting = false,
  error = "",
  onOpenChange,
  onSubmit,
  onExchange,
}: ModalAgregarPrestamoProps) {
  const [search, setSearch] = useState("")
  const [filtros, setFiltros] = useState<FiltrosUnidadPrestamo>(FILTROS_UNIDAD_VACIOS)
  const [filtro, setFiltro] = useState<Filtro>("todas")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [exchangeTarget, setExchangeTarget] = useState<PrestamoEnUso | null>(null)
  const [isExchanging, setIsExchanging] = useState(false)

  // Congelar valores durante la animación de cierre para evitar parpadeos
  const displayedMechanic = useClosingSnapshot(open, mechanic)
  const displayedAvailableUnits = useClosingSnapshot(open, availableUnits)
  const displayedLoansInUse = useClosingSnapshot(open, loansInUse)
  const displayedCombinadas = useClosingSnapshot(open, combinadas)
  const displayedLoading = useClosingSnapshot(open, isLoading)
  const displayedSubmitting = useClosingSnapshot(open, isSubmitting)
  const displayedError = useClosingSnapshot(open, error)

  // Búsqueda en segundo plano usando useDeferredValue para fluidez extrema al escribir
  const deferredSearch = useDeferredValue(search)
  const deferredFiltros = useDeferredValue(filtros)

  useEffect(() => {
    if (open) {
      setSearch("")
      setFiltros(FILTROS_UNIDAD_VACIOS)
      setFiltro("todas")
      setSelectedIds([])
      setExchangeTarget(null)
    }
  }, [open])

  // Conjunto Set de IDs seleccionados para búsqueda O(1) instantánea
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  // Unidades combinadas (disponibles + en uso por otros) para alimentar las sugerencias de filtros
  const todasLasUnidades = useMemo(() => {
    const unidadesPrestadas = (displayedLoansInUse ?? [])
      .map((l) => l.unidad)
      .filter((u): u is UnidadPrestamo => Boolean(u))
    return [...displayedAvailableUnits, ...unidadesPrestadas]
  }, [displayedAvailableUnits, displayedLoansInUse])

  // Opciones únicas para las sugerencias de los comboboxes
  const opcionesColor = useMemo(
    () =>
      opcionesFiltroUnicas(
        todasLasUnidades.flatMap((u) => [
          u.color_primario ? etiquetaColorUnidad(u.color_primario) : null,
          u.color_secundario ? etiquetaColorUnidad(u.color_secundario) : null,
        ]),
      ),
    [todasLasUnidades],
  )

  const opcionesColor2 = useMemo(
    () =>
      opcionesColor.filter(
        (c) => c.toLowerCase() !== filtros.color1.trim().toLowerCase(),
      ),
    [opcionesColor, filtros.color1],
  )

  const opcionesMarca = useMemo(
    () => opcionesFiltroUnicas(todasLasUnidades.map((u) => marcaUnidad(u))),
    [todasLasUnidades],
  )

  const opcionesTamano = useMemo(
    () => opcionesFiltroUnicas(todasLasUnidades.map((u) => u.tamano)),
    [todasLasUnidades],
  )

  const opcionesUbicacion = useMemo(
    () => opcionesFiltroUnicas(todasLasUnidades.map((u) => u.ubicacion?.nombre)),
    [todasLasUnidades],
  )

  const filteredUnits = useMemo(
    () => filtrarUnidadesPorBusqueda(displayedAvailableUnits, deferredSearch, deferredFiltros),
    [displayedAvailableUnits, deferredSearch, deferredFiltros],
  )

  const availableIds = useMemo(
    () => new Set(displayedAvailableUnits.map((unidad) => unidad.id)),
    [displayedAvailableUnits],
  )

  const filteredCombinadas = useMemo(() => {
    if (filtro === "en_uso") return []
    return filtrarCombinadasPorBusqueda(displayedCombinadas, deferredSearch).filter((combinada) => {
      if (!combinadaDisponible(combinada, availableIds)) return false
      if (filtro === "seleccionadas") {
        return (combinada.unidades ?? []).some((u) => selectedSet.has(u.id))
      }
      if (filtrosUnidadVacios(deferredFiltros)) return true
      return (combinada.unidades ?? []).some((unidad) =>
        unidadCoincideFiltros(unidad, deferredFiltros),
      )
    })
  }, [availableIds, displayedCombinadas, deferredSearch, deferredFiltros, filtro, selectedSet])

  // Filtrado de herramientas en uso por otros mecánicos
  const filteredLoansInUse = useMemo(() => {
    if (filtro === "combinadas" || filtro === "seleccionadas") {
      return []
    }

    const query = deferredSearch.trim().toLocaleLowerCase("es")

    return (displayedLoansInUse ?? []).filter((loan) => {
      // 1. Filtros secundarios (comboboxes: color, marca, tamano, ubicacion)
      if (!filtrosUnidadVacios(deferredFiltros)) {
        if (!unidadCoincideFiltros(loan.unidad, deferredFiltros)) {
          return false
        }
      }

      // 2. Buscador de texto
      if (query) {
        const matches = [
          loan.nombre,
          loan.detalle,
          loan.mechanicName,
          loan.mechanicArea,
          loan.unidad?.observaciones,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("es")
          .includes(query)

        if (!matches) return false
      }

      return true
    })
  }, [deferredFiltros, deferredSearch, displayedLoansInUse, filtro])

  const unidadesVisibles = useMemo(() => {
    if (filtro === "en_uso" || filtro === "combinadas") return []
    if (filtro === "seleccionadas") {
      return filteredUnits.filter((unidad) => selectedSet.has(unidad.id))
    }
    return filteredUnits
  }, [filtro, filteredUnits, selectedSet])

  const hayResultados =
    unidadesVisibles.length > 0 ||
    filteredCombinadas.length > 0 ||
    filteredLoansInUse.length > 0

  // Reglas de deshabilitado
  const disabledGeneral = displayedSubmitting || isExchanging
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
    if (displayedSubmitting || isExchanging) return
    onOpenChange(false)
  }, [displayedSubmitting, isExchanging, onOpenChange])

  const toggleUnit = useCallback((unidadId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked
        ? [...current, unidadId]
        : current.filter((selectedId) => selectedId !== unidadId),
    )
  }, [])

  const submitUnits = () => {
    if (selectedIds.length === 0 || displayedSubmitting || isExchanging) return
    onSubmit(selectedIds)
  }

  const handleExchangeClick = useCallback((item: PrestamoEnUso) => {
    setExchangeTarget(item)
  }, [])

  const handleConfirmExchange = async () => {
    if (!exchangeTarget || !onExchange) return
    setIsExchanging(true)
    try {
      await onExchange(exchangeTarget.unidadId)
      setExchangeTarget(null)
      closeModal()
    } catch {
      // El error se gestiona en la vista
    } finally {
      setIsExchanging(false)
    }
  }

  return (
    <>
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
        <DialogContent className="flex h-[min(92vh,52rem)] w-[min(96vw,84rem)] max-w-none flex-col gap-4 overflow-hidden p-5 sm:max-w-none">
          <DialogHeader className="gap-2">
            <DialogTitle className="pr-10 text-[18px] font-semibold tracking-tight">
              Agregar préstamo a “{displayedMechanic?.nombre_completo}”
            </DialogTitle>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {displayedError ? (
              <div
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {displayedError}
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
                  placeholder="Escribe aquí para buscar por herramienta, marca, ubicación o mecánico..."
                  value={search}
                  disabled={disabledGeneral}
                  onChange={(event) => {
                    const nextSearch = event.target.value
                    setSearch(nextSearch)
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

              {/* Buscadores secundarios (Filtros/Comboboxes) en 5 columnas */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {/* Color 1 */}
                <ComboboxFiltro
                  placeholder="Color 1"
                  value={filtros.color1}
                  options={opcionesColor}
                  disabled={disabledGeneral}
                  onChange={(val) => {
                    setFiltros((prev) => ({
                      ...prev,
                      color1: val,
                      color2: val.trim() ? prev.color2 : "",
                      color3: val.trim() ? prev.color3 : "",
                    }))
                  }}
                />

                {/* Color 2 */}
                <ComboboxFiltro
                  placeholder="Color 2"
                  value={filtros.color2}
                  options={opcionesColor2}
                  disabled={disabledColor2}
                  onChange={(val) => {
                    setFiltros((prev) => ({
                      ...prev,
                      color2: val,
                      color3: val.trim() ? prev.color3 : "",
                    }))
                  }}
                />

                {/* Marca */}
                <ComboboxFiltro
                  placeholder="Marca"
                  value={filtros.marca}
                  options={opcionesMarca}
                  disabled={disabledGeneral}
                  onChange={(val) =>
                    setFiltros((prev) => ({ ...prev, marca: val }))
                  }
                />

                {/* Tamaño */}
                <ComboboxFiltro
                  placeholder="Tamaño"
                  value={filtros.tamano}
                  options={opcionesTamano}
                  disabled={disabledGeneral}
                  onChange={(val) =>
                    setFiltros((prev) => ({ ...prev, tamano: val }))
                  }
                />

                {/* Ubicación */}
                <ComboboxFiltro
                  placeholder="Ubicación"
                  value={filtros.ubicacion}
                  options={opcionesUbicacion}
                  disabled={disabledGeneral}
                  onChange={(val) =>
                    setFiltros((prev) => ({ ...prev, ubicacion: val }))
                  }
                />
              </div>
            </div>

            {/* Opciones de filtro y Botón Limpiar comboboxes */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={filtro === "todas" ? "default" : "outline"}
                  aria-pressed={filtro === "todas"}
                  disabled={disabledGeneral}
                  onClick={() => setFiltro("todas")}
                >
                  Ver todas
                </Button>

                <Button
                  size="sm"
                  variant={filtro === "en_uso" ? "warning" : "outline"}
                  className={
                    filtro === "en_uso"
                      ? "border-amber-500/40 dark:border-amber-300/40"
                      : undefined
                  }
                  aria-pressed={filtro === "en_uso"}
                  disabled={disabledGeneral}
                  onClick={() => setFiltro("en_uso")}
                >
                  <Wrench data-icon="inline-start" className="size-3.5 text-amber-600 dark:text-amber-400" />
                  En préstamo ({displayedLoansInUse.length})
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
                  disabled={disabledGeneral}
                  onClick={() => setFiltro("combinadas")}
                >
                  <Combine data-icon="inline-start" />
                  Solo combinadas
                </Button>

                <Button
                  size="sm"
                  variant={filtro === "seleccionadas" ? "success" : "outline"}
                  aria-pressed={filtro === "seleccionadas"}
                  disabled={disabledGeneral}
                  onClick={() => setFiltro("seleccionadas")}
                >
                  <Check data-icon="inline-start" />
                  Ver Seleccionadas
                </Button>

                {/* Botón para Limpiar los buscadores */}
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={disabledGeneral || (!search.trim() && filtrosUnidadVacios(filtros))}
                  onClick={() => {
                    setSearch("")
                    setFiltros(FILTROS_UNIDAD_VACIOS)
                  }}
                >
                  <RotateCcw data-icon="inline-start" className="size-3.5" />
                  Limpiar Buscadores
                </Button>
              </div>

              <span className="text-sm text-muted-foreground">
                {selectedIds.length} seleccionadas
              </span>
            </div>

            {displayedLoading ? (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed py-16 text-center text-base text-muted-foreground">
                Cargando herramientas...
              </div>
            ) : hayResultados ? (
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {/* Unidades disponibles en almacén */}
                {unidadesVisibles.map((unidad) => (
                  <UnidadItemRow
                    key={unidad.id}
                    unidad={unidad}
                    isSelected={selectedSet.has(unidad.id)}
                    disabled={disabledGeneral}
                    onToggle={toggleUnit}
                  />
                ))}

                {/* Herramientas en préstamo con otros mecánicos (intercambio) */}
                {filteredLoansInUse.map((loan) => (
                  <PrestamoEnUsoItemRow
                    key={loan.unidadId}
                    item={loan}
                    disabled={disabledGeneral}
                    onExchange={handleExchangeClick}
                  />
                ))}

                {/* Combinadas */}
                {filteredCombinadas.map((combinada) => {
                  const ids = unidadesIdsCombinada(combinada)
                  const isSelected = ids.every((id) => selectedSet.has(id))

                  return (
                    <CombinadaItemRow
                      key={combinada.id}
                      combinada={combinada}
                      isSelected={isSelected}
                      disabled={disabledGeneral}
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
                    : filtro === "en_uso"
                      ? "No hay herramientas prestadas que coincidan con la búsqueda"
                      : filtro === "combinadas"
                        ? "No hay combinadas disponibles para esta búsqueda"
                        : "No hay herramientas que coincidan con la búsqueda"}
                </p>
                <p className="mt-2 text-base text-muted-foreground">
                  {filtro === "seleccionadas"
                    ? "Marca la casilla de las herramientas que desees incluir para ver tu selección aquí."
                    : filtro === "en_uso"
                      ? "No se encontraron herramientas en préstamo con otros mecánicos para este filtro."
                      : filtro === "combinadas"
                        ? "Una combinada solo aparece si todas sus unidades están libres. Prueba con “Ver todas”."
                        : "Prueba con otro término de búsqueda o limpia los filtros."}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="-mx-5 -mb-5 p-5 pt-2.5 pb-2.5 ">
            <Button
              variant="outline"
              size="lg"
              className="h-9"
              disabled={disabledGeneral}
              onClick={closeModal}
            >
              Cancelar
            </Button>
            <Button
              size="lg"
              className="h-9"
              disabled={selectedIds.length === 0 || disabledGeneral || displayedLoading}
              onClick={submitUnits}
            >
              <Plus data-icon="inline-start" />
              {displayedSubmitting
                ? "Registrando..."
                : `Agregar ${selectedIds.length || ""} ${selectedIds.length === 1 ? "unidad" : "unidades"
                }`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo modal de confirmación para intercambio de herramienta */}
      <Dialog
        open={exchangeTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isExchanging) {
            setExchangeTarget(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <ArrowLeftRight className="size-5 text-amber-600 dark:text-amber-400" />
              Intercambiar herramienta
            </DialogTitle>
            <DialogDescription className="text-sm">
              Esta herramienta actualmente la tiene{" "}
              <strong className="text-foreground">{exchangeTarget?.mechanicName}</strong>.
              <br />
              Al intercambiarla, se registrará su devolución automática y pasará a préstamo activo para{" "}
              <strong className="text-foreground">{displayedMechanic?.nombre_completo}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium text-foreground">{exchangeTarget?.nombre}</p>
            <p className="text-xs text-muted-foreground">{exchangeTarget?.detalle}</p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isExchanging}
              onClick={() => setExchangeTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
              disabled={isExchanging}
              onClick={handleConfirmExchange}
            >
              <ArrowLeftRight data-icon="inline-start" className="size-4" />
              {isExchanging ? "Intercambiando..." : "Confirmar Intercambio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
