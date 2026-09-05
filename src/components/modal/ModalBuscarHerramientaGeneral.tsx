import { memo, useCallback, useEffect, useDeferredValue, useMemo, useState } from "react"
import {
  Check,
  CircleCheck,
  PackageSearch,
  RotateCcw,
  Search,
  Undo2,
  UserRound,
  Wrench,
  X,
} from "lucide-react"

import { ComboboxFiltro } from "@/components/form/combobox-filtro"
import { DetalleUnidadPrestamo } from "@/components/prestamos/detalle-unidad-prestamo"
import { AlertError } from "@/components/ui/alert-error"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useClosingSnapshot } from "@/hooks/use-closing-snapshot"
import { etiquetaColorUnidad } from "@/lib/herramientas"
import {
  compararPorBusquedaCorta,
  FILTROS_UNIDAD_VACIOS,
  filtrosUnidadVacios,
  formatBorrowedAt,
  marcaUnidad,
  opcionesFiltroUnicas,
  unidadCoincideFiltros,
  type FiltrosUnidadPrestamo,
  type HerramientaGeneral,
} from "@/lib/prestamos"

type ModalBuscarHerramientaGeneralProps = {
  open: boolean
  tools: HerramientaGeneral[]
  isLoading?: boolean
  isSavingReturns?: boolean
  error?: string
  onOpenChange: (open: boolean) => void
  onDismissError?: () => void
  onSaveReturns: (detalleIds: string[]) => Promise<void>
}

// Fila memoizada para cada herramienta
const HerramientaGeneralRow = memo(function HerramientaGeneralRow({
  item,
  isPending,
  isSavingReturns,
  onToggleStage,
}: {
  item: HerramientaGeneral
  isPending: boolean
  isSavingReturns: boolean
  onToggleStage: (detalleId: string) => void
}) {
  const estaEnUso = item.estado === "en_uso"

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
        isPending
          ? "border-amber-500/50 bg-amber-500/[0.07] dark:bg-amber-500/[0.12]"
          : "border-border"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Wrench className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{item.nombre}</p>
            <span
              className={
                estaEnUso
                  ? "rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300"
                  : "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
              }
            >
              {estaEnUso ? "En uso" : "Disponible"}
            </span>
            {isPending ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <RotateCcw className="size-3" />
                Marcada para devolver
              </span>
            ) : null}
          </div>
          <DetalleUnidadPrestamo
            unidad={item.unidad}
            className="text-xs"
          />
          {estaEnUso && item.borrowedAt ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              Prestada {formatBorrowedAt(item.borrowedAt)}
            </p>
          ) : null}
        </div>
      </div>

      {estaEnUso ? (
        <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
            <UserRound className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">
                En préstamo con
              </p>
              <p className="text-sm font-medium">{item.mechanicName}</p>
            </div>
          </div>

          {isPending ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-amber-500/40 text-amber-700 hover:bg-amber-500/15 hover:text-amber-800 dark:border-amber-400/40 dark:text-amber-300"
              disabled={isSavingReturns}
              onClick={() => item.detalleId && onToggleStage(item.detalleId)}
            >
              <Undo2 data-icon="inline-start" className="size-3.5" />
              Cancelar Devolución
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isSavingReturns}
              onClick={() => item.detalleId && onToggleStage(item.detalleId)}
            >
              <RotateCcw data-icon="inline-start" className="size-3.5" />
              Devolver
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-300">
          <CircleCheck className="size-4" />
          <span className="text-sm font-medium">En almacén</span>
        </div>
      )}
    </div>
  )
})

export function ModalBuscarHerramientaGeneral({
  open,
  tools,
  isLoading = false,
  isSavingReturns = false,
  error = "",
  onOpenChange,
  onDismissError,
  onSaveReturns,
}: ModalBuscarHerramientaGeneralProps) {
  const [activeTab, setActiveTab] = useState<"todas" | "en_uso">("en_uso")
  const [search, setSearch] = useState("")
  const [filtros, setFiltros] = useState<FiltrosUnidadPrestamo>(FILTROS_UNIDAD_VACIOS)
  const [pendingReturnIds, setPendingReturnIds] = useState<string[]>([])

  const deferredSearch = useDeferredValue(search)
  const deferredFiltros = useDeferredValue(filtros)

  // Congelar herramientas y estados visuales durante la animación de cierre
  const displayedTools = useClosingSnapshot(open, tools)
  const displayedLoading = useClosingSnapshot(open, isLoading)
  const displayedError = useClosingSnapshot(open, error)

  useEffect(() => {
    if (open) {
      setSearch("")
      setFiltros(FILTROS_UNIDAD_VACIOS)
      setActiveTab("en_uso")
      setPendingReturnIds([])
    }
  }, [open])

  useEffect(() => {
    setPendingReturnIds((prev) =>
      prev.filter((id) =>
        tools.some((t) => t.estado === "en_uso" && t.detalleId === id),
      ),
    )
  }, [tools])

  const usedToolsCount = useMemo(() => {
    return displayedTools.filter((t) => t.estado === "en_uso").length
  }, [displayedTools])

  // Opciones únicas para las sugerencias de los comboboxes
  const opcionesColor = useMemo(
    () =>
      opcionesFiltroUnicas(
        displayedTools.flatMap((t) => [
          t.unidad?.color_primario ? etiquetaColorUnidad(t.unidad.color_primario) : null,
          t.unidad?.color_secundario ? etiquetaColorUnidad(t.unidad.color_secundario) : null,
        ]),
      ),
    [displayedTools],
  )

  const opcionesColor2 = useMemo(
    () =>
      opcionesColor.filter(
        (c) => c.toLowerCase() !== filtros.color1.trim().toLowerCase(),
      ),
    [opcionesColor, filtros.color1],
  )

  const opcionesMarca = useMemo(
    () => opcionesFiltroUnicas(displayedTools.map((t) => (t.unidad ? marcaUnidad(t.unidad) : null))),
    [displayedTools],
  )

  const opcionesTamano = useMemo(
    () => opcionesFiltroUnicas(displayedTools.map((t) => t.unidad?.tamano)),
    [displayedTools],
  )

  const opcionesUbicacion = useMemo(
    () => opcionesFiltroUnicas(displayedTools.map((t) => t.unidad?.ubicacion?.nombre)),
    [displayedTools],
  )

  const filteredTools = useMemo(() => {
    const query = deferredSearch.trim().toLocaleLowerCase("es")
    const baseList =
      activeTab === "en_uso"
        ? displayedTools.filter((t) => t.estado === "en_uso")
        : displayedTools

    return baseList
      .filter((item) => {
        // Filtrar por comboboxes (color1, color2, marca, tamaño, ubicación)
        if (!filtrosUnidadVacios(deferredFiltros)) {
          if (!unidadCoincideFiltros(item.unidad, deferredFiltros)) {
            return false
          }
        }

        // Búsqueda por texto libre
        if (query) {
          const matchText = [
            item.nombre,
            item.detalle,
            item.mechanicName,
            item.mechanicArea,
            item.estado === "en_uso" ? "en uso prestada" : "disponible",
            item.unidad?.observaciones,
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase("es")
            .includes(query)

          if (!matchText) return false
        }

        return true
      })
      .sort((a, b) => {
        if (query) {
          return compararPorBusquedaCorta(a.nombre, b.nombre, query)
        }
        return 0
      })
  }, [activeTab, displayedTools, deferredSearch, deferredFiltros])

  const disabledGeneral = displayedLoading || isSavingReturns
  const disabledColor2 = disabledGeneral || !filtros.color1.trim()

  const handleToggleStage = useCallback((detalleId: string) => {
    setPendingReturnIds((prev) =>
      prev.includes(detalleId)
        ? prev.filter((id) => id !== detalleId)
        : [...prev, detalleId],
    )
  }, [])

  const handleSave = async () => {
    if (pendingReturnIds.length === 0) return
    try {
      await onSaveReturns(pendingReturnIds)
      setPendingReturnIds([])
      onOpenChange(false)
    } catch {
      // Se preservan los IDs si falla
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="flex h-[min(95vh,52rem)] w-[min(96vw,80rem)] max-w-none flex-col gap-4 overflow-hidden p-5 sm:max-w-none">
        <DialogHeader>
          <DialogTitle className="pr-8 text-lg">
            Buscar Herramientas
          </DialogTitle>
        </DialogHeader>

        {displayedError ? (
          <AlertError onClose={() => onDismissError?.()}>{displayedError}</AlertError>
        ) : null}

        {/* Pestañas: 1ro "Herramientas en Uso", 2do "Todas las herramientas" */}
        <div className="flex flex-wrap gap-1 rounded-lg bg-muted/70 p-1 text-sm font-medium">
          <button
            type="button"
            className={`flex items-center gap-2 rounded-md cursor-pointer px-3.5 py-1.5 transition-all ${
              activeTab === "en_uso"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("en_uso")}
          >
            <Wrench className="size-4 text-amber-600 dark:text-amber-400" />
            <span>Herramientas en Uso</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold">
              {usedToolsCount}
            </span>
          </button>

          <button
            type="button"
            className={`flex items-center gap-2 rounded-md cursor-pointer px-3.5 py-1.5 transition-all ${
              activeTab === "todas"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("todas")}
          >
            <PackageSearch className="size-4" />
            <span>Todas las herramientas</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold">
              {displayedTools.length}
            </span>
          </button>
        </div>

        {/* Buscador principal y Comboboxes de filtros secundarios */}
        <div className="space-y-3">
          {/* Buscador principal - 100% de ancho */}
          <div className="relative w-full">
            <label htmlFor="tools-search-input" className="sr-only">
              Buscar herramientas
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="tools-search-input"
              className="h-10 pr-9 pl-9 text-base"
              placeholder={
                activeTab === "en_uso"
                  ? "Escribe aquí para buscar en herramientas en uso por herramienta, mecánico o área..."
                  : "Escribe aquí para buscar por herramienta, mecánico, marca o ubicación..."
              }
              value={search}
              disabled={disabledGeneral}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search ? (
              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setSearch("")}
                aria-label="Limpiar búsqueda"
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

        {/* Barra informativa con Botón Limpiar Buscadores */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-y py-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="font-medium">
              {activeTab === "en_uso" ? "Herramientas en uso" : "Inventario general"}
            </span>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="h-7 text-xs"
              disabled={
                disabledGeneral ||
                (!search.trim() && filtrosUnidadVacios(filtros))
              }
              onClick={() => {
                setSearch("")
                setFiltros(FILTROS_UNIDAD_VACIOS)
              }}
            >
              <RotateCcw data-icon="inline-start" className="size-3" />
              Limpiar Buscadores
            </Button>
          </div>
          <span className="text-muted-foreground text-xs">
            {search.trim() || !filtrosUnidadVacios(filtros) ? (
              <>
                {filteredTools.length} de{" "}
                {activeTab === "en_uso" ? usedToolsCount : displayedTools.length}{" "}
                unidades encontradas
              </>
            ) : (
              <>
                {filteredTools.length}{" "}
                {activeTab === "en_uso" ? "unidades en préstamo" : "unidades en almacén"}
              </>
            )}
          </span>
        </div>

        {/* Listado de herramientas */}
        {displayedLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Cargando herramientas...
          </div>
        ) : filteredTools.length > 0 ? (
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {filteredTools.map((item) => (
              <HerramientaGeneralRow
                key={item.unidadId}
                item={item}
                isPending={Boolean(item.detalleId && pendingReturnIds.includes(item.detalleId))}
                isSavingReturns={isSavingReturns}
                onToggleStage={handleToggleStage}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center py-10">
            <PackageSearch className="mb-3 size-9 text-muted-foreground" />
            <p className="font-medium">No se encontró la herramienta</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeTab === "en_uso"
                ? "No hay herramientas prestadas que coincidan con los filtros aplicados."
                : "No hay herramientas que coincidan con los filtros aplicados."}
            </p>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="mt-auto flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {pendingReturnIds.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-medium text-foreground">
                  {pendingReturnIds.length}{" "}
                  {pendingReturnIds.length === 1
                    ? "devolución pendiente por guardar"
                    : "devoluciones pendientes por guardar"}
                </span>
              </div>
            ) : (
              <span>
                Presiona &ldquo;Devolver&rdquo; en las herramientas que quieras registrar como devueltas.
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSavingReturns}
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              variant="success"
              disabled={pendingReturnIds.length === 0 || isSavingReturns}
              onClick={() => void handleSave()}
            >
              <Check data-icon="inline-start" className="size-4" />
              {isSavingReturns
                ? "Guardando devoluciones..."
                : pendingReturnIds.length > 0
                  ? `Guardar Devoluciones (${pendingReturnIds.length})`
                  : "Guardar Devoluciones"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
