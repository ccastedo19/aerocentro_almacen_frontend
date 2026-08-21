import * as React from 'react'
import {
  BadgeCheck,
  Bell,
  House,
  ChevronsUpDown,
  DatabaseBackup,
  FolderTree,
  LogOut,
  MapPin,
  Package,
  Tag,
  UserRound,
  Users,
  Warehouse,
  Wrench,
} from 'lucide-react'
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun, Monitor } from "lucide-react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from "@/hooks/use-auth"
import { esAdministrador, getIniciales, getNombreCompleto } from "@/lib/auth"

const data = {
  teams: [
    {
      name: 'Aerocentro',
      logo: Warehouse,
      plan: 'Almacén de herramientas',
    },
  ],
  navGroups: [
    {
      items: [
        {
          title: "Inicio",
          url: "/inicio",
          icon: House,
        },
        {
          title: "Punto de Préstamos",
          url: "/punto-prestamos",
          icon: Wrench,
        },
      ],
    },
    {
      label: "Inventario",
      items: [
        {
          title: "Herramientas",
          url: "/herramientas",
          icon: Package,
        },
        {
          title: "Categorías",
          url: "/categorias",
          icon: FolderTree,
        },
        {
          title: "Ubicaciones",
          url: "/ubicaciones",
          icon: MapPin,
        },
        {
          title: "Marcas",
          url: "/marcas",
          icon: Tag,
        },
      ],
    },
    {
      label: "Personal",
      items: [
        {
          title: "Mecánicos",
          url: "/mecanicos",
          icon: UserRound,
        },
      ],
    },
    {
      label: "Configuración",
      items: [
        {
          title: "Usuarios",
          url: "/usuarios",
          icon: Users,
          adminOnly: true,
        },
        {
          title: "Backup",
          url: "/backup",
          icon: DatabaseBackup,
          adminOnly: true,
        },
      ],
    },
  ]
  
}

function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}) {
  const activeTeam = teams[0];

  if (!activeTeam) {
    return null
  }

 
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <activeTeam.logo className="size-4" />
          </div>
  
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{activeTeam.name}</span>
            <span className="truncate text-xs">{activeTeam.plan}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function NavMain({
  groups,
}: {
  groups: {
    label?: string
    items: {
      title: string
      url: string
      icon: React.ElementType
      adminOnly?: boolean
    }[]
  }[]
}) {
  const { pathname } = useLocation()
  const { usuario } = useAuth()
  const isAdmin = esAdministrador(usuario)

  return (
    <>
      {groups.map((group, index) => {
        const items = group.items.filter((item) => !item.adminOnly || isAdmin)

        if (items.length === 0) return null

        return (
          <SidebarGroup key={group.label ?? `main-${index}`}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={pathname === item.url || (pathname === "/" && item.url === "/inicio")}
                    render={<Link to={item.url} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )
      })}
    </>
  )
}


function NavUser() {
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()

  if (!usuario) return null

  const name = getNombreCompleto(usuario)
  const initials = getIniciales(usuario)

  const handleLogout = () => {
    void logout().then(() => {
      navigate("/login", { replace: true })
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs">{usuario.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-xs">{usuario.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

              <DropdownMenuGroup>

                <DropdownMenuLabel>
                  Tema
                </DropdownMenuLabel>

                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={(value) =>
                    setTheme(value)
                  }
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

                <DropdownMenuItem>
                  <BadgeCheck />
                  Cuenta
                </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notificaciones
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut />
                Salir
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={data.navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
