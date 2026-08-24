import { api, downloadApi } from "@/lib/api"
import { type Usuario } from "@/lib/auth"
import { formatFechaHora } from "@/lib/historial-prestamos"

export type BackupItem = {
  id: string
  fecha: string
  nombre_archivo: string
  tamano: number
  usuario?: Pick<Usuario, "id" | "nombre" | "apellido"> | null
}

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
  const data = new FormData()
  data.append("archivo", archivo)

  const respuesta = await api<BackupResponse>(RESOURCE, {
    method: "POST",
    body: data,
  })

  return respuesta.backup
}

export async function restaurarBackup(id: string) {
  await api(`${RESOURCE}/${id}/restaurar`, { method: "POST" })
}

export function formatFechaBackup(value: string) {
  return formatFechaHora(value)
}

export function formatTamanoBackup(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
