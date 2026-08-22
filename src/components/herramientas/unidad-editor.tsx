import { CreatableNamedSelect } from "@/components/form/creatable-named-select"
import { type NamedOption } from "@/components/form/named-select"
import { type CatalogoItem } from "@/lib/catalogo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Pencil, Plus, Trash2 } from "lucide-react"

export type UnidadCamposValues = {
  marca_id: string
  ubicacion_id: string
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
  calibracion?: string
  observaciones?: string
  estado?: string
  disableActions?: boolean
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
            <TableHead>Calibración</TableHead>
            {mostrarEstado ? <TableHead>Estado</TableHead> : null}
            <TableHead className="w-[88px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={mostrarEstado ? 5 : 4}
                className="h-16 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            filas.map((fila) => (
              <TableRow key={fila.id}>
                <TableCell className="font-medium">{fila.marca}</TableCell>
                <TableCell>{fila.ubicacion}</TableCell>
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
                        variant="ghost"
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
                      variant="ghost"
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
    <Button type="button" variant="outline" disabled={disabled} onClick={onClick}>
      <Plus data-icon="inline-start" />
      {isEditing ? "Guardar unidad" : "Agregar unidad"}
    </Button>
  )
}
