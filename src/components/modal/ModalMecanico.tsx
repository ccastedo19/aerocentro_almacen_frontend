import { useEffect, useRef, useState, type FormEvent } from "react"
import { ImagePlus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  COLORES_MECANICO,
  getInicialesMecanico,
  optimizarImagenMecanico,
  type ColorMecanico,
  type Mecanico,
  type MecanicoFormValues,
} from "@/lib/mecanicos"

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export type MecanicoFieldErrors = {
  nombre?: string
  apellido?: string
  apodo?: string
  nro_licencia?: string
  cargo?: string
  telefono?: string
  color?: string
  imagen?: string
}

type ModalMecanicoProps = {
  open: boolean
  item?: Mecanico | null
  isSubmitting: boolean
  formError: string
  fieldErrors: MecanicoFieldErrors
  onOpenChange: (open: boolean) => void
  onSubmit: (values: MecanicoFormValues) => void
}

export function ModalMecanico({
  open,
  item,
  isSubmitting,
  formError,
  fieldErrors,
  onOpenChange,
  onSubmit,
}: ModalMecanicoProps) {
  const isEditing = Boolean(item)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }

  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [apodo, setApodo] = useState("")
  const [nroLicencia, setNroLicencia] = useState("")
  const [cargo, setCargo] = useState("")
  const [telefono, setTelefono] = useState("")
  const [color, setColor] = useState<ColorMecanico>("azul")
  const [imagen, setImagen] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const [eliminarImagen, setEliminarImagen] = useState(false)
  const [localErrors, setLocalErrors] = useState<MecanicoFieldErrors>({})

  useEffect(() => {
    if (!open) return

    revokeObjectUrl()
    setNombre(item?.nombre ?? "")
    setApellido(item?.apellido ?? "")
    setApodo(item?.apodo ?? "")
    setNroLicencia(item?.nro_licencia ?? "")
    setCargo(item?.cargo ?? "")
    setTelefono(item?.telefono ?? "")
    setColor(item?.color ?? "azul")
    setImagen(null)
    setPreviewUrl(item?.imagen ?? null)
    setIsImagePreviewOpen(false)
    setEliminarImagen(false)
    setLocalErrors({})

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [item, open])

  useEffect(() => {
    return () => {
      revokeObjectUrl()
    }
  }, [])

  const closeModal = () => {
    if (isSubmitting) return
    onOpenChange(false)
  }

  const clearFieldError = (field: keyof MecanicoFieldErrors) => {
    if (localErrors[field]) {
      setLocalErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  const handleFileChange = (file: File | undefined) => {
    if (!file) return

    const typeOk =
      ACCEPTED_IMAGE_TYPES.includes(file.type) ||
      /\.(jpe?g|png|webp)$/i.test(file.name)

    if (!typeOk) {
      setLocalErrors((current) => ({
        ...current,
        imagen: "Usa una imagen JPG, PNG o WEBP.",
      }))
      return
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setLocalErrors((current) => ({
        ...current,
        imagen: "La imagen no puede superar 4 MB.",
      }))
      return
    }

    revokeObjectUrl()
    const objectUrl = URL.createObjectURL(file)
    objectUrlRef.current = objectUrl
    setImagen(file)
    setPreviewUrl(objectUrl)
    setEliminarImagen(false)
    setLocalErrors((current) => ({ ...current, imagen: undefined }))
  }

  const handleRemoveImage = () => {
    revokeObjectUrl()
    setImagen(null)
    setPreviewUrl(null)
    setEliminarImagen(true)
    setLocalErrors((current) => ({ ...current, imagen: undefined }))

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: MecanicoFieldErrors = {}
    const nombreValue = nombre.trim()
    const apellidoValue = apellido.trim()
    const licenciaValue = nroLicencia.trim()
    const cargoValue = cargo.trim()

    if (!nombreValue) nextErrors.nombre = "El nombre es obligatorio."
    if (!apellidoValue) nextErrors.apellido = "El apellido es obligatorio."
    if (!cargoValue) nextErrors.cargo = "El cargo es obligatorio."

    if (Object.keys(nextErrors).length > 0) {
      setLocalErrors(nextErrors)
      return
    }

    onSubmit({
      nombre: nombreValue,
      apellido: apellidoValue,
      apodo: apodo.trim(),
      nro_licencia: licenciaValue,
      cargo: cargoValue,
      telefono: telefono.trim(),
      color,
      imagen,
      eliminar_imagen: isEditing && eliminarImagen && !imagen,
    })
  }

  const shownErrors: MecanicoFieldErrors = {
    nombre: localErrors.nombre || fieldErrors.nombre,
    apellido: localErrors.apellido || fieldErrors.apellido,
    apodo: localErrors.apodo || fieldErrors.apodo,
    nro_licencia: localErrors.nro_licencia || fieldErrors.nro_licencia,
    cargo: localErrors.cargo || fieldErrors.cargo,
    telefono: localErrors.telefono || fieldErrors.telefono,
    color: localErrors.color || fieldErrors.color,
    imagen: localErrors.imagen || fieldErrors.imagen,
  }

  const firstFieldError = Object.values(shownErrors).find(Boolean) ?? ""
  const shownFormError =
    formError && formError !== firstFieldError ? formError : ""

  const initials = getInicialesMecanico({
    nombre: nombre || item?.nombre || "M",
    apellido: apellido || item?.apellido || "",
  })

  return (
    <>
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
            {isEditing ? "Editar mecánico" : "Agregar mecánico"}
          </DialogTitle>
        </DialogHeader>

        <form
          id="mecanico-form"
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

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-xl outline-none enabled:cursor-zoom-in enabled:focus-visible:ring-2 enabled:focus-visible:ring-ring enabled:focus-visible:ring-offset-2"
              disabled={!isEditing || !previewUrl}
              aria-label={isEditing && previewUrl ? "Ampliar foto del mecánico" : undefined}
              onClick={() => setIsImagePreviewOpen(true)}
            >
              <Avatar className="size-16 overflow-hidden rounded-xl after:rounded-xl">
                {previewUrl ? (
                  <AvatarImage
                    src={optimizarImagenMecanico(previewUrl, 300, 300)}
                    alt="Foto del mecánico"
                    className="rounded-xl object-cover"
                  />
                ) : null}
                <AvatarFallback className="rounded-xl text-base">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>

            <div className="min-w-0 flex-1 space-y-2">
              <input
                ref={fileInputRef}
                id="mecanico-imagen"
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="sr-only"
                disabled={isSubmitting}
                onChange={(event) => handleFileChange(event.target.files?.[0])}
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="info"
                  disabled={isSubmitting}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus data-icon="inline-start" />
                  {previewUrl ? "Cambiar foto" : "Subir foto"}
                </Button>
                {previewUrl ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isSubmitting}
                    onClick={handleRemoveImage}
                  >
                    <Trash2 data-icon="inline-start" />
                    Quitar
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG o WEBP. Máximo 4 MB.
              </p>
              {shownErrors.imagen ? (
                <p className="text-sm text-destructive">{shownErrors.imagen}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="mecanico-nombre"
              label="Nombre"
              placeholder="Ej. Carlos"
              value={nombre}
              disabled={isSubmitting}
              error={shownErrors.nombre}
              onChange={(value) => {
                setNombre(value)
                clearFieldError("nombre")
              }}
            />
            <Field
              id="mecanico-apellido"
              label="Apellido"
              placeholder="Ej. Mendoza"
              value={apellido}
              disabled={isSubmitting}
              error={shownErrors.apellido}
              onChange={(value) => {
                setApellido(value)
                clearFieldError("apellido")
              }}
            />
            <Field
              id="mecanico-apodo"
              label="Apodo"
              optional
              placeholder="Ej. El Gato"
              value={apodo}
              disabled={isSubmitting}
              error={shownErrors.apodo}
              onChange={(value) => {
                setApodo(value)
                clearFieldError("apodo")
              }}
            />
            <Field
              id="mecanico-licencia"
              label="N° de licencia"
              optional
              placeholder="Ej. LIC-001"
              value={nroLicencia}
              disabled={isSubmitting}
              error={shownErrors.nro_licencia}
              onChange={(value) => {
                setNroLicencia(value)
                clearFieldError("nro_licencia")
              }}
            />
            <Field
              id="mecanico-cargo"
              label="Cargo"
              placeholder="Ej. Aviónica"
              value={cargo}
              disabled={isSubmitting}
              error={shownErrors.cargo}
              onChange={(value) => {
                setCargo(value)
                clearFieldError("cargo")
              }}
            />
          </div>

          <Field
            id="mecanico-telefono"
            label="Teléfono"
            optional
            placeholder="Ej. 0412-1234567"
            value={telefono}
            disabled={isSubmitting}
            error={shownErrors.telefono}
            onChange={(value) => {
              setTelefono(value)
              clearFieldError("telefono")
            }}
          />

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Color de identificación</legend>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {COLORES_MECANICO.map((opcion) => (
                <button
                  key={opcion.value}
                  type="button"
                  className={`flex items-center justify-center rounded-lg border p-2 transition-colors ${
                    color === opcion.value
                      ? "border-foreground bg-muted"
                      : "border-transparent hover:bg-muted/60"
                  }`}
                  disabled={isSubmitting}
                  aria-pressed={color === opcion.value}
                  aria-label={opcion.label}
                  title={opcion.label}
                  onClick={() => {
                    setColor(opcion.value)
                    clearFieldError("color")
                  }}
                >
                  <span
                    className={`size-6 rounded-full ${opcion.muestra}`}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
            {shownErrors.color ? (
              <p className="text-sm text-destructive">{shownErrors.color}</p>
            ) : null}
          </fieldset>
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
          <Button type="submit" form="mecanico-form" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] p-2 sm:max-w-3xl">
          <DialogTitle className="sr-only">Foto del mecánico</DialogTitle>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`Foto ampliada de ${item?.nombre_completo ?? "mecánico"}`}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

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
