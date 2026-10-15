import { useState } from "react"
import { NotebookPen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ModalNota } from "@/components/modal/ModalNota"

export function BotonNotas() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label="Notas del Almacén"
        title="Notas del Almacén"
        className="relative rounded-full hover:bg-accent text-foreground hover:text-amber-700 dark:hover:text-amber-300"
        onClick={() => setOpen(true)}
      >
        <NotebookPen className="size-[19px]" />
      </Button>

      <ModalNota open={open} onOpenChange={setOpen} />
    </>
  )
}
