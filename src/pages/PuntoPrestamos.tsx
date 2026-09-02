import { useCallback, useEffect, useMemo, useState } from "react"
import { Eye, PackageSearch, Plus, RotateCcw, Search, Wrench } from "lucide-react"

import { ModalAgregarPrestamo } from "@/components/modal/ModalAgregarPrestamo"
import { ModalBuscarHerramientaGeneral } from "@/components/modal/ModalBuscarHerramientaGeneral"
import { ModalBuscarHerramientaEnUso } from "@/components/modal/ModalBuscarHerramientaEnUso"
import { ModalVerPrestamos } from "@/components/modal/ModalVerPrestamos"
import { AlertError } from "@/components/ui/alert-error"
import { PagePreloader } from "@/components/ui/page-preloader"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api"
import { listarCombinadasActivas, type Combinada } from "@/lib/combinadas"
import { getInicialesMecanico, optimizarImagenMecanico } from "@/lib/mecanicos"
import { toastExito } from "@/lib/toast"
import {
  crearPrestamo,
  devolverTodasAbsoluto,
  devolverTodasDeMecanico,
  devolverUnidad,
  estiloTarjetaMecanico,
  listarHerramientasGeneral,
  listarHerramientasEnUso,
  listarPrestamosDeMecanico,
  listarPuntoPrestamos,
  listarUnidadesDisponibles,
  type DetallePrestamoActivo,
  type HerramientaGeneral,
  type MecanicoPunto,
  type PrestamoEnUso,
  type UnidadPrestamo,
} from "@/lib/prestamos"

const MECANICO_ACTIVO = 1

export const PuntoPrestamos = () => {
  const [search, setSearch] = useState("")
  const [mecanicos, setMecanicos] = useState<MecanicoPunto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState("")

  const [isUsedToolsOpen, setIsUsedToolsOpen] = useState(false)
  const [usedTools, setUsedTools] = useState<PrestamoEnUso[]>([])
  const [isLoadingUsed, setIsLoadingUsed] = useState(false)
  const [usedError, setUsedError] = useState("")

  const [isGeneralToolsOpen, setIsGeneralToolsOpen] = useState(false)
  const [generalTools, setGeneralTools] = useState<HerramientaGeneral[]>([])
  const [isLoadingGeneral, setIsLoadingGeneral] = useState(false)
  const [generalError, setGeneralError] = useState("")

  const [viewMechanicId, setViewMechanicId] = useState<string | null>(null)
  const [viewLoans, setViewLoans] = useState<DetallePrestamoActivo[]>([])
  const [isLoadingView, setIsLoadingView] = useState(false)
  const [viewError, setViewError] = useState("")
  const [returningId, setReturningId] = useState<string | null>(null)
  const [isReturningAll, setIsReturningAll] = useState(false)
  const [isConfirmingReturnAllGlobal, setIsConfirmingReturnAllGlobal] = useState(false)
  const [isReturningAllGlobal, setIsReturningAllGlobal] = useState(false)

  const [addMechanicId, setAddMechanicId] = useState<string | null>(null)
  const [availableUnits, setAvailableUnits] = useState<UnidadPrestamo[]>([])
  const [combinadas, setCombinadas] = useState<Combinada[]>([])
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)
  const [isSavingLoan, setIsSavingLoan] = useState(false)
  const [addError, setAddError] = useState("")

  const loadMecanicos = useCallback(async () => {
    const data = await listarPuntoPrestamos()
    setMecanicos(data)
  }, [])

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setPageError("")

    loadMecanicos()
      .catch((error) => {
        if (cancelled) return
        setPageError(
          error instanceof ApiError
            ? error.message
            : "No se pudo cargar el punto de préstamos.",
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [loadMecanicos])

  const filteredMechanics = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()

    if (!query) return mecanicos

    return mecanicos.filter((mecanico) =>
      `${mecanico.nombre_completo} ${mecanico.apodo ?? ""} ${mecanico.cargo}`
        .toLocaleLowerCase()
        .includes(query),
    )
  }, [mecanicos, search])

  const totalPrestamosActivos = useMemo(
    () => mecanicos.reduce((acc, m) => acc + Number(m.prestamos_activos ?? 0), 0),
    [mecanicos],
  )

  const viewMechanic = mecanicos.find((mecanico) => mecanico.id === viewMechanicId) ?? null
  const addMechanic = mecanicos.find((mecanico) => mecanico.id === addMechanicId) ?? null

  const loadViewLoans = useCallback(async (mecanicoId: string) => {
    setIsLoadingView(true)
    setViewError("")

    try {
      setViewLoans(await listarPrestamosDeMecanico(mecanicoId))
    } catch (error) {
      setViewError(
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar los préstamos.",
      )
    } finally {
      setIsLoadingView(false)
    }
  }, [])

  const openViewLoans = (mecanicoId: string) => {
    setViewMechanicId(mecanicoId)
    void loadViewLoans(mecanicoId)
  }

  const openAddLoan = async (mecanicoId: string) => {
    setAddMechanicId(mecanicoId)
    setAddError("")
    setIsLoadingUnits(true)

    try {
      const [unidades, combinadasActivas] = await Promise.all([
        listarUnidadesDisponibles(),
        listarCombinadasActivas(),
      ])
      setAvailableUnits(unidades)
      setCombinadas(combinadasActivas)
    } catch (error) {
      setAddError(
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar las unidades disponibles.",
      )
      setAvailableUnits([])
      setCombinadas([])
    } finally {
      setIsLoadingUnits(false)
    }
  }

  const openUsedTools = async () => {
    setIsUsedToolsOpen(true)
    setIsLoadingUsed(true)
    setUsedError("")

    try {
      setUsedTools(await listarHerramientasEnUso())
    } catch (error) {
      setUsedError(
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar las herramientas en uso.",
      )
      setUsedTools([])
    } finally {
      setIsLoadingUsed(false)
    }
  }

  const openGeneralTools = async () => {
    setIsGeneralToolsOpen(true)
    setIsLoadingGeneral(true)
    setGeneralError("")

    try {
      setGeneralTools(await listarHerramientasGeneral())
    } catch (error) {
      setGeneralError(
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar las herramientas.",
      )
      setGeneralTools([])
    } finally {
      setIsLoadingGeneral(false)
    }
  }

  const refreshAfterChange = async () => {
    await loadMecanicos()

    if (viewMechanicId) {
      await loadViewLoans(viewMechanicId)
    }

    if (isUsedToolsOpen) {
      setUsedTools(await listarHerramientasEnUso())
    }

    if (isGeneralToolsOpen) {
      setGeneralTools(await listarHerramientasGeneral())
    }
  }

  const handleAddLoan = async (unidadIds: string[]) => {
    if (!addMechanicId || unidadIds.length === 0) return

    setIsSavingLoan(true)
    setAddError("")

    try {
      await crearPrestamo(addMechanicId, unidadIds)
      setAddMechanicId(null)
      setAvailableUnits([])
      await refreshAfterChange()
    } catch (error) {
      setAddError(
        error instanceof ApiError
          ? error.errors.unidades_ids?.[0]
          || error.errors.mecanico_id?.[0]
          || error.message
          : "No se pudo registrar el préstamo.",
      )
    } finally {
      setIsSavingLoan(false)
    }
  }

  const handleReturnTool = async (
    detalleId: string,
    origen: "view" | "used" | "general" = "view",
  ) => {
    setReturningId(detalleId)

    if (origen === "used") {
      setUsedError("")
    } else if (origen === "general") {
      setGeneralError("")
    } else {
      setViewError("")
    }

    try {
      await devolverUnidad(detalleId)
      await refreshAfterChange()
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.errors.detalle?.[0] || error.message
          : "No se pudo devolver la unidad."

      if (origen === "used") {
        setUsedError(message)
      } else if (origen === "general") {
        setGeneralError(message)
      } else {
        setViewError(message)
      }
    } finally {
      setReturningId(null)
    }
  }

  const handleReturnAll = async () => {
    if (!viewMechanicId) return

    setIsReturningAll(true)
    setViewError("")

    try {
      await devolverTodasDeMecanico(viewMechanicId)
      setViewMechanicId(null)
      setViewLoans([])
      await refreshAfterChange()
      toastExito("Todas las herramientas del mecánico han sido devueltas correctamente.")
    } catch (error) {
      setViewError(
        error instanceof ApiError
          ? error.errors.mecanico?.[0] || error.message
          : "No se pudieron devolver las unidades.",
      )
    } finally {
      setIsReturningAll(false)
    }
  }

  const handleReturnAllGlobal = async () => {
    setIsReturningAllGlobal(true)
    setPageError("")

    try {
      await devolverTodasAbsoluto()
      setIsConfirmingReturnAllGlobal(false)
      await refreshAfterChange()
      toastExito("Todas las herramientas prestadas han sido devueltas correctamente.")
    } catch (error) {
      setPageError(
        error instanceof ApiError
          ? error.message
          : "No se pudieron devolver las herramientas.",
      )
    } finally {
      setIsReturningAllGlobal(false)
    }
  }

  if (isLoading) {
    return <PagePreloader recurso="todos los mecánicos" />
  }

  return (
    <div className="w-full space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Punto de Préstamos
        </h1>
        <p className="text-sm text-muted-foreground">
          Registra y consulta las unidades que tiene cada mecánico.
        </p>
      </section>

      <section className="space-y-4">
        {pageError ? (
          <AlertError onClose={() => setPageError("")}>{pageError}</AlertError>
        ) : null}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[25rem] lg:w-[25rem] shrink-0">
              <label htmlFor="mechanic-search" className="sr-only">
                Buscar mecánico
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="mechanic-search"
                className="h-10 w-full pl-9 pr-4 text-base"
                placeholder="Buscar mecánico por nombre, apodo o cargo..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium self-start sm:self-center shrink-0">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {totalPrestamosActivos}{" "}
              {totalPrestamosActivos === 1
                ? "Préstamo en Total"
                : "Préstamos en Total"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap shrink-0">
            <Button
              variant="info"
              size="lg"
              className="sm:shrink-0"
              onClick={() => void openUsedTools()}
            >
              <Wrench data-icon="inline-start" />
              Buscar en uso
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="sm:shrink-0"
              onClick={() => void openGeneralTools()}
            >
              <PackageSearch data-icon="inline-start" />
              Buscar todas
            </Button>

            <Button
              size="lg"
              variant="destructive"
              className="sm:shrink-0"
              disabled={totalPrestamosActivos === 0 || isReturningAllGlobal}
              onClick={() => setIsConfirmingReturnAllGlobal(true)}
            >
              <RotateCcw data-icon="inline-start" />
              {isReturningAllGlobal ? "Devolviendo..." : "Devolver todas"}
            </Button>
          </div>
        </div>

        {filteredMechanics.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredMechanics.map((mechanic, index) => {
              const activeLoans = Number(mechanic.prestamos_activos ?? 0)
              const estilo = estiloTarjetaMecanico(mechanic.color, index)
              const puedePrestar = mechanic.estado === MECANICO_ACTIVO

              return (
                <Card
                  key={mechanic.id}
                  className={`h-full border-t-4 transition-shadow hover:shadow-md ${estilo.accent}`}
                >
                  <CardContent className="flex min-h-[4.75rem] items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-3">
                      <CardTitle className="line-clamp-1">
                        {mechanic.nombre_completo}
                      </CardTitle>

                      <p className="h-5 truncate text-sm font-medium">
                        {mechanic.apodo ? `“${mechanic.apodo}”` : "\u00a0"}
                      </p>

                      <CardDescription className="line-clamp-1">
                        {mechanic.cargo}
                      </CardDescription>
                    </div>
                    <div className="flex-col">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium mb-3 relative right-2 ">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        {activeLoans}{" "}
                        {activeLoans === 1
                          ? "Préstamo"
                          : "Préstamos"}
                      </span>

                      {mechanic.imagen ? (
                        <img
                          src={optimizarImagenMecanico(mechanic.imagen, 400, 400)}
                          alt={mechanic.nombre_completo}
                          className="size-20 shrink-0 rounded-xl object-cover shadow-xs border border-border/40"
                          loading="eager"
                          decoding="async"
                        />
                      ) : (
                        <div
                          className={`flex size-20 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${estilo.badge}`}
                        >
                          {getInicialesMecanico(mechanic)}
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="mt-auto grid grid-cols-2 gap-2">
                    <Button
                      className="h-8"
                      variant="success"
                      disabled={!puedePrestar}
                      onClick={() => void openAddLoan(mechanic.id)}
                    >
                      <Plus data-icon="inline-start" />
                      Nuevo préstamo
                    </Button>
                    <Button
                      className="h-8"
                      variant="info"
                      onClick={() => openViewLoans(mechanic.id)}
                    >
                      <Eye data-icon="inline-start" />
                      Ver préstamos
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <CardTitle>No se encontraron mecánicos</CardTitle>
              <CardDescription className="mt-1">
                {search.trim()
                  ? "Intenta realizar la búsqueda con otro nombre."
                  : "Registra mecánicos activos para comenzar a prestar unidades."}
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </section>

      <ModalBuscarHerramientaEnUso
        open={isUsedToolsOpen}
        usedTools={usedTools}
        isLoading={isLoadingUsed}
        returningId={returningId}
        error={usedError}
        onOpenChange={setIsUsedToolsOpen}
        onDismissError={() => setUsedError("")}
        onReturnTool={(detalleId) => {
          void handleReturnTool(detalleId, "used")
        }}
      />

      <ModalBuscarHerramientaGeneral
        open={isGeneralToolsOpen}
        tools={generalTools}
        isLoading={isLoadingGeneral}
        returningId={returningId}
        error={generalError}
        onOpenChange={setIsGeneralToolsOpen}
        onDismissError={() => setGeneralError("")}
        onReturnTool={(detalleId) => {
          void handleReturnTool(detalleId, "general")
        }}
      />

      <ModalVerPrestamos
        open={viewMechanicId !== null}
        mechanic={viewMechanic}
        loans={viewLoans}
        isLoading={isLoadingView}
        returningId={returningId}
        isReturningAll={isReturningAll}
        error={viewError}
        canAdd={viewMechanic?.estado === MECANICO_ACTIVO}
        onDismissError={() => setViewError("")}
        onOpenChange={(open) => {
          if (!open) setViewMechanicId(null)
        }}
        onAddTool={() => {
          if (viewMechanicId) void openAddLoan(viewMechanicId)
        }}
        onReturnTool={(detalleId) => {
          void handleReturnTool(detalleId)
        }}
        onReturnAll={() => {
          void handleReturnAll()
        }}
      />

      <ModalAgregarPrestamo
        open={addMechanicId !== null}
        mechanic={addMechanic}
        availableUnits={availableUnits}
        combinadas={combinadas}
        isLoading={isLoadingUnits}
        isSubmitting={isSavingLoan}
        error={addError}
        onOpenChange={(open) => {
          if (!open && isSavingLoan) return
          if (!open) {
            setAddMechanicId(null)
            setAvailableUnits([])
            setCombinadas([])
            setAddError("")
          }
        }}
        onSubmit={(unidadIds) => {
          void handleAddLoan(unidadIds)
        }}
      />

      {/* Modal de confirmación para Devolver Todas en general */}
      <Dialog
        open={isConfirmingReturnAllGlobal}
        onOpenChange={(open) => {
          if (isReturningAllGlobal) return
          setIsConfirmingReturnAllGlobal(open)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Devolver TODAS las herramientas prestadas?</DialogTitle>
            <DialogDescription>
              Se registrará la devolución masiva de las{" "}
              <span className="font-semibold text-foreground">
                {totalPrestamosActivos}{" "}
                {totalPrestamosActivos === 1
                  ? "herramienta activa"
                  : "herramientas activas"}
              </span>{" "}
              de todos los mecánicos. Todas las unidades volverán a estar disponibles inmediatamente en el inventario del almacén.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isReturningAllGlobal}
              onClick={() => setIsConfirmingReturnAllGlobal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isReturningAllGlobal}
              onClick={() => void handleReturnAllGlobal()}
            >
              <RotateCcw data-icon="inline-start" />
              {isReturningAllGlobal ? "Devolviendo todo..." : "Devolver todas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
