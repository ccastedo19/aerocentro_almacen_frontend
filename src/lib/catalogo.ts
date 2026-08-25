import { api, listarTodosPaginados } from "@/lib/api"

export type CatalogoItem = {
  id: string
  nombre: string
  descripcion: string | null
  estado: number
  parent_id: string | null
  padre?: {
    id: string
    nombre: string
    parent_id: string | null
  } | null
}

export type CatalogoFormValues = {
  nombre: string
  descripcion: string
  parent_id: string | null
}

export async function listarCatalogo(path: string) {
  return listarTodosPaginados<CatalogoItem>(path)
}

type CrearCatalogoResponse = {
  message: string
  categoria?: CatalogoItem
  marca?: CatalogoItem
  ubicacion?: CatalogoItem
}

export async function crearCatalogo(path: string, values: CatalogoFormValues) {
  const respuesta = await api<CrearCatalogoResponse>(`${path}`, {
    method: "POST",
    body: {
      nombre: values.nombre,
      descripcion: values.descripcion || null,
      parent_id: values.parent_id,
    },
  })

  const item = respuesta.categoria ?? respuesta.marca ?? respuesta.ubicacion

  if (!item) {
    throw new Error("No se pudo crear el registro.")
  }

  return item
}

export async function actualizarCatalogo(
  path: string,
  id: string,
  values: CatalogoFormValues,
) {
  await api(`${path}/${id}`, {
    method: "PUT",
    body: {
      nombre: values.nombre,
      descripcion: values.descripcion || null,
      parent_id: values.parent_id,
    },
  })
}

export async function eliminarCatalogo(path: string, id: string) {
  await api(`${path}/${id}`, { method: "DELETE" })
}
