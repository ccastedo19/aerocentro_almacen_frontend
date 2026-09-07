import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CheckCircle,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { createColumnHelper } from "@tanstack/react-table"
import { Link, useNavigate } from "react-router-dom"

import { ModalConfirmarEliminar } from "@/components/modal/ModalConfirmarEliminar"
import { ModalDetalleOrdenRecepcion } from "@/components/modal/ModalDetalleOrdenRecepcion"
import { ModalVerPdfRecepcion } from "@/components/modal/ModalVerPdfRecepcion"
import { AlertError } from "@/components/ui/alert-error"
import { PagePreloader } from "@/components/ui/page-preloader"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { type DataTableFeatures } from "@/components/ui/data-table-features"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api"
import {
  badgeColorEstadoOrden,
  eliminarOrdenRecepcion,
  etiquetaEstadoOrden,
  finalizarOrdenRecepcion,
  listarOrdenesRecepcion,
  obtenerPdfOrden,
  ORDEN_ESTADO_BORRADOR,
  ORDEN_ESTADO_FINALIZADO,
  type OrdenRecepcion,
} from "@/lib/ordenes-recepcion"
import { toastExito } from "@/lib/toast"

type TabFiltro = "todos" | "borradores" | "finalizados"

export const HistorialRecepcion = () => {
  const navigate = useNavigate()
  const [ordenes, setOrdenes] = useState<OrdenRecepcion[]>([])
  const [search, setSearch] = useState("")
  const [tabFiltro, setTabFiltro] = useState<TabFiltro>("todos")
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState("")

  // Modal Detalle
  const [selectedOrden, setSelectedOrden] = useState<OrdenRecepcion | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Modal Eliminar
  const [deletingOrden, setDeletingOrden] = useState<OrdenRecepcion | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  // Modal PDF
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [pdfNumeroOrden, setPdfNumeroOrden] = useState("")

  const loadData = useCallback(async () => {
    const ordenesData = await listarOrdenesRecepcion()
    setOrdenes(ordenesData)
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setPageError("")

    loadData()
      .catch((error) => {
        if (cancelled) return
        setPageError(
          error instanceof ApiError
            ? error.message
            : "No se pudo cargar el historial de recepción.",
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [loadData])

  // Filtrado
  const filteredOrdenes = useMemo(() => {
    return ordenes.filter((o) => {
      if (tabFiltro === "borradores" && o.estado !== ORDEN_ESTADO_BORRADOR) {
        return false
      }
      if (tabFiltro === "finalizados" && o.estado !== ORDEN_ESTADO_FINALIZADO) {
        return false
      }

      if (!search.trim()) return true
      const query = search.toLowerCase()
      const matchNumero = o.numero_orden.toLowerCase().includes(query)
      const matchCliente = o.cliente?.nombre_completo.toLowerCase().includes(query)
      const matchModelo = o.modelo.toLowerCase().includes(query)
      const matchSerie = o.serie.toLowerCase().includes(query)
      const matchMatricula = o.matricula?.toLowerCase().includes(query)

      return matchNumero || matchCliente || matchModelo || matchSerie || matchMatricula
    })
  }, [ordenes, tabFiltro, search])

  // Acciones
  const handleVerPdf = async (orden: OrdenRecepcion) => {
    try {
      setPdfNumeroOrden(orden.numero_orden)
      setPdfBase64(null)
      setPdfModalOpen(true)

      const base64 = await obtenerPdfOrden(orden.id)
      setPdfBase64(base64)
    } catch (err) {
      setPdfModalOpen(false)
      setPageError(
        err instanceof ApiError ? err.message : "Error al generar el PDF.",
      )
    }
  }

  const handleFinalizar = async (orden: OrdenRecepcion) => {
    try {
      const res = await finalizarOrdenRecepcion(orden.id)
      toastExito(`Orden ${orden.numero_orden} finalizada exitosamente`)

      setOrdenes((prev) =>
        prev.map((o) => (o.id === orden.id ? res.orden : o)),
      )

      if (isDetailOpen) {
        setSelectedOrden(res.orden)
      }

      // Mostrar PDF
      setPdfNumeroOrden(orden.numero_orden)
      setPdfBase64(res.pdf_base64)
      setPdfModalOpen(true)
    } catch (err) {
      setPageError(
        err instanceof ApiError ? err.message : "Error al finalizar la orden.",
      )
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingOrden) return
    try {
      setIsDeleting(true)
      setDeleteError("")
      await eliminarOrdenRecepcion(deletingOrden.id)
      toastExito(`Orden ${deletingOrden.numero_orden} eliminada`)
      setOrdenes((prev) => prev.filter((o) => o.id !== deletingOrden.id))
      setDeletingOrden(null)
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : "No se pudo eliminar el documento de recepción.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<DataTableFeatures, OrdenRecepcion>()

    return columnHelper.columns([
      columnHelper.accessor("numero_orden", {
        header: "N° Orden",
        sortFn: "text",
        cell: ({ row }) => (
          <div className="font-mono font-bold text-primary flex items-center gap-1.5">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            {row.original.numero_orden}
          </div>
        ),
      }),

      columnHelper.accessor("created_at", {
        header: "Fecha",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(row.original.created_at).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      }),

      columnHelper.accessor("cliente.nombre_completo", {
        header: "Cliente",
        sortFn: "text",
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-foreground">
              {row.original.cliente?.nombre_completo || "Sin cliente"}
            </div>
            {row.original.cliente?.nit && (
              <div className="text-[11px] text-muted-foreground">
                NIT: {row.original.cliente.nit}
              </div>
            )}
          </div>
        ),
      }),

      columnHelper.accessor("modelo", {
        header: "Motor / Aeronave",
        cell: ({ row }) => {
          const o = row.original
          return (
            <div className="text-xs space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold capitalize text-foreground">
                  {o.marca}
                </span>
                <span className="text-muted-foreground">&bull;</span>
                <span className="font-mono text-muted-foreground">{o.modelo}</span>
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                <span>S/N: {o.serie}</span>
                {o.matricula && (
                  <span>&bull; Matrícula: <strong className="text-foreground">{o.matricula}</strong></span>
                )}
                {o.bimotor && (
                  <span className="bg-primary/10 text-primary px-1.5 py-0.2 rounded text-[10px] font-semibold">
                    BiMotor ({o.motor_posicion || "ambos"})
                  </span>
                )}
              </div>
            </div>
          )
        },
      }),

      columnHelper.accessor((row) => row.items?.length || 0, {
        id: "items_count",
        header: "Ítems",
        cell: ({ row }) => (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
            {row.original.items?.length || 0}
          </span>
        ),
      }),

      columnHelper.accessor("estado", {
        header: "Estado",
        cell: ({ row }) => (
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColorEstadoOrden(
              row.original.estado,
            )}`}
          >
            {etiquetaEstadoOrden(row.original.estado)}
          </span>
        ),
      }),

      columnHelper.display({
        id: "acciones",
        header: "",
        cell: ({ row }) => {
          const orden = row.original
          const esBorrador = orden.estado === ORDEN_ESTADO_BORRADOR

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Acciones de ${orden.numero_orden}`}
                    />
                  }
                >
                  <MoreHorizontal />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedOrden(orden)
                      setIsDetailOpen(true)
                    }}
                    className="gap-2 cursor-pointer"
                  >
                    <Eye className="size-4 text-muted-foreground" />
                    Ver detalles
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => handleVerPdf(orden)}
                    className="gap-2 cursor-pointer"
                  >
                    <FileText className="size-4 text-primary" />
                    Ver documento PDF
                  </DropdownMenuItem>

                  {esBorrador && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleFinalizar(orden)}
                        className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600 font-medium"
                      >
                        <CheckCircle className="size-4" />
                        Finalizar orden
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => navigate(`/punto-recepcion?id=${orden.id}`)}
                        className="gap-2 cursor-pointer text-amber-600 focus:text-amber-600 font-medium"
                      >
                        <Pencil className="size-4 text-amber-600" />
                        Editar borrador
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      setDeleteError("")
                      setDeletingOrden(orden)
                    }}
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Eliminar documento
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      }),
    ])
  }, [navigate])

  if (isLoading) {
    return <PagePreloader recurso="historial de recepción" />
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Historial de Recepción
          </h1>
          <p className="text-sm text-muted-foreground">
            Consulta y gestiona todos los documentos de recepción emitidos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/punto-recepcion">
            <Button size="sm" className="gap-1.5 font-medium">
              <Plus className="size-4" />
              Nueva Recepción
            </Button>
          </Link>
        </div>
      </div>

      {pageError && (
        <AlertError onClose={() => setPageError("")}>{pageError}</AlertError>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex w-fit flex-wrap rounded-lg border bg-muted/50 p-0.5">
          <Button
            type="button"
            className="h-8 px-3 text-xs"
            variant={tabFiltro === "todos" ? "default" : "ghost"}
            onClick={() => setTabFiltro("todos")}
          >
            Todos ({ordenes.length})
          </Button>
          <Button
            type="button"
            className="h-8 px-3 text-xs"
            variant={tabFiltro === "borradores" ? "default" : "ghost"}
            onClick={() => setTabFiltro("borradores")}
          >
            Borradores (
            {ordenes.filter((o) => o.estado === ORDEN_ESTADO_BORRADOR).length}
            )
          </Button>
          <Button
            type="button"
            className="h-8 px-3 text-xs"
            variant={tabFiltro === "finalizados" ? "default" : "ghost"}
            onClick={() => setTabFiltro("finalizados")}
          >
            Finalizados (
            {ordenes.filter((o) => o.estado === ORDEN_ESTADO_FINALIZADO).length}
            )
          </Button>
        </div>

        {/* Input Buscador */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por N° orden, cliente, serie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={filteredOrdenes}
        search={search}
        pageSizeOptions={[10, 20, 50]}
        emptyMessage="No se encontraron documentos de recepción"
        emptyDescription="Registra un nuevo documento en el Punto de Recepción."
      />

      {/* Modal Detalle */}
      <ModalDetalleOrdenRecepcion
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        orden={selectedOrden}
        onVerPdf={handleVerPdf}
        onFinalizar={handleFinalizar}
        onEditarBorrador={(orden) => {
          setIsDetailOpen(false)
          navigate(`/punto-recepcion?id=${orden.id}`)
        }}
      />

      {/* Modal Eliminar */}
      <ModalConfirmarEliminar
        open={deletingOrden !== null}
        singular="documento de recepción"
        nombre={deletingOrden ? deletingOrden.numero_orden : ""}
        isSubmitting={isDeleting}
        error={deleteError}
        onOpenChange={(open) => !open && setDeletingOrden(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal PDF */}
      <ModalVerPdfRecepcion
        open={pdfModalOpen}
        onOpenChange={setPdfModalOpen}
        pdfBase64={pdfBase64}
        numeroOrden={pdfNumeroOrden}
      />
    </div>
  )
}
