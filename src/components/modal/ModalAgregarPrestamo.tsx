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

type Filtro = "todas" | "en_uso" | "combinadas"

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
  onExchange?: (item: PrestamoEnUso) => Promise<void>
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

// Fila de herramienta en uso (botón de intercambio si es de otro mecánico, o indicativo azul si es del mismo mecánico)
const PrestamoEnUsoItemRow = memo(function PrestamoEnUsoItemRow({
  item,
  isCurrentMechanic = false,
  disabled,
  onExchange,
}: {
  item: PrestamoEnUso
  isCurrentMechanic?: boolean
  disabled: boolean
  onExchange: (item: PrestamoEnUso) => void
}) {
  if (isCurrentMechanic) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-blue-500/30 bg-blue-500/[0.05] p-3 transition-colors hover:bg-blue-500/[0.08] sm:flex-row sm:items-center sm:justify-between dark:border-blue-400/30 dark:bg-blue-500/[0.08]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
            <Wrench className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-medium">{item.nombre}</p>
              <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                La está usando
              </span>
            </div>
            <DetalleUnidadPrestamo
              unidad={item.unidad}
              className="mt-0.5 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-xs">
            <UserRound className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 leading-tight">En posesión de</p>
              <p className="truncate font-semibold text-blue-800 dark:text-blue-200 leading-tight">
                Este mecánico ({item.mechanicName})
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
  const [displayLimit, setDisplayLimit] = useState(40)

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
      setDisplayLimit(40)
    }
  }, [open])

  useEffect(() => {
    setDisplayLimit(40)
  }, [filtro, deferredSearch, deferredFiltros])

  const handleScrollList = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop - clientHeight < 250) {
      setDisplayLimit((prev) => prev + 40)
    }
  }, [])

  // Conjunto Set de IDs seleccionados para búsqueda O(1) instantánea
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  // Unidades combinadas (disponibles + en uso por otros) para alimentar las sugerencias de filtros
  const todasLasUnidades = useMemo(() => {
    const unidadesPrestadas = (displayedLoansInUse ?? [])
      .map((l) => l.unidad)
      .filter((u): u is UnidadPrestamo => Boolean(u))
    return [...displayedAvailableUnits, ...unidadesPrestadas]
  }, [displayedAvailableUnits, displayedLoansInUse])

  // Lista de unidades seleccionadas para mostrar en el panel lateral derecho
  const selectedUnidades = useMemo(() => {
    const map = new Map(todasLasUnidades.map((u) => [u.id, u]))
    return selectedIds
      .map((id) => map.get(id))
      .filter((u): u is UnidadPrestamo => Boolean(u))
  }, [selectedIds, todasLasUnidades])

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
      if (filtrosUnidadVacios(deferredFiltros)) return true
      return (combinada.unidades ?? []).some((unidad) =>
        unidadCoincideFiltros(unidad, deferredFiltros),
      )
    })
  }, [availableIds, displayedCombinadas, deferredSearch, deferredFiltros, filtro])

  // Filtrado de herramientas en uso (tanto de este mecánico como de otros)
  const filteredLoansInUse = useMemo(() => {
    if (filtro === "combinadas") {
      return []
    }

    const query = deferredSearch.trim().toLocaleLowerCase("es")

    const list = (displayedLoansInUse ?? []).filter((loan) => {
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

    // Colocar primero las herramientas que ya tiene en posesión el mecánico actual
    if (displayedMechanic) {
      return [...list].sort((a, b) => {
        const aIsCurrent = a.mechanicId === displayedMechanic.id ? 1 : 0
        const bIsCurrent = b.mechanicId === displayedMechanic.id ? 1 : 0
        return bIsCurrent - aIsCurrent
      })
    }

    return list
  }, [deferredFiltros, deferredSearch, displayedLoansInUse, displayedMechanic, filtro])

  const unidadesVisibles = useMemo(() => {
    if (filtro === "en_uso" || filtro === "combinadas") return []
    return filteredUnits
  }, [filtro, filteredUnits])

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
    const target = exchangeTarget
    setIsExchanging(true)
    try {
      await onExchange(target)
      setSelectedIds((current) =>
        current.includes(target.unidadId) ? current : [...current, target.unidadId],
      )
      setExchangeTarget(null)
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

              <span className="text-sm font-medium text-muted-foreground">
                {selectedIds.length} {selectedIds.length === 1 ? "seleccionada" : "seleccionadas"}
              </span>
            </div>

            {/* Layout principal dividido de 2 columnas: Lista a la izquierda | Seleccionadas a la derecha */}
            <div className="flex min-h-0 flex-1 gap-4">
              {/* Columna Izquierda: Listado de herramientas */}
              <div className="flex min-w-0 flex-1 flex-col">
                {displayedLoading ? (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed py-16 text-center text-base text-muted-foreground">
                    Cargando herramientas...
                  </div>
                ) : hayResultados ? (
                  <div
                    className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1"
                    onScroll={handleScrollList}
                  >
                    {/* Unidades disponibles en almacén */}
                    {unidadesVisibles.slice(0, displayLimit).map((unidad) => (
                      <UnidadItemRow
                        key={unidad.id}
                        unidad={unidad}
                        isSelected={selectedSet.has(unidad.id)}
                        disabled={disabledGeneral}
                        onToggle={toggleUnit}
                      />
                    ))}

                    {/* Herramientas en préstamo (en uso por este mecánico u otros mecánicos) */}
                    {filteredLoansInUse.slice(0, displayLimit).map((loan) => (
                      <PrestamoEnUsoItemRow
                        key={loan.unidadId}
                        item={loan}
                        isCurrentMechanic={
                          displayedMechanic ? loan.mechanicId === displayedMechanic.id : false
                        }
                        disabled={disabledGeneral}
                        onExchange={handleExchangeClick}
                      />
                    ))}

                    {/* Combinadas */}
                    {filteredCombinadas.slice(0, displayLimit).map((combinada) => {
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
                      {filtro === "en_uso"
                        ? "No hay herramientas prestadas que coincidan con la búsqueda"
                        : filtro === "combinadas"
                          ? "No hay combinadas disponibles para esta búsqueda"
                          : "No hay herramientas que coincidan con la búsqueda"}
                    </p>
                    <p className="mt-2 text-base text-muted-foreground">
                      {filtro === "en_uso"
                        ? "No se encontraron herramientas en préstamo con otros mecánicos para este filtro."
                        : filtro === "combinadas"
                          ? "Una combinada solo aparece si todas sus unidades están libres. Prueba con “Ver todas”."
                          : "Prueba con otro término de búsqueda o limpia los filtros."}
                    </p>
                  </div>
                )}
              </div>

              {/* Panel Lateral Derecho: Herramientas Seleccionadas */}
              <div className="flex w-72 shrink-0 flex-col rounded-xl border bg-card p-3.5 shadow-sm min-h-0 sm:w-80 lg:w-96">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="size-3" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Seleccionadas
                    </h3>
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs  text-primary">
                      {selectedIds.length}
                    </span>
                  </div>

                  {selectedIds.length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                      disabled={disabledGeneral}
                      onClick={() => setSelectedIds([])}
                    >
                      <RotateCcw className="mr-1 size-3" />
                      Limpiar
                    </Button>
                  ) : null}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto py-2.5 space-y-2 pr-0.5">
                  {selectedUnidades.length > 0 ? (
                    selectedUnidades.map((unidad) => (
                      <div
                        key={unidad.id}
                        className="group flex items-center justify-between gap-2.5 rounded-lg border bg-background p-2.5 transition-colors hover:border-destructive/40"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-medium text-foreground">
                            {nombreUnidad(unidad)}
                          </p>
                          <DetalleUnidadPrestamo
                            unidad={unidad}
                            className="mt-0.5 text-[12px]"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6 shrink-0 rounded-md text-muted-foreground opacity-70 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          disabled={disabledGeneral}
                          onClick={() => toggleUnit(unidad.id, false)}
                        >
                          <X className="size-3.5" />
                          <span className="sr-only">Quitar</span>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center py-8 text-center text-muted-foreground">
                      <Wrench className="mb-2 size-8 stroke-[1.5] text-muted-foreground/40" />
                      <p className="text-sm font-medium">No hay herramientas seleccionadas</p>
                      <p className="mt-1 max-w-[200px] text-[12px] text-muted-foreground/70">
                        Selecciona las casillas a la izquierda para agregarlas a este préstamo.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
              Pedir devolución e intercambiar
            </DialogTitle>
            <DialogDescription className="text-sm">
              Esta herramienta actualmente la tiene{" "}
              <strong className="text-foreground">{exchangeTarget?.mechanicName}</strong>.
              <br />
              Al confirmar, se registrará la devolución de{" "}
              <strong className="text-foreground">{exchangeTarget?.mechanicName}</strong> y quedará seleccionada automáticamente en este nuevo préstamo para{" "}
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
              variant="warning"
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
