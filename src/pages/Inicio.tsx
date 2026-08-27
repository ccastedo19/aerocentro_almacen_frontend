import { useEffect, useState } from "react"
import {
  CircleCheck,
  Package,
  TrendingUp,
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

type KpiColor = "violeta" | "azul" | "naranja" | "verde"

const ESTILOS_KPI: Record<KpiColor, { icono: string; detalle: string }> = {
  violeta: {
    icono: "bg-violet-500/12 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
    detalle: "text-violet-600 dark:text-violet-300",
  },
  azul: {
    icono: "bg-sky-500/12 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300",
    detalle: "text-sky-600 dark:text-sky-300",
  },
  naranja: {
    icono: "bg-orange-500/12 text-orange-600 dark:bg-orange-400/15 dark:text-orange-300",
    detalle: "text-orange-600 dark:text-orange-300",
  },
  verde: {
    icono: "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
    detalle: "text-emerald-600 dark:text-emerald-300",
  },
}

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
          detalle="Herramientas registradas"
          icon={Package}
          color="violeta"
        />
        <KpiCard
          titulo="Mecánicos"
          valor={resumen.mecanicos}
          detalle="Personal activo"
          icon={UserRound}
          color="azul"
        />
        <KpiCard
          titulo="Herramientas prestadas"
          valor={resumen.prestadas}
          detalle="Herramientas en uso"
          icon={Wrench}
          color="naranja"
        />
        <KpiCard
          titulo="Herramientas disponibles"
          valor={resumen.disponibles}
          detalle="Herramientas Listas para prestar"
          icon={CircleCheck}
          color="verde"
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
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-300">
                        {item.cantidad}
                      </span>
                      <div
                        className={cn(
                          "w-full max-w-16 rounded-t-md transition-colors",
                          item.cantidad > 0
                            ? "bg-gradient-to-t from-violet-700 to-violet-400"
                            : "bg-violet-200 dark:bg-violet-400/25",
                        )}
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
              <div className="flex h-full flex-col items-center justify-center gap-3 py-6 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300">
                  <CircleCheck className="size-7" />
                </span>
                <p className="font-medium text-emerald-600 dark:text-emerald-300">
                  ¡Todo está al día!
                </p>
                <p className="text-sm text-muted-foreground">
                  No hay herramientas atrasadas.
                </p>
              </div>
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
                        <span className="rounded-full bg-rose-500/12 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-400/15 dark:text-rose-300">
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
            <CardAction>
              <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/12 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300">
                <TrendingUp className="size-4" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-auto">
            <RankingTable
              items={top_herramientas}
              etiqueta="Herramienta"
              vacio="Aún no hay préstamos de herramientas."
              color="violeta"
            />
          </CardContent>
        </Card>

        <Card className="h-[22rem]">
          <CardHeader>
            <CardTitle>Top 5 mecánicos más frecuentes</CardTitle>
            <CardDescription>
              Quienes más retiran herramientas.
            </CardDescription>
            <CardAction>
              <div className="flex size-9 items-center justify-center rounded-lg bg-sky-500/12 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300">
                <UserRound className="size-4" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-auto">
            <RankingTable
              items={top_mecanicos}
              etiqueta="Mecánico"
              vacio="Aún no hay préstamos de mecánicos."
              color="azul"
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
  color,
}: {
  titulo: string
  valor: number
  detalle: string
  icon: typeof Package
  color: KpiColor
}) {
  const estilo = ESTILOS_KPI[color]

  return (
    <Card>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardAction>
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-full",
              estilo.icono,
            )}
          >
            <Icon className="size-5" />
          </div>
        </CardAction>
        <CardTitle className="text-3xl font-semibold tracking-tight">
          {valor}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-sm font-medium", estilo.detalle)}>{detalle}</p>
      </CardContent>
    </Card>
  )
}

function RankingTable({
  items,
  etiqueta,
  vacio,
  color,
}: {
  items: RankingInicio[]
  etiqueta: string
  vacio: string
  color: Extract<KpiColor, "violeta" | "azul">
}) {
  if (items.length === 0) {
    return <EmptyState texto={vacio} />
  }

  const destacado =
    color === "violeta" ? "bg-violet-600 text-white" : "bg-sky-600 text-white"
  const encabezado =
    color === "violeta"
      ? "text-violet-600 dark:text-violet-300"
      : "text-sky-600 dark:text-sky-300"

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead className={encabezado}>{etiqueta}</TableHead>
          <TableHead className={cn("text-right", encabezado)}>
            Préstamos
          </TableHead>
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
                    ? destacado
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
