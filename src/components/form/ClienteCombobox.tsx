import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { type Cliente } from "@/lib/clientes"

export type ClienteComboboxProps = {
  id?: string
  placeholder?: string
  value: string // clienteId (UUID)
  clientes: Cliente[]
  disabled?: boolean
  className?: string
  onChange: (clienteId: string) => void
}

export function ClienteCombobox({
  id,
  placeholder = "Escribe para buscar y seleccionar cliente...",
  value,
  clientes,
  disabled = false,
  className,
  onChange,
}: ClienteComboboxProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cliente actualmente seleccionado
  const selectedCliente = useMemo(
    () => clientes.find((c) => c.id === value),
    [clientes, value],
  )

  // Cuando cambia el cliente seleccionado externamente, sincronizar el texto visible si el dropdown está cerrado
  useEffect(() => {
    if (!isOpen) {
      if (selectedCliente) {
        setSearchQuery(selectedCliente.nombre_completo)
      } else {
        setSearchQuery("")
      }
    }
  }, [selectedCliente, isOpen])

  // Filtrado de opciones
  const filteredClientes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return clientes

    // Si coincide exactamente con el cliente ya seleccionado y el dropdown recién se abre, mostrar todos
    if (selectedCliente && selectedCliente.nombre_completo.toLowerCase() === q) {
      return clientes
    }

    return clientes.filter((c) => {
      const matchNombre = c.nombre_completo.toLowerCase().includes(q)
      const matchNit = c.nit?.toLowerCase().includes(q)
      const matchApodo = c.apodo?.toLowerCase().includes(q)
      const matchCelular = c.celular?.toLowerCase().includes(q)
      return matchNombre || matchNit || matchApodo || matchCelular
    })
  }, [clientes, searchQuery, selectedCliente])

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        // Restaurar nombre del cliente si hay uno seleccionado
        if (selectedCliente) {
          setSearchQuery(selectedCliente.nombre_completo)
        } else {
          setSearchQuery("")
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, selectedCliente])

  const handleSelect = (cliente: Cliente) => {
    onChange(cliente.id)
    setSearchQuery(cliente.nombre_completo)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    setSearchQuery("")
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        id={inputId}
        ref={inputRef}
        className={cn(
          "h-9 pl-9 pr-14 text-xs sm:text-sm",
          selectedCliente && "font-medium text-foreground",
        )}
        placeholder={placeholder}
        value={searchQuery}
        disabled={disabled}
        autoComplete="off"
        onFocus={() => {
          setIsOpen(true)
        }}
        onChange={(event) => {
          setSearchQuery(event.target.value)
          setIsOpen(true)
          if (!event.target.value.trim() && value) {
            onChange("")
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false)
            if (selectedCliente) {
              setSearchQuery(selectedCliente.nombre_completo)
            }
          }
        }}
      />

      {/* Botones a la derecha: Limpiar (X) y Flecha (ChevronDown) */}
      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
        {value && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onClick={handleClear}
            className="flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Limpiar selección"
          >
            <X className="size-3.5" />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => {
            if (disabled) return
            setIsOpen((prev) => !prev)
            if (!isOpen) {
              inputRef.current?.focus()
            }
          }}
          className="flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Dropdown de opciones */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
          {filteredClientes.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              No se encontraron clientes que coincidan con &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredClientes.map((cliente) => {
              const isSelected = cliente.id === value
              return (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => handleSelect(cliente)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-xs sm:text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent/80 font-semibold text-primary",
                  )}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium text-foreground">
                      {cliente.nombre_completo}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {cliente.nit && <span>NIT: {cliente.nit}</span>}
                      {cliente.celular && (
                        <span>&bull; Cel: {cliente.celular}</span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
