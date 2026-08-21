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

import { ModalConfirmarEliminar } from "@/components/modal/ModalConfirmarEliminar"
import {
  ModalMecanico,
  type MecanicoFieldErrors,
} from "@/components/modal/ModalMecanico"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  actualizarMecanico,
  cambiarEstadoMecanico,
  crearMecanico,
  eliminarMecanico,
  etiquetaEstadoMecanico,
  getInicialesMecanico,
  listarMecanicos,
  MECANICO_ESTADO_ACTIVO,
  MECANICO_ESTADO_FUERA_DE_SERVICIO,
  type Mecanico,
  type MecanicoFormValues,
} from "@/lib/mecanicos"

type EstadoFiltro = "todos" | "activo" | "fuera"

export const Mecanicos = () => {
  const [items, setItems] = useState<Mecanico[]>([])
  const [search, setSearch] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos")
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Mecanico | null>(null)
  const [deletingItem, setDeletingItem] = useState<Mecanico | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<MecanicoFieldErrors>({})
  const [deleteError, setDeleteError] = useState("")

  const loadItems = useCallback(async () => {
    const data = await listarMecanicos()
    setItems(data)
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
      return items.filter((item) => item.estado === MECANICO_ESTADO_ACTIVO)
    }

    if (estadoFiltro === "fuera") {
      return items.filter(
        (item) => item.estado === MECANICO_ESTADO_FUERA_DE_SERVICIO,
      )
    }

    return items
  }, [estadoFiltro, items])

  const handleCambiarEstado = useCallback(
    async (mecanico: Mecanico, estado: number) => {
      setPageError("")

      try {
        await cambiarEstadoMecanico(mecanico.id, estado)
        await loadItems()
      } catch (error) {
        setPageError(
          error instanceof ApiError
            ? error.errors.mecanico?.[0] || error.message
            : "No se pudo actualizar el estado.",
        )
      }
    },
    [loadItems],
  )

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<DataTableFeatures, Mecanico>()

    return columnHelper.columns([
      columnHelper.accessor("nombre_completo", {
        header: "Mecánico",
        sortFn: "text",
        cell: ({ row }) => {
          const mecanico = row.original

          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9 rounded-lg after:rounded-lg">
                {mecanico.imagen ? (
                  <AvatarImage
                    src={mecanico.imagen}
                    alt={mecanico.nombre_completo}
                  />
                ) : null}
                <AvatarFallback className="rounded-lg text-xs">
                  {getInicialesMecanico(mecanico)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{mecanico.nombre_completo}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor("nro_licencia", {
        header: "Licencia",
        sortFn: "text",
      }),
      columnHelper.accessor("cargo", {
        header: "Cargo",
        sortFn: "text",
      }),
      columnHelper.accessor("telefono", {
        header: "Teléfono",
        sortFn: "text",
        cell: ({ getValue }) => getValue() || "—",
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
          const mecanico = row.original
          const estaActivo = mecanico.estado === MECANICO_ESTADO_ACTIVO

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Acciones de ${mecanico.nombre_completo}`}
                  />
                }
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setEditingItem(mecanico)
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
                      mecanico,
                      estaActivo
                        ? MECANICO_ESTADO_FUERA_DE_SERVICIO
                        : MECANICO_ESTADO_ACTIVO,
                    )
                  }}
                >
                  {estaActivo ? <CirclePause /> : <CirclePlay />}
                  {estaActivo ? "Marcar fuera de servicio" : "Reactivar"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    setDeletingItem(mecanico)
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

  const handleSubmit = async (values: MecanicoFormValues) => {
    setIsSaving(true)
    setFormError("")
    setFieldErrors({})

    try {
      if (editingItem) {
        await actualizarMecanico(editingItem.id, values)
      } else {
        await crearMecanico(values)
      }

      await loadItems()
      setIsFormOpen(false)
      setEditingItem(null)
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors({
          nombre: error.errors.nombre?.[0],
          apellido: error.errors.apellido?.[0],
          nro_licencia: error.errors.nro_licencia?.[0],
          cargo: error.errors.cargo?.[0],
          telefono: error.errors.telefono?.[0],
          imagen: error.errors.imagen?.[0],
        })
        setFormError(error.message)
        return
      }

      setFormError("No se pudo guardar el mecánico.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return

    setIsDeleting(true)
    setDeleteError("")

    try {
      await eliminarMecanico(deletingItem.id)
      await loadItems()
      setDeletingItem(null)
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.errors.mecanico?.[0] || error.message
          : "No se pudo eliminar el mecánico.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="w-full space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Mecánicos</h1>
        <p className="text-sm text-muted-foreground">
          Registra al personal del hangar que toma herramientas en préstamo.
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
              <label htmlFor="mecanico-search" className="sr-only">
                Buscar mecánico
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="mecanico-search"
                className="h-10 pl-9"
                placeholder="Buscar por nombre, licencia, cargo o teléfono..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <Select
              value={estadoFiltro}
              onValueChange={(value) => {
                if (value == null) return
                setEstadoFiltro(value as EstadoFiltro)
              }}
            >
              <SelectTrigger
                id="mecanico-estado"
                className="h-10 min-w-[12rem]"
                aria-label="Filtrar por estado"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="fuera">Fuera de servicio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            size="lg"
            className="h-10 sm:shrink-0"
            onClick={() => {
              setEditingItem(null)
              setFormError("")
              setFieldErrors({})
              setIsFormOpen(true)
            }}
          >
            <Plus data-icon="inline-start" />
            Agregar mecánico
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
            Cargando mecánicos...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={visibleItems}
            search={search}
            pageSizeOptions={[5, 10, 20]}
            emptyMessage={
              hasSearch
                ? "No se encontraron mecánicos"
                : estadoFiltro !== "todos"
                  ? "No hay mecánicos en este estado"
                  : "No hay mecánicos registrados"
            }
            emptyDescription={
              hasSearch
                ? "Intenta con otro nombre, licencia o cargo."
                : "Agrega el primer mecánico para comenzar."
            }
          />
        )}
      </section>

      <ModalMecanico
        open={isFormOpen}
        item={editingItem}
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

      <ModalConfirmarEliminar
        open={deletingItem !== null}
        singular="mecánico"
        nombre={deletingItem?.nombre_completo}
        descripcion={
          deletingItem
            ? `Se ocultará a “${deletingItem.nombre_completo}” del personal. No podrá tomar herramientas hasta que lo registres de nuevo.`
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
  const activo = estado === MECANICO_ESTADO_ACTIVO

  return (
    <span
      className={
        activo
          ? "inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
          : "inline-flex rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300"
      }
    >
      {etiquetaEstadoMecanico(estado)}
    </span>
  )
}
