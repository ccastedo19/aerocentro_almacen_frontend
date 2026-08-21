import { CatalogoPage } from "@/components/catalogo/CatalogoPage"

export const Marcas = () => {
  return (
    <CatalogoPage
      titulo="Marcas"
      descripcion="Registra las marcas de las herramientas para identificar cada unidad."
      singular="marca"
      plural="marcas"
      resourcePath="/api/marcas"
      searchPlaceholder="Buscar marca por nombre o descripción..."
      nombrePlaceholder="Ej. Bosch"
      descripcionPlaceholder="Describe la marca o su uso en el almacén"
    />
  )
}
