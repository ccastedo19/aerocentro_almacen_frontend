import * as React from "react"
import { ChevronDown, LogOut, Monitor, Moon, Sun } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { ModalLogout } from "@/components/modal/ModalLogout"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "@/hooks/use-theme"
import { getIniciales, getNombreCompleto } from "@/lib/auth"
import { cn } from "@/lib/utils"

type UserMenuProps = {
  render: React.ReactElement
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
  contentClassName?: string
}

export function UserMenu({
  render,
  children,
  side = "bottom",
  align = "end",
  contentClassName,
}: UserMenuProps) {
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const [isLogoutOpen, setIsLogoutOpen] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  if (!usuario) return null

  const name = getNombreCompleto(usuario)
  const initials = getIniciales(usuario)

  const handleLogout = () => {
    setIsLoggingOut(true)

    void logout()
      .then(() => {
        navigate("/login", { replace: true })
      })
      .finally(() => {
        setIsLoggingOut(false)
        setIsLogoutOpen(false)
      })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={render}>{children}</DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn("min-w-56 rounded-lg", contentClassName)}
          side={side}
          align={align}
          sideOffset={4}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-full after:hidden">
                  <AvatarFallback className="rounded-full">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs">
                    {usuario.rol?.nombre ?? "Sin rol"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel>Tema</DropdownMenuLabel>

            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(value) => setTheme(value)}
            >
              <DropdownMenuRadioItem value="light">
                <Sun />
                Claro
              </DropdownMenuRadioItem>

              <DropdownMenuRadioItem value="dark">
                <Moon />
                Oscuro
              </DropdownMenuRadioItem>

              <DropdownMenuRadioItem value="system">
                <Monitor />
                Sistema
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setIsLogoutOpen(true)}
            >
              <LogOut />
              Salir
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ModalLogout
        open={isLogoutOpen}
        isSubmitting={isLoggingOut}
        onOpenChange={(open) => {
          if (!open && isLoggingOut) return
          setIsLogoutOpen(open)
        }}
        onConfirm={handleLogout}
      />
    </>
  )
}

export function NavbarUserMenu() {
  const { usuario } = useAuth()

  if (!usuario) return null

  return (
    <UserMenu
      side="bottom"
      align="end"
      render={
        <Button
          variant="ghost"
          className="h-11 gap-2 px-1.5 hover:bg-accent sm:px-2"
        />
      }
    >
      <Avatar className="size-8 rounded-full after:hidden">
        <AvatarFallback className="rounded-full text-xs">
          {getIniciales(usuario)}
        </AvatarFallback>
      </Avatar>

      <div className="hidden text-left leading-tight sm:grid">
        <span className="truncate text-sm font-medium">
          {getNombreCompleto(usuario)}
        </span>
        <span className="truncate text-xs font-normal text-muted-foreground">
          {usuario.rol?.nombre ?? "Sin rol"}
        </span>
      </div>

      <ChevronDown className="text-muted-foreground" />
    </UserMenu>
  )
}
