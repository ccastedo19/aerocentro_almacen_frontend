import { CatalogoPage } from "@/components/catalogo/CatalogoPage"

export const Categorias = () => {
  return (
    <CatalogoPage
      titulo="Categorías"
      descripcion="Organiza las herramientas del almacén por tipo para encontrarlas más rápido."
      singular="categoría"
      plural="categorías"
      resourcePath="/api/categorias"
      searchPlaceholder="Buscar categoría por nombre o descripción..."
      nombrePlaceholder="Ej. Herramientas de mano"
      descripcionPlaceholder="Describe el tipo de herramientas de esta categoría"
    />
  )
}
