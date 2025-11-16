// src/utils/roi.ts
import type { Operacion } from "@/types"

// Tipo para agrupar todos los KPI del sistema
export type KPIs = {
  sumaPrimas: number
  totalCostos: number
  gananciaNeta: number
  roiGeneral: number
  totalOperaciones: number
  capitalInvertido: number
}

// ROI de una sola operación
export function computeRoiOperacion(op: Operacion): number {
  const capital = op.acciones * op.strike
  const costos = (op.comision || 0) + (op.costoCierre || 0)
  const ganancia = (op.primaRecibida || 0) - costos
  if (!capital || capital === 0) return 0
  return (ganancia / capital) * 100
}

// ROI general (promedio de todas las operaciones)
export function computeRoiGeneral(ops: Operacion[]): number {
  const totalCapital = ops.reduce((sum, o) => sum + o.acciones * o.strike, 0)
  const totalGanancia = ops.reduce(
    (sum, o) => sum + ((o.primaRecibida || 0) - ((o.comision || 0) + (o.costoCierre || 0))),
    0
  )
  if (!totalCapital || totalCapital === 0) return 0
  return (totalGanancia / totalCapital) * 100
}

// Cálculo de KPIs globales
export function computeKPIs(ops: Operacion[]): KPIs {
  const sumaPrimas = ops.reduce((sum, o) => sum + (o.primaRecibida || 0), 0)
  const totalCostos = ops.reduce((sum, o) => sum + ((o.comision || 0) + (o.costoCierre || 0)), 0)
  const gananciaNeta = sumaPrimas - totalCostos
  const roiGeneral = computeRoiGeneral(ops)
  const totalOperaciones = ops.length
  const capitalInvertido = ops.reduce((sum, o) => sum + (o.acciones * o.strike), 0)

  return { sumaPrimas, totalCostos, gananciaNeta, roiGeneral, totalOperaciones, capitalInvertido }
}
