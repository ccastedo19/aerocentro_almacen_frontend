import { api } from "@/lib/api"

export type InicioResumen = {
  herramientas: number
  mecanicos: number
  prestadas: number
  disponibles: number
}

export type PrestamoPorDia = {
  dia: string
  cantidad: number
}

export type HerramientaNoDevuelta = {
  id: string
  herramienta: string
  mecanico: string
  retraso: string
}

export type RankingInicio = {
  id: string
  nombre: string
  prestamos: number
}

export type InicioDashboard = {
  resumen: InicioResumen
  prestamos_por_dia: PrestamoPorDia[]
  no_devueltas: HerramientaNoDevuelta[]
  top_herramientas: RankingInicio[]
  top_mecanicos: RankingInicio[]
}

export const INICIO_VACIO: InicioDashboard = {
  resumen: {
    herramientas: 0,
    mecanicos: 0,
    prestadas: 0,
    disponibles: 0,
  },
  prestamos_por_dia: [
    { dia: "Lun", cantidad: 0 },
    { dia: "Mar", cantidad: 0 },
    { dia: "Mié", cantidad: 0 },
    { dia: "Jue", cantidad: 0 },
    { dia: "Vie", cantidad: 0 },
    { dia: "Sáb", cantidad: 0 },
    { dia: "Dom", cantidad: 0 },
  ],
  no_devueltas: [],
  top_herramientas: [],
  top_mecanicos: [],
}

export function obtenerInicio() {
  return api<InicioDashboard>("/api/inicio")
}
