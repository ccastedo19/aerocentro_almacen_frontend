import { Warehouse } from "lucide-react"

import { cn } from "@/lib/utils"

type PagePreloaderProps = {
  recurso: string
  className?: string
  variant?: "content" | "screen"
}

export function PagePreloader({
  recurso,
  className,
  variant = "content",
}: PagePreloaderProps) {
  return (
    <div
      className={cn(
        "flex justify-center bg-background",
        variant === "screen"
          ? "fixed inset-0 z-[100] items-start pt-24"
          : "w-full pt-10",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative flex size-24 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-[3px] border-muted" />
          <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-primary border-r-primary/40" />
          <span className="absolute inset-3 animate-pulse rounded-full bg-primary/8" />
          <Warehouse className="relative size-9 text-primary" />
        </div>

        <div className="space-y-1.5">
          <p className="text-xl font-semibold tracking-tight">
            Cargando {recurso}
          </p>
          <p className="text-sm text-muted-foreground">
            Un momento, estamos preparando la información.
          </p>
        </div>
      </div>
    </div>
  )
}
