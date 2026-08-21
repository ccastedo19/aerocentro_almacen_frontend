import { Link, useLocation } from "react-router-dom";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routes: Record<
  string,
  {
    title: string;
    parent?: string;
  }
> = {
  "/inicio": {
    title: "Inicio",
  },

  "/punto-prestamos": {
    title: "Punto de Préstamos",
  },

  "/herramientas": {
    title: "Herramientas",
    parent: "Inventario",
  },

  "/categorias": {
    title: "Categorías",
    parent: "Inventario",
  },

  "/ubicaciones": {
    title: "Ubicaciones",
    parent: "Inventario",
  },

  "/marcas": {
    title: "Marcas",
    parent: "Inventario",
  },

  "/mecanicos": {
    title: "Mecánicos",
    parent: "Personal",
  },

  "/usuarios": {
    title: "Usuarios",
    parent: "Configuración",
  },

  "/backup": {
    title: "Backup",
    parent: "Configuración",
  },
};

export function Breadcrumbs() {
  const { pathname } = useLocation();

  const current = routes[pathname];

  return (
    <Breadcrumb>
      <BreadcrumbList>

        {/* Inicio */}
        <BreadcrumbItem>
          {pathname === "/inicio" || pathname === "/" ? (
            <BreadcrumbPage>Inicio</BreadcrumbPage>
          ) : (
            <BreadcrumbLink
              render={<Link to="/inicio" />}
            >
              Inicio
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {/* Padre */}
        {current?.parent && (
          <>
            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>{current.parent}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}

        {/* Página */}
        {pathname !== "/inicio" &&
          pathname !== "/" &&
          current && (
            <>
              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbPage>
                  {current.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}