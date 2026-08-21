import { api } from "@/lib/api"

export type CatalogoItem = {
  id: string
  nombre: string
  descripcion: string | null
  estado: number
}

export type CatalogoFormValues = {
  nombre: string
  descripcion: string
}

type LaravelPaginated<T> = {
  data: T[]
}

export async function listarCatalogo(path: string) {
  const query = new URLSearchParams({ por_pagina: "100" })
  const respuesta = await api<LaravelPaginated<CatalogoItem>>(
    `${path}?${query.toString()}`,
  )

  return respuesta.data
}

export async function crearCatalogo(path: string, values: CatalogoFormValues) {
  await api(`${path}`, {
    method: "POST",
    body: {
      nombre: values.nombre,
      descripcion: values.descripcion || null,
    },
  })
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
    },
  })
}

export async function eliminarCatalogo(path: string, id: string) {
  await api(`${path}/${id}`, { method: "DELETE" })
}
