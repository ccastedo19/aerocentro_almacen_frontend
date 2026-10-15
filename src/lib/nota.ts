import { api } from "@/lib/api"

export type Nota = {
  id: string
  titulo: string
  contenido: string
  usuario_id: string | null
  usuario?: {
    id: string
    nombre: string
    apellido: string
    nombre_usuario: string
  } | null
  created_at: string
  updated_at: string
}

export async function obtenerNota(): Promise<Nota> {
  const respuesta = await api<{ nota: Nota }>("/api/nota")
  return respuesta.nota
}

export async function actualizarNota(
  contenido: string,
  titulo?: string,
): Promise<Nota> {
  const respuesta = await api<{ message: string; nota: Nota }>("/api/nota", {
    method: "PUT",
    body: {
      contenido,
      titulo,
    },
  })
  return respuesta.nota
}
