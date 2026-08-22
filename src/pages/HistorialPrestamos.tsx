import { useState } from "react"

import { HistorialGeneral } from "@/components/historial/HistorialGeneral"
import { HistorialPorHerramienta } from "@/components/historial/HistorialPorHerramienta"
import { HistorialPorMecanico } from "@/components/historial/HistorialPorMecanico"
import { Button } from "@/components/ui/button"

type TabHistorial = "general" | "mecanico" | "herramienta"

export const HistorialPrestamos = () => {
  const [tab, setTab] = useState<TabHistorial>("general")

  return (
    <div className="w-full space-y-4">
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
          onClick={() => setTab("general")}
        >
          Historial general
        </Button>
        <Button
          type="button"
          className="h-9 px-4"
          variant={tab === "mecanico" ? "default" : "ghost"}
          onClick={() => setTab("mecanico")}
        >
          Por mecánico
        </Button>
        <Button
          type="button"
          className="h-9 px-4"
          variant={tab === "herramienta" ? "default" : "ghost"}
          onClick={() => setTab("herramienta")}
        >
          Por herramienta
        </Button>
      </div>

      {tab === "general" ? <HistorialGeneral /> : null}
      {tab === "mecanico" ? <HistorialPorMecanico /> : null}
      {tab === "herramienta" ? <HistorialPorHerramienta /> : null}
    </div>
  )
}
