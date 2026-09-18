import { memo, useEffect, useMemo, useState } from "react"
import { Clock, PackageOpen, Search, Wrench, X } from "lucide-react"

import { AlertError } from "@/components/ui/alert-error"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { DetalleUnidadPrestamo } from "@/components/prestamos/detalle-unidad-prestamo"
import { getInicialesMecanico, optimizarImagenMecanico } from "@/lib/mecanicos"
import {
    compararPorBusquedaCorta,
    formatBorrowedAt,
    nombreUnidad,
    textoBusquedaUnidad,
    type DetallePrestamoActivo,
    type MecanicoPunto,
} from "@/lib/prestamos"

type ModalVerPrestamosPublicoProps = {
    open: boolean
    mechanic?: MecanicoPunto | null
    loans: DetallePrestamoActivo[]
    isLoading?: boolean
    error?: string
    onDismissError?: () => void
    onOpenChange: (open: boolean) => void
}

const LoanItemRowPublic = memo(function LoanItemRowPublic({
    loan,
}: {
    loan: DetallePrestamoActivo
}) {
    return (
        <div className="flex items-start gap-2.5 sm:gap-3 rounded-xl border border-border/60 bg-card p-2.5 sm:p-3.5 transition-all hover:border-emerald-500/30 hover:bg-muted/30">
            <div className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 mt-0.5">
                <Wrench className="size-4 sm:size-5" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <p className="font-semibold text-xs sm:text-sm text-foreground line-clamp-1">
                        {nombreUnidad(loan.unidad)}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground shrink-0 font-medium">
                        <Clock className="size-3 text-emerald-500" />
                        {formatBorrowedAt(loan.prestamo?.fecha_prestamo ?? "")}
                    </span>
                </div>

                <DetalleUnidadPrestamo
                    unidad={loan.unidad}
                    className="text-[11px] sm:text-xs"
                />
            </div>
        </div>
    )
})

export function ModalVerPrestamosPublico({
    open,
    mechanic,
    loans,
    isLoading = false,
    error = "",
    onDismissError,
    onOpenChange,
}: ModalVerPrestamosPublicoProps) {
    const [search, setSearch] = useState("")

    useEffect(() => {
        if (open) {
            setSearch("")
        }
    }, [open])

    const displayedMechanic = useClosingSnapshot(open, mechanic)
    const displayedLoans = useClosingSnapshot(open, loans)
    const displayedLoading = useClosingSnapshot(open, isLoading)
    const displayedError = useClosingSnapshot(open, error)

    const filteredLoans = useMemo(() => {
        const query = search.trim().toLocaleLowerCase()
        const source = displayedLoans

        if (!query) return source

        return source
            .filter((loan) => {
                const haystack = [
                    textoBusquedaUnidad(loan.unidad),
                    loan.unidad?.observaciones ?? "",
                ]
                    .join(" ")
                    .toLocaleLowerCase()

                return haystack.includes(query)
            })
            .sort((a, b) =>
                compararPorBusquedaCorta(
                    nombreUnidad(a.unidad),
                    nombreUnidad(b.unidad),
                    query,
                ),
            )
    }, [displayedLoans, search])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[min(100vh,44rem)] w-[min(94vw,58rem)] max-w-none flex-col gap-3 sm:gap-4 overflow-hidden p-3.5 sm:p-5 dark bg-background text-foreground">
                {/* Cabecera compacta del modal con info del mecánico */}
                <DialogHeader className="space-y-2 border-b border-border/50 pb-3">
                    <div className="flex items-center gap-3 pr-6">
                        <Avatar className="size-10 sm:size-12 rounded-xl border border-border/60 shrink-0 after:hidden">
                            {displayedMechanic?.imagen ? (
                                <AvatarImage
                                    src={optimizarImagenMecanico(displayedMechanic.imagen)}
                                    alt={displayedMechanic.nombre_completo}
                                    className="rounded-xl object-cover"
                                />
                            ) : null}
                            <AvatarFallback className="rounded-xl text-xs sm:text-base font-bold bg-muted/80">
                                {displayedMechanic ? getInicialesMecanico(displayedMechanic) : "?"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                            <DialogTitle className="text-sm sm:text-base font-semibold leading-tight line-clamp-1">
                                {displayedMechanic?.nombre_completo ?? "Mecánico"}
                            </DialogTitle>
                            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                                {displayedMechanic?.apodo ? `“${displayedMechanic.apodo}” • ` : ""}
                                {displayedMechanic?.cargo ?? "Personal Técnico"}
                            </p>
                        </div>

                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-emerald-400 shrink-0">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {displayedLoans.length}{" "}
                            {displayedLoans.length === 1 ? "Préstamo" : "Préstamos"}
                        </span>
                    </div>
                </DialogHeader>

                {displayedError ? (
                    <AlertError onClose={() => onDismissError?.()}>{displayedError}</AlertError>
                ) : null}

                {/* Buscador de herramientas */}
                {displayedLoans.length > 0 ? (
                    <div className="relative">
                        <label htmlFor="search-public-loans" className="sr-only">
                            Buscar herramienta prestada
                        </label>
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 sm:size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="search-public-loans"
                            className="h-8 sm:h-9 pr-8 pl-8 sm:pl-9 text-xs sm:text-sm rounded-lg"
                            placeholder="Buscar herramienta por nombre, código..."
                            value={search}
                            disabled={displayedLoading}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        {search.trim() ? (
                            <button
                                type="button"
                                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                                onClick={() => setSearch("")}
                                aria-label="Limpiar búsqueda"
                            >
                                <X className="size-3.5" />
                            </button>
                        ) : null}
                    </div>
                ) : null}

                {/* Lista de préstamos sencillos */}
                {displayedLoading ? (
                    <div className="flex flex-1 items-center justify-center text-xs sm:text-sm text-muted-foreground">
                        Cargando herramientas prestadas...
                    </div>
                ) : displayedLoans.length > 0 ? (
                    filteredLoans.length > 0 ? (
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                            {filteredLoans.map((loan) => (
                                <LoanItemRowPublic key={loan.id} loan={loan} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Search className="mb-2 size-7 text-muted-foreground/60" />
                            <p className="text-xs sm:text-sm font-medium">No se encontraron resultados</p>
                            <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground">
                                No hay herramientas que coincidan con &ldquo;{search}&rdquo;.
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 h-7 text-xs"
                                onClick={() => setSearch("")}
                            >
                                Limpiar filtro
                            </Button>
                        </div>
                    )
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center text-center py-8">
                        <PackageOpen className="mb-2 size-9 text-emerald-500/60" />
                        <p className="text-xs sm:text-sm font-medium">Sin herramientas prestadas</p>
                        <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground">
                            Actualmente no tienes ninguna herramienta en préstamo.
                        </p>
                    </div>
                )}

                {/* Pie del modal */}
                <DialogFooter className="mt-auto border-t border-border/50 pt-2.5 flex items-center justify-between sm:justify-end">

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-medium px-4"
                        onClick={() => onOpenChange(false)}
                    >
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
