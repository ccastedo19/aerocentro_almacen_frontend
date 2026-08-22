import { X } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"

type AlertErrorProps = {
  children: ReactNode
  onClose: () => void
}

export function AlertError({ children, onClose }: AlertErrorProps) {
  return (
    <div
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      role="alert"
    >
      <p className="min-w-0 flex-1">{children}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="text-destructive hover:bg-destructive/15 hover:text-destructive"
        aria-label="Cerrar aviso"
        onClick={onClose}
      >
        <X />
      </Button>
    </div>
  )
}
