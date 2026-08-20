import { useMemo, useState } from "react"
import { Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Mechanic, Tool } from "@/lib/prestamos-data"

type ModalAgregarPrestamoProps = {
  open: boolean
  mechanic?: Mechanic
  availableTools: Tool[]
  onOpenChange: (open: boolean) => void
  onSubmit: (toolIds: number[]) => void
}

export function ModalAgregarPrestamo({
  open,
  mechanic,
  availableTools,
  onOpenChange,
  onSubmit,
}: ModalAgregarPrestamoProps) {
  const [search, setSearch] = useState("")
  const [selectedToolIds, setSelectedToolIds] = useState<number[]>([])

  const filteredTools = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()

    if (!query) return availableTools

    return availableTools.filter((tool) =>
      tool.name.toLocaleLowerCase().includes(query)
    )
  }, [availableTools, search])

  const closeModal = () => {
    setSearch("")
    setSelectedToolIds([])
    onOpenChange(false)
  }

  const toggleTool = (toolId: number, checked: boolean) => {
    setSelectedToolIds((current) =>
      checked
        ? [...current, toolId]
        : current.filter((selectedId) => selectedId !== toolId)
    )
  }

  const submitTools = () => {
    if (selectedToolIds.length === 0) return

    onSubmit(selectedToolIds)
    setSearch("")
    setSelectedToolIds([])
  }

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
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-lg">
            Añadir préstamo a “{mechanic?.name}”
          </DialogTitle>
          <DialogDescription>
            Busca y selecciona una o varias herramientas disponibles para
            registrarlas en un solo préstamo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <label htmlFor="tool-search" className="sr-only">
              Buscar herramienta
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="tool-search"
              className="h-10 pl-9"
              placeholder="Buscar herramienta por nombre..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Herramientas disponibles</span>
            <span className="text-muted-foreground">
              {selectedToolIds.length} seleccionadas
            </span>
          </div>

          {filteredTools.length > 0 ? (
            <div className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
              {filteredTools.map((tool) => {
                const isSelected = selectedToolIds.includes(tool.id)

                return (
                  <label
                    key={tool.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-muted/50"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        toggleTool(tool.id, checked)
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{tool.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tool.category}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed py-8 text-center">
              <p className="font-medium">No hay herramientas disponibles</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Prueba con otra búsqueda o devuelve alguna herramienta.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
          <Button
            disabled={selectedToolIds.length === 0}
            onClick={submitTools}
          >
            <Plus data-icon="inline-start" />
            Añadir {selectedToolIds.length || ""}{" "}
            {selectedToolIds.length === 1 ? "herramienta" : "herramientas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
