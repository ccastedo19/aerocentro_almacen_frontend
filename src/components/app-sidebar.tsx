import * as React from 'react'
import {
  House,
  Combine,
  DatabaseBackup,
  FolderTree,
  History,
  MapPin,
  Package,
  Tag,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react'

import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/img/logo_aerocentro.jpg";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useAuth } from "@/hooks/use-auth"
import { esAdministrador } from "@/lib/auth"

const data = {
  teams: [
    {
      name: 'Aerocentro Almacén',
      plan: 'Version 1.0',
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
          title: "Combinadas",
          url: "/combinadas",
          icon: Combine,
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
      label: "Reportes",
      items: [
        {
          title: "Historial de Préstamos",
          url: "/historial-prestamos",
          icon: History,
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
          <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-white">
            <img
              src={logo}
              alt="Aerocentro"
              className="size-full object-contain"
            />
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
                    className="sidebar-navigation-item"
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


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={data.navGroups} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
