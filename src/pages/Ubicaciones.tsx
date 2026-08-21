import { CatalogoPage } from "@/components/catalogo/CatalogoPage"

export const Ubicaciones = () => {
  return (
    <CatalogoPage
      titulo="Ubicaciones"
      descripcion="Indica en qué estante, zona o área del almacén está cada herramienta."
      singular="ubicación"
      plural="ubicaciones"
      resourcePath="/api/ubicaciones"
      searchPlaceholder="Buscar ubicación por nombre o descripción..."
      nombrePlaceholder="Ej. Estante A-01"
      descripcionPlaceholder="Describe dónde se encuentra esta ubicación"
    />
  )
}
