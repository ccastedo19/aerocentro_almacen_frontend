import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type NamedOption = {
  id: string
  nombre: string
}

type NamedSelectProps = {
  id: string
  value: string
  options: NamedOption[]
  placeholder: string
  disabled?: boolean
  error?: string
  onChange: (value: string) => void
}

export function NamedSelect({
  id,
  value,
  options,
  placeholder,
  disabled,
  error,
  onChange,
}: NamedSelectProps) {
  return (
    <>
      <Select
        value={value || null}
        items={Object.fromEntries(options.map((option) => [option.id, option.nombre]))}
        itemToStringLabel={(optionId) =>
          options.find((option) => option.id === optionId)?.nombre ?? ""
        }
        onValueChange={(next) => {
          if (next == null) return
          onChange(String(next))
        }}
      >
        <SelectTrigger
          id={id}
          className="h-10 w-full"
          disabled={disabled}
          aria-invalid={Boolean(error)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} className="min-w-64">
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </>
  )
}
