import { useCallback, useEffect, useMemo, useState } from "react"
import { Eye, Plus, Search, Wrench } from "lucide-react"

import { ModalAgregarPrestamo } from "@/components/modal/ModalAgregarPrestamo"
import { ModalBuscarHerramientaEnUso } from "@/components/modal/ModalBuscarHerramientaEnUso"
import { ModalVerPrestamos } from "@/components/modal/ModalVerPrestamos"
import { AlertError } from "@/components/ui/alert-error"
import { PagePreloader } from "@/components/ui/page-preloader"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api"
import { getInicialesMecanico } from "@/lib/mecanicos"
import {
  crearPrestamo,
  devolverTodasDeMecanico,
  devolverUnidad,
  estiloTarjetaMecanico,
  listarHerramientasEnUso,
  listarPrestamosDeMecanico,
  listarPuntoPrestamos,
  listarUnidadesDisponibles,
  type DetallePrestamoActivo,
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

  const [viewMechanicId, setViewMechanicId] = useState<string | null>(null)
  const [viewLoans, setViewLoans] = useState<DetallePrestamoActivo[]>([])
  const [isLoadingView, setIsLoadingView] = useState(false)
  const [viewError, setViewError] = useState("")
  const [returningId, setReturningId] = useState<string | null>(null)
  const [isReturningAll, setIsReturningAll] = useState(false)

  const [addMechanicId, setAddMechanicId] = useState<string | null>(null)
  const [availableUnits, setAvailableUnits] = useState<UnidadPrestamo[]>([])
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
      setAvailableUnits(await listarUnidadesDisponibles())
    } catch (error) {
      setAddError(
        error instanceof ApiError
          ? error.message
          : "No se pudieron cargar las unidades disponibles.",
      )
      setAvailableUnits([])
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

  const refreshAfterChange = async () => {
    await loadMecanicos()

    if (viewMechanicId) {
      await loadViewLoans(viewMechanicId)
    }

    if (isUsedToolsOpen) {
      setUsedTools(await listarHerramientasEnUso())
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
    origen: "view" | "used" = "view",
  ) => {
    setReturningId(detalleId)

    if (origen === "used") {
      setUsedError("")
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
      await refreshAfterChange()
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <label htmlFor="mechanic-search" className="sr-only">
              Buscar mecánico
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="mechanic-search"
              className="h-9 pl-9"
              placeholder="Buscar mecánico por nombre..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="lg"
            className="sm:shrink-0"
            onClick={() => void openUsedTools()}
          >
            <Wrench data-icon="inline-start" />
            Buscar herramienta en uso
          </Button>
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
                  <CardHeader>
                    {mechanic.imagen ? (
                      <img
                        src={mechanic.imagen}
                        alt=""
                        className="size-11 rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        className={`flex size-11 items-center justify-center rounded-xl text-sm font-semibold ${estilo.badge}`}
                      >
                        {getInicialesMecanico(mechanic)}
                      </div>
                    )}
                    <CardAction>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        {activeLoans}{" "}
                        {activeLoans === 1
                          ? "Préstamo"
                          : "Préstamos"}
                      </span>
                    </CardAction>
                  </CardHeader>

                  <CardContent className="min-h-[4.75rem] space-y-1">
                    <CardTitle className="line-clamp-1">
                      {mechanic.nombre_completo}
                    </CardTitle>
                    <p className="h-5 truncate text-sm font-medium">
                      {mechanic.apodo ? `“${mechanic.apodo}”` : "\u00a0"}
                    </p>
                    <CardDescription className="line-clamp-1">
                      {mechanic.cargo}
                    </CardDescription>
                  </CardContent>

                  <CardFooter className="mt-auto grid grid-cols-2 gap-2">
                    <Button
                      className="h8"
                      variant="outline"
                      disabled={!puedePrestar}
                      onClick={() => void openAddLoan(mechanic.id)}
                    >
                      <Plus data-icon="inline-start" />
                      Nuevo préstamo
                    </Button>
                    <Button
                      className="h-8"
                      variant="outline"
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
        isLoading={isLoadingUnits}
        isSubmitting={isSavingLoan}
        error={addError}
        onOpenChange={(open) => {
          if (!open && isSavingLoan) return
          if (!open) {
            setAddMechanicId(null)
            setAvailableUnits([])
            setAddError("")
          }
        }}
        onSubmit={(unidadIds) => {
          void handleAddLoan(unidadIds)
        }}
      />
    </div>
  )
}
