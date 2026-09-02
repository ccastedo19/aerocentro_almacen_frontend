import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type ComboboxFiltroProps = {
  id?: string
  placeholder: string
  value: string
  options: string[]
  disabled?: boolean
  className?: string
  onChange: (value: string) => void
}

export function ComboboxFiltro({
  id,
  placeholder,
  value,
  options,
  disabled = false,
  className,
  onChange,
}: ComboboxFiltroProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const query = value.trim().toLowerCase()
  const isExactMatch = useMemo(
    () => options.some((opt) => opt.toLowerCase() === query),
    [options, query],
  )

  const filteredOptions = useMemo(() => {
    if (!query || isExactMatch) return options
    return options.filter((opt) => opt.toLowerCase().includes(query))
  }, [options, query, isExactMatch])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (disabled) {
      setIsOpen(false)
    }
  }, [disabled])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false)
    } else if (event.key === "ArrowDown" && !isOpen && !disabled) {
      setIsOpen(true)
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />

      <Input
        id={inputId}
        ref={inputRef}
        className="h-9 pr-12 pl-8 text-xs sm:text-sm"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        autoComplete="off"
        onChange={(event) => {
          onChange(event.target.value)
          if (!disabled) setIsOpen(true)
        }}
        onFocus={() => {
          if (!disabled) setIsOpen(true)
        }}
        onKeyDown={handleKeyDown}
      />

      {/* Controles del lado derecho: Limpiar (X) y Flecha (ChevronDown) */}
      <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-0.5">
        {value.trim() && !disabled ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={(event) => {
              event.stopPropagation()
              onChange("")
              inputRef.current?.focus()
              setIsOpen(true)
            }}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Limpiar"
          >
            <X className="size-3" />
          </button>
        ) : null}

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation()
            if (!disabled) {
              setIsOpen((prev) => !prev)
              inputRef.current?.focus()
            }
          }}
          className={cn(
            "flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
            disabled && "cursor-not-allowed opacity-40",
          )}
          title={isOpen ? "Cerrar opciones" : "Ver opciones"}
        >
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Desplegable de opciones estilizado */}
      {isOpen && !disabled ? (
        <div
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1 max-h-48 w-full min-w-full overflow-y-auto rounded-lg border border-border/80 bg-popover p-1 text-popover-foreground shadow-lg backdrop-blur-md ring-1 ring-black/5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 dark:bg-zinc-900/95 dark:ring-white/10 animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = opt.toLowerCase() === value.trim().toLowerCase()
              return (
                <button
                  key={opt}
                  type="button"
                  title={opt}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs sm:text-sm transition-colors",
                    isSelected
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  onMouseDown={(event) => {
                    // onMouseDown se ejecuta antes del blur del input
                    event.preventDefault()
                    onChange(opt)
                    setIsOpen(false)
                  }}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected ? (
                    <Check className="size-3.5 shrink-0 text-primary" />
                  ) : null}
                </button>
              )
            })
          ) : (
            <div className="px-3 py-2 text-center text-xs text-muted-foreground">
              Sin coincidencias
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
