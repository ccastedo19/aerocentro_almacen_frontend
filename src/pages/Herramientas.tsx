import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CirclePause,
  CirclePlay,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { createColumnHelper } from "@tanstack/react-table"

import { ModalConfirmarEliminar } from "@/components/modal/ModalConfirmarEliminar"
import {
  ModalHerramienta,
  type HerramientaFieldErrors,
} from "@/components/modal/ModalHerramienta"
import { ModalVerUnidades } from "@/components/modal/ModalVerUnidades"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiError } from "@/lib/api"
import { listarCatalogo, type CatalogoItem } from "@/lib/catalogo"
import {
  actualizarHerramienta,
  cambiarEstadoHerramienta,
  crearHerramienta,
  eliminarHerramienta,
  etiquetaEstadoHerramienta,
  HERRAMIENTA_ESTADO_ACTIVO,
  HERRAMIENTA_ESTADO_INACTIVO,
  listarHerramientas,
  type Herramienta,
  type HerramientaFormValues,
} from "@/lib/herramientas"

type EstadoFiltro = "todos" | "activo" | "inactivo"

export const Herramientas = () => {
  const [items, setItems] = useState<Herramienta[]>([])
  const [categorias, setCategorias] = useState<CatalogoItem[]>([])
  const [marcas, setMarcas] = useState<CatalogoItem[]>([])
  const [ubicaciones, setUbicaciones] = useState<CatalogoItem[]>([])
  const [search, setSearch] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos")
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Herramienta | null>(null)
  const [viewingItem, setViewingItem] = useState<Herramienta | null>(null)
  const [deletingItem, setDeletingItem] = useState<Herramienta | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<HerramientaFieldErrors>({})
  const [deleteError, setDeleteError] = useState("")

  const loadItems = useCallback(async () => {
    const [herramientas, categoriasData, marcasData, ubicacionesData] =
      await Promise.all([
        listarHerramientas(),
        listarCatalogo("/api/categorias"),
        listarCatalogo("/api/marcas"),
        listarCatalogo("/api/ubicaciones"),
      ])
    setItems(herramientas)
    setCategorias(categoriasData)
    setMarcas(marcasData)
    setUbicaciones(ubicacionesData)
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
      return items.filter((item) => item.estado === HERRAMIENTA_ESTADO_ACTIVO)
    }

    if (estadoFiltro === "inactivo") {
      return items.filter((item) => item.estado === HERRAMIENTA_ESTADO_INACTIVO)
    }

    return items
  }, [estadoFiltro, items])

  const handleCambiarEstado = useCallback(
    async (herramienta: Herramienta, estado: number) => {
      setPageError("")

      try {
        await cambiarEstadoHerramienta(herramienta.id, estado)
        await loadItems()
      } catch (error) {
        setPageError(
          error instanceof ApiError
            ? error.errors.herramienta?.[0] || error.message
            : "No se pudo actualizar el estado.",
        )
      }
    },
    [loadItems],
  )

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<DataTableFeatures, Herramienta>()

    return columnHelper.columns([
      columnHelper.accessor("nombre", {
        header: "Herramienta",
        sortFn: "text",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
      }),
      columnHelper.accessor((row) => row.categoria?.nombre ?? "—", {
        id: "categoria",
        header: "Categoría",
        sortFn: "text",
      }),
      columnHelper.accessor((row) => row.unidades_total ?? 0, {
        id: "unidades",
        header: "Unidades",
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const herramienta = row.original
          const total = herramienta.unidades_total ?? 0
          const disponibles = herramienta.unidades_disponibles ?? 0

          return (
            <div className="flex items-center gap-2">
              <span className="tabular-nums text-muted-foreground">
                {disponibles}/{total}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setViewingItem(herramienta)}
              >
                <Eye data-icon="inline-start" />
                Ver unidades
              </Button>
            </div>
          )
        },
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
          const herramienta = row.original
          const estaActiva = herramienta.estado === HERRAMIENTA_ESTADO_ACTIVO

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Acciones de ${herramienta.nombre}`}
                  />
                }
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewingItem(herramienta)}>
                  <Eye />
                  Ver unidades
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingItem(herramienta)
                    setFormError("")
                    setFieldErrors({})
                    setIsFormOpen(true)
                  }}
                >
                  <Pencil />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    void handleCambiarEstado(
                      herramienta,
                      estaActiva
                        ? HERRAMIENTA_ESTADO_INACTIVO
                        : HERRAMIENTA_ESTADO_ACTIVO,
                    )
                  }}
                >
                  {estaActiva ? <CirclePause /> : <CirclePlay />}
                  {estaActiva ? "Desactivar" : "Reactivar"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    setDeletingItem(herramienta)
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

  const handleSubmit = async (values: HerramientaFormValues) => {
    setIsSaving(true)
    setFormError("")
    setFieldErrors({})

    try {
      if (editingItem) {
        await actualizarHerramienta(editingItem.id, values)
      } else {
        await crearHerramienta(values)
      }

      await loadItems()
      setIsFormOpen(false)
      setEditingItem(null)
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors({
          nombre: error.errors.nombre?.[0],
          descripcion: error.errors.descripcion?.[0],
          categoria_id: error.errors.categoria_id?.[0],
          unidades: error.errors.unidades?.[0],
        })
        setFormError(error.message)
        return
      }

      setFormError("No se pudo guardar la herramienta.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return

    setIsDeleting(true)
    setDeleteError("")

    try {
      await eliminarHerramienta(deletingItem.id)
      await loadItems()
      setDeletingItem(null)
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.errors.herramienta?.[0] || error.message
          : "No se pudo eliminar la herramienta.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="w-full space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Herramientas</h1>
        <p className="text-sm text-muted-foreground">
          Registra el tipo de herramienta y sus unidades físicas con marca y
          ubicación.
        </p>
      </section>

      <section className="space-y-4">
        {pageError ? (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {pageError}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full max-w-md">
              <label htmlFor="herramienta-search" className="sr-only">
                Buscar herramienta
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="herramienta-search"
                className="h-9 pl-9"
                placeholder="Buscar por nombre o categoría..."
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
                id="herramienta-estado"
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
            Agregar herramienta
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
            Cargando herramientas...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={visibleItems}
            search={search}
            pageSizeOptions={[5, 10, 20]}
            emptyMessage={
              hasSearch
                ? "No se encontraron herramientas"
                : estadoFiltro !== "todos"
                  ? "No hay herramientas en este estado"
                  : "No hay herramientas registradas"
            }
            emptyDescription={
              hasSearch
                ? "Intenta con otro nombre o categoría."
                : "Agrega la primera herramienta y sus unidades para comenzar."
            }
          />
        )}
      </section>

      <ModalHerramienta
        open={isFormOpen}
        item={editingItem}
        categorias={categorias}
        marcas={marcas}
        ubicaciones={ubicaciones}
        isSubmitting={isSaving}
        formError={formError}
        fieldErrors={fieldErrors}
        onOpenChange={(open) => {
          if (!open && isSaving) return
          setIsFormOpen(open)
          if (!open) setEditingItem(null)
        }}
        onSubmit={handleSubmit}
      />

      <ModalVerUnidades
        open={viewingItem !== null}
        herramienta={viewingItem}
        marcas={marcas}
        ubicaciones={ubicaciones}
        onOpenChange={(open) => {
          if (!open) setViewingItem(null)
        }}
        onChanged={() => {
          void loadItems()
        }}
      />

      <ModalConfirmarEliminar
        open={deletingItem !== null}
        singular="herramienta"
        nombre={deletingItem?.nombre}
        descripcion={
          deletingItem
            ? `Se ocultará “${deletingItem.nombre}” del inventario. Primero deben eliminarse sus unidades.`
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
  const activa = estado === HERRAMIENTA_ESTADO_ACTIVO

  return (
    <span
      className={
        activa
          ? "inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
          : "inline-flex rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300"
      }
    >
      {etiquetaEstadoHerramienta(estado)}
    </span>
  )
}
