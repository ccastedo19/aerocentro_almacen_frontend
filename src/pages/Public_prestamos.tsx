import { useCallback, useEffect, useMemo, useState } from "react"
import { Search, Wrench } from "lucide-react"

import { ModalVerPrestamosPublico } from "@/components/modal/ModalVerPrestamosPublico"
import { AlertError } from "@/components/ui/alert-error"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PagePreloader } from "@/components/ui/page-preloader"
import { ApiError } from "@/lib/api"
import { getInicialesMecanico, optimizarImagenMecanico } from "@/lib/mecanicos"
import {
    estiloTarjetaMecanico,
    listarPrestamosDeMecanicoPublico,
    listarPuntoPrestamosPublico,
    type DetallePrestamoActivo,
    type MecanicoPunto,
} from "@/lib/prestamos"

// Intervalo de actualización en tiempo real (cada 5 segundos)
const REALTIME_POLLING_MS = 5000

export const Public_prestamos = () => {
    const [search, setSearch] = useState("")
    const [mecanicos, setMecanicos] = useState<MecanicoPunto[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [pageError, setPageError] = useState("")

    // Estado para ver préstamos en modal público (solo lectura)
    const [viewMechanicId, setViewMechanicId] = useState<string | null>(null)
    const [viewLoans, setViewLoans] = useState<DetallePrestamoActivo[]>([])
    const [isLoadingView, setIsLoadingView] = useState(false)
    const [viewError, setViewError] = useState("")

    // Carga inicial y silenciosa de la lista de mecánicos
    const loadMecanicos = useCallback(async (isSilent = false) => {
        if (!isSilent) setIsLoading(true)
        try {
            const data = await listarPuntoPrestamosPublico()
            setMecanicos(data)
        } catch (error) {
            if (!isSilent) {
                setPageError(
                    error instanceof ApiError
                        ? error.message
                        : "No se pudo cargar la consulta de préstamos.",
                )
            }
        } finally {
            if (!isSilent) setIsLoading(false)
        }
    }, [])

    // Carga silenciosa de los préstamos activos del mecánico abierto en modal
    const loadViewLoans = useCallback(async (mecanicoId: string, isSilent = false) => {
        if (!isSilent) setIsLoadingView(true)
        try {
            const data = await listarPrestamosDeMecanicoPublico(mecanicoId)
            setViewLoans(data)
        } catch (error) {
            if (!isSilent) {
                setViewError(
                    error instanceof ApiError
                        ? error.message
                        : "No se pudieron cargar los préstamos del mecánico.",
                )
            }
        } finally {
            if (!isSilent) setIsLoadingView(false)
        }
    }, [])

    // 1. Efecto inicial de carga
    useEffect(() => {
        void loadMecanicos(false)
    }, [loadMecanicos])

    // 2. Efecto de actualización en TIEMPO REAL (Polling automático cada 5 segundos)
    useEffect(() => {
        const timer = setInterval(() => {
            if (document.visibilityState === "visible") {
                void loadMecanicos(true)
                if (viewMechanicId) {
                    void loadViewLoans(viewMechanicId, true)
                }
            }
        }, REALTIME_POLLING_MS)

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void loadMecanicos(true)
                if (viewMechanicId) {
                    void loadViewLoans(viewMechanicId, true)
                }
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)

        return () => {
            clearInterval(timer)
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
    }, [loadMecanicos, loadViewLoans, viewMechanicId])

    // Abrir modal de préstamos
    const openViewLoans = (mecanicoId: string) => {
        setViewMechanicId(mecanicoId)
        void loadViewLoans(mecanicoId, false)
    }

    // Filtrado por buscador
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

    const viewMechanic = mecanicos.find((m) => m.id === viewMechanicId) ?? null

    if (isLoading) {
        return (
            <div className="dark bg-background text-foreground min-h-screen p-4 sm:p-6 lg:p-8">
                <PagePreloader recurso="consulta pública de préstamos" />
            </div>
        )
    }

    return (
        <div className="dark bg-background text-foreground min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            {/* Encabezado Principal */}
            <section className="mb-2 sm:mb-4 flex flex-col gap-3  sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-4">
                        <h1 className="text-base sm:text-2xl font-semibold tracking-tight">
                            Herramientas Prestadas
                        </h1>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11.5px] font-semibold text-emerald-400">
                            <span className="relative flex size-2 relative top-[-1px]">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                            </span>
                            En Directo
                        </span>
                    </div>

                </div>
            </section>

            <section className="space-y-4">
                {pageError ? (
                    <AlertError onClose={() => setPageError("")}>{pageError}</AlertError>
                ) : null}

                {/* Buscador y Resumen */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:w-[25rem] shrink-0">
                            <label htmlFor="public-search" className="sr-only">
                                Buscar mecánico
                            </label>
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="public-search"
                                className="h-9 w-full pl-9 pr-4 text-base max-sm:text-sm"
                                placeholder="Buscar mecánico..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </div>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium self-start sm:self-center shrink-0 tracking-[0.6px]">
                            <span className="size-1.5 rounded-full bg-emerald-500 " />
                            {totalPrestamosActivos}{" "}
                            {totalPrestamosActivos === 1
                                ? "Préstamo en Total"
                                : "Préstamos en Total"}
                        </span>
                    </div>
                </div>

                {/* Grid de Tarjetas de Mecánicos (2 por fila en móvil) */}
                {filteredMechanics.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredMechanics.map((mechanic, index) => {
                            const activeLoans = Number(mechanic.prestamos_activos ?? 0)
                            const estilo = estiloTarjetaMecanico(mechanic.color, index)

                            return (
                                <Card
                                    key={mechanic.id}
                                    className={`w-[95%] mx-auto sm:w-full h-full border-t-4 transition-all duration-200 hover:shadow-lg ${estilo.accent}`}
                                >
                                    <CardContent className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2 sm:gap-3 px-2.5 pt-2.5 pb-0 sm:p-0 text-center sm:text-left">

                                        {/* Avatar */}
                                        <div className="pl-0 sm:pl-3.5  flex w-full sm:w-[35%] items-center justify-center sm:items-start sm:justify-between gap-2">
                                            <Avatar className="size-20 sm:size-25 rounded-2xl border border-border/60 shadow-xs shrink-0 after:hidden">
                                                {mechanic.imagen ? (
                                                    <AvatarImage
                                                        src={optimizarImagenMecanico(mechanic.imagen)}
                                                        alt={mechanic.nombre_completo}
                                                        className="rounded-2xl object-cover"
                                                    />
                                                ) : null}

                                                <AvatarFallback className="rounded-2xl text-sm sm:text-xl font-bold bg-muted/80 text-foreground border border-border/30">
                                                    {getInicialesMecanico(mechanic)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>

                                        {/* Información */}
                                        <div className="w-full sm:w-[65%] space-y-0.5 sm:space-y-1 min-w-0 pl-2">

                                            {/* Préstamos */}
                                            <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium shrink-0 mb-2">
                                                <span
                                                    className={`size-1.5 rounded-full ${activeLoans > 0
                                                        ? "bg-emerald-500 animate-pulse"
                                                        : "bg-muted-foreground/40"
                                                        }`}
                                                />

                                                {activeLoans}{" "}

                                                <span className="hidden sm:inline">
                                                    {activeLoans === 1 ? "Préstamo" : "Préstamos"}
                                                </span>

                                                <span className="sm:hidden">
                                                    {activeLoans === 1 ? "Préstamo." : "Préstamos."}
                                                </span>
                                            </span>

                                            {/* Nombre */}
                                            <CardTitle className="text-xs tracking-[0.4px] sm:text-[15px] font-semibold leading-tight  break-words">
                                                {mechanic.nombre_completo}
                                            </CardTitle>

                                            {/* Apodo */}
                                            <p className="hidden sm:block h-4 truncate text-xs sm:text-sm font-medium text-muted-foreground">
                                                {mechanic.apodo ? `“${mechanic.apodo}”` : "\u00a0"}
                                            </p>

                                        </div>
                                    </CardContent>

                                    <CardFooter className="mt-auto p-1 sm:p-1 pt-0 flex justify-center items-center">
                                        <Button
                                            variant="info"
                                            className=" w-full h-7 sm:h-9 text-[10.5px] sm:text-sm font-medium cursor-pointer mt-1 sm:mt-0"
                                            onClick={() => openViewLoans(mechanic.id)}
                                        >
                                            Ver préstamos
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
                        <Wrench className="size-10 text-muted-foreground/40 mb-2" />
                        <p className="text-lg font-medium">No se encontraron mecánicos</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            No hay mecánicos registrados o que coincidan con la búsqueda.
                        </p>
                    </div>
                )}
            </section>

            {/* Modal de Consulta de Préstamos Público (Sencillo y Lectura Fácil) */}
            <ModalVerPrestamosPublico
                open={Boolean(viewMechanicId)}
                mechanic={viewMechanic}
                loans={viewLoans}
                isLoading={isLoadingView}
                error={viewError}
                onDismissError={() => setViewError("")}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewMechanicId(null)
                        setViewLoans([])
                    }
                }}
            />
        </div>
    )
}