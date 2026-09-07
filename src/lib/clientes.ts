import { api, listarTodosPaginados } from "@/lib/api"

export const CLIENTE_ESTADO_ELIMINADO = 0
export const CLIENTE_ESTADO_ACTIVO = 1

export type Cliente = {
  id: string
  nombre_completo: string
  apodo: string | null
  nit: string | null
  correo: string | null
  celular: string | null
  estado: number
  usuario_id: string
}

export type ClienteFormValues = {
  nombre_completo: string
  apodo: string
  nit: string
  correo: string
  celular: string
}

type ClienteResponse = {
  cliente: Cliente
}

const RESOURCE = "/api/clientes"

export function etiquetaEstadoCliente(estado: number) {
  if (estado === CLIENTE_ESTADO_ELIMINADO) return "Eliminado"
  return "Activo"
}

export function inicialesCliente(cliente: Pick<Cliente, "nombre_completo">) {
  const palabras = cliente.nombre_completo.trim().split(/\s+/)
  const primera = palabras[0]?.charAt(0) ?? ""
  const segunda = palabras[1]?.charAt(0) ?? ""
  return `${primera}${segunda}`.toUpperCase() || "C"
}

export async function listarClientes() {
  return listarTodosPaginados<Cliente>(RESOURCE)
}

export async function crearCliente(values: ClienteFormValues) {
  const respuesta = await api<ClienteResponse>(RESOURCE, {
    method: "POST",
    body: values,
  })
  return respuesta.cliente
}

export async function actualizarCliente(id: string, values: ClienteFormValues) {
  const respuesta = await api<ClienteResponse>(`${RESOURCE}/${id}`, {
    method: "PATCH",
    body: values,
  })
  return respuesta.cliente
}

export async function eliminarCliente(id: string) {
  await api(`${RESOURCE}/${id}`, { method: "DELETE" })
}

export async function cambiarEstadoCliente(id: string, estado: number) {
  const respuesta = await api<ClienteResponse>(`${RESOURCE}/${id}/estado`, {
    method: "PATCH",
    body: { estado },
  })
  return respuesta.cliente
}
