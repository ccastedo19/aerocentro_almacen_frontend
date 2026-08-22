import { useCallback, useEffect, useMemo, useState } from "react"
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { createColumnHelper } from "@tanstack/react-table"

import { ModalCatalogo } from "@/components/modal/ModalCatalogo"
import { ModalConfirmarEliminar } from "@/components/modal/ModalConfirmarEliminar"
import { AlertError } from "@/components/ui/alert-error"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { type DataTableFeatures } from "@/components/ui/data-table-features"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api"
import {
  actualizarCatalogo,
  crearCatalogo,
  eliminarCatalogo,
  listarCatalogo,
  type CatalogoFormValues,
  type CatalogoItem,
} from "@/lib/catalogo"

export type CatalogoPageProps = {
  titulo: string
  descripcion: string
  singular: string
  plural: string
  resourcePath: string
  searchPlaceholder: string
  nombrePlaceholder: string
  descripcionPlaceholder: string
}

export function CatalogoPage({
  titulo,
  descripcion,
  singular,
  plural,
  resourcePath,
  searchPlaceholder,
  nombrePlaceholder,
  descripcionPlaceholder,
}: CatalogoPageProps) {
  const [items, setItems] = useState<CatalogoItem[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CatalogoItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<CatalogoItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState("")
  const [nombreError, setNombreError] = useState("")
  const [deleteError, setDeleteError] = useState("")

  const loadItems = useCallback(async () => {
    const data = await listarCatalogo(resourcePath)
    setItems(data)
  }, [resourcePath])

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

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<DataTableFeatures, CatalogoItem>()

    return columnHelper.columns([
      columnHelper.accessor("nombre", {
        header: "Nombre",
        sortFn: "text",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("descripcion", {
        header: "Descripción",
        sortFn: "text",
        cell: ({ getValue }) => {
          const value = getValue()

          return value ? (
            <span className="block max-w-xl whitespace-normal text-muted-foreground">
              {value}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Acciones de ${row.original.nombre}`}
                />
              }
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditingItem(row.original)
                  setFormError("")
                  setNombreError("")
                  setIsFormOpen(true)
                }}
              >
                <Pencil />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  setDeletingItem(row.original)
                  setDeleteError("")
                }}
              >
                <Trash2 />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ])
  }, [])

  const hasSearch = search.trim().length > 0

  const handleSubmit = async (values: CatalogoFormValues) => {
    setIsSaving(true)
    setFormError("")
    setNombreError("")

    try {
      if (editingItem) {
        await actualizarCatalogo(resourcePath, editingItem.id, values)
      } else {
        await crearCatalogo(resourcePath, values)
      }

      await loadItems()
      setIsFormOpen(false)
      setEditingItem(null)
    } catch (error) {
      if (error instanceof ApiError) {
        setNombreError(error.errors.nombre?.[0] ?? "")
        setFormError(error.message)
        return
      }

      setFormError("No se pudo guardar el registro.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return

    setIsDeleting(true)
    setDeleteError("")

    try {
      await eliminarCatalogo(resourcePath, deletingItem.id)
      await loadItems()
      setDeletingItem(null)
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.message
          : "No se pudo eliminar el registro.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="w-full space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        <p className="text-sm text-muted-foreground">{descripcion}</p>
      </section>

      <section className="space-y-4">
        {pageError ? (
          <AlertError onClose={() => setPageError("")}>{pageError}</AlertError>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <label htmlFor={`${singular}-search`} className="sr-only">
              Buscar {singular}
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`${singular}-search`}
              className="h-9 pl-9"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Button
            size="lg"
            className="h-9 sm:shrink-0"
            onClick={() => {
              setEditingItem(null)
              setFormError("")
              setNombreError("")
              setIsFormOpen(true)
            }}
          >
            <Plus data-icon="inline-start" />
            Agregar {singular}
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
            Cargando {plural}...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            search={search}
            pageSizeOptions={[5, 10, 20]}
            emptyMessage={
              hasSearch
                ? `No se encontraron ${plural}`
                : `No hay ${plural} registradas`
            }
            emptyDescription={
              hasSearch
                ? "Intenta con otro nombre o descripción."
                : `Agrega la primera ${singular} para comenzar.`
            }
          />
        )}
      </section>

      <ModalCatalogo
        open={isFormOpen}
        singular={singular}
        nombrePlaceholder={nombrePlaceholder}
        descripcionPlaceholder={descripcionPlaceholder}
        item={editingItem}
        isSubmitting={isSaving}
        formError={formError}
        nombreError={nombreError}
        onOpenChange={(open) => {
          if (!open && isSaving) return
          setIsFormOpen(open)
          if (!open) setEditingItem(null)
        }}
        onSubmit={handleSubmit}
      />

      <ModalConfirmarEliminar
        open={deletingItem !== null}
        singular={singular}
        nombre={deletingItem?.nombre}
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
