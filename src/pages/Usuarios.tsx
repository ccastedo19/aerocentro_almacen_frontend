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
  ModalUsuario,
  type UsuarioFieldErrors,
} from "@/components/modal/ModalUsuario"
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
import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api"
import { getNombreCompleto, type Rol, type Usuario } from "@/lib/auth"
import {
  actualizarUsuario,
  cambiarEstadoUsuario,
  crearUsuario,
  eliminarUsuario,
  etiquetaEstadoUsuario,
  listarRoles,
  listarUsuarios,
  USUARIO_ESTADO_ACTIVO,
  USUARIO_ESTADO_INACTIVO,
  type UsuarioFormValues,
} from "@/lib/usuarios"

type EstadoFiltro = "todos" | "activo" | "inactivo"

export const Usuarios = () => {
  const { usuario: sesionUsuario, refreshUsuario } = useAuth()
  const [items, setItems] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [search, setSearch] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos")
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Usuario | null>(null)
  const [deletingItem, setDeletingItem] = useState<Usuario | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<UsuarioFieldErrors>({})
  const [deleteError, setDeleteError] = useState("")

  const loadItems = useCallback(async () => {
    const [usuarios, rolesData] = await Promise.all([
      listarUsuarios(),
      listarRoles(),
    ])
    setItems(usuarios)
    setRoles(rolesData)
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
              ? "No tienes permiso para administrar usuarios."
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

  const visibleItems = useMemo(() => {
    if (estadoFiltro === "activo") {
      return items.filter((item) => item.estado === USUARIO_ESTADO_ACTIVO)
    }

    if (estadoFiltro === "inactivo") {
      return items.filter((item) => item.estado === USUARIO_ESTADO_INACTIVO)
    }

    return items
  }, [estadoFiltro, items])

  const handleCambiarEstado = useCallback(
    async (usuario: Usuario, estado: number) => {
      setPageError("")

      try {
        await cambiarEstadoUsuario(usuario.id, estado)
        await loadItems()
      } catch (error) {
        setPageError(
          error instanceof ApiError
            ? error.errors.estado?.[0] ||
                error.errors.usuario?.[0] ||
                error.message
            : "No se pudo actualizar el estado.",
        )
      }
    },
    [loadItems],
  )

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<DataTableFeatures, Usuario>()

    return columnHelper.columns([
      columnHelper.accessor((row) => getNombreCompleto(row), {
        id: "nombre_completo",
        header: "Nombre",
        sortFn: "text",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("nombre_usuario", {
        header: "Usuario",
        sortFn: "text",
      }),
      columnHelper.accessor("email", {
        header: "Correo",
        sortFn: "text",
      }),
      columnHelper.accessor((row) => row.rol?.nombre ?? "—", {
        id: "rol",
        header: "Rol",
        sortFn: "text",
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
          const usuario = row.original
          const esSesionActual = sesionUsuario?.id === usuario.id
          const estaActivo = usuario.estado === USUARIO_ESTADO_ACTIVO

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Acciones de ${getNombreCompleto(usuario)}`}
                  />
                }
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setEditingItem(usuario)
                    setFormError("")
                    setFieldErrors({})
                    setIsFormOpen(true)
                  }}
                >
                  <Pencil />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={esSesionActual}
                  onClick={() => {
                    void handleCambiarEstado(
                      usuario,
                      estaActivo
                        ? USUARIO_ESTADO_INACTIVO
                        : USUARIO_ESTADO_ACTIVO,
                    )
                  }}
                >
                  {estaActivo ? <CirclePause /> : <CirclePlay />}
                  {estaActivo ? "Desactivar" : "Reactivar"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={esSesionActual}
                  onClick={() => {
                    setDeletingItem(usuario)
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
  }, [handleCambiarEstado, sesionUsuario?.id])

  const hasSearch = search.trim().length > 0

  const handleSubmit = async (values: UsuarioFormValues) => {
    setIsSaving(true)
    setFormError("")
    setFieldErrors({})

    try {
      if (editingItem) {
        await actualizarUsuario(editingItem.id, values)

        if (sesionUsuario?.id === editingItem.id) {
          await refreshUsuario()
        }
      } else {
        await crearUsuario(values)
      }

      await loadItems()
      setIsFormOpen(false)
      setEditingItem(null)
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors({
          nombre: error.errors.nombre?.[0],
          apellido: error.errors.apellido?.[0],
          nombre_usuario: error.errors.nombre_usuario?.[0],
          email: error.errors.email?.[0],
          rol_id: error.errors.rol_id?.[0],
          password: error.errors.password?.[0],
          password_confirmation: error.errors.password_confirmation?.[0],
        })
        setFormError(error.message)
        return
      }

      setFormError("No se pudo guardar el usuario.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return

    setIsDeleting(true)
    setDeleteError("")

    try {
      await eliminarUsuario(deletingItem.id)
      await loadItems()
      setDeletingItem(null)
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.errors.usuario?.[0] || error.message
          : "No se pudo eliminar el usuario.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="w-full space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Administra quién puede entrar al almacén y con qué rol.
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
              <label htmlFor="usuario-search" className="sr-only">
                Buscar usuario
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="usuario-search"
                className="h-9 pl-9"
                placeholder="Buscar por nombre, usuario, correo o rol..."
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
                id="usuario-estado"
                className="h-10 min-w-[12rem]"
                aria-label="Filtrar por estado"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="inactivo">Inactivos</SelectItem>
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
            Agregar usuario
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
            Cargando usuarios...
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={visibleItems}
            search={search}
            pageSizeOptions={[5, 10, 20]}
            emptyMessage={
              hasSearch
                ? "No se encontraron usuarios"
                : estadoFiltro !== "todos"
                  ? "No hay usuarios en este estado"
                  : "No hay usuarios registrados"
            }
            emptyDescription={
              hasSearch
                ? "Intenta con otro nombre, usuario o correo."
                : "Agrega el primer usuario para comenzar."
            }
          />
        )}
      </section>

      <ModalUsuario
        open={isFormOpen}
        item={editingItem}
        roles={roles}
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
        singular="usuario"
        nombre={deletingItem ? getNombreCompleto(deletingItem) : undefined}
        descripcion={
          deletingItem
            ? `Se dará de baja a “${getNombreCompleto(deletingItem)}” y se cerrarán sus sesiones.`
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
  const activo = estado === USUARIO_ESTADO_ACTIVO

  return (
    <span
      className={
        activo
          ? "inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
          : "inline-flex rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300"
      }
    >
      {etiquetaEstadoUsuario(estado)}
    </span>
  )
}
