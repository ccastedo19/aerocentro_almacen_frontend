import { useState, type FormEvent } from "react"
import {
  Eye,
  EyeOff,
  Lock,
  Monitor,
  Moon,
  Package,
  Sun,
  User,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "@/hooks/use-theme"
import { ApiError } from "@/lib/api"

const productHighlights = [
  {
    icon: Wrench,
    title: "Préstamos",
    description: "Registra qué herramienta tiene cada mecánico.",
  },
  {
    icon: Package,
    title: "Inventario",
    description: "Ubica stock, categorías y ubicación en el almacén.",
  },
  {
    icon: Users,
    title: "Usuarios",
    description: "Acceso controlado para encargados y administradores.",
  },
]

type FieldErrors = {
  credencial?: string
  password?: string
}

export const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { theme, setTheme } = useTheme()
  const [credencial, setCredencial] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const clearErrors = () => {
    setFieldErrors({})
    setFormError("")
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const credencialValue = credencial.trim()
    const nextErrors: FieldErrors = {}

    if (!credencialValue) {
      nextErrors.credencial = "Ingresa tu usuario o correo."
    }

    if (!password) {
      nextErrors.password = "Ingresa tu contraseña."
    }

    if (nextErrors.credencial || nextErrors.password) {
      setFieldErrors(nextErrors)
      setFormError("")
      return
    }

    setIsSubmitting(true)
    clearErrors()

    try {
      await login(credencialValue, password)
      navigate("/", { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        const credencialError = error.errors.credencial?.[0]
        const passwordError = error.errors.password?.[0]

        setFieldErrors({
          credencial: credencialError,
          password: passwordError,
        })
        setFormError(error.message)
      } else {
        setFormError("No se pudo iniciar sesión.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-zinc-950 text-zinc-50 lg:flex lg:flex-col">
        <div
          aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:2.5rem_2.5rem]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl"
        />
        <div className="absolute inset-y-0 left-0 w-1 bg-blue-500" />

        <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500 text-white">
              <Warehouse className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Aerocentro</p>
              <p className="text-xs text-zinc-400">Almacén de herramientas</p>
            </div>
          </div>

          <div className="max-w-md space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight xl:text-4xl">
                Control de préstamos para el taller
              </h1>
              <p className="text-sm leading-relaxed text-zinc-400">
                Inicia sesión para registrar entregas, devoluciones e inventario
                de herramientas en Aerocentro Air Services.
              </p>
            </div>

            <ul className="space-y-4">
              {productHighlights.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <item.icon className="size-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-sm text-zinc-400">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-zinc-500">
            Aerocentro Air Services
          </p>
        </div>
      </aside>

      <section className="relative flex flex-col bg-background">
        <header className="flex items-center justify-between px-6 py-5 lg:justify-end">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Warehouse className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Aerocentro</p>
              <p className="text-xs text-muted-foreground">
                Almacén de herramientas
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Cambiar tema"
                />
              }
            >
              <Sun className="size-4 dark:hidden" />
              <Moon className="hidden size-4 dark:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value)}
              >
                <DropdownMenuRadioItem value="light">
                  <Sun />
                  Claro
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Moon />
                  Oscuro
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <Monitor />
                  Sistema
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Iniciar sesión
              </h2>
              <p className="text-sm text-muted-foreground">
                Usa tu usuario o correo
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {formError ? (
                <div
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {formError}
                </div>
              ) : null}

              <div className="space-y-2">
                <label
                  htmlFor="credencial"
                  className="text-sm font-medium leading-none"
                >
                  Usuario o correo
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="credencial"
                    name="credencial"
                    autoComplete="username"
                    className="h-10 pl-9"
                    placeholder="Usuario o correo"
                    value={credencial}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(fieldErrors.credencial)}
                    onChange={(event) => {
                      setCredencial(event.target.value)
                      if (fieldErrors.credencial || formError) {
                        setFieldErrors((current) => ({
                          ...current,
                          credencial: undefined,
                        }))
                        setFormError("")
                      }
                    }}
                  />
                </div>
                {fieldErrors.credencial &&
                fieldErrors.credencial !== formError ? (
                  <p className="text-sm text-destructive">
                    {fieldErrors.credencial}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="h-10 pr-10 pl-9"
                    placeholder="Contraseña"
                    value={password}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(fieldErrors.password)}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      if (fieldErrors.password || formError) {
                        setFieldErrors((current) => ({
                          ...current,
                          password: undefined,
                        }))
                        setFormError("")
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
                    disabled={isSubmitting}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
                {fieldErrors.password &&
                fieldErrors.password !== formError ? (
                  <p className="text-sm text-destructive">
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-10 w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
