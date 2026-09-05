import { useCallback, useEffect, useMemo, useState } from "react"
import { Eye, PackageSearch, Plus, RotateCcw, Search } from "lucide-react"

import { ModalAgregarPrestamo } from "@/components/modal/ModalAgregarPrestamo"
import { ModalBuscarHerramientaGeneral } from "@/components/modal/ModalBuscarHerramientaGeneral"
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
  devolverMultiplesDetalles,
  devolverTodasAbsoluto,
  estiloTarjetaMecanico,
  intercambiarPrestamos,
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

  const [isGeneralToolsOpen, setIsGeneralToolsOpen] = useState(false)
  const [generalTools, setGeneralTools] = useState<HerramientaGeneral[]>([])
  const [isLoadingGeneral, setIsLoadingGeneral] = useState(false)
  const [generalError, setGeneralError] = useState("")

  const [viewMechanicId, setViewMechanicId] = useState<string | null>(null)
  const [viewLoans, setViewLoans] = useState<DetallePrestamoActivo[]>([])
  const [isLoadingView, setIsLoadingView] = useState(false)
  const [viewError, setViewError] = useState("")
  const [isSavingReturns, setIsSavingReturns] = useState(false)
  const [isConfirmingReturnAllGlobal, setIsConfirmingReturnAllGlobal] = useState(false)
  const [isReturningAllGlobal, setIsReturningAllGlobal] = useState(false)

  const [addMechanicId, setAddMechanicId] = useState<string | null>(null)
  const [availableUnits, setAvailableUnits] = useState<UnidadPrestamo[]>([])
  const [loansInUse, setLoansInUse] = useState<PrestamoEnUso[]>([])
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

    // Precarga en segundo plano para que la apertura de modales sea instantánea
    void Promise.all([
      listarUnidadesDisponibles(),
      listarCombinadasActivas(),
      listarHerramientasEnUso(),
      listarHerramientasGeneral(),
    ])
      .then(([unidades, combinadasActivas, enUso, general]) => {
        if (cancelled) return
        setAvailableUnits(unidades)
        setCombinadas(combinadasActivas)
        setLoansInUse(enUso)
        setGeneralTools(general)
      })
      .catch(() => {
        // Si falla la precarga silenciosa, los modales la solicitarán al abrir
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

    // Si no tenemos unidades precargadas, mostramos el estado de carga
    if (availableUnits.length === 0 && loansInUse.length === 0) {
      setIsLoadingUnits(true)
    }

    try {
      const [unidades, combinadasActivas, enUso] = await Promise.all([
        listarUnidadesDisponibles(),
        listarCombinadasActivas(),
        listarHerramientasEnUso(),
      ])
      setAvailableUnits(unidades)
      setCombinadas(combinadasActivas)
      setLoansInUse(enUso.filter((l) => l.mechanicId !== mecanicoId))
    } catch (error) {
      setAddError(
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar las unidades disponibles.",
      )
    } finally {
      setIsLoadingUnits(false)
    }
  }

  const openGeneralTools = async () => {
    setIsGeneralToolsOpen(true)
    setGeneralError("")

    if (generalTools.length === 0) {
      setIsLoadingGeneral(true)
    }

    try {
      setGeneralTools(await listarHerramientasGeneral())
    } catch (error) {
      setGeneralError(
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar las herramientas.",
      )
    } finally {
      setIsLoadingGeneral(false)
    }
  }

  const refreshAfterChange = async () => {
    const promises: Promise<unknown>[] = [
      loadMecanicos(),
      listarUnidadesDisponibles().then((u) => setAvailableUnits(u)),
      listarCombinadasActivas().then((c) => setCombinadas(c)),
      listarHerramientasEnUso().then((enUso) => {
        setLoansInUse(enUso)
      }),
    ]

    if (viewMechanicId) {
      promises.push(loadViewLoans(viewMechanicId))
    }

    if (isGeneralToolsOpen) {
      promises.push(
        listarHerramientasGeneral().then((tools) => setGeneralTools(tools)),
      )
    }

    await Promise.all(promises)
  }

  const handleAddLoan = async (unidadIds: string[]) => {
    if (!addMechanicId || unidadIds.length === 0) return

    setIsSavingLoan(true)
    setAddError("")

    try {
      await crearPrestamo(addMechanicId, unidadIds)
      setAddMechanicId(null)
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

  const handleExchangeLoan = async (unidadId: string) => {
    if (!addMechanicId) return

    setAddError("")
    try {
      await intercambiarPrestamos(addMechanicId, [unidadId])
      setAddMechanicId(null)
      await refreshAfterChange()
      toastExito("Herramienta intercambiada correctamente.")
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.errors.unidades_ids?.[0]
            || error.errors.mecanico_destino_id?.[0]
            || error.message
          : "No se pudo realizar el intercambio de préstamos."
      setAddError(message)
      throw error
    }
  }

  const handleSaveReturns = async (
    detalleIds: string[],
    origen: "view" | "general" = "view",
  ) => {
    if (detalleIds.length === 0) return

    setIsSavingReturns(true)

    if (origen === "general") {
      setGeneralError("")
    } else {
      setViewError("")
    }

    try {
      await devolverMultiplesDetalles(detalleIds)
      await refreshAfterChange()
      toastExito(
        detalleIds.length === 1
          ? "La herramienta ha sido devuelta correctamente."
          : `Se han devuelto ${detalleIds.length} herramientas correctamente.`,
      )
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.errors.detalles_ids?.[0]
            || error.errors.detalle?.[0]
            || error.message
          : "No se pudieron registrar las devoluciones."

      if (origen === "general") {
        setGeneralError(message)
      } else {
        setViewError(message)
      }
      throw error
    } finally {
      setIsSavingReturns(false)
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
              size="lg"
              variant="outline"
              className="sm:shrink-0"
              onClick={() => void openGeneralTools()}
            >
              <PackageSearch data-icon="inline-start" />
              Buscar Herramientas
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

      <ModalBuscarHerramientaGeneral
        open={isGeneralToolsOpen}
        tools={generalTools}
        isLoading={isLoadingGeneral}
        isSavingReturns={isSavingReturns}
        error={generalError}
        onOpenChange={(open) => {
          setIsGeneralToolsOpen(open)
          if (!open) {
            setGeneralError("")
          }
        }}
        onDismissError={() => setGeneralError("")}
        onSaveReturns={(detalleIds) => handleSaveReturns(detalleIds, "general")}
      />

      <ModalVerPrestamos
        open={viewMechanicId !== null}
        mechanic={viewMechanic}
        loans={viewLoans}
        isLoading={isLoadingView}
        isSavingReturns={isSavingReturns}
        error={viewError}
        canAdd={viewMechanic?.estado === MECANICO_ACTIVO}
        onDismissError={() => setViewError("")}
        onOpenChange={(open) => {
          if (!open) {
            setViewMechanicId(null)
            setViewError("")
          }
        }}
        onAddTool={() => {
          if (viewMechanicId) void openAddLoan(viewMechanicId)
        }}
        onSaveReturns={(detalleIds) => handleSaveReturns(detalleIds, "view")}
      />

      <ModalAgregarPrestamo
        open={addMechanicId !== null}
        mechanic={addMechanic}
        availableUnits={availableUnits}
        loansInUse={loansInUse}
        combinadas={combinadas}
        isLoading={isLoadingUnits}
        isSubmitting={isSavingLoan}
        error={addError}
        onOpenChange={(open) => {
          if (!open && isSavingLoan) return
          if (!open) {
            setAddMechanicId(null)
            setAddError("")
          }
        }}
        onSubmit={(unidadIds) => {
          void handleAddLoan(unidadIds)
        }}
        onExchange={handleExchangeLoan}
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
