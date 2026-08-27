import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronRight, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CatalogoItem } from "@/lib/catalogo"
import type { CatalogoTreeNode } from "@/lib/catalogo-tree"
import { cn } from "@/lib/utils"

type CatalogoTreeProps = {
  titulo: string
  nodes: CatalogoTreeNode[]
  search: string
  emptyMessage: string
  onEdit: (item: CatalogoItem) => void
  onAddChild: (item: CatalogoItem) => void
  onDelete: (item: CatalogoItem) => void
}

export function CatalogoTree({
  titulo,
  nodes,
  search,
  emptyMessage,
  onEdit,
  onAddChild,
  onDelete,
}: CatalogoTreeProps) {
  const searchTerm = search.trim().toLocaleLowerCase("es")
  const filteredNodes = useMemo(
    () => filtrarNodos(nodes, searchTerm),
    [nodes, searchTerm],
  )

  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())
  const raicesExpandibles = useMemo(
    () =>
      nodes
        .filter((node) => node.hijos.length > 0)
        .map((node) => node.id)
        .join("|"),
    [nodes],
  )

  useEffect(() => {
    if (!raicesExpandibles) return

    setOpenIds((prev) => {
      const next = new Set(prev)
      raicesExpandibles.split("|").forEach((id) => next.add(id))
      return next
    })
  }, [raicesExpandibles])

  const isOpen = useCallback(
    (id: string) => (searchTerm ? true : openIds.has(id)),
    [openIds, searchTerm],
  )

  const toggle = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <div className="overflow-hidden rounded-xl border bg-card ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
        <p className="text-sm font-semibold">{titulo}</p>

        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Expandir todo"
            aria-label="Expandir todo"
            onClick={() => setOpenIds(new Set(idsExpandibles(nodes)))}
          >
            <ChevronDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Contraer todo"
            aria-label="Contraer todo"
            onClick={() => setOpenIds(new Set())}
          >
            <ChevronUp />
          </Button>
        </div>
      </div>

      {filteredNodes.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <ul className="p-2">
          {filteredNodes.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              isOpen={isOpen}
              onToggle={toggle}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function TreeNode({
  node,
  isOpen,
  onToggle,
  onEdit,
  onAddChild,
  onDelete,
}: {
  node: CatalogoTreeNode
  isOpen: (id: string) => boolean
  onToggle: (id: string) => void
  onEdit: (item: CatalogoItem) => void
  onAddChild: (item: CatalogoItem) => void
  onDelete: (item: CatalogoItem) => void
}) {
  const hasChildren = node.hijos.length > 0
  const abierto = hasChildren && isOpen(node.id)

  const contenido = (
    <>
      <span className="truncate text-sm font-medium">{node.nombre}</span>
      <span className="shrink-0 text-xs font-medium text-primary">
        [{node.hijos.length}]
      </span>
      {node.descripcion ? (
        <span className="hidden truncate text-xs text-muted-foreground lg:inline">
          {node.descripcion}
        </span>
      ) : null}
    </>
  )

  return (
    <li>
      <div className="group/fila flex min-h-9 items-center gap-1.5 rounded-lg px-1 transition-colors hover:bg-accent/60">
        {hasChildren ? (
          <button
            type="button"
            aria-label={`${abierto ? "Contraer" : "Expandir"} ${node.nombre}`}
            aria-expanded={abierto}
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onToggle(node.id)}
          >
            <ChevronRight
              className={cn("size-4 transition-transform", abierto && "rotate-90")}
            />
          </button>
        ) : (
          <span className="size-6 shrink-0" />
        )}

        {hasChildren ? (
          <button
            type="button"
            className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onToggle(node.id)}
          >
            {contenido}
          </button>
        ) : (
          <span className="flex min-w-0 items-center gap-2 py-1.5">
            {contenido}
          </span>
        )}

        <div className="invisible flex shrink-0 items-center gap-0.5 pl-1 opacity-0 transition-opacity group-hover/fila:visible group-hover/fila:opacity-100 focus-within:visible focus-within:opacity-100 max-sm:visible max-sm:opacity-100">
          <Button
            type="button"
            variant="success"
            size="icon-xs"
            title={`Agregar dentro de ${node.nombre}`}
            aria-label={`Agregar dentro de ${node.nombre}`}
            onClick={() => onAddChild(node)}
          >
            <Plus />
          </Button>
          <Button
            type="button"
            variant="warning"
            size="icon-xs"
            title={`Editar ${node.nombre}`}
            aria-label={`Editar ${node.nombre}`}
            onClick={() => onEdit(node)}
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon-xs"
            title={`Eliminar ${node.nombre}`}
            aria-label={`Eliminar ${node.nombre}`}
            onClick={() => onDelete(node)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {abierto ? (
        <ul className="ml-4 border-l border-border pl-2">
          {node.hijos.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              isOpen={isOpen}
              onToggle={onToggle}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function idsExpandibles(nodes: CatalogoTreeNode[]): string[] {
  return nodes.flatMap((node) =>
    node.hijos.length > 0 ? [node.id, ...idsExpandibles(node.hijos)] : [],
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
