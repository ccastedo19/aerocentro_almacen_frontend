import { ApiError, api, downloadApi } from "@/lib/api"
import { type Usuario } from "@/lib/auth"
import { formatFechaHora } from "@/lib/historial-prestamos"

export type BackupItem = {
  id: string
  fecha: string
  nombre_archivo: string
  tamano: number
  disponible: boolean
  usuario?: Pick<Usuario, "id" | "nombre" | "apellido"> | null
}

const MAX_BYTES = 20 * 1024 * 1024

type BackupsResponse = {
  backups: BackupItem[]
}

type BackupResponse = {
  backup: BackupItem
}

const RESOURCE = "/api/backups"

export async function listarBackups() {
  const respuesta = await api<BackupsResponse>(RESOURCE)

  return respuesta.backups
}

export async function descargarBackupActual() {
  await downloadApi(`${RESOURCE}/descargar`, { method: "POST" }, "aerocentro-almacen.sql")
}

export async function subirBackup(archivo: File) {
  if (archivo.size > MAX_BYTES) {
    throw new ApiError("El archivo no puede superar 20 MB.", 422)
  }

  // El SQL viaja en base64 porque el firewall del hosting bloquea con 403 los
  // cuerpos que contienen sentencias SQL sin codificar.
  const respuesta = await api<BackupResponse>(RESOURCE, {
    method: "POST",
    body: {
      nombre: archivo.name,
      contenido: await leerBase64(archivo),
    },
  })

  return respuesta.backup
}

export async function restaurarBackup(id: string) {
  await api(`${RESOURCE}/${id}/restaurar`, { method: "POST" })
}

export async function eliminarBackup(id: string) {
  await api(`${RESOURCE}/${id}`, { method: "DELETE" })
}

function leerBase64(archivo: File) {
  return new Promise<string>((resolve, reject) => {
    const lector = new FileReader()

    lector.onload = () => {
      const resultado = typeof lector.result === "string" ? lector.result : ""
      const separador = resultado.indexOf(",")

      if (separador === -1) {
        reject(new ApiError("No se pudo leer el archivo.", 0))

        return
      }

      resolve(resultado.slice(separador + 1))
    }

    lector.onerror = () => {
      reject(new ApiError("No se pudo leer el archivo.", 0))
    }

    lector.readAsDataURL(archivo)
  })
}

export function formatFechaBackup(value: string) {
  return formatFechaHora(value)
}

export function formatTamanoBackup(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
