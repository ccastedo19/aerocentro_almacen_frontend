import { useCallback, useEffect, useRef, useState } from "react"
import { Download, RotateCcw, Upload } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { ModalConfirmarRestaurarBackup } from "@/components/modal/ModalConfirmarRestaurarBackup"
import { AlertError } from "@/components/ui/alert-error"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PagePreloader } from "@/components/ui/page-preloader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api"
import { toastExito } from "@/lib/toast"
import {
  descargarBackupActual,
  formatFechaBackup,
  formatTamanoBackup,
  listarBackups,
  restaurarBackup,
  subirBackup,
  type BackupItem,
} from "@/lib/backups"

export const Backup = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<BackupItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [pageError, setPageError] = useState("")
  const [restoreError, setRestoreError] = useState("")
  const [usingItem, setUsingItem] = useState<BackupItem | null>(null)

  const loadItems = useCallback(async () => {
    setItems(await listarBackups())
  }, [])

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setPageError("")

    loadItems()
      .catch((error) => {
        if (cancelled) return
        setPageError(
          error instanceof ApiError
            ? error.status === 403
              ? "No tienes permiso para administrar backups."
              : error.message
            : "No se pudo cargar la lista.",
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [loadItems])

  const handleDescargar = async () => {
    setIsDownloading(true)
    setPageError("")

    try {
      await descargarBackupActual()
      await loadItems()
      toastExito("Backup descargado", "El SQL actual quedó guardado en la tabla.")
    } catch (error) {
      setPageError(
        error instanceof ApiError
          ? error.message
          : "No se pudo descargar el backup.",
      )
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSubir = async (archivo: File | undefined) => {
    if (!archivo) return

    setIsUploading(true)
    setPageError("")

    try {
      await subirBackup(archivo)
      await loadItems()
      toastExito("Backup cargado", "El archivo ya aparece en la tabla.")
    } catch (error) {
      setPageError(
        error instanceof ApiError
          ? error.errors.archivo?.[0] || error.message
          : "No se pudo subir el backup.",
      )
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRestaurar = async () => {
    if (!usingItem) return

    setIsRestoring(true)
    setRestoreError("")

    try {
      await restaurarBackup(usingItem.id)
      setUsingItem(null)
      await logout()
      navigate("/login", { replace: true })
    } catch (error) {
      setRestoreError(
        error instanceof ApiError
          ? error.message
          : "No se pudo usar el backup.",
      )
    } finally {
      setIsRestoring(false)
    }
  }

  if (isLoading) {
    return <PagePreloader recurso="todos los backups" />
  }

  return (
    <div className="w-full space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Backup</h1>
        <p className="text-sm text-muted-foreground">
          Descarga el SQL actual del almacén, carga copias anteriores y restáuralas
          cuando lo necesites.
        </p>
      </section>

      {pageError ? (
        <AlertError onClose={() => setPageError("")}>{pageError}</AlertError>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Cómo funciona el backup</CardTitle>
            <CardDescription>
              Conserva una copia del almacén y vuelve a ella si algo se pierde o
              se carga por error.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  1
                </span>
                <p>
                  <span className="font-medium">Descargar backup actual</span>{" "}
                  genera el SQL completo (herramientas, unidades, préstamos,
                  mecánicos y usuarios) y también lo guarda en la tabla de la
                  derecha para poder usarlo después.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  2
                </span>
                <p>
                  <span className="font-medium">Subir backup</span> carga un
                  archivo <span className="font-medium">.sql</span> que ya
                  tengas. Queda listado con su fecha.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  3
                </span>
                <p>
                  <span className="font-medium">Usar</span> restaura esa copia y
                  reemplaza los datos actuales. Al terminar se cerrará tu sesión
                  y tendrás que volver a iniciar. Esta acción no se puede
                  deshacer.
                </p>
              </li>
            </ol>

            <input
              ref={fileInputRef}
              type="file"
              accept=".sql,.txt,application/sql,text/plain"
              className="sr-only"
              onChange={(event) => {
                void handleSubir(event.target.files?.[0])
              }}
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="sm:flex-1"
                disabled={isDownloading || isUploading}
                onClick={() => {
                  void handleDescargar()
                }}
              >
                <Download data-icon="inline-start" />
                {isDownloading ? "Generando..." : "Descargar backup actual"}
              </Button>
              <Button
                type="button"
                variant="info"
                className="sm:flex-1"
                disabled={isDownloading || isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload data-icon="inline-start" />
                {isUploading ? "Subiendo..." : "Subir backup"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backups cargados</CardTitle>
            <CardDescription>
              Fecha de cada copia guardada. Usa una para volver el almacén a ese
              momento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aún no hay backups. Descarga el actual o sube un archivo SQL.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-card ring-1 ring-foreground/10">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-11 px-4">Fecha</TableHead>
                      <TableHead className="h-11 px-4">Archivo</TableHead>
                      <TableHead className="h-11 px-4">Tamaño</TableHead>
                      <TableHead className="h-11 px-4 text-right">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="px-4 py-3 tabular-nums">
                          {formatFechaBackup(item.fecha)}
                        </TableCell>
                        <TableCell className="max-w-44 truncate px-4 py-3 font-medium">
                          {item.nombre_archivo}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground tabular-nums">
                          {formatTamanoBackup(item.tamano)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="warning"
                            onClick={() => {
                              setRestoreError("")
                              setUsingItem(item)
                            }}
                          >
                            <RotateCcw data-icon="inline-start" />
                            Usar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <ModalConfirmarRestaurarBackup
        backup={usingItem}
        open={usingItem !== null}
        isSubmitting={isRestoring}
        error={restoreError}
        onOpenChange={(open) => {
          if (!open && isRestoring) return
          if (!open) setUsingItem(null)
        }}
        onConfirm={() => {
          void handleRestaurar()
        }}
      />
    </div>
  )
}
