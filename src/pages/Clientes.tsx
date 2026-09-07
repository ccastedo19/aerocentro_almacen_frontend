import { useCallback, useEffect, useMemo, useState } from "react"
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { createColumnHelper } from "@tanstack/react-table"

import {
  ModalCliente,
  type ClienteFieldErrors,
} from "@/components/modal/ModalCliente"
import { ModalConfirmarEliminar } from "@/components/modal/ModalConfirmarEliminar"
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
import { ICONO_ACCION } from "@/lib/acciones-color"
import { ApiError } from "@/lib/api"
import { toastExito } from "@/lib/toast"
import {
  actualizarCliente,
  CLIENTE_ESTADO_ACTIVO,
  crearCliente,
  eliminarCliente,
  inicialesCliente,
  listarClientes,
  type Cliente,
  type ClienteFormValues,
} from "@/lib/clientes"

export const Clientes = () => {
  const [items, setItems] = useState<Cliente[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Cliente | null>(null)
  const [deletingItem, setDeletingItem] = useState<Cliente | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<ClienteFieldErrors>({})
  const [deleteError, setDeleteError] = useState("")

  const loadItems = useCallback(async () => {
    const data = await listarClientes()
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

  const visibleItems = useMemo(() => items, [items])


  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<DataTableFeatures, Cliente>()

    return columnHelper.columns([
      columnHelper.accessor("nombre_completo", {
        header: "Cliente",
        sortFn: "text",
        cell: ({ row }) => {
          const cliente = row.original
          const iniciales = inicialesCliente(cliente)
          return (
            <div className="flex items-center gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                {iniciales}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{cliente.nombre_completo}</p>
                {cliente.apodo ? (
                  <p className="truncate text-xs text-muted-foreground">
                    &quot;{cliente.apodo}&quot;
                  </p>
                ) : null}
              </div>
            </div>
          )
        },
      }),
      columnHelper.accessor("nit", {
        header: "NIT",
        sortFn: "text",
        cell: ({ getValue }) =>
          getValue() ? (
            <span className="font-mono text-sm">{getValue()}</span>
          ) : (
            "—"
          ),
      }),
      columnHelper.accessor("correo", {
        header: "Correo",
        sortFn: "text",
        cell: ({ getValue }) => getValue() || "—",
      }),
      columnHelper.accessor("celular", {
        header: "Celular",
        sortFn: "text",
        cell: ({ getValue }) => getValue() || "—",
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const cliente = row.original

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Acciones de ${cliente.nombre_completo}`}
                  />
                }
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-full">
                <DropdownMenuItem
                  onClick={() => {
                    setEditingItem(cliente)
                    setFormError("")
                    setFieldErrors({})
                    setIsFormOpen(true)
                  }}
                >
                  <Pencil className={ICONO_ACCION.editar} />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    setDeletingItem(cliente)
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
  }, [])

  const hasSearch = search.trim().length > 0

  const handleSubmit = async (values: ClienteFormValues) => {
    setIsSaving(true)
    setFormError("")
    setFieldErrors({})

    try {
      if (editingItem) {
        await actualizarCliente(editingItem.id, values)
        toastExito("Cliente actualizado correctamente.")
      } else {
        await crearCliente(values)
        toastExito("Cliente creado correctamente.")
      }

      await loadItems()
      setIsFormOpen(false)
      setEditingItem(null)
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors({
          nombre_completo: error.errors.nombre_completo?.[0],
          apodo: error.errors.apodo?.[0],
          nit: error.errors.nit?.[0],
          correo: error.errors.correo?.[0],
          celular: error.errors.celular?.[0],
        })
        setFormError(error.message)
        return
      }

      setFormError("No se pudo guardar el cliente.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return

    setIsDeleting(true)
    setDeleteError("")

    try {
      await eliminarCliente(deletingItem.id)
      await loadItems()
      setDeletingItem(null)
      toastExito("Cliente eliminado correctamente.")
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.errors.cliente?.[0] || error.message
          : "No se pudo eliminar el cliente.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return <PagePreloader recurso="todos los clientes" />
  }

  return (
    <div className="w-full space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona los clientes registrados en el sistema.
        </p>
      </section>

      <section className="space-y-4">
        {pageError ? (
          <AlertError onClose={() => setPageError("")}>{pageError}</AlertError>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <label htmlFor="cliente-search" className="sr-only">
              Buscar cliente
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="cliente-search"
              className="h-9 pl-9"
              placeholder="Buscar por nombre, NIT, correo o celular..."
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
              setFieldErrors({})
              setIsFormOpen(true)
            }}
          >
            <Plus data-icon="inline-start" />
            Agregar cliente
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={visibleItems}
          search={search}
          pageSizeOptions={[5, 10, 20]}
          emptyMessage={
            hasSearch ? "No se encontraron clientes" : "No hay clientes registrados"
          }
          emptyDescription={
            hasSearch
              ? "Intenta con otro nombre, NIT, correo o celular."
              : "Agrega el primer cliente para comenzar."
          }
        />
      </section>

      <ModalCliente
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
        singular="cliente"
        nombre={deletingItem?.nombre_completo}
        descripcion={
          deletingItem
            ? `Se ocultará a "${deletingItem.nombre_completo}" del sistema.`
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
