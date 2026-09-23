import { useCallback, useEffect, useState } from "react"
import {
    AlertCircle,
    Bell,
    Check,
    CheckCircle2,
    Eye,
    EyeOff,
    ImagePlus,
    Info,
    Loader2,
    Save,
    Sparkles,
    Trash2,
} from "lucide-react"

import { AlertError } from "@/components/ui/alert-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PagePreloader } from "@/components/ui/page-preloader"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api"
import { toastExito } from "@/lib/toast"
import {
    cambiarEstadoNotificacionPublica,
    eliminarNotificacionPublica,
    guardarNotificacionPublica,
    obtenerNotificacionPublicaAdmin,
    type NotificacionPublica,
} from "@/lib/notificaciones-publicas"

export const NotificacionesPublicas = () => {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isTogglingState, setIsTogglingState] = useState(false)

    const [pageError, setPageError] = useState("")
    const [successMessage, setSuccessMessage] = useState("")

    // Notificación en base de datos
    const [notificacion, setNotificacion] = useState<NotificacionPublica | null>(null)

    // Campos del formulario
    const [titulo, setTitulo] = useState("")
    const [mensaje, setMensaje] = useState("")
    const [estado, setEstado] = useState<number>(1) // 1: Mostrar, 0: Ocultar

    // Manejo de imagen
    const [imagenFile, setImagenFile] = useState<File | null>(null)
    const [imagenPreview, setImagenPreview] = useState<string | null>(null)
    const [eliminarImagen, setEliminarImagen] = useState(false)

    // Cargar notificación desde el servidor
    const cargarNotificacion = useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await obtenerNotificacionPublicaAdmin()
            if (data) {
                setNotificacion(data)
                setTitulo(data.titulo ?? "")
                setMensaje(data.mensaje ?? "")
                setEstado(data.estado ?? 1)
                setImagenPreview(data.imagen ?? null)
            } else {
                setNotificacion(null)
                setTitulo("Aviso Importante para Mecánicos")
                setMensaje("")
                setEstado(1)
                setImagenPreview(null)
            }
        } catch (error) {
            setPageError(
                error instanceof ApiError
                    ? error.message
                    : "No se pudo cargar la configuración de notificación pública.",
            )
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        void cargarNotificacion()
    }, [cargarNotificacion])

    // Cambiar palanca de estado (mostrar / ocultar)
    const handleToggleEstado = async () => {
        const nuevoEstado = estado === 1 ? 0 : 1
        setEstado(nuevoEstado)

        // Si ya existe la notificación en la BD, actualizar inmediatamente el estado
        if (notificacion) {
            setIsTogglingState(true)
            setPageError("")
            try {
                const res = await cambiarEstadoNotificacionPublica(nuevoEstado)
                setNotificacion(res.notificacion)
                const mensajeExito =
                    nuevoEstado === 1
                        ? "La notificación ahora está VISIBLE en la pantalla pública."
                        : "La notificación ahora está OCULTA en la pantalla pública."
                setSuccessMessage(mensajeExito)
                toastExito(mensajeExito)
            } catch (error) {
                // Revertir
                setEstado(estado)
                setPageError(
                    error instanceof ApiError
                        ? error.message
                        : "No se pudo actualizar el estado de la notificación.",
                )
            } finally {
                setIsTogglingState(false)
            }
        }
    }

    // Selección de nueva imagen
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            setPageError("El archivo seleccionado debe ser una imagen válida (JPG, PNG, WebP).")
            return
        }

        if (file.size > 4 * 1024 * 1024) {
            setPageError("La imagen no debe superar los 4 MB de tamaño.")
            return
        }

        setImagenFile(file)
        setEliminarImagen(false)
        setImagenPreview(URL.createObjectURL(file))
        setPageError("")
    }

    // Quitar imagen
    const handleRemoveImage = () => {
        setImagenFile(null)
        setImagenPreview(null)
        setEliminarImagen(true)
    }

    // Guardar cambios
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setPageError("")
        setSuccessMessage("")

        const tituloTrim = titulo.trim()
        const mensajeTrim = mensaje.trim()
        const tieneImagenValida = Boolean(imagenPreview) && !eliminarImagen

        if (!tituloTrim) {
            setPageError("El título de la notificación es obligatorio.")
            return
        }

        // Validación: imagen y mensaje pueden ser nulos, pero no los dos al mismo tiempo
        if (!mensajeTrim && !tieneImagenValida) {
            setPageError(
                "Debes incluir obligatoriamente al menos un mensaje de texto o una imagen para publicar la notificación.",
            )
            return
        }

        setIsSaving(true)

        try {
            const formData = new FormData()
            formData.append("titulo", tituloTrim)
            formData.append("mensaje", mensajeTrim)
            formData.append("estado", String(estado))

            if (imagenFile) {
                formData.append("imagen", imagenFile)
            }

            if (eliminarImagen) {
                formData.append("eliminar_imagen", "1")
            }

            const respuesta = await guardarNotificacionPublica(formData)

            setNotificacion(respuesta.notificacion)
            setImagenFile(null)
            setEliminarImagen(false)
            setImagenPreview(respuesta.notificacion.imagen ?? null)
            setSuccessMessage("¡La notificación pública se ha guardado correctamente!")
            toastExito("Notificación pública guardada correctamente.")
        } catch (error) {
            setPageError(
                error instanceof ApiError
                    ? error.message
                    : "No se pudo guardar la notificación pública.",
            )
        } finally {
            setIsSaving(false)
        }
    }

    // Eliminar la notificación completa
    const handleDeleteNotificacion = async () => {
        if (!notificacion) return
        if (!window.confirm("¿Estás seguro de eliminar esta notificación pública?")) return

        setIsSaving(true)
        try {
            await eliminarNotificacionPublica()
            setNotificacion(null)
            setTitulo("")
            setMensaje("")
            setEstado(1)
            setImagenFile(null)
            setImagenPreview(null)
            setEliminarImagen(false)
            setSuccessMessage("La notificación pública ha sido eliminada.")
            toastExito("Notificación pública eliminada correctamente.")
        } catch (error) {
            setPageError(
                error instanceof ApiError
                    ? error.message
                    : "No se pudo eliminar la notificación pública.",
            )
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <PagePreloader recurso="configuración de notificaciones públicas" />
    }

    const tieneImagenValida = Boolean(imagenPreview) && !eliminarImagen

    return (
        <div className="w-full space-y-6 pb-12">
            {/* Encabezado */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Bell className="size-5" />
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight">Notificación Pública</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Configura un aviso o mensaje emergente para mostrar a los mecánicos en la pantalla pública de préstamos.
                    </p>
                </div>

                {/* Palanca / Switch de Estado */}
                <div className="flex items-center gap-3 self-start sm:self-center bg-card border border-border/70 rounded-xl p-2.5 shadow-xs">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        {estado === 1 ? (
                            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                        ) : (
                            <span className="size-2 rounded-full bg-muted-foreground/40" />
                        )}
                        {estado === 1 ? "Mostrar en pantalla" : "Oculta"}
                    </span>

                    <button
                        type="button"
                        role="switch"
                        aria-checked={estado === 1}
                        disabled={isTogglingState}
                        onClick={() => void handleToggleEstado()}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${estado === 1 ? "bg-emerald-500" : "bg-muted"
                            }`}
                    >
                        <span
                            className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${estado === 1 ? "translate-x-5" : "translate-x-0"
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Mensajes de Alerta */}
            {pageError ? (
                <AlertError onClose={() => setPageError("")}>{pageError}</AlertError>
            ) : null}

            {successMessage ? (
                <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                    <button
                        type="button"
                        className="text-emerald-600 dark:text-emerald-400 hover:opacity-80"
                        onClick={() => setSuccessMessage("")}
                    >
                        ✕
                    </button>
                </div>
            ) : null}

            {/* Grid Principal: Formulario a la Izquierda, Vista Previa a la Derecha */}
            <div className="grid gap-6 lg:grid-cols-12 items-start">
                {/* Formulario de Configuración */}
                <Card className="lg:col-span-7">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Sparkles className="size-4 text-emerald-500" />
                                Contenido de la Notificación
                            </CardTitle>
                            {notificacion ? (
                                <span className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground font-medium">
                                    Editando aviso actual
                                </span>
                            ) : (
                                <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-medium">
                                    Nuevo aviso
                                </span>
                            )}
                        </div>
                        <CardDescription>
                            Define el título, texto o imagen que verán los mecánicos en la pantalla pública.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
                            {/* Título de la notificación */}
                            <div className="space-y-2">
                                <label htmlFor="titulo" className="text-sm font-medium leading-none">
                                    Título de la Notificación <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    id="titulo"
                                    maxLength={100}
                                    placeholder="Ej: Aviso Importante • Mantenimiento de Almacén"
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    required
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Máximo 100 caracteres. ({titulo.length}/100)
                                </p>
                            </div>

                            {/* Mensaje de texto */}
                            <div className="space-y-2">
                                <label htmlFor="mensaje" className="text-sm font-medium leading-none">
                                    Mensaje de Texto
                                </label>
                                <Textarea
                                    id="mensaje"
                                    rows={4}
                                    maxLength={500}
                                    placeholder="Escribe el mensaje o aviso detallado aquí..."
                                    value={mensaje}
                                    onChange={(e) => setMensaje(e.target.value)}
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Opcional si subes una imagen. ({mensaje.length}/500)
                                </p>
                            </div>

                            {/* Subida de Imagen */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                    Imagen Adjunta
                                </label>

                                {tieneImagenValida ? (
                                    <div className="relative overflow-hidden rounded-xl border border-border/80 bg-muted/30 p-2">
                                        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/40">
                                            <img
                                                src={imagenPreview!}
                                                alt="Vista previa"
                                                className="size-full object-contain"
                                            />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between px-1">

                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="h-7 text-xs gap-1"
                                                onClick={handleRemoveImage}
                                            >
                                                <Trash2 className="size-3.5" />
                                                Quitar imagen
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="imagen-upload"
                                        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-muted/20 p-6 text-center transition-colors hover:border-emerald-500/50 hover:bg-muted/40"
                                    >
                                        <ImagePlus className="size-8 text-muted-foreground/60 mb-2" />
                                        <p className="text-sm font-medium text-foreground">
                                            Haz clic para seleccionar una imagen
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Formatos soportados: PNG, JPG, WebP (Máx. 4 MB)
                                        </p>
                                        <input
                                            id="imagen-upload"
                                            type="file"
                                            accept="image/png, image/jpeg, image/webp"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Nota de Validación de Regla */}
                            <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-3 text-xs text-sky-700 dark:text-sky-300 flex items-start gap-2">
                                <Info className="size-4 shrink-0 mt-0.5" />
                                <span>
                                    <strong>Regla de contenido:</strong> El mensaje de texto y la imagen pueden ser opcionales, pero es obligatorio incluir <strong>al menos uno de los dos</strong> para publicar la notificación.
                                </span>
                            </div>

                            {/* Acciones */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
                                <div>
                                    {notificacion ? (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs gap-1.5"
                                            onClick={() => void handleDeleteNotificacion()}
                                            disabled={isSaving}
                                        >
                                            <Trash2 className="size-3.5" />
                                            Eliminar Notificación
                                        </Button>
                                    ) : null}
                                </div>

                                <Button
                                    type="submit"
                                    variant="success"
                                    disabled={isSaving}
                                    className="gap-2 px-5"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="size-4" />
                                            Guardar Notificación
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Tarjeta de Vista Previa (Cómo se verá en la Pantalla Pública) */}
                <Card className="lg:col-span-5 border-emerald-500/30 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.04]">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            {estado === 1 ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                            <CardTitle className="text-base font-semibold">
                                Vista Previa en Vivo
                            </CardTitle>
                        </div>
                        <CardDescription>
                            Así es como se visualizará la notificación flotante en la pantalla pública de préstamos.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Simulación del Modal / Card Flotante Pública */}
                        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xl dark bg-zinc-900 text-zinc-100 space-y-3">
                            <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                <div className="flex items-center gap-2">
                                    <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                                        Notificación Oficial
                                    </span>
                                </div>
                                <span className="text-[10px] text-zinc-400 font-mono">Ahora mismo</span>
                            </div>

                            <h3 className="text-base font-bold tracking-tight text-white">
                                {titulo.trim() || "Título de la Notificación"}
                            </h3>

                            {tieneImagenValida ? (
                                <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black/60 max-h-56 flex items-center justify-center">
                                    <img
                                        src={imagenPreview!}
                                        alt="Vista previa"
                                        className="w-full max-h-56 object-contain"
                                    />
                                </div>
                            ) : null}

                            {mensaje.trim() ? (
                                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-800/40 p-2.5 rounded-lg border border-zinc-800">
                                    {mensaje.trim()}
                                </p>
                            ) : null}

                            {!tieneImagenValida && !mensaje.trim() ? (
                                <div className="rounded-lg border border-dashed border-zinc-700 py-6 text-center text-xs text-zinc-400">
                                    <AlertCircle className="size-5 mx-auto mb-1 opacity-50" />
                                    Agrega un mensaje de texto o una imagen para ver la vista previa.
                                </div>
                            ) : null}
                        </div>

                        <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground flex items-center gap-2">
                            <Check className="size-4 text-emerald-500 shrink-0" />
                            <span>
                                Estado actual:{" "}
                                <strong className={estado === 1 ? "text-emerald-500" : "text-amber-500"}>
                                    {estado === 1 ? "VISIBILIDAD ACTIVADA" : "OCULTA (NO MOSTRAR)"}
                                </strong>
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
