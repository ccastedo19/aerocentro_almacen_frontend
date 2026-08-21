import { useEffect, useState, type FormEvent } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Rol, type Usuario } from "@/lib/auth"
import { type UsuarioFormValues } from "@/lib/usuarios"

const USUARIO_REGEX = /^[A-Za-z0-9_-]+$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type UsuarioFieldErrors = {
  nombre?: string
  apellido?: string
  nombre_usuario?: string
  email?: string
  rol_id?: string
  password?: string
  password_confirmation?: string
}

type ModalUsuarioProps = {
  open: boolean
  item?: Usuario | null
  roles: Rol[]
  isSubmitting: boolean
  formError: string
  fieldErrors: UsuarioFieldErrors
  onOpenChange: (open: boolean) => void
  onSubmit: (values: UsuarioFormValues) => void
}

export function ModalUsuario({
  open,
  item,
  roles,
  isSubmitting,
  formError,
  fieldErrors,
  onOpenChange,
  onSubmit,
}: ModalUsuarioProps) {
  const isEditing = Boolean(item)
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [email, setEmail] = useState("")
  const [rolId, setRolId] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [localErrors, setLocalErrors] = useState<UsuarioFieldErrors>({})

  useEffect(() => {
    if (!open) return

    setNombre(item?.nombre ?? "")
    setApellido(item?.apellido ?? "")
    setNombreUsuario(item?.nombre_usuario ?? "")
    setEmail(item?.email ?? "")
    setRolId(item?.rol_id ?? roles[0]?.id ?? "")
    setPassword("")
    setPasswordConfirmation("")
    setShowPassword(false)
    setLocalErrors({})
  }, [item, open, roles])

  const closeModal = () => {
    if (isSubmitting) return
    onOpenChange(false)
  }

  const clearFieldError = (field: keyof UsuarioFieldErrors) => {
    if (localErrors[field]) {
      setLocalErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: UsuarioFieldErrors = {}
    const nombreValue = nombre.trim()
    const apellidoValue = apellido.trim()
    const usuarioValue = nombreUsuario.trim()
    const emailValue = email.trim()

    if (!nombreValue) nextErrors.nombre = "El nombre es obligatorio."
    if (!apellidoValue) nextErrors.apellido = "El apellido es obligatorio."

    if (!usuarioValue) {
      nextErrors.nombre_usuario = "El usuario es obligatorio."
    } else if (!USUARIO_REGEX.test(usuarioValue)) {
      nextErrors.nombre_usuario =
        "Usa solo letras, números, guiones o guión bajo."
    } else if (usuarioValue.length > 30) {
      nextErrors.nombre_usuario = "El usuario no puede superar 30 caracteres."
    }

    if (!emailValue) {
      nextErrors.email = "El correo es obligatorio."
    } else if (!EMAIL_REGEX.test(emailValue)) {
      nextErrors.email = "Ingresa un correo válido."
    }

    if (!rolId) nextErrors.rol_id = "Selecciona un rol."

    if (!isEditing || password || passwordConfirmation) {
      if (!password) {
        nextErrors.password = "La contraseña es obligatoria."
      } else if (password.length < 8) {
        nextErrors.password = "La contraseña debe tener al menos 8 caracteres."
      }

      if (password !== passwordConfirmation) {
        nextErrors.password_confirmation = "Las contraseñas no coinciden."
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setLocalErrors(nextErrors)
      return
    }

    onSubmit({
      nombre: nombreValue,
      apellido: apellidoValue,
      nombre_usuario: usuarioValue,
      email: emailValue,
      rol_id: rolId,
      password: password || undefined,
      password_confirmation: passwordConfirmation || undefined,
    })
  }

  const shownErrors: UsuarioFieldErrors = {
    nombre: localErrors.nombre || fieldErrors.nombre,
    apellido: localErrors.apellido || fieldErrors.apellido,
    nombre_usuario: localErrors.nombre_usuario || fieldErrors.nombre_usuario,
    email: localErrors.email || fieldErrors.email,
    rol_id: localErrors.rol_id || fieldErrors.rol_id,
    password: localErrors.password || fieldErrors.password,
    password_confirmation:
      localErrors.password_confirmation || fieldErrors.password_confirmation,
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
            {isEditing ? "Editar usuario" : "Agregar usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Deja la contraseña en blanco si no quieres cambiarla."
              : "El usuario podrá iniciar sesión con su nombre de usuario o correo."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="usuario-form"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="usuario-nombre"
              label="Nombre"
              placeholder="Ej. Alejandro"
              value={nombre}
              disabled={isSubmitting}
              error={shownErrors.nombre}
              onChange={(value) => {
                setNombre(value)
                clearFieldError("nombre")
              }}
            />
            <Field
              id="usuario-apellido"
              label="Apellido"
              placeholder="Ej. Castedo"
              value={apellido}
              disabled={isSubmitting}
              error={shownErrors.apellido}
              onChange={(value) => {
                setApellido(value)
                clearFieldError("apellido")
              }}
            />
            <Field
              id="usuario-nombre-usuario"
              label="Usuario"
              placeholder="Ej. alecastedo1"
              autoComplete="username"
              value={nombreUsuario}
              disabled={isSubmitting}
              error={shownErrors.nombre_usuario}
              onChange={(value) => {
                setNombreUsuario(value)
                clearFieldError("nombre_usuario")
              }}
            />
            <Field
              id="usuario-email"
              label="Correo"
              type="email"
              placeholder="Ej. alejandro@aerocentro.com"
              autoComplete="email"
              value={email}
              disabled={isSubmitting}
              error={shownErrors.email}
              onChange={(value) => {
                setEmail(value)
                clearFieldError("email")
              }}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="usuario-rol" className="text-sm font-medium">
              Rol
            </label>
            <Select
              value={rolId || null}
              items={Object.fromEntries(roles.map((rol) => [rol.id, rol.nombre]))}
              itemToStringLabel={(id) =>
                roles.find((rol) => rol.id === id)?.nombre ?? ""
              }
              onValueChange={(value) => {
                if (value == null) return
                setRolId(String(value))
                clearFieldError("rol_id")
              }}
            >
              <SelectTrigger
                id="usuario-rol"
                className="h-10 w-full"
                disabled={isSubmitting}
                aria-invalid={Boolean(shownErrors.rol_id)}
              >
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="min-w-64">
                {roles.map((rol) => (
                  <SelectItem key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {shownErrors.rol_id ? (
              <p className="text-sm text-destructive">{shownErrors.rol_id}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordField
              id="usuario-password"
              label="Contraseña"
              optional={isEditing}
              value={password}
              showPassword={showPassword}
              disabled={isSubmitting}
              error={shownErrors.password}
              onToggleVisibility={() => setShowPassword((visible) => !visible)}
              onChange={(value) => {
                setPassword(value)
                clearFieldError("password")
              }}
            />
            <PasswordField
              id="usuario-password-confirmation"
              label="Confirmar contraseña"
              optional={isEditing}
              value={passwordConfirmation}
              showPassword={showPassword}
              disabled={isSubmitting}
              error={shownErrors.password_confirmation}
              onToggleVisibility={() => setShowPassword((visible) => !visible)}
              onChange={(value) => {
                setPasswordConfirmation(value)
                clearFieldError("password_confirmation")
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
          <Button type="submit" form="usuario-form" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  value,
  disabled,
  error,
  onChange,
}: {
  id: string
  label: string
  type?: string
  placeholder: string
  autoComplete?: string
  value: string
  disabled: boolean
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        className="h-10"
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

function PasswordField({
  id,
  label,
  optional,
  value,
  showPassword,
  disabled,
  error,
  onToggleVisibility,
  onChange,
}: {
  id: string
  label: string
  optional?: boolean
  value: string
  showPassword: boolean
  disabled: boolean
  error?: string
  onToggleVisibility: () => void
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
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          className="h-10 pr-10"
          placeholder={optional ? "Sin cambios" : "Mínimo 8 caracteres"}
          value={value}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
          disabled={disabled}
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={onToggleVisibility}
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
