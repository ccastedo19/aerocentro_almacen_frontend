import { useEffect, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  NamedSelect,
  type NamedOption,
} from "@/components/form/named-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { CatalogoFormValues, CatalogoItem } from "@/lib/catalogo"

type ModalCatalogoProps = {
  open: boolean
  singular: string
  nombrePlaceholder: string
  descripcionPlaceholder: string
  item?: CatalogoItem | null
  isSubmitting: boolean
  formError: string
  nombreError: string
  parentError?: string
  jerarquico?: boolean
  parentOptions?: NamedOption[]
  initialParentId?: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CatalogoFormValues) => void
}

export function ModalCatalogo({
  open,
  singular,
  nombrePlaceholder,
  descripcionPlaceholder,
  item,
  isSubmitting,
  formError,
  nombreError,
  parentError,
  jerarquico = false,
  parentOptions = [],
  initialParentId = null,
  onOpenChange,
  onSubmit,
}: ModalCatalogoProps) {
  const isEditing = Boolean(item)
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [parentId, setParentId] = useState("__root__")
  const [localNombreError, setLocalNombreError] = useState("")

  useEffect(() => {
    if (!open) return

    setNombre(item?.nombre ?? "")
    setDescripcion(item?.descripcion ?? "")
    setParentId(item?.parent_id ?? initialParentId ?? "__root__")
    setLocalNombreError("")
  }, [initialParentId, item, open])

  const closeModal = () => {
    if (isSubmitting) return
    onOpenChange(false)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nombreValue = nombre.trim()

    if (!nombreValue) {
      setLocalNombreError("El nombre es obligatorio.")
      return
    }

    onSubmit({
      nombre: nombreValue,
      descripcion: descripcion.trim(),
      parent_id: jerarquico && parentId !== "__root__" ? parentId : null,
    })
  }

  const shownNombreError = localNombreError || nombreError
  const shownFormError =
    formError && formError !== shownNombreError ? formError : ""
  const selectedParent = parentOptions.find((option) => option.id === parentId)
  const singularCapitalizado =
    singular.charAt(0).toLocaleUpperCase("es") + singular.slice(1)

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Editar ${singular}` : `Agregar ${singular}`}
          </DialogTitle>
          <DialogDescription>
            El nombre es obligatorio. La descripción puede quedar vacía.
          </DialogDescription>
        </DialogHeader>

        <form
          id="catalogo-form"
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

          {!isEditing && initialParentId && selectedParent ? (
            <div className="rounded-lg border bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                {singularCapitalizado} padre:
              </span>{" "}
              <span className="font-semibold">{selectedParent.nombre}</span>
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="catalogo-nombre" className="text-sm font-medium">
              Nombre
            </label>
            <Input
              id="catalogo-nombre"
              className="h-10"
              placeholder={nombrePlaceholder}
              value={nombre}
              disabled={isSubmitting}
              aria-invalid={Boolean(shownNombreError)}
              onChange={(event) => {
                setNombre(event.target.value)
                if (localNombreError) setLocalNombreError("")
              }}
            />
            {shownNombreError ? (
              <p className="text-sm text-destructive">{shownNombreError}</p>
            ) : null}
          </div>

          {jerarquico ? (
            <div className="space-y-2">
              <label htmlFor="catalogo-padre" className="text-sm font-medium">
                Padre
                <span className="ml-1 font-normal text-muted-foreground">
                  (opcional)
                </span>
              </label>
              <NamedSelect
                id="catalogo-padre"
                value={parentId}
                options={[
                  { id: "__root__", nombre: "Sin padre (raíz)" },
                  ...parentOptions,
                ]}
                placeholder="Selecciona un padre"
                disabled={isSubmitting}
                error={parentError}
                onChange={setParentId}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <label
              htmlFor="catalogo-descripcion"
              className="text-sm font-medium"
            >
              Descripción
              <span className="ml-1 font-normal text-muted-foreground">
                (opcional)
              </span>
            </label>
            <Textarea
              id="catalogo-descripcion"
              placeholder={descripcionPlaceholder}
              value={descripcion}
              disabled={isSubmitting}
              onChange={(event) => setDescripcion(event.target.value)}
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
          <Button type="submit" form="catalogo-form" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
