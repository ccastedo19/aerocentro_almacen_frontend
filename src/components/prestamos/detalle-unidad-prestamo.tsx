import {
  etiquetaColorUnidad,
  muestraColorUnidad,
  type ColorUnidad,
} from "@/lib/herramientas"
import {
  coloresUnidad,
  marcaUnidad,
  type UnidadPrestamo,
} from "@/lib/prestamos"
import { cn } from "@/lib/utils"

function MuestraColor({ color }: { color: ColorUnidad }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{etiquetaColorUnidad(color)}</span>
      <span
        aria-hidden
        className={cn(
          "inline-block size-3.5 shrink-0 rounded-full ring-1 ring-black/20 dark:ring-white/25",
          muestraColorUnidad(color),
        )}
      />
    </span>
  )
}

export function DetalleUnidadPrestamo({
  unidad,
  className,
}: {
  unidad?: UnidadPrestamo | null
  className?: string
}) {
  const marca = marcaUnidad(unidad)
  const ubicacion = unidad?.ubicacion?.nombre?.trim() || null
  const tamano = unidad?.tamano?.trim() || null
  const colores = coloresUnidad(unidad)

  const partes = [
    marca ? <span key="marca">{marca}</span> : null,
    ubicacion ? <span key="ubicacion">{ubicacion}</span> : null,
    tamano ? <span key="tamano">Tamaño: {tamano}</span> : null,
    ...colores.map((color) => <MuestraColor key={color} color={color} />),
  ].filter(Boolean)

  if (partes.length === 0) {
    return null
  }

  return (
    <span
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground",
        className,
      )}
    >
      {partes.map((parte, index) => (
        <span key={index} className="inline-flex items-center gap-2">
          {index > 0 ? <span aria-hidden>·</span> : null}
          {parte}
        </span>
      ))}
    </span>
  )
}
