export type Mechanic = {
  id: number
  name: string
  area: string
  initials: string
  accent: string
  badge: string
}

export type Tool = {
  id: number
  name: string
  category: string
}

export type Loan = {
  toolId: number
  borrowedAt: string
}

export type UsedTool = {
  tool: Tool
  mechanic: Mechanic
  borrowedAt: string
}

export const mechanics: Mechanic[] = [
  {
    id: 1,
    name: "Carlos Mendoza",
    area: "Mantenimiento de aeronaves",
    initials: "CM",
    accent: "border-blue-500",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  {
    id: 2,
    name: "José Ramírez",
    area: "Mecánica general",
    initials: "JR",
    accent: "border-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  {
    id: 3,
    name: "Miguel Torres",
    area: "Sistemas hidráulicos",
    initials: "MT",
    accent: "border-amber-500",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  {
    id: 4,
    name: "Andrés Castillo",
    area: "Aviónica",
    initials: "AC",
    accent: "border-violet-500",
    badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  },
  {
    id: 5,
    name: "Luis Herrera",
    area: "Inspección técnica",
    initials: "LH",
    accent: "border-rose-500",
    badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  },
  {
    id: 6,
    name: "Daniel Suárez",
    area: "Motores",
    initials: "DS",
    accent: "border-cyan-500",
    badge: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  },
]

export const tools: Tool[] = [
  { id: 1, name: "Llave dinamométrica 1/2″", category: "Llaves" },
  { id: 2, name: "Juego de dados 3/8″", category: "Dados" },
  { id: 3, name: "Multímetro digital", category: "Medición" },
  { id: 4, name: "Pinza para alambre de seguridad", category: "Pinzas" },
  { id: 5, name: "Calibrador Vernier", category: "Medición" },
  { id: 6, name: "Taladro neumático", category: "Neumáticas" },
  { id: 7, name: "Linterna de inspección", category: "Inspección" },
  { id: 8, name: "Alicate de corte diagonal", category: "Alicates" },
  { id: 9, name: "Juego de destornilladores", category: "Manuales" },
  { id: 10, name: "Martillo de bola", category: "Manuales" },
  { id: 11, name: "Llave ajustable 12″", category: "Llaves" },
  { id: 12, name: "Torquímetro digital", category: "Medición" },
  { id: 13, name: "Remachadora neumática", category: "Neumáticas" },
  { id: 14, name: "Endoscopio industrial", category: "Inspección" },
  { id: 15, name: "Manómetro hidráulico", category: "Medición" },
  { id: 16, name: "Extractor de rodamientos", category: "Extractores" },
  { id: 17, name: "Juego de llaves Allen", category: "Llaves" },
  { id: 18, name: "Pistola de impacto", category: "Neumáticas" },
  { id: 19, name: "Cortador de cables", category: "Corte" },
  { id: 20, name: "Medidor de presión", category: "Medición" },
  { id: 21, name: "Espejo telescópico", category: "Inspección" },
  { id: 22, name: "Juego de llaves corona", category: "Llaves" },
]

const createBorrowedAt = (daysAgo: number, hour: number, minute: number) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hour, minute, 0, 0)

  return date.toISOString()
}

export const initialLoans: Record<number, Loan[]> = {
  1: [
    { toolId: 1, borrowedAt: createBorrowedAt(0, 8, 15) },
    { toolId: 3, borrowedAt: createBorrowedAt(0, 8, 20) },
    { toolId: 4, borrowedAt: createBorrowedAt(1, 8, 22) },
    { toolId: 7, borrowedAt: createBorrowedAt(2, 9, 5) },
  ],
  2: [
    { toolId: 2, borrowedAt: createBorrowedAt(1, 7, 50) },
    { toolId: 8, borrowedAt: createBorrowedAt(3, 7, 52) },
  ],
  3: [
    { toolId: 5, borrowedAt: createBorrowedAt(0, 9, 10) },
    { toolId: 11, borrowedAt: createBorrowedAt(1, 9, 12) },
    { toolId: 15, borrowedAt: createBorrowedAt(4, 9, 15) },
  ],
  4: [{ toolId: 14, borrowedAt: createBorrowedAt(0, 8, 45) }],
  5: [
    { toolId: 6, borrowedAt: createBorrowedAt(0, 7, 30) },
    { toolId: 9, borrowedAt: createBorrowedAt(0, 7, 32) },
    { toolId: 12, borrowedAt: createBorrowedAt(1, 7, 35) },
    { toolId: 13, borrowedAt: createBorrowedAt(2, 7, 38) },
    { toolId: 16, borrowedAt: createBorrowedAt(5, 7, 40) },
  ],
  6: [
    { toolId: 17, borrowedAt: createBorrowedAt(1, 8, 55) },
    { toolId: 18, borrowedAt: createBorrowedAt(3, 8, 57) },
  ],
}

export const formatBorrowedAt = (value: string) => {
  const borrowedAt = new Date(value)
  const today = new Date()
  const borrowedDay = new Date(borrowedAt)

  today.setHours(0, 0, 0, 0)
  borrowedDay.setHours(0, 0, 0, 0)

  const daysAgo = Math.round(
    (today.getTime() - borrowedDay.getTime()) / 86_400_000
  )
  const time = new Intl.DateTimeFormat("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(borrowedAt)

  if (daysAgo === 0) return `hoy, ${time}`
  if (daysAgo === 1) return `ayer, ${time}`

  const date = new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(borrowedAt)

  return `${date}, ${time}`
}
