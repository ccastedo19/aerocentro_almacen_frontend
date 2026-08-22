import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  detalleUnidadHistorial,
  formatFechaHora,
  MOVIMIENTO_DEVUELTO,
  MOVIMIENTO_EN_CURSO,
  type MovimientoPrestamo,
} from "@/lib/historial-prestamos"

type EstadoFiltro = "todos" | "curso" | "devuelto"
type ModoHistorial = "herramienta" | "mecanico"

type ModalHistorialPrestamoProps = {
  open: boolean
  titulo: string
  descripcion: string
  modo: ModoHistorial
  movimientos: MovimientoPrestamo[]
  isLoading?: boolean
  error?: string
  onOpenChange: (open: boolean) => void
}

export function ModalHistorialPrestamo({
  open,
  titulo,
  descripcion,
  modo,
  movimientos,
  isLoading = false,
  error = "",
  onOpenChange,
}: ModalHistorialPrestamoProps) {
  const [search, setSearch] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos")

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()

    return movimientos.filter((movimiento) => {
      if (estadoFiltro === "curso" && movimiento.estado !== MOVIMIENTO_EN_CURSO) {
        return false
      }

      if (estadoFiltro === "devuelto" && movimiento.estado !== MOVIMIENTO_DEVUELTO) {
        return false
      }

      if (!query) return true

      const haystack = [
        movimiento.mecanico?.nombre_completo,
        movimiento.mecanico?.apodo,
        movimiento.herramienta?.nombre,
        movimiento.herramienta?.categoria?.nombre,
        movimiento.unidad?.marca?.nombre,
        movimiento.unidad?.ubicacion?.nombre,
        movimiento.estado_etiqueta,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase()

      return haystack.includes(query)
    })
  }, [estadoFiltro, movimientos, search])

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSearch("")
          setEstadoFiltro("todos")
        }

        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-lg">{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>

        {error ? (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-md">
            <label htmlFor="historial-movimiento-search" className="sr-only">
              Buscar movimiento
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="historial-movimiento-search"
              className="h-10 pl-9"
              placeholder={
                modo === "mecanico"
                  ? "Buscar por herramienta, marca o ubicación..."
                  : "Buscar por mecánico, marca o ubicación..."
              }
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Select
            value={estadoFiltro}
            items={{
              todos: "Todos los estados",
              curso: "En préstamo",
              devuelto: "Devuelto",
            }}
            onValueChange={(value) => {
              if (value == null) return
              setEstadoFiltro(value as EstadoFiltro)
            }}
          >
            <SelectTrigger
              id="historial-estado"
              className="h-10 min-w-[12rem]"
              aria-label="Filtrar por estado"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="curso">En préstamo</SelectItem>
              <SelectItem value="devuelto">Devuelto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Cargando historial...
          </p>
        ) : (
          <div className="max-h-[52vh] overflow-auto rounded-xl border bg-card ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {modo === "mecanico" ? (
                    <TableHead>Herramienta</TableHead>
                  ) : (
                    <TableHead>Mecánico</TableHead>
                  )}
                  <TableHead>Unidad</TableHead>
                  <TableHead>Prestada</TableHead>
                  <TableHead>Devuelta</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="h-16 text-center text-muted-foreground"
                    >
                      No hay movimientos para mostrar.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((movimiento) => {
                    const unidad = detalleUnidadHistorial(movimiento.unidad)
                    const enCurso = movimiento.estado === MOVIMIENTO_EN_CURSO

                    return (
                      <TableRow key={movimiento.id}>
                        <TableCell>
                          {modo === "mecanico" ? (
                            <>
                              <p className="font-medium">
                                {movimiento.herramienta?.nombre ?? "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {movimiento.herramienta?.categoria?.nombre ?? "—"}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium">
                                {movimiento.mecanico?.nombre_completo ?? "—"}
                              </p>
                              {movimiento.mecanico?.apodo ? (
                                <p className="text-xs text-muted-foreground">
                                  “{movimiento.mecanico.apodo}”
                                </p>
                              ) : null}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {unidad || "—"}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatFechaHora(movimiento.fecha_prestamo)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatFechaHora(movimiento.fecha_devolucion)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              enCurso
                                ? "inline-flex rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300"
                                : "inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                            }
                          >
                            {enCurso ? "En préstamo" : "Devuelto"}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
