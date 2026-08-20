import { useMemo, useState } from "react"
import { Search, UserRound, Wrench } from "lucide-react"

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
  formatBorrowedAt,
  type UsedTool,
} from "@/lib/prestamos-data"

type ModalBuscarHerramientaEnUsoProps = {
  open: boolean
  usedTools: UsedTool[]
  onOpenChange: (open: boolean) => void
}

export function ModalBuscarHerramientaEnUso({
  open,
  usedTools,
  onOpenChange,
}: ModalBuscarHerramientaEnUsoProps) {
  const [search, setSearch] = useState("")

  const filteredTools = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()

    if (!query) return usedTools

    return usedTools.filter(({ tool }) =>
      tool.name.toLocaleLowerCase().includes(query)
    )
  }, [search, usedTools])

  const closeModal = () => {
    setSearch("")
    onOpenChange(false)
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
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-8 text-lg">
            Buscar herramienta en uso
          </DialogTitle>
          <DialogDescription>
            Consulta qué mecánico tiene actualmente una herramienta prestada.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <label htmlFor="used-tool-search" className="sr-only">
            Buscar herramienta en uso
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="used-tool-search"
            className="h-10 pl-9"
            placeholder="Buscar herramienta por nombre..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="flex items-center justify-between border-b pb-3 text-sm">
          <span className="font-medium">Herramientas prestadas</span>
          <span className="text-muted-foreground">
            {filteredTools.length} en uso
          </span>
        </div>

        {filteredTools.length > 0 ? (
          <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
            {filteredTools.map(({ tool, mechanic, borrowedAt }) => (
              <div
                key={tool.id}
                className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Wrench className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{tool.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tool.category} · Prestada {formatBorrowedAt(borrowedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 sm:shrink-0">
                  <UserRound className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      En préstamo con
                    </p>
                    <p className="text-sm font-medium">{mechanic.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Search className="mb-3 size-9 text-muted-foreground" />
            <p className="font-medium">No se encontró la herramienta</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Verifica el nombre o busca otra herramienta en uso.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={closeModal}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
