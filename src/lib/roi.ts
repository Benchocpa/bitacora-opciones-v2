// src/lib/roi.ts
export type Trade = {
  id?: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  fecha_cierre?: string | null;
  ticker: string;
  estrategia: string;
  acciones: number;
  strike: number;
  prima_recibida: number;
  comision: number;
  costo_cierre: number;
  estado: 'abierta' | 'cerrada' | 'rolada' | 'cancelada';
  precio_cierre?: number | null;
  notas?: string | null;
};

export type KPIs = {
  totalOperaciones: number;
  sumaPrimas: number;
  totalCostos: number;
  gananciaNeta: number;
  capitalInvertido: number;
  roiGeneral: number;
};

export function computeKPIs(trades: Trade[]): KPIs {
  const totalOperaciones = trades.length;
  const sumaPrimas = trades.reduce((s, t) => s + (t.prima_recibida || 0), 0);
  const totalCostos = trades.reduce((s, t) => s + (t.comision || 0) + (t.costo_cierre || 0), 0);
  const gananciaNeta = sumaPrimas - totalCostos;
  const capitalInvertido = trades.reduce((s, t) => s + (t.acciones * t.strike), 0);
  const roiGeneral = capitalInvertido > 0 ? (gananciaNeta / capitalInvertido) * 100 : 0;
  return { totalOperaciones, sumaPrimas, totalCostos, gananciaNeta, capitalInvertido, roiGeneral };
}

export function computeRoiPorTicker(trades: Trade[]): { ticker: string; roi: number; neto: number; capital: number }[] {
  const byTicker = new Map<string, Trade[]>();
  trades.forEach(t => {
    const key = t.ticker.toUpperCase();
    byTicker.set(key, [...(byTicker.get(key) || []), t]);
  });

  return Array.from(byTicker.entries()).map(([ticker, arr]) => {
    const primas = arr.reduce((s, t) => s + (t.prima_recibida || 0), 0);
    const costos = arr.reduce((s, t) => s + (t.comision || 0) + (t.costo_cierre || 0), 0);
    const neto = primas - costos;
    const capital = arr.reduce((s, t) => s + (t.acciones * t.strike), 0);
    const roi = capital > 0 ? (neto / capital) * 100 : 0;
    return { ticker, roi, neto, capital };
  }).sort((a, b) => b.roi - a.roi);
}

export function computeRoiOperacion(t: Trade): number {
  const neto = (t.prima_recibida || 0) - ((t.comision || 0) + (t.costo_cierre || 0));
  const capital = t.acciones * t.strike;
  return capital > 0 ? (neto / capital) * 100 : 0;
}
