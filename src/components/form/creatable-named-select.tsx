import { useMemo, useState } from "react"
import { Combobox } from "@base-ui/react/combobox"
import { CheckIcon, ChevronDownIcon, Plus } from "lucide-react"

import { type NamedOption } from "@/components/form/named-select"
import { ApiError } from "@/lib/api"
import { crearCatalogo, type CatalogoItem } from "@/lib/catalogo"
import { cn } from "@/lib/utils"

type CreatableNamedSelectProps = {
  id: string
  value: string
  options: NamedOption[]
  placeholder: string
  createNoun: string
  resourcePath: string
  disabled?: boolean
  error?: string
  className?: string
  onChange: (value: string) => void
  onCreated: (item: CatalogoItem) => void
}

function normalizarNombre(nombre: string) {
  return nombre.trim().toLocaleLowerCase("es")
}

export function CreatableNamedSelect({
  id,
  value,
  options,
  placeholder,
  createNoun,
  resourcePath,
  disabled,
  error,
  className,
  onChange,
  onCreated,
}: CreatableNamedSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [createdOption, setCreatedOption] = useState<NamedOption | null>(null)

  const items = useMemo(() => {
    const base = options.filter((option) => option.nombre.trim() !== "")

    if (createdOption && !base.some((option) => option.id === createdOption.id)) {
      return [...base, createdOption]
    }

    return base
  }, [createdOption, options])

  const selected = items.find((option) => option.id === value) ?? null
  const queryTrim = query.trim()
  const existeExacto = items.some(
    (option) => normalizarNombre(option.nombre) === normalizarNombre(queryTrim),
  )
  const canCreate = queryTrim.length > 0 && !existeExacto && !isCreating

  const handleCreate = async () => {
    if (!canCreate) return

    setIsCreating(true)
    setCreateError("")

    try {
      const item = await crearCatalogo(resourcePath, {
        nombre: queryTrim,
        descripcion: "",
      })
      setCreatedOption(item)
      onCreated(item)
      onChange(item.id)
      setQuery("")
      setOpen(false)
    } catch (caught) {
      setCreateError(
        caught instanceof ApiError
          ? caught.errors.nombre?.[0] || caught.message
          : `No se pudo agregar la ${createNoun}.`,
      )
    } finally {
      setIsCreating(false)
    }
  }

  const shownError = error || createError

  return (
    <>
      <Combobox.Root
        items={items}
        value={selected}
        open={open}
        disabled={disabled || isCreating}
        itemToStringLabel={(item) => item?.nombre ?? ""}
        isItemEqualToValue={(item, current) => item.id === current.id}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            setQuery("")
            setCreateError("")
          }
        }}
        onValueChange={(next) => {
          if (!next) return
          onChange(next.id)
          setCreateError("")
        }}
        onInputValueChange={(next) => {
          setQuery(next)
          if (createError) setCreateError("")
        }}
      >
        <Combobox.Trigger
          id={id}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-sm whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30",
            className,
          )}
          aria-invalid={Boolean(shownError)}
        >
          <span
            className={cn(
              "min-w-0 truncate text-left",
              selected ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {selected?.nombre || placeholder}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </Combobox.Trigger>

        <Combobox.Portal>
          <Combobox.Positioner
            className="isolate z-[80]"
            side="bottom"
            sideOffset={4}
            align="start"
          >
            <Combobox.Popup className="w-(--anchor-width) max-h-72 origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10">
              <div className="border-b p-2">
                <Combobox.Input
                  placeholder={`Buscar ${createNoun}...`}
                  className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <Combobox.Empty className="px-3 py-2 text-sm text-muted-foreground">
                {canCreate
                  ? "No hay coincidencias."
                  : "Escribe un nombre para agregar uno nuevo."}
              </Combobox.Empty>

              <Combobox.List className="max-h-40 overflow-auto p-1">
                {(item: NamedOption) => (
                  <Combobox.Item
                    key={item.id}
                    value={item}
                    className="relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                  >
                    {item.nombre}
                    <Combobox.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
                      <CheckIcon className="size-4" />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>

              {canCreate ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm font-medium hover:bg-accent"
                  disabled={isCreating}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void handleCreate()}
                >
                  <Plus className="size-4 shrink-0" />
                  {isCreating
                    ? "Agregando..."
                    : `Agregar nueva ${createNoun} “${queryTrim}”`}
                </button>
              ) : null}
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
      {shownError ? (
        <p className="text-sm text-destructive">{shownError}</p>
      ) : null}
    </>
  )
}
