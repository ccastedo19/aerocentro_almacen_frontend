import { useMemo, useState } from "react"
import { Eye, Plus, Search, Wrench } from "lucide-react"

import { ModalAgregarPrestamo } from "@/components/modal/ModalAgregarPrestamo"
import { ModalBuscarHerramientaEnUso } from "@/components/modal/ModalBuscarHerramientaEnUso"
import { ModalVerPrestamos } from "@/components/modal/ModalVerPrestamos"
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
import {
  initialLoans,
  mechanics,
  tools,
  type Loan,
  type UsedTool,
} from "@/lib/prestamos-data"

export const PuntoPrestamos = () => {
  const [search, setSearch] = useState("")
  const [loans, setLoans] =
    useState<Record<number, Loan[]>>(initialLoans)
  const [isUsedToolsOpen, setIsUsedToolsOpen] = useState(false)
  const [viewMechanicId, setViewMechanicId] = useState<number | null>(null)
  const [addMechanicId, setAddMechanicId] = useState<number | null>(null)

  const filteredMechanics = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()

    if (!query) return mechanics

    return mechanics.filter((mechanic) =>
      mechanic.name.toLocaleLowerCase().includes(query)
    )
  }, [search])

  const viewMechanic = mechanics.find(
    (mechanic) => mechanic.id === viewMechanicId
  )
  const addMechanic = mechanics.find(
    (mechanic) => mechanic.id === addMechanicId
  )
  const viewLoans = viewMechanicId ? loans[viewMechanicId] ?? [] : []

  const availableTools = useMemo(() => {
    const loanedToolIds = new Set(
      Object.values(loans).flatMap((mechanicLoans) =>
        mechanicLoans.map((loan) => loan.toolId)
      )
    )

    return tools.filter((tool) => !loanedToolIds.has(tool.id))
  }, [loans])

  const usedTools = useMemo<UsedTool[]>(
    () =>
      mechanics.flatMap((mechanic) =>
        (loans[mechanic.id] ?? []).flatMap((loan) => {
          const tool = tools.find((item) => item.id === loan.toolId)

          return tool
            ? [{ tool, mechanic, borrowedAt: loan.borrowedAt }]
            : []
        })
      ),
    [loans]
  )

  const openAddLoan = (mechanicId: number) => {
    setAddMechanicId(mechanicId)
  }

  const returnTool = (mechanicId: number, toolId: number) => {
    setLoans((current) => ({
      ...current,
      [mechanicId]: (current[mechanicId] ?? []).filter(
        (loan) => loan.toolId !== toolId
      ),
    }))
  }

  const returnAllTools = (mechanicId: number) => {
    setLoans((current) => ({ ...current, [mechanicId]: [] }))
  }

  const addSelectedTools = (toolIds: number[]) => {
    if (!addMechanicId || toolIds.length === 0) return

    setLoans((current) => ({
      ...current,
      [addMechanicId]: [
        ...(current[addMechanicId] ?? []),
        ...toolIds.map((toolId) => ({
          toolId,
          borrowedAt: new Date().toISOString(),
        })),
      ],
    }))
    setAddMechanicId(null)
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Punto de Préstamos
        </h1>
        <p className="text-sm text-muted-foreground">
          Registra y consulta las herramientas que tiene cada mecánico.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <label htmlFor="mechanic-search" className="sr-only">
              Buscar mecánico
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="mechanic-search"
              className="h-10 pl-9"
              placeholder="Buscar mecánico por nombre..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="lg"
            className="sm:shrink-0"
            onClick={() => setIsUsedToolsOpen(true)}
          >
            <Wrench data-icon="inline-start" />
            Buscar herramienta en uso
          </Button>
        </div>

        {filteredMechanics.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredMechanics.map((mechanic) => {
              const activeLoans = loans[mechanic.id]?.length ?? 0
              return (
                <Card
                  key={mechanic.id}
                  className={`border-t-4 transition-shadow hover:shadow-md ${mechanic.accent}`}
                >
                  <CardHeader>
                    <div
                      className={`flex size-11 items-center justify-center rounded-xl text-sm font-semibold ${mechanic.badge}`}
                    >
                      {mechanic.initials}
                    </div>
                    <CardAction>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        {activeLoans} activos
                      </span>
                    </CardAction>
                  </CardHeader>

                  <CardContent className="space-y-1">
                    <CardTitle>{mechanic.name}</CardTitle>
                    <CardDescription>{mechanic.area}</CardDescription>
                  </CardContent>

                  <CardFooter className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAddLoan(mechanic.id)}
                    >
                      <Plus data-icon="inline-start" />
                      Añadir préstamo
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setViewMechanicId(mechanic.id)}
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
                Intenta realizar la búsqueda con otro nombre.
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </section>

      <ModalBuscarHerramientaEnUso
        open={isUsedToolsOpen}
        usedTools={usedTools}
        onOpenChange={setIsUsedToolsOpen}
      />

      <ModalVerPrestamos
        open={viewMechanicId !== null}
        mechanic={viewMechanic}
        loans={viewLoans}
        tools={tools}
        onOpenChange={(open) => {
          if (!open) setViewMechanicId(null)
        }}
        onAddTool={() => {
          if (viewMechanicId) openAddLoan(viewMechanicId)
        }}
        onReturnTool={(toolId) => {
          if (viewMechanicId) returnTool(viewMechanicId, toolId)
        }}
        onReturnAll={() => {
          if (viewMechanicId) returnAllTools(viewMechanicId)
        }}
      />

      <ModalAgregarPrestamo
        open={addMechanicId !== null}
        mechanic={addMechanic}
        availableTools={availableTools}
        onOpenChange={(open) => {
          if (!open) setAddMechanicId(null)
        }}
        onSubmit={addSelectedTools}
      />
    </div>
  )
}
