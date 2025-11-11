
import { Operacion, KPI } from '@/types'

export function capital(op: Operacion) {
  return op.acciones * op.strike
}

export function gananciaNeta(op: Operacion) {
  // prima recibida - costos (comision + costoCierre). If assigned/closed, precioCierre isn't used here.
  return op.primaRecibida - (op.comision + op.costoCierre)
}

export function roiOperacion(op: Operacion) {
  const cap = capital(op)
  const neto = gananciaNeta(op)
  return cap > 0 ? (neto / cap) * 100 : 0
}

export function computeKPIs(ops: Operacion[]): KPI {
  const totalOps = ops.length
  const primas = sum(ops.map(o => o.primaRecibida))
  const costos = sum(ops.map(o => o.comision + o.costoCierre))
  const neto = primas - costos
  const capTotal = sum(ops.map(capital))
  const roiGeneral = capTotal > 0 ? (neto / capTotal) * 100 : 0
  return { primas, costos, neto, totalOps, roiGeneral }
}

export function roiPorTicker(ops: Operacion[]): { ticker: string, roi: number, neto: number, capital: number }[] {
  const by = new Map<string, Operacion[]>()
  for (const op of ops) {
    const t = op.ticker.toUpperCase()
    by.set(t, [...(by.get(t) || []), op])
  }
  const rows = Array.from(by.entries()).map(([ticker, arr]) => {
    const cap = sum(arr.map(capital))
    const neto = sum(arr.map(gananciaNeta))
    const roi = cap > 0 ? (neto / cap) * 100 : 0
    return { ticker, roi, neto, capital: cap }
  })
  rows.sort((a, b) => b.roi - a.roi)
  return rows
}

export function sum(nums: number[]) { return nums.reduce((a, b) => a + b, 0) }
