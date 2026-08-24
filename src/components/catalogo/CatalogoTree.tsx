import { ChevronRight, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CatalogoItem } from "@/lib/catalogo"
import type { CatalogoTreeNode } from "@/lib/catalogo-tree"

type CatalogoTreeProps = {
  nodes: CatalogoTreeNode[]
  search: string
  emptyMessage: string
  onEdit: (item: CatalogoItem) => void
  onAddChild: (item: CatalogoItem) => void
  onDelete: (item: CatalogoItem) => void
}

export function CatalogoTree({
  nodes,
  search,
  emptyMessage,
  onEdit,
  onAddChild,
  onDelete,
}: CatalogoTreeProps) {
  const filteredNodes = filtrarNodos(nodes, search.trim().toLocaleLowerCase("es"))

  if (filteredNodes.length === 0) {
    return (
      <div className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card ring-1 ring-foreground/10">
      {filteredNodes.map((node) => (
        <TreeNode
          key={`${node.id}-${search ? "search" : "default"}`}
          node={node}
          depth={0}
          forceOpen={Boolean(search.trim())}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

function TreeNode({
  node,
  depth,
  forceOpen,
  onEdit,
  onAddChild,
  onDelete,
}: {
  node: CatalogoTreeNode
  depth: number
  forceOpen: boolean
  onEdit: (item: CatalogoItem) => void
  onAddChild: (item: CatalogoItem) => void
  onDelete: (item: CatalogoItem) => void
}) {
  const hasChildren = node.hijos.length > 0

  return (
    <Collapsible defaultOpen={forceOpen || depth === 0}>
      <div
        className="flex min-h-11 items-center gap-2 border-b px-3 last:border-b-0 hover:bg-muted/40"
        style={{ paddingLeft: `${12 + depth * 24}px` }}
      >
        {hasChildren ? (
          <CollapsibleTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Expandir o contraer ${node.nombre}`}
                className="group"
              />
            }
          >
            <ChevronRight className="transition-transform group-data-[panel-open]:rotate-90" />
          </CollapsibleTrigger>
        ) : (
          <span className="size-8 shrink-0" />
        )}

        <button
          type="button"
          className="min-w-0 flex-1 rounded-md py-2 text-left outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
          title={`Agregar un hijo a ${node.nombre}`}
          onClick={() => onAddChild(node)}
        >
          <p className="truncate text-sm font-medium">{node.nombre}</p>
          {node.descripcion ? (
            <p className="truncate text-xs text-muted-foreground">
              {node.descripcion}
            </p>
          ) : null}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Acciones de ${node.nombre}`}
              />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAddChild(node)}>
              <Plus />
              Agregar hijo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(node)}>
              <Pencil />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(node)}>
              <Trash2 />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasChildren ? (
        <CollapsibleContent>
          {node.hijos.map((child) => (
            <TreeNode
              key={`${child.id}-${forceOpen ? "search" : "default"}`}
              node={child}
              depth={depth + 1}
              forceOpen={forceOpen}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </CollapsibleContent>
      ) : null}
    </Collapsible>
  )
}

function filtrarNodos(nodes: CatalogoTreeNode[], search: string): CatalogoTreeNode[] {
  if (!search) return nodes

  return nodes.flatMap((node) => {
    const children = filtrarNodos(node.hijos, search)
    const matches = `${node.nombre} ${node.descripcion ?? ""}`
      .toLocaleLowerCase("es")
      .includes(search)

    return matches || children.length > 0
      ? [{ ...node, hijos: matches ? node.hijos : children }]
      : []
  })
}
