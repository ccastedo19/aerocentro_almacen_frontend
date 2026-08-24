import { useState } from "react"

import { HistorialGeneral } from "@/components/historial/HistorialGeneral"
import { HistorialPorHerramienta } from "@/components/historial/HistorialPorHerramienta"
import { HistorialPorMecanico } from "@/components/historial/HistorialPorMecanico"
import { Button } from "@/components/ui/button"
import { PagePreloader } from "@/components/ui/page-preloader"

type TabHistorial = "general" | "mecanico" | "herramienta"

const recursoPorTab: Record<TabHistorial, string> = {
  general: "todos los movimientos",
  mecanico: "todos los mecánicos",
  herramienta: "todas las herramientas",
}

export const HistorialPrestamos = () => {
  const [tab, setTab] = useState<TabHistorial>("general")
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="w-full space-y-4">
      {isLoading ? (
        <PagePreloader recurso={recursoPorTab[tab]} />
      ) : (
        <>
          <section className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Historial de Préstamos
            </h1>
            <p className="text-sm text-muted-foreground">
              Consulta el kardex general, o el historial por mecánico y por
              herramienta.
            </p>
          </section>

          <div className="flex w-fit flex-wrap rounded-lg border bg-muted/50 p-0.5">
            <Button
              type="button"
              className="h-9 px-4"
              variant={tab === "general" ? "default" : "ghost"}
              onClick={() => {
                if (tab === "general") return
                setIsLoading(true)
                setTab("general")
              }}
            >
              Historial general
            </Button>
            <Button
              type="button"
              className="h-9 px-4"
              variant={tab === "mecanico" ? "default" : "ghost"}
              onClick={() => {
                if (tab === "mecanico") return
                setIsLoading(true)
                setTab("mecanico")
              }}
            >
              Por mecánico
            </Button>
            <Button
              type="button"
              className="h-9 px-4"
              variant={tab === "herramienta" ? "default" : "ghost"}
              onClick={() => {
                if (tab === "herramienta") return
                setIsLoading(true)
                setTab("herramienta")
              }}
            >
              Por herramienta
            </Button>
          </div>
        </>
      )}

      <div className={isLoading ? "hidden" : undefined}>
        {tab === "general" ? (
          <HistorialGeneral onLoadingChange={setIsLoading} />
        ) : null}
        {tab === "mecanico" ? (
          <HistorialPorMecanico onLoadingChange={setIsLoading} />
        ) : null}
        {tab === "herramienta" ? (
          <HistorialPorHerramienta onLoadingChange={setIsLoading} />
        ) : null}
      </div>
    </div>
  )
}
