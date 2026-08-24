import type { CatalogoItem } from "@/lib/catalogo"

export type CatalogoTreeNode = CatalogoItem & {
  hijos: CatalogoTreeNode[]
}

export function construirArbolCatalogo(items: CatalogoItem[]) {
  const nodos = new Map<string, CatalogoTreeNode>(
    items.map((item) => [item.id, { ...item, hijos: [] }]),
  )
  const raices: CatalogoTreeNode[] = []

  for (const nodo of nodos.values()) {
    const padre = nodo.parent_id ? nodos.get(nodo.parent_id) : null

    if (padre && padre.id !== nodo.id) {
      padre.hijos.push(nodo)
    } else {
      raices.push(nodo)
    }
  }

  const ordenar = (nodosActuales: CatalogoTreeNode[]) => {
    nodosActuales.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    nodosActuales.forEach((nodo) => ordenar(nodo.hijos))
  }

  ordenar(raices)

  return raices
}

export function rutaCatalogo(itemId: string, items: CatalogoItem[]) {
  const porId = new Map(items.map((item) => [item.id, item]))
  const partes: string[] = []
  const visitados = new Set<string>()
  let actual = porId.get(itemId)

  while (actual && !visitados.has(actual.id)) {
    partes.unshift(actual.nombre)
    visitados.add(actual.id)
    actual = actual.parent_id ? porId.get(actual.parent_id) : undefined
  }

  return partes.join(" > ")
}

export function idsDescendientes(itemId: string, items: CatalogoItem[]) {
  const hijosPorPadre = new Map<string, string[]>()

  for (const item of items) {
    if (!item.parent_id) continue
    const hijos = hijosPorPadre.get(item.parent_id) ?? []
    hijos.push(item.id)
    hijosPorPadre.set(item.parent_id, hijos)
  }

  const resultado = new Set<string>()
  const pendientes = [...(hijosPorPadre.get(itemId) ?? [])]

  while (pendientes.length > 0) {
    const id = pendientes.pop()
    if (!id || resultado.has(id)) continue
    resultado.add(id)
    pendientes.push(...(hijosPorPadre.get(id) ?? []))
  }

  return resultado
}

export function opcionesCatalogoConRuta(items: CatalogoItem[]) {
  return items
    .map((item) => ({
      id: item.id,
      nombre: item.nombre,
      ruta: rutaCatalogo(item.id, items),
    }))
    .sort((a, b) => a.ruta.localeCompare(b.ruta, "es"))
}
