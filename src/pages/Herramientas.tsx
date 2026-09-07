import {
  useCallback,
  useEffect,
  useDeferredValue,
  useMemo,
  useState,
} from "react"
import {
  CirclePause,
  CirclePlay,
  Eye,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react"
import { createColumnHelper } from "@tanstack/react-table"

import { ComboboxFiltro } from "@/components/form/combobox-filtro"
import { ModalConfirmarEliminar } from "@/components/modal/ModalConfirmarEliminar"
import {
  ModalHerramienta,
  type HerramientaFieldErrors,
} from "@/components/modal/ModalHerramienta"
import { ModalVerUnidades } from "@/components/modal/ModalVerUnidades"
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
import { listarCatalogo, type CatalogoItem } from "@/lib/catalogo"
import { opcionesCatalogoConRuta } from "@/lib/catalogo-tree"
import {
  actualizarHerramienta,
  cambiarEstadoHerramienta,
  COLORES_UNIDAD,
  coloresUnidadVisibles,
  crearHerramienta,
  eliminarHerramienta,
  etiquetaColoresUnidad,
  etiquetaColorUnidad,
  etiquetaEstadoHerramienta,
  etiquetaEstadoUnidad,
  HERRAMIENTA_ESTADO_ACTIVO,
  HERRAMIENTA_ESTADO_INACTIVO,
  listarHerramientas,
  listarUnidades,
  UNIDAD_ESTADO_DISPONIBLE,
  UNIDAD_ESTADO_PRESTADA,
  type Herramienta,
  type HerramientaFormValues,
  type HerramientaUnidad,
} from "@/lib/herramientas"
import { opcionesFiltroUnicas } from "@/lib/prestamos"
import { cn } from "@/lib/utils"

type EstadoFiltro = "todos" | "activo" | "inactivo"
type ActiveTab = "herramientas" | "unidades"

type FiltrosUnidades = {
  marca: string
  ubicacion: string
  color1: string
  color2: string
  tamano: string
}

const FILTROS_UNIDADES_VACIOS: FiltrosUnidades = {
  marca: "",
  ubicacion: "",
  color1: "",
  color2: "",
  tamano: "",
}

function insertarCatalogo(
  setItems: (updater: (current: CatalogoItem[]) => CatalogoItem[]) => void,
  item: CatalogoItem,
) {
  setItems((current) => {
    if (current.some((row) => row.id === item.id)) return current

    return [...current, item].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es"),
    )
  })
}

function coincideTexto(valor: string | null | undefined, query: string) {
  const q = query.trim().toLocaleLowerCase()
  if (!q) return true
  return (valor ?? "").trim().toLocaleLowerCase().includes(q)
}

export const Herramientas = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("herramientas")

  // ── Datos compartidos ──────────────────────────────────────────────────────
  const [items, setItems] = useState<Herramienta[]>([])
  const [unidades, setUnidades] = useState<HerramientaUnidad[]>([])
  const [categorias, setCategorias] = useState<CatalogoItem[]>([])
  const [marcas, setMarcas] = useState<CatalogoItem[]>([])
  const [ubicaciones, setUbicaciones] = useState<CatalogoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState("")

  // ── Estado pestaña Herramientas ────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Herramienta | null>(null)
  const [viewingItem, setViewingItem] = useState<Herramienta | null>(null)
  const [deletingItem, setDeletingItem] = useState<Herramienta | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<HerramientaFieldErrors>({})
  const [deleteError, setDeleteError] = useState("")

  // ── Estado pestaña Unidades ────────────────────────────────────────────────
  const [unidadSearch, setUnidadSearch] = useState("")
  const [filtrosUnidades, setFiltrosUnidades] =
    useState<FiltrosUnidades>(FILTROS_UNIDADES_VACIOS)
  const deferredUnidadSearch = useDeferredValue(unidadSearch)
  const deferredFiltros = useDeferredValue(filtrosUnidades)

  // ── Carga de datos ─────────────────────────────────────────────────────────
  const loadItems = useCallback(async () => {
    const [herramientas, unidadesData, categoriasData, marcasData, ubicacionesData] =
      await Promise.all([
        listarHerramientas(),
        listarUnidades(),
        listarCatalogo("/api/categorias"),
        listarCatalogo("/api/marcas"),
        listarCatalogo("/api/ubicaciones"),
      ])
    setItems(herramientas)
    setUnidades(unidadesData)
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

  // ── Memos pestaña Herramientas ─────────────────────────────────────────────
  const visibleItems = useMemo(() => {
    if (estadoFiltro === "activo") {
      return items.filter((item) => item.estado === HERRAMIENTA_ESTADO_ACTIVO)
    }

    if (estadoFiltro === "inactivo") {
      return items.filter((item) => item.estado === HERRAMIENTA_ESTADO_INACTIVO)
    }

    return items
  }, [estadoFiltro, items])

  const categoriasOpciones = useMemo(
    () => opcionesCatalogoConRuta(categorias),
    [categorias],
  )
  const ubicacionesOpciones = useMemo(
    () => opcionesCatalogoConRuta(ubicaciones),
    [ubicaciones],
  )

  // ── Memos pestaña Unidades ─────────────────────────────────────────────────
  const opcionesMarca = useMemo(
    () => opcionesFiltroUnicas(unidades.map((u) => u.marca?.nombre)),
    [unidades],
  )
  const opcionesUbicacion = useMemo(
    () => opcionesFiltroUnicas(unidades.map((u) => u.ubicacion?.nombre)),
    [unidades],
  )
  // opcionesCategoria eliminado — categoría no se usa como filtro en esta pestaña
  const opcionesTamano = useMemo(
    () => opcionesFiltroUnicas(unidades.map((u) => u.tamano)),
    [unidades],
  )
  const opcionesColor = useMemo(
    () =>
      COLORES_UNIDAD.filter((c) => c.value !== "sin_color").map((c) => c.label),
    [],
  )
  const opcionesColor2 = useMemo(
    () => (deferredFiltros.color1.trim() ? opcionesColor : []),
    [deferredFiltros.color1, opcionesColor],
  )

  const unidadesFiltradas = useMemo(() => {
    const query = deferredUnidadSearch.trim().toLocaleLowerCase()
    const f = deferredFiltros

    return unidades.filter((u) => {
      if (query) {
        const texto = [
          u.herramienta?.nombre,
          u.herramienta?.categoria?.nombre,
          u.marca?.nombre,
          u.ubicacion?.nombre,
          u.tamano,
          u.color_primario,
          u.color_secundario,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase()
        if (!texto.includes(query)) return false
      }

      if (!coincideTexto(u.marca?.nombre, f.marca)) return false
      if (!coincideTexto(u.ubicacion?.nombre, f.ubicacion)) return false
      if (!coincideTexto(u.tamano, f.tamano)) return false

      if (f.color1.trim()) {
        const colores = coloresUnidadVisibles(
          u.color_primario,
          u.color_secundario,
        ).map((c) => etiquetaColorUnidad(c).toLocaleLowerCase())
        if (!colores.some((c) => c.includes(f.color1.trim().toLocaleLowerCase())))
          return false
      }
      if (f.color2.trim()) {
        const colores = coloresUnidadVisibles(
          u.color_primario,
          u.color_secundario,
        ).map((c) => etiquetaColorUnidad(c).toLocaleLowerCase())
        if (!colores.some((c) => c.includes(f.color2.trim().toLocaleLowerCase())))
          return false
      }

      return true
    })
  }, [unidades, deferredUnidadSearch, deferredFiltros])

  const hayFiltrosActivos = useMemo(
    () =>
      unidadSearch.trim().length > 0 ||
      Object.values(filtrosUnidades).some((v) => v.trim().length > 0),
    [unidadSearch, filtrosUnidades],
  )

  // ── Columnas pestaña Unidades ─────────────────────────────────────────────
  const columnsUnidades = useMemo(() => {
    const ch = createColumnHelper<DataTableFeatures, HerramientaUnidad>()
    return ch.columns([
      ch.accessor((row) => row.herramienta?.nombre ?? "", {
        id: "herramienta",
        header: "Herramienta",
        sortFn: "text",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() || "—"}</span>
        ),
      }),
      ch.accessor((row) => row.marca?.nombre ?? "", {
        id: "marca",
        header: "Marca",
        sortFn: "text",
        cell: ({ getValue }) => getValue() || <span className="text-muted-foreground">—</span>,
      }),
      ch.accessor(
        (row) =>
          ubicacionesOpciones.find((u) => u.id === row.ubicacion_id)?.ruta ??
          row.ubicacion?.nombre ??
          "",
        {
          id: "ubicacion",
          header: "Ubicación",
          sortFn: "text",
          cell: ({ getValue }) =>
            getValue() ? (
              <span className="text-muted-foreground">{getValue()}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
      ),
      ch.accessor(
        (row) => etiquetaColoresUnidad(row.color_primario, row.color_secundario),
        {
          id: "colores",
          header: "Colores",
          sortFn: "text",
          enableGlobalFilter: false,
          cell: ({ getValue }) => {
            const label = getValue()
            return label === "Sin Color" ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              <span>{label}</span>
            )
          },
        },
      ),
      ch.accessor((row) => row.tamano ?? "", {
        id: "tamano",
        header: "Tamaño",
        sortFn: "text",
        cell: ({ getValue }) =>
          getValue() ? (
            <span className="text-muted-foreground">{getValue()}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      }),
      ch.accessor("estado", {
        header: "Estado",
        enableGlobalFilter: false,
        cell: ({ getValue }) => <UnidadEstadoBadge estado={getValue()} />,
      }),
    ])
  }, [ubicacionesOpciones])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCambiarEstado = useCallback(
    async (herramienta: Herramienta, estado: number) => {
      setPageError("")

      try {
        await cambiarEstadoHerramienta(herramienta.id, estado)
        await loadItems()
        toastExito(
          estado === HERRAMIENTA_ESTADO_ACTIVO
            ? "Herramienta reactivada correctamente."
            : "Herramienta desactivada correctamente.",
        )
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
      columnHelper.accessor(
        (row) =>
          categoriasOpciones.find((categoria) => categoria.id === row.categoria_id)
            ?.ruta
          ?? row.categoria?.nombre
          ?? "—",
        {
          id: "categoria",
          header: "Categoría",
          sortFn: "text",
        },
      ),
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
                variant="info"
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
                  <Eye className={ICONO_ACCION.ver} />
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
                  <Pencil className={ICONO_ACCION.editar} />
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
  }, [categoriasOpciones, handleCambiarEstado])

  const hasSearch = search.trim().length > 0

  const handleSubmit = async (values: HerramientaFormValues) => {
    setIsSaving(true)
    setFormError("")
    setFieldErrors({})

    try {
      if (editingItem) {
        await actualizarHerramienta(editingItem.id, values)
        toastExito("Herramienta actualizada correctamente.")
      } else {
        await crearHerramienta(values)
        toastExito("Herramienta creada correctamente.")
      }

      await loadItems()
      setIsFormOpen(false)
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
      toastExito("Herramienta eliminada correctamente.")
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

  if (isLoading) {
    return <PagePreloader recurso="todas las herramientas" />
  }

  return (
    <div className="w-full space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Herramientas</h1>
        <p className="text-sm text-muted-foreground">
          Registra el tipo de herramienta y sus unidades físicas con marca y
          ubicación.
        </p>
      </section>

      {/* Selector de pestaña */}
      <div className="flex gap-1 rounded-xl border bg-muted/40 p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("herramientas")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 cursor-pointer py-1 text-sm font-medium transition-all",
            activeTab === "herramientas"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Wrench className="size-4" />
          Herramientas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("unidades")}
          className={cn(
            "flex items-center gap-2 rounded-lg cursor-pointer px-4 py-1 text-sm font-medium transition-all",
            activeTab === "unidades"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Layers className="size-4" />
          Unidades
        </button>
      </div>

      {pageError ? (
        <AlertError onClose={() => setPageError("")}>{pageError}</AlertError>
      ) : null}

      {/* ── Pestaña: Herramientas ─────────────────────────────────────────── */}
      {activeTab === "herramientas" && (
        <section className="space-y-4">
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
        </section>
      )}

      {/* ── Pestaña: Unidades ─────────────────────────────────────────────── */}
      {activeTab === "unidades" && (
        <section className="space-y-4">
          {/* Filtros — una sola fila */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Búsqueda libre — más ancha */}
            <div className="relative min-w-[200px] flex-[2]">
              <label htmlFor="unidad-search" className="sr-only">
                Buscar unidad
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="unidad-search"
                className="h-9 pl-9"
                placeholder="Buscar por nombre, marca, color..."
                value={unidadSearch}
                onChange={(e) => setUnidadSearch(e.target.value)}
              />
            </div>

            {/* Filtros más pequeños — flex-1 */}
            <div className="min-w-[110px] flex-1">
              <label htmlFor="filtro-marca" className="sr-only">Marca</label>
              <ComboboxFiltro
                id="filtro-marca"
                placeholder="Marca..."
                value={filtrosUnidades.marca}
                options={opcionesMarca}
                onChange={(v) =>
                  setFiltrosUnidades((prev) => ({ ...prev, marca: v }))
                }
              />
            </div>

            <div className="min-w-[110px] flex-1">
              <label htmlFor="filtro-ubicacion" className="sr-only">Ubicación</label>
              <ComboboxFiltro
                id="filtro-ubicacion"
                placeholder="Ubicación..."
                value={filtrosUnidades.ubicacion}
                options={opcionesUbicacion}
                onChange={(v) =>
                  setFiltrosUnidades((prev) => ({ ...prev, ubicacion: v }))
                }
              />
            </div>

            <div className="min-w-[110px] flex-1">
              <label htmlFor="filtro-color1" className="sr-only">Color primario</label>
              <ComboboxFiltro
                id="filtro-color1"
                placeholder="Color 1..."
                value={filtrosUnidades.color1}
                options={opcionesColor}
                onChange={(v) =>
                  setFiltrosUnidades((prev) => ({
                    ...prev,
                    color1: v,
                    color2: v.trim() ? prev.color2 : "",
                  }))
                }
              />
            </div>

            {filtrosUnidades.color1.trim() ? (
              <div className="min-w-[110px] flex-1">
                <label htmlFor="filtro-color2" className="sr-only">Color secundario</label>
                <ComboboxFiltro
                  id="filtro-color2"
                  placeholder="Color 2..."
                  value={filtrosUnidades.color2}
                  options={opcionesColor2}
                  onChange={(v) =>
                    setFiltrosUnidades((prev) => ({ ...prev, color2: v }))
                  }
                />
              </div>
            ) : null}

            <div className="min-w-[110px] flex-1">
              <label htmlFor="filtro-tamano" className="sr-only">Tamaño</label>
              <ComboboxFiltro
                id="filtro-tamano"
                placeholder="Tamaño..."
                value={filtrosUnidades.tamano}
                options={opcionesTamano}
                onChange={(v) =>
                  setFiltrosUnidades((prev) => ({ ...prev, tamano: v }))
                }
              />
            </div>

            {hayFiltrosActivos ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 shrink-0 text-xs text-muted-foreground"
                onClick={() => {
                  setUnidadSearch("")
                  setFiltrosUnidades(FILTROS_UNIDADES_VACIOS)
                }}
              >
                Limpiar
              </Button>
            ) : null}
          </div>

          <DataTable
            columns={columnsUnidades}
            data={unidadesFiltradas}
            search={unidadSearch}
            pageSizeOptions={[5, 10, 20, 50]}
            emptyMessage="No se encontraron unidades"
            emptyDescription={
              hayFiltrosActivos
                ? "Prueba con otros filtros."
                : "No hay unidades registradas aún."
            }
          />
        </section>
      )}

      {/* ── Modales ────────────────────────────────────────────────────────── */}
      <ModalHerramienta
        open={isFormOpen}
        item={editingItem}
        categorias={categoriasOpciones}
        marcas={marcas}
        ubicaciones={ubicacionesOpciones}
        isSubmitting={isSaving}
        formError={formError}
        fieldErrors={fieldErrors}
        onOpenChange={(open) => {
          if (!open && isSaving) return
          setIsFormOpen(open)
        }}
        onSubmit={handleSubmit}
        onCreatedCategoria={(item) => insertarCatalogo(setCategorias, item)}
        onCreatedMarca={(item) => insertarCatalogo(setMarcas, item)}
        onCreatedUbicacion={(item) => insertarCatalogo(setUbicaciones, item)}
      />

      <ModalVerUnidades
        open={viewingItem !== null}
        herramienta={viewingItem}
        marcas={marcas}
        ubicaciones={ubicacionesOpciones}
        onOpenChange={(open) => {
          if (!open) setViewingItem(null)
        }}
        onChanged={() => {
          void loadItems()
        }}
        onCreatedMarca={(item) => insertarCatalogo(setMarcas, item)}
        onCreatedUbicacion={(item) => insertarCatalogo(setUbicaciones, item)}
      />

      <ModalConfirmarEliminar
        open={deletingItem !== null}
        singular="herramienta"
        nombre={deletingItem?.nombre}
        descripcion={
          deletingItem
            ? `Se ocultará "${deletingItem.nombre}" del inventario. Primero deben eliminarse sus unidades.`
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

// ── Sub-componentes ──────────────────────────────────────────────────────────

function UnidadEstadoBadge({ estado }: { estado: number }) {
  const estaDisponible = estado === UNIDAD_ESTADO_DISPONIBLE
  const estaPrestada = estado === UNIDAD_ESTADO_PRESTADA

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        estaDisponible
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          : estaPrestada
            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
            : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
      )}
    >
      {etiquetaEstadoUnidad(estado)}
    </span>
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
