# SCD — Documento de Contexto del Software

> **SCD** (Software Context Document): referencia viva del proyecto para desarrolladores y agentes de IA.
> Las secciones marcadas con `AUTO` se regeneran con `npm run scd:update`.

## Resumen del proyecto

Aplicación web **Tienda de Componentes** construida con React, Vite y shadcn/ui (preset Nova). Incluye un layout con sidebar colapsable basado en la documentación oficial de shadcn.

### Objetivo

Gestionar y mostrar componentes de una tienda con una interfaz moderna, accesible y extensible.

### Estado actual

- Layout principal con `SidebarProvider`, `AppSidebar` y área de contenido.
- Componentes shadcn/ui instalados y configurados.
- MCP de shadcn habilitado a nivel de proyecto.
- Rutas en preparación (`src/routes/Route.tsx` vacío).

---

## Metadatos

<!-- AUTO:metadata:START -->
- **Proyecto**: tienda_componentes_full
- **Versión**: 0.0.0
- **Última actualización automática**: 2026-07-12T19:08:40.434Z
- **Última modificación en `src/`**: 2026-07-11T15:43:32.746Z
<!-- AUTO:metadata:END -->

---

## Stack tecnológico

<!-- AUTO:stack:START -->
### Dependencias
- **@base-ui/react**: ^1.6.0
- **@fontsource-variable/geist**: ^5.2.9
- **@tailwindcss/vite**: ^4.3.2
- **class-variance-authority**: ^0.7.1
- **clsx**: ^2.1.1
- **lucide-react**: ^1.24.0
- **react**: ^19.2.7
- **react-dom**: ^19.2.7
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

### Decisiones técnicas

| Área | Elección |
|------|----------|
| Framework UI | React 19 + TypeScript |
| Bundler | Vite 8 |
| Estilos | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Componentes | shadcn/ui — preset **Nova** (`base-nova`) |
| Primitivos UI | `@base-ui/react` |
| Iconos | `lucide-react` |
| Fuente | Geist Variable (`@fontsource-variable/geist`) |
| Linter | oxlint |

---

## Arquitectura

```
src/
├── main.tsx              # Entrada: TooltipProvider + App
├── App.tsx               # Layout con sidebar y contenido principal
├── components/
│   ├── app-sidebar.tsx   # Sidebar de la documentación shadcn
│   └── ui/               # Componentes shadcn generados por CLI
├── hooks/
│   └── use-mobile.ts     # Detección de viewport móvil (sidebar)
├── lib/
│   └── utils.ts          # Utilidad cn() para clases Tailwind
└── routes/
    └── Route.tsx         # Rutas (pendiente de implementar)
```

### Layout

1. `SidebarProvider` envuelve toda la aplicación.
2. `AppSidebar` renderiza navegación lateral colapsable.
3. `SidebarInset` contiene header con `SidebarTrigger` y el contenido principal.

### Convenciones

- Alias de importación: `@/` apunta a `src/`.
- Componentes UI en `@/components/ui/*`.
- Lógica reutilizable en `@/hooks/*`.
- Utilidades en `@/lib/*`.
- Añadir componentes shadcn: `npx shadcn@latest add <nombre>`.

---

## Estructura detectada

<!-- AUTO:structure:START -->
### Componentes de aplicación
- `src/components/app-sidebar.tsx`

### Hooks
- `src/hooks/use-mobile.ts`

### Rutas
- `src/routes/Route.tsx`

### Utilidades
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

### Componentes UI instalados
- `src/components/ui/avatar.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/collapsible.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/separator.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/ui/skeleton.tsx`
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

### Uso recomendado en Cursor

1. Activar el servidor **shadcn** en Settings → MCP.
2. Ejemplos de prompts:
   - "Muéstrame los componentes disponibles en el registry de shadcn"
   - "Añade card, dialog e input al proyecto"

---

## Rutas y navegación

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `src/routes/Route.tsx` | Pendiente | Definición de rutas de la aplicación |

> Actualizar esta tabla manualmente al implementar el enrutamiento.

---

## Comandos útiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run lint         # Linter (oxlint)
npm run scd:update   # Regenerar secciones automáticas de este documento
```

---

## Mantenimiento del SCD

Este documento se mantiene de dos formas:

1. **Automática**: `npm run scd:update` regenera metadatos, dependencias, estructura y componentes.
2. **Manual + IA**: la regla `.cursor/rules/scd.mdc` indica al agente actualizar las secciones manuales cuando cambie la arquitectura, rutas o decisiones del proyecto.

### Cuándo actualizar

- Al añadir dependencias, rutas, páginas o módulos nuevos.
- Al instalar componentes shadcn.
- Al cambiar convenciones de carpetas o aliases.
- Al finalizar una tarea que modifique la estructura del proyecto.
