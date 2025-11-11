
import { Operacion } from '@/types'

function csvEscape(value: any): string {
  const s = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export function exportCSV(ops: Operacion[]): string {
  const headers = [
    'fechaInicio','fechaVencimiento','fechaCierre','ticker','estrategia','acciones','strike',
    'primaRecibida','comision','costoCierre','estado','precioCierre','notas'
  ]
  const lines = [headers.join(',')]
  for (const op of ops) {
    const row = [
      op.fechaInicio, op.fechaVencimiento, op.fechaCierre ?? '', op.ticker, op.estrategia, op.acciones,
      op.strike, op.primaRecibida, op.comision, op.costoCierre, op.estado, op.precioCierre ?? '', op.notas ?? ''
    ].map(csvEscape).join(',')
    lines.push(row)
  }
  return lines.join('\n')
}

export function importCSV(text: string): Operacion[] {
  // Simple RFC4180 parser for commas/quotes/newlines
  const rows: string[][] = []
  let i = 0, field = '', row: string[] = [], inQuotes = false
  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i+1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else { field += ch }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === ',') { row.push(field); field = '' }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i+1] === '\n') i++
        row.push(field); rows.push(row); row = []; field = ''
      } else { field += ch }
    }
    i++
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }

  if (rows.length === 0) return []
  const headers = rows[0].map(h => h.trim())
  const dataRows = rows.slice(1).filter(r => r.some(cell => cell.trim() !== ''))
  const idx = (name: string) => headers.indexOf(name)

  return dataRows.map(r => ({
    fechaInicio: r[idx('fechaInicio')] || '',
    fechaVencimiento: r[idx('fechaVencimiento')] || '',
    fechaCierre: r[idx('fechaCierre')] || '',
    ticker: (r[idx('ticker')] || '').toUpperCase(),
    estrategia: r[idx('estrategia')] || '',
    acciones: Number(r[idx('acciones')] || 0),
    strike: Number(r[idx('strike')] || 0),
    primaRecibida: Number(r[idx('primaRecibida')] || 0),
    comision: Number(r[idx('comision')] || 0),
    costoCierre: Number(r[idx('costoCierre')] || 0),
    estado: (r[idx('estado')] || 'Abierta') as any,
    precioCierre: Number(r[idx('precioCierre')] || 0),
    notas: r[idx('notas')] || ''
  }))
}
