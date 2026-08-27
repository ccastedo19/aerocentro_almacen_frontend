import { CreatableNamedSelect } from "@/components/form/creatable-named-select"
import { type NamedOption } from "@/components/form/named-select"
import { type CatalogoItem } from "@/lib/catalogo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  COLORES_UNIDAD,
  SIN_COLOR,
  type ColorUnidadSeleccion,
} from "@/lib/herramientas"
import { Pencil, Plus, Trash2 } from "lucide-react"

export type UnidadCamposValues = {
  marca_id: string
  ubicacion_id: string
  color_primario: ColorUnidadSeleccion
  color_secundario: ColorUnidadSeleccion
  tamano: string
  requiere_calibracion: boolean
  fecha_calibracion: string
  proxima_calibracion: string
  observaciones: string
}

export type UnidadCamposErrors = Partial<Record<keyof UnidadCamposValues, string>>

export function unidadCamposVacia(marcas: NamedOption[], ubicaciones: NamedOption[]): UnidadCamposValues {
  return {
    marca_id: marcas[0]?.id ?? "",
    ubicacion_id: ubicaciones[0]?.id ?? "",
    color_primario: SIN_COLOR,
    color_secundario: SIN_COLOR,
    tamano: "",
    requiere_calibracion: false,
    fecha_calibracion: "",
    proxima_calibracion: "",
    observaciones: "",
  }
}

export function validarUnidadCampos(values: UnidadCamposValues): UnidadCamposErrors {
  const errors: UnidadCamposErrors = {}

  if (!values.marca_id) errors.marca_id = "Selecciona una marca."
  if (!values.ubicacion_id) errors.ubicacion_id = "Selecciona una ubicación."
  if (
    values.color_primario !== SIN_COLOR &&
    values.color_primario === values.color_secundario
  ) {
    errors.color_secundario = "Selecciona un color diferente."
  }
  if (values.tamano.trim().length > 50) {
    errors.tamano = "El tamaño no puede superar 50 caracteres."
  }

  if (values.requiere_calibracion) {
    if (!values.fecha_calibracion) {
      errors.fecha_calibracion = "La última calibración es obligatoria."
    }

    if (!values.proxima_calibracion) {
      errors.proxima_calibracion = "La próxima calibración es obligatoria."
    }

    if (
      values.fecha_calibracion &&
      values.proxima_calibracion &&
      values.proxima_calibracion < values.fecha_calibracion
    ) {
      errors.proxima_calibracion =
        "La próxima calibración no puede ser anterior a la última."
    }
  }

  return errors
}

type UnidadCamposProps = {
  idPrefix: string
  values: UnidadCamposValues
  marcas: NamedOption[]
  ubicaciones: NamedOption[]
  errors: UnidadCamposErrors
  disabled?: boolean
  onChange: (values: UnidadCamposValues) => void
  onCreatedMarca: (item: CatalogoItem) => void
  onCreatedUbicacion: (item: CatalogoItem) => void
}

export function UnidadCampos({
  idPrefix,
  values,
  marcas,
  ubicaciones,
  errors,
  disabled,
  onChange,
  onCreatedMarca,
  onCreatedUbicacion,
}: UnidadCamposProps) {
  const set = <K extends keyof UnidadCamposValues>(key: K, value: UnidadCamposValues[K]) => {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 mb-1">
        <div className="space-y-0">
          <label htmlFor={`${idPrefix}-marca`} className="text-sm font-medium">
            Marca
          </label>
          <CreatableNamedSelect
            id={`${idPrefix}-marca`}
            value={values.marca_id}
            options={marcas}
            placeholder="Selecciona o busca una marca"
            createNoun="marca"
            resourcePath="/api/marcas"
            disabled={disabled}
            error={errors.marca_id}
            onChange={(value) => set("marca_id", value)}
            onCreated={onCreatedMarca}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`${idPrefix}-ubicacion`} className="text-sm font-medium">
            Ubicación
          </label>
          <CreatableNamedSelect
            id={`${idPrefix}-ubicacion`}
            value={values.ubicacion_id}
            options={ubicaciones}
            placeholder="Selecciona o busca una ubicación"
            createNoun="ubicación"
            resourcePath="/api/ubicaciones"
            disabled={disabled}
            error={errors.ubicacion_id}
            onChange={(value) => set("ubicacion_id", value)}
            onCreated={onCreatedUbicacion}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorSelect
            id={`${idPrefix}-color-primario`}
            label="Color 1"
            value={values.color_primario}
            disabled={disabled}
            error={errors.color_primario}
            onChange={(value) => {
              onChange({
                ...values,
                color_primario: value,
                color_secundario:
                  value === SIN_COLOR ? SIN_COLOR : values.color_secundario,
              })
            }}
          />
          <ColorSelect
            id={`${idPrefix}-color-secundario`}
            label="Color 2"
            value={values.color_secundario}
            disabled={disabled || values.color_primario === SIN_COLOR}
            error={errors.color_secundario}
            onChange={(value) => set("color_secundario", value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor={`${idPrefix}-tamano`} className="text-sm font-medium">
            Tamaño
            <span className="ml-1 font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>
          <Input
            id={`${idPrefix}-tamano`}
            className="h-8"
            maxLength={50}
            placeholder='Ej. 11 mm, 3/8" o grande'
            value={values.tamano}
            disabled={disabled}
            aria-invalid={Boolean(errors.tamano)}
            onChange={(event) => set("tamano", event.target.value)}
          />
          {errors.tamano ? (
            <p className="text-sm text-destructive">{errors.tamano}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
        <label htmlFor={`${idPrefix}-requiere-calibracion`} className="text-sm font-medium">
          ¿Requiere calibración?
        </label>
        <button
          type="button"
          id={`${idPrefix}-requiere-calibracion`}
          role="switch"
          aria-checked={values.requiere_calibracion}
          disabled={disabled}
          onClick={() => {
            const next = !values.requiere_calibracion
            onChange({
              ...values,
              requiere_calibracion: next,
              fecha_calibracion: next ? values.fecha_calibracion : "",
              proxima_calibracion: next ? values.proxima_calibracion : "",
            })
          }}
          className={cn(
            "relative cursor-pointer inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
            values.requiere_calibracion ? "bg-primary" : "bg-input",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <span
            className={cn(
              "inline-block size-5 rounded-full bg-background shadow-sm transition-transform",
              values.requiere_calibracion ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      {values.requiere_calibracion ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-fecha`} className="text-sm font-medium">
              Última calibración
            </label>
            <Input
              id={`${idPrefix}-fecha`}
              type="date"
              className="h-8"
              value={values.fecha_calibracion}
              disabled={disabled}
              aria-invalid={Boolean(errors.fecha_calibracion)}
              onChange={(event) => set("fecha_calibracion", event.target.value)}
            />
            {errors.fecha_calibracion ? (
              <p className="text-sm text-destructive">{errors.fecha_calibracion}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-proxima`} className="text-sm font-medium">
              Próxima calibración
            </label>
            <Input
              id={`${idPrefix}-proxima`}
              type="date"
              className="h-8"
              value={values.proxima_calibracion}
              disabled={disabled}
              aria-invalid={Boolean(errors.proxima_calibracion)}
              onChange={(event) => set("proxima_calibracion", event.target.value)}
            />
            {errors.proxima_calibracion ? (
              <p className="text-sm text-destructive">{errors.proxima_calibracion}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export type UnidadTablaFila = {
  id: string
  marca: string
  ubicacion: string
  colores?: string
  tamano?: string
  calibracion?: string
  observaciones?: string
  estado?: string
  disableActions?: boolean
  pending?: boolean
}

type UnidadesMiniTablaProps = {
  filas: UnidadTablaFila[]
  emptyMessage: string
  onEdit?: (id: string) => void
  onDelete: (id: string) => void
}

export function UnidadesMiniTabla({
  filas,
  emptyMessage,
  onEdit,
  onDelete,
}: UnidadesMiniTablaProps) {
  const mostrarEstado = filas.some((fila) => fila.estado)

  return (
    <div className="overflow-hidden rounded-xl border bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Marca</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Tamaño</TableHead>
            <TableHead>Calibración</TableHead>
            {mostrarEstado ? <TableHead>Estado</TableHead> : null}
            <TableHead className="w-[88px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={mostrarEstado ? 7 : 6}
                className="h-16 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            filas.map((fila) => (
              <TableRow
                key={fila.id}
                className={cn(
                  fila.pending &&
                    "border-l-4 border-l-sky-400 bg-sky-500/8 hover:bg-sky-500/12 dark:border-l-sky-300",
                )}
              >
                <TableCell className="font-medium">{fila.marca}</TableCell>
                <TableCell>{fila.ubicacion}</TableCell>
                <TableCell>{fila.colores || "Sin Color"}</TableCell>
                <TableCell>{fila.tamano || "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {fila.calibracion || "—"}
                </TableCell>
                {mostrarEstado ? (
                  <TableCell className="text-muted-foreground">
                    {fila.estado ?? "—"}
                  </TableCell>
                ) : null}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {onEdit ? (
                      <Button
                        type="button"
                        variant="warning"
                        size="icon-sm"
                        disabled={fila.disableActions}
                        aria-label="Editar unidad"
                        onClick={() => onEdit(fila.id)}
                      >
                        <Pencil />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      disabled={fila.disableActions}
                      aria-label="Quitar unidad"
                      onClick={() => onDelete(fila.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

const COLORES_UNIDAD_ITEMS = Object.fromEntries(
  COLORES_UNIDAD.map((color) => [color.value, color.label]),
)

function ColorSelect({
  id,
  label,
  value,
  disabled,
  error,
  onChange,
}: {
  id: string
  label: string
  value: ColorUnidadSeleccion
  disabled?: boolean
  error?: string
  onChange: (value: ColorUnidadSeleccion) => void
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Select
        value={value}
        items={COLORES_UNIDAD_ITEMS}
        disabled={disabled}
        onValueChange={(nextValue) => {
          if (nextValue) onChange(nextValue as ColorUnidadSeleccion)
        }}
      >
        <SelectTrigger id={id} className="h-8 w-full" aria-invalid={Boolean(error)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {COLORES_UNIDAD.map((color) => (
            <SelectItem key={color.value} value={color.value}>
              {color.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

type BotonAgregarUnidadProps = {
  disabled?: boolean
  isEditing?: boolean
  onClick: () => void
}

export function BotonAgregarUnidad({
  disabled,
  isEditing,
  onClick,
}: BotonAgregarUnidadProps) {
  return (
    <Button
      type="button"
      variant={isEditing ? "info" : "success"}
      disabled={disabled}
      onClick={onClick}
    >
      <Plus data-icon="inline-start" />
      {isEditing ? "Actualizar unidad" : "Agregar unidad"}
    </Button>
  )
}
