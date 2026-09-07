import { useEffect, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { type Cliente, type ClienteFormValues } from "@/lib/clientes"

export type ClienteFieldErrors = {
  nombre_completo?: string
  apodo?: string
  nit?: string
  correo?: string
  celular?: string
}

type ModalClienteProps = {
  open: boolean
  item?: Cliente | null
  isSubmitting: boolean
  formError: string
  fieldErrors: ClienteFieldErrors
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ClienteFormValues) => void
}

export function ModalCliente({
  open,
  item,
  isSubmitting,
  formError,
  fieldErrors,
  onOpenChange,
  onSubmit,
}: ModalClienteProps) {
  const isEditing = Boolean(item)

  const [nombreCompleto, setNombreCompleto] = useState("")
  const [apodo, setApodo] = useState("")
  const [nit, setNit] = useState("")
  const [correo, setCorreo] = useState("")
  const [celular, setCelular] = useState("")
  const [localErrors, setLocalErrors] = useState<ClienteFieldErrors>({})

  useEffect(() => {
    if (!open) return
    setNombreCompleto(item?.nombre_completo ?? "")
    setApodo(item?.apodo ?? "")
    setNit(item?.nit ?? "")
    setCorreo(item?.correo ?? "")
    setCelular(item?.celular ?? "")
    setLocalErrors({})
  }, [item, open])

  const closeModal = () => {
    if (isSubmitting) return
    onOpenChange(false)
  }

  const clearFieldError = (field: keyof ClienteFieldErrors) => {
    if (localErrors[field]) {
      setLocalErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: ClienteFieldErrors = {}
    const nombreValue = nombreCompleto.trim()

    if (!nombreValue) nextErrors.nombre_completo = "El nombre es obligatorio."

    if (Object.keys(nextErrors).length > 0) {
      setLocalErrors(nextErrors)
      return
    }

    onSubmit({
      nombre_completo: nombreValue,
      apodo: apodo.trim(),
      nit: nit.trim(),
      correo: correo.trim(),
      celular: celular.trim(),
    })
  }

  const shownErrors: ClienteFieldErrors = {
    nombre_completo: localErrors.nombre_completo || fieldErrors.nombre_completo,
    apodo: localErrors.apodo || fieldErrors.apodo,
    nit: localErrors.nit || fieldErrors.nit,
    correo: localErrors.correo || fieldErrors.correo,
    celular: localErrors.celular || fieldErrors.celular,
  }

  const firstFieldError = Object.values(shownErrors).find(Boolean) ?? ""
  const shownFormError =
    formError && formError !== firstFieldError ? formError : ""

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeModal()
          return
        }
        onOpenChange(true)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar cliente" : "Agregar cliente"}
          </DialogTitle>
        </DialogHeader>

        <form
          id="cliente-form"
          className="space-y-4"
          onSubmit={handleSubmit}
          noValidate
        >
          {shownFormError ? (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {shownFormError}
            </div>
          ) : null}

          {/* Nombre completo — ocupa todo el ancho */}
          <Field
            id="cliente-nombre"
            label="Nombre completo"
            placeholder="Ej. Juan Carlos Pérez"
            value={nombreCompleto}
            disabled={isSubmitting}
            error={shownErrors.nombre_completo}
            onChange={(v) => {
              setNombreCompleto(v)
              clearFieldError("nombre_completo")
            }}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="cliente-apodo"
              label="Apodo"
              optional
              placeholder="Ej. Juancho"
              value={apodo}
              disabled={isSubmitting}
              error={shownErrors.apodo}
              onChange={(v) => {
                setApodo(v)
                clearFieldError("apodo")
              }}
            />
            <Field
              id="cliente-nit"
              label="NIT"
              optional
              placeholder="Ej. 12345678-9"
              value={nit}
              disabled={isSubmitting}
              error={shownErrors.nit}
              onChange={(v) => {
                setNit(v)
                clearFieldError("nit")
              }}
            />
            <Field
              id="cliente-correo"
              label="Correo"
              optional
              placeholder="Ej. juan@correo.com"
              value={correo}
              disabled={isSubmitting}
              error={shownErrors.correo}
              onChange={(v) => {
                setCorreo(v)
                clearFieldError("correo")
              }}
            />
            <Field
              id="cliente-celular"
              label="Celular"
              optional
              placeholder="Ej. 0414-1234567"
              value={celular}
              disabled={isSubmitting}
              error={shownErrors.celular}
              onChange={(v) => {
                setCelular(v)
                clearFieldError("celular")
              }}
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={closeModal}
          >
            Cancelar
          </Button>
          <Button type="submit" form="cliente-form" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function Field({
  id,
  label,
  optional,
  placeholder,
  value,
  disabled,
  error,
  onChange,
}: {
  id: string
  label: string
  optional?: boolean
  placeholder: string
  value: string
  disabled: boolean
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-muted-foreground">
            (opcional)
          </span>
        ) : null}
      </label>
      <Input
        id={id}
        className="h-9"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
