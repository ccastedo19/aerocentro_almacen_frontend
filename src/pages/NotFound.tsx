import { House, SearchX } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

export const NotFound = () => {
  return (
    <div className="flex min-h-[calc(100svh-8rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <SearchX className="size-7 text-muted-foreground" />
      </div>

      <p className="mt-6 text-sm font-medium tracking-[0.2em] text-muted-foreground">
        NOT FOUND 404
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Página no encontrada
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        La ruta que buscas no existe o ya no está disponible en el Sistema de
        Almacén de Aerocentro.
      </p>

      <Button className="mt-8" render={<Link to="/inicio" />}>
        <House data-icon="inline-start" />
        Volver al Inicio
      </Button>
    </div>
  )
}
