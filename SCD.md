# SCD — Documento de Contexto del Software (Frontend)

> **SCD** (Software Context Document): Referencia técnica viva del proyecto frontend para desarrolladores y agentes de IA.
> Las secciones marcadas con `AUTO` se regeneran ejecutando `npm run scd:update`.

---

## Resumen del Proyecto

Aplicación web **Aerocentro Almacén (Módulo de Almacén de Avionetas)** construida con React 19, TypeScript, Vite 8, Tailwind CSS v4 y componentes **shadcn/ui** (preset Nova). 

Incluye un sistema completo de navegación por Dashboard, Punto de Préstamos interactivo en tiempo real, gestión de inventario y unidades serializadas con QR, kits/combinadas, control de mecánicos aeronáuticos, vistas en árbol para categorías y ubicaciones, auditoría de préstamos y respaldos de sistema.

### Objetivo

Proveer una interfaz de usuario moderna, rápida e intuitiva para los almacenistas y administradores de Aerocentro, optimizando la entrega, recepción y trazabilidad de herramientas e insumos aeronáuticos.

### Estado Actual

- **Sistema de Enrutamiento**: React Router v7 (`createBrowserRouter`) en `src/routes/Route.tsx`.
- **Autenticación**: `AuthProvider` en `src/components/auth-provider.tsx` con manejo de Bearer Tokens para Laravel Sanctum.
- **Protección de Rutas**: Guards `RequireAuth`, `RequireGuest` y `RequireAdmin` en `src/components/auth-guards.tsx`.
- **Layout General**: `MainLayout` con `SidebarProvider`, `AppSidebar` colapsable, `Breadcrumbs`, selector de tema y menú de usuario.
- **Modales de Negocio**: 14 modales reactivos en `src/components/modal/` para creación, edición, asignación y devolución de componentes.

---

## Metadatos

<!-- AUTO:metadata:START -->
- **Proyecto**: tienda_componentes_full
- **Versión**: 0.0.0
- **Última actualización automática**: 2026-09-02T21:06:27.839Z
- **Última modificación en `src/`**: 2026-08-28T13:01:15.566Z
<!-- AUTO:metadata:END -->

---

## Stack Tecnológico

<!-- AUTO:stack:START -->
### Dependencias
- **@base-ui/react**: ^1.6.0
- **@fontsource-variable/geist**: ^5.2.9
- **@tailwindcss/vite**: ^4.3.2
- **@tanstack/react-table**: ^9.1.2
- **class-variance-authority**: ^0.7.1
- **clsx**: ^2.1.1
- **lucide-react**: ^1.24.0
- **next-themes**: ^0.4.6
- **react**: ^19.2.7
- **react-dom**: ^19.2.7
- **react-router-dom**: ^7.18.1
- **tailwind-merge**: ^3.6.0
- **tailwindcss**: ^4.3.2
- **tw-animate-css**: ^1.4.0
- **@types/node**: ^24.13.2
- **@types/react**: ^19.2.17
- **@types/react-dom**: ^19.2.3
- **@vitejs/plugin-react**: ^6.0.3
- **oxlint**: ^1.71.0
- **shadcn**: ^4.13.0
- **typescript**: ~6.0.2
- **vite**: ^8.1.1

### Scripts
- `dev`: `vite`
- `build`: `tsc -b && vite build`
- `lint`: `oxlint`
- `preview`: `vite preview`
- `scd:update`: `node scripts/update-scd.mjs`
<!-- AUTO:stack:END -->

### Decisiones Técnicas

| Área | Elección |
|------|----------|
| Framework UI | React 19 + TypeScript 6 |
| Bundler | Vite 8 |
| Enrutamiento | React Router v7 |
| Estilos | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Componentes UI | shadcn/ui — preset **Nova** (`base-nova`) |
| Tablas Complejas | `@tanstack/react-table` |
| Primitivos UI | `@base-ui/react` |
| Iconos | `lucide-react` |
| Fuente | Geist Variable (`@fontsource-variable/geist`) |
| Linter | `oxlint` |

---

## Arquitectura del Proyecto

```
src/
├── main.tsx                    # Punto de entrada de React con TooltipProvider y AuthProvider
├── App.tsx                     # Componente raíz del router
├── routes/
│   └── Route.tsx               # Configuración central de rutas y protecciones
├── components/
│   ├── MainLayout.tsx          # Layout principal (Sidebar + Breadcrumb + UserMenu)
│   ├── app-sidebar.tsx         # Menú lateral navegable por roles
│   ├── auth-guards.tsx         # Guardias de autenticación y admin
│   ├── auth-provider.tsx       # Estado global de usuario y token Sanctum
│   ├── Breadcrumbs.tsx         # Navegación dinámica
│   ├── user-menu.tsx           # Perfil de usuario y logout
│   ├── notifications-menu.tsx  # Alertas y avisos de herramientas prestadas
│   ├── modal/                  # Modales reactivos de la aplicación
│   ├── catalogo/               # Vistas jerárquicas y en árbol
│   ├── herramientas/           # Editores de unidades físicas
│   ├── historial/              # Reportes e historial de movimientos
│   ├── prestamos/              # Detalle de préstamos y herramientas
│   ├── form/                   # Selects dinámicos con creación rápida
│   └── ui/                     # Primitivos shadcn/ui estilizados
├── pages/                      # 18 vistas principales
│   ├── Login.tsx               # Pantalla de inicio de sesión
│   ├── Inicio.tsx              # Dashboard y catálogo visual
│   ├── PuntoPrestamos.tsx      # Terminal de entrega/devolución de herramientas
│   ├── Herramientas.tsx        # Inventario de herramientas e insumos
│   ├── Combinadas.tsx          # Gestión de kits y juegos de herramientas
│   ├── Categorias.tsx          # Categorías jerárquicas
│   ├── Ubicaciones.tsx         # Estantes y ubicaciones en almacén
│   ├── Marcas.tsx              # Fabricantes de herramientas
│   ├── Mecanicos.tsx           # Ficha de mecánicos aeronáuticos
│   ├── HistorialPrestamos.tsx  # Reportes y trazabilidad
│   ├── Usuarios.tsx            # Administración de cuentas (Admin)
│   ├── Backup.tsx              # Respaldos de base de datos (Admin)
│   └── NotFound.tsx            # Página 404
├── hooks/                      # Custom React Hooks
└── lib/
    ├── utils.ts                # Utilidad cn() para mezclar clases Tailwind
    └── api.ts                  # Cliente Axios/Fetch configurado con token Sanctum
```

---

## Estructura Detectada

<!-- AUTO:structure:START -->
### Vistas / Páginas (`src/pages`)
- `src/pages/Agenda.tsx`
- `src/pages/Backup.tsx`
- `src/pages/Categorias.tsx`
- `src/pages/Clientes.tsx`
- `src/pages/Combinadas.tsx`
- `src/pages/Datos_empresa.tsx`
- `src/pages/Herramientas.tsx`
- `src/pages/HistorialPrestamos.tsx`
- `src/pages/Inicio.tsx`
- `src/pages/Login.tsx`
- `src/pages/Marcas.tsx`
- `src/pages/Mecanicos.tsx`
- `src/pages/NotFound.tsx`
- `src/pages/PuntoPrestamos.tsx`
- `src/pages/Servicios.tsx`
- `src/pages/Trabajadores.tsx`
- `src/pages/Ubicaciones.tsx`
- `src/pages/Usuarios.tsx`

### Componentes de Aplicación y Layout
- `src/components/Breadcrumbs.tsx`
- `src/components/MainLayout.tsx`
- `src/components/app-sidebar.tsx`
- `src/components/auth-guards.tsx`
- `src/components/auth-provider.tsx`
- `src/components/form/combobox-filtro.tsx`
- `src/components/form/creatable-named-select.tsx`
- `src/components/form/named-select.tsx`
- `src/components/herramientas/unidad-editor.tsx`
- `src/components/notifications-menu.tsx`
- `src/components/prestamos/detalle-unidad-prestamo.tsx`
- `src/components/theme-provider.tsx`
- `src/components/user-menu.tsx`

### Modales de Negocio (`src/components/modal`)
- `src/components/modal/ModalAgregarPrestamo.tsx`
- `src/components/modal/ModalBuscarHerramientaEnUso.tsx`
- `src/components/modal/ModalBuscarHerramientaGeneral.tsx`
- `src/components/modal/ModalCatalogo.tsx`
- `src/components/modal/ModalCombinada.tsx`
- `src/components/modal/ModalConfirmarEliminar.tsx`
- `src/components/modal/ModalConfirmarRestaurarBackup.tsx`
- `src/components/modal/ModalHerramienta.tsx`
- `src/components/modal/ModalHistorialPrestamo.tsx`
- `src/components/modal/ModalLogout.tsx`
- `src/components/modal/ModalMecanico.tsx`
- `src/components/modal/ModalUsuario.tsx`
- `src/components/modal/ModalVerPrestamos.tsx`
- `src/components/modal/ModalVerUnidades.tsx`

### Componentes de Catálogo (`src/components/catalogo`)
- `src/components/catalogo/CatalogoPage.tsx`
- `src/components/catalogo/CatalogoTree.tsx`

### Componentes de Historial (`src/components/historial`)
- `src/components/historial/HistorialGeneral.tsx`
- `src/components/historial/HistorialPorHerramienta.tsx`
- `src/components/historial/HistorialPorMecanico.tsx`

### Hooks
- `src/hooks/use-auth.ts`
- `src/hooks/use-closing-snapshot.ts`
- `src/hooks/use-mobile.ts`
- `src/hooks/use-theme.ts`

### Rutas
- `src/routes/Route.tsx`

### Utilidades
- `src/lib/acciones-color.ts`
- `src/lib/api.ts`
- `src/lib/auth.ts`
- `src/lib/backups.ts`
- `src/lib/catalogo-tree.ts`
- `src/lib/catalogo.ts`
- `src/lib/combinadas.ts`
- `src/lib/herramientas.ts`
- `src/lib/historial-prestamos.ts`
- `src/lib/inicio.ts`
- `src/lib/mecanicos.ts`
- `src/lib/prestamos.ts`
- `src/lib/toast.ts`
- `src/lib/usuarios.ts`
- `src/lib/utils.ts`
<!-- AUTO:structure:END -->

---

## Configuración shadcn/ui

<!-- AUTO:shadcn:START -->
- **Estilo**: base-nova
- **Iconos**: lucide
- **CSS**: `src/index.css`
- **Variables CSS**: sí

### Aliases
- `components`: `@/components`
- `utils`: `@/lib/utils`
- `ui`: `@/components/ui`
- `lib`: `@/lib`
- `hooks`: `@/hooks`

### Componentes UI instalados (shadcn)
- `src/components/ui/alert-error.tsx`
- `src/components/ui/avatar.tsx`
- `src/components/ui/breadcrumb.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/collapsible.tsx`
- `src/components/ui/data-table.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/page-preloader.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/separator.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/toast.tsx`
- `src/components/ui/tooltip.tsx`
<!-- AUTO:shadcn:END -->

---

## MCP (Model Context Protocol)

<!-- AUTO:mcp:START -->
Servidor MCP configurado en `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": [
        "shadcn@latest",
        "mcp"
      ]
    }
  }
}
```
<!-- AUTO:mcp:END -->

---

## Rutas y Navegación

| Ruta Path | Vista / Componente | Acceso | Descripción |
|-----------|--------------------|--------|-------------|
| `/login` | `Login.tsx` | Invitado | Inicio de sesión con correo y contraseña |
| `/` / `/inicio` | `Inicio.tsx` | Autenticado | Dashboard con métricas de almacén e insumos |
| `/punto-prestamos` | `PuntoPrestamos.tsx` | Autenticado | Despacho y devolución rápida de herramientas a mecánicos |
| `/herramientas` | `Herramientas.tsx` | Autenticado | Catálogo e inventario serializado de herramientas |
| `/combinadas` | `Combinadas.tsx` | Autenticado | Gestión de juegos/kits de herramientas combinadas |
| `/categorias` | `Categorias.tsx` | Autenticado | Árbol jerárquico de categorías de almacén |
| `/ubicaciones` | `Ubicaciones.tsx` | Autenticado | Ubicaciones físicas en hangar/estantes |
| `/marcas` | `Marcas.tsx` | Autenticado | Marcas y fabricantes |
| `/mecanicos` | `Mecanicos.tsx` | Autenticado | Registro de mecánicos aeronáuticos |
| `/historial-prestamos`| `HistorialPrestamos.tsx` | Autenticado | Auditoría de movimientos y reportes |
| `/usuarios` | `Usuarios.tsx` | Solo Admin | Gestión de usuarios y asignación de roles |
| `/backup` | `Backup.tsx` | Solo Admin | Generación y restauración de respaldos SQL |

---

## Comandos Útiles

```bash
npm run dev          # Servidor de desarrollo Vite
npm run build        # Build de producción TypeScript + Vite
npm run lint         # Linter con oxlint
npm run scd:update   # Regenerar secciones automáticas del SCD
```

---

## Mantenimiento del SCD

1. **Automático**: Ejecutar `npm run scd:update` para actualizar metadatos, dependencias, rutas y componentes detectados.
2. **Manual**: Actualizar la tabla de rutas o agregar descripciones cuando se incorpore un módulo nuevo.
