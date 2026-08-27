import { Bell, BellOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NotificationsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Notificaciones"
            className="relative rounded-full hover:bg-accent"
          />
        }
      >
        <Bell className="size-[18px]" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-72 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-sm text-foreground">
            Notificaciones
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <BellOff className="size-5" />
          </span>
          <p className="text-sm font-medium">Temporalmente deshabilitado</p>
          <p className="text-xs text-muted-foreground">
            Las notificaciones no están disponibles por el momento.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
