import { useEffect, useState } from "react"
import {
  CircleCheck,
  Package,
  UserRound,
  Wrench,
} from "lucide-react"

import { AlertError } from "@/components/ui/alert-error"
import { PagePreloader } from "@/components/ui/page-preloader"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api"
import {
  INICIO_VACIO,
  obtenerInicio,
  type RankingInicio,
} from "@/lib/inicio"
import { cn } from "@/lib/utils"

export const Inicio = () => {
  const { usuario } = useAuth()
  const nombre = usuario?.nombre.trim() || "usuario"
  const [dashboard, setDashboard] = useState(INICIO_VACIO)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState("")

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setPageError("")

    obtenerInicio()
      .then((data) => {
        if (!cancelled) setDashboard(data)
      })
      .catch((error) => {
        if (cancelled) return
        setPageError(
          error instanceof ApiError
            ? error.message
            : "No se pudo cargar el inicio.",
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const { resumen, prestamos_por_dia, no_devueltas, top_herramientas, top_mecanicos } =
    dashboard
  const maxPrestamosDia = Math.max(
    ...prestamos_por_dia.map((item) => item.cantidad),
    1,
  )

  if (isLoading) {
    return <PagePreloader recurso="todas las estadísticas" />
  }

  return (
    <div className="w-full space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bienvenido {nombre}, puedes usar el Sistema de Almacén.
        </h1>
        <p className="text-sm text-muted-foreground">
          Resumen del inventario y de los préstamos activos.
        </p>
      </section>

      {pageError ? (
        <AlertError onClose={() => setPageError("")}>{pageError}</AlertError>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          titulo="Herramientas"
          valor={resumen.herramientas}
          detalle="Tipos registrados"
          icon={Package}
        />
        <KpiCard
          titulo="Mecánicos"
          valor={resumen.mecanicos}
          detalle="Personal activo"
          icon={UserRound}
        />
        <KpiCard
          titulo="Herramientas prestadas"
          valor={resumen.prestadas}
          detalle="Unidades en uso"
          icon={Wrench}
        />
        <KpiCard
          titulo="Herramientas disponibles"
          valor={resumen.disponibles}
          detalle="Listas para prestar"
          icon={CircleCheck}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="h-[22rem]">
          <CardHeader>
            <CardTitle>Préstamos por día de la semana</CardTitle>
            <CardDescription>
              Cantidad de préstamos registrados en los últimos 7 días.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
              <div className="flex h-full items-end gap-3 sm:gap-4">
                {prestamos_por_dia.map((item) => {
                  const altura = Math.max(
                    (item.cantidad / maxPrestamosDia) * 100,
                    8,
                  )

                  return (
                    <div
                      key={item.dia}
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {item.cantidad}
                      </span>
                      <div
                        className="w-full max-w-16 rounded-t-md bg-primary/80"
                        style={{ height: `${altura}%` }}
                        title={`${item.dia}: ${item.cantidad} préstamos`}
                      />
                      <span className="text-xs font-medium">{item.dia}</span>
                    </div>
                  )
                })}
              </div>
          </CardContent>
        </Card>

        <Card className="h-[22rem]">
          <CardHeader>
            <CardTitle>Herramientas no devueltas en 24 horas</CardTitle>
            <CardDescription>
              Unidades que superan el tiempo de préstamo.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-auto">
            {no_devueltas.length === 0 ? (
              <EmptyState texto="No hay herramientas atrasadas." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Herramienta</TableHead>
                    <TableHead>Mecánico</TableHead>
                    <TableHead>Retraso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {no_devueltas.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-56 truncate font-medium">
                        {item.herramienta}
                      </TableCell>
                      <TableCell>{item.mecanico}</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          {item.retraso}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="h-[22rem]">
          <CardHeader>
            <CardTitle>Top 5 herramientas más prestadas</CardTitle>
            <CardDescription>
              Las unidades con más movimientos.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-auto">
            <RankingTable
              items={top_herramientas}
              etiqueta="Herramienta"
              vacio="Aún no hay préstamos de herramientas."
            />
          </CardContent>
        </Card>

        <Card className="h-[22rem]">
          <CardHeader>
            <CardTitle>Top 5 mecánicos más frecuentes</CardTitle>
            <CardDescription>
              Quienes más retiran herramientas.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-auto">
            <RankingTable
              items={top_mecanicos}
              etiqueta="Mecánico"
              vacio="Aún no hay préstamos de mecánicos."
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function KpiCard({
  titulo,
  valor,
  detalle,
  icon: Icon,
}: {
  titulo: string
  valor: number
  detalle: string
  icon: typeof Package
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardAction>
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        </CardAction>
        <CardTitle className="text-3xl font-semibold tracking-tight">
          {valor}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{detalle}</p>
      </CardContent>
    </Card>
  )
}

function RankingTable({
  items,
  etiqueta,
  vacio,
}: {
  items: RankingInicio[]
  etiqueta: string
  vacio: string
}) {
  if (items.length === 0) {
    return <EmptyState texto={vacio} />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>{etiqueta}</TableHead>
          <TableHead className="text-right">Préstamos</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          <TableRow key={item.id}>
            <TableCell>
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                  index === 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
            </TableCell>
            <TableCell className="max-w-48 truncate font-medium">
              {item.nombre}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {item.prestamos}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function EmptyState({ texto }: { texto: string }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{texto}</p>
  )
}
