export type Operacion = {
  id?: string
  created_at?: string
  fechaInicio: string
  fechaVencimiento: string
  fechaCierre?: string | null
  ticker: string
  estrategia: string
  acciones: number
  strike: number
  primaRecibida: number
  comision: number
  costoCierre: number
  estado: string
  precioCierre?: number | null
  notas?: string
}