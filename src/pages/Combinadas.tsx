import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CirclePause,
  CirclePlay,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { createColumnHelper } from "@tanstack/react-table"

import {
  ModalCombinada,
  type CombinadaFieldErrors,
} from "@/components/modal/ModalCombinada"
import { ModalConfirmarEliminar } from "@/components/modal/ModalConfirmarEliminar"
import { AlertError } from "@/components/ui/alert-error"
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
import { PagePreloader } from "@/components/ui/page-preloader"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ICONO_ACCION } from "@/lib/acciones-color"
import { ApiError } from "@/lib/api"
import { toastExito } from "@/lib/toast"
import {
  actualizarCombinada,
  cambiarEstadoCombinada,
  COMBINADA_ESTADO_ACTIVA,
  COMBINADA_ESTADO_INACTIVA,
  crearCombinada,
  eliminarCombinada,
  etiquetaEstadoCombinada,
  listarCombinadas,
  resumenCombinada,
  type Combinada,
  type CombinadaFormValues,
} from "@/lib/combinadas"
import { listarUnidades, type HerramientaUnidad } from "@/lib/herramientas"

type EstadoFiltro = "todos" | "activo" | "inactivo"

export const Combinadas = () => {
  const [items, setItems] = useState<Combinada[]>([])
  const [unidades, setUnidades] = useState<HerramientaUnidad[]>([])
  const [search, setSearch] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos")
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Combinada | null>(null)
  const [deletingItem, setDeletingItem] = useState<Combinada | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<CombinadaFieldErrors>({})
  const [deleteError, setDeleteError] = useState("")

  const loadItems = useCallback(async () => {
    const [combinadas, unidadesData] = await Promise.all([
      listarCombinadas(),
      listarUnidades(),
    ])
    setItems(combinadas)
    setUnidades(unidadesData)
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
            ? error.message
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

  const visibleItems = useMemo(() => {
    if (estadoFiltro === "activo") {
      return items.filter((item) => item.estado === COMBINADA_ESTADO_ACTIVA)
    }

    if (estadoFiltro === "inactivo") {
      return items.filter((item) => item.estado === COMBINADA_ESTADO_INACTIVA)
    }

    return items
  }, [estadoFiltro, items])

  const handleCambiarEstado = useCallback(
    async (combinada: Combinada, estado: number) => {
      setPageError("")

      try {
        await cambiarEstadoCombinada(combinada.id, estado)
        await loadItems()
        toastExito(
          estado === COMBINADA_ESTADO_ACTIVA
            ? "Combinada reactivada correctamente."
            : "Combinada desactivada correctamente.",
        )
      } catch (error) {
        setPageError(
          error instanceof ApiError
            ? error.errors.combinada?.[0] || error.message
            : "No se pudo actualizar el estado.",
        )
      }
    },
    [loadItems],
  )

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<DataTableFeatures, Combinada>()

    return columnHelper.columns([
      columnHelper.accessor("nombre", {
        header: "Combinada",
        sortFn: "text",
        cell: ({ row }) => (
          <div className="min-w-0">
            <span className="font-medium">{row.original.nombre}</span>
            {row.original.descripcion ? (
              <p className="truncate text-xs text-muted-foreground">
                {row.original.descripcion}
              </p>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor((row) => resumenCombinada(row), {
        id: "composicion",
        header: "Composición",
        sortFn: "text",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1.5">
            {(row.original.unidades ?? []).map((unidad) => (
              <span
                key={unidad.id}
                className="inline-flex rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300"
              >
                {unidad.herramienta?.nombre ?? "Herramienta"}
              </span>
            ))}
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.unidades_total ?? 0, {
        id: "unidades",
        header: "Unidades",
        enableGlobalFilter: false,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-muted-foreground">
            {getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("estado", {
        header: "Estado",
        enableGlobalFilter: false,
        cell: ({ getValue }) => <EstadoBadge estado={getValue()} />,
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const combinada = row.original
          const estaActiva = combinada.estado === COMBINADA_ESTADO_ACTIVA

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Acciones de ${combinada.nombre}`}
                  />
                }
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setEditingItem(combinada)
                    setFormError("")
                    setFieldErrors({})
                    setIsFormOpen(true)
                  }}
                >
                  <Pencil className={ICONO_ACCION.editar} />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    void handleCambiarEstado(
                      combinada,
                      estaActiva
                        ? COMBINADA_ESTADO_INACTIVA
                        : COMBINADA_ESTADO_ACTIVA,
                    )
                  }}
                >
                  {estaActiva ? (
                    <CirclePause className={ICONO_ACCION.desactivar} />
                  ) : (
                    <CirclePlay className={ICONO_ACCION.activar} />
                  )}
                  {estaActiva ? "Desactivar" : "Reactivar"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    setDeletingItem(combinada)
                    setDeleteError("")
                  }}
                >
                  <Trash2 />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      }),
    ])
  }, [handleCambiarEstado])

  const hasSearch = search.trim().length > 0

  const handleSubmit = async (values: CombinadaFormValues) => {
    setIsSaving(true)
    setFormError("")
    setFieldErrors({})

    try {
      if (editingItem) {
        await actualizarCombinada(editingItem.id, values)
        toastExito("Combinada actualizada correctamente.")
      } else {
        await crearCombinada(values)
        toastExito("Combinada creada correctamente.")
      }

      await loadItems()
      setIsFormOpen(false)
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors({
          nombre: error.errors.nombre?.[0],
          descripcion: error.errors.descripcion?.[0],
          unidades_ids: error.errors.unidades_ids?.[0],
        })
        setFormError(error.message)
        return
      }

      setFormError("No se pudo guardar la combinada.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return

    setIsDeleting(true)
    setDeleteError("")

    try {
      await eliminarCombinada(deletingItem.id)
      await loadItems()
      setDeletingItem(null)
      toastExito("Combinada eliminada correctamente.")
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.errors.combinada?.[0] || error.message
          : "No se pudo eliminar la combinada.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return <PagePreloader recurso="todas las combinadas" />
  }

  return (
    <div className="w-full space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Combinadas</h1>
        <p className="text-sm text-muted-foreground">
          Agrupa varias unidades en un solo conjunto para prestarlas juntas, como
          una llave de bujía formada por chicharra, extensión y dado.
        </p>
      </section>

      <section className="space-y-4">
        {pageError ? (
          <AlertError onClose={() => setPageError("")}>{pageError}</AlertError>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full max-w-md">
              <label htmlFor="combinada-search-page" className="sr-only">
                Buscar combinada
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="combinada-search-page"
                className="h-9 pl-9"
                placeholder="Buscar por nombre o herramienta..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <Select
              value={estadoFiltro}
              items={{
                todos: "Todos los estados",
                activo: "Activas",
                inactivo: "Inactivas",
              }}
              onValueChange={(value) => {
                if (value == null) return
                setEstadoFiltro(value as EstadoFiltro)
              }}
            >
              <SelectTrigger
                id="combinada-estado"
                className="h-10 min-w-[12rem]"
                aria-label="Filtrar por estado"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activas</SelectItem>
                <SelectItem value="inactivo">Inactivas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            size="lg"
            className="h-9 sm:shrink-0"
            onClick={() => {
              setEditingItem(null)
              setFormError("")
              setFieldErrors({})
              setIsFormOpen(true)
            }}
          >
            <Plus data-icon="inline-start" />
            Agregar combinada
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={visibleItems}
          search={search}
          pageSizeOptions={[5, 10, 20]}
          emptyMessage={
            hasSearch
              ? "No se encontraron combinadas"
              : estadoFiltro !== "todos"
                ? "No hay combinadas en este estado"
                : "No hay combinadas registradas"
          }
          emptyDescription={
            hasSearch
              ? "Intenta con otro nombre o herramienta."
              : "Crea la primera combinada para prestar varias unidades juntas."
          }
        />
      </section>

      <ModalCombinada
        open={isFormOpen}
        item={editingItem}
        unidades={unidades}
        isSubmitting={isSaving}
        formError={formError}
        fieldErrors={fieldErrors}
        onOpenChange={(open) => {
          if (!open && isSaving) return
          setIsFormOpen(open)
        }}
        onSubmit={handleSubmit}
      />

      <ModalConfirmarEliminar
        open={deletingItem !== null}
        singular="combinada"
        nombre={deletingItem?.nombre}
        descripcion={
          deletingItem
            ? `Se ocultará “${deletingItem.nombre}”. Las unidades seguirán disponibles por separado.`
            : undefined
        }
        isSubmitting={isDeleting}
        error={deleteError}
        onOpenChange={(open) => {
          if (!open && isDeleting) return
          if (!open) setDeletingItem(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function EstadoBadge({ estado }: { estado: number }) {
  const activa = estado === COMBINADA_ESTADO_ACTIVA

  return (
    <span
      className={
        activa
          ? "inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
          : "inline-flex rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300"
      }
    >
      {etiquetaEstadoCombinada(estado)}
    </span>
  )
}
