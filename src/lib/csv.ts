// src/lib/csv.ts
import { Trade } from './roi';

const headers = [
  'fecha_inicio','fecha_vencimiento','fecha_cierre','ticker','estrategia',
  'acciones','strike','prima_recibida','comision','costo_cierre','estado','precio_cierre','notas'
] as const;

function escapeCSV(value: string | number | null | undefined): string {
  const v = value ?? '';
  const s = String(v);
  const needsQuotes = /[",\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function exportCSV(trades: Trade[]): string {
  const headerLine = headers.join(',');
  const lines = trades.map(t =>
    headers.map(h => {
      const v = (t as any)[h];
      return escapeCSV(v);
    }).join(',')
  );
  return [headerLine, ...lines].join('\n');
}

export function importCSV(text: string): Trade[] {
  // Simple CSV parser that handles quoted fields with commas and quotes
  const lines = text.split(/\r?\n/).filter(l => l.trim().length);
  const hdr = lines.shift();
  if (!hdr) return [];
  const cols = hdr.split(',');

  function parseLine(line: string): string[] {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
        } else { cur += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { out.push(cur); cur = ''; }
        else { cur += ch; }
      }
    }
    out.push(cur);
    return out;
  }

  return lines.map(l => {
    const cells = parseLine(l);
    const obj: any = {};
    cols.forEach((c, i) => obj[c] = cells[i] ?? '');
    return {
      fecha_inicio: obj.fecha_inicio,
      fecha_vencimiento: obj.fecha_vencimiento,
      fecha_cierre: obj.fecha_cierre || null,
      ticker: obj.ticker,
      estrategia: obj.estrategia,
      acciones: Number(obj.acciones || 0),
      strike: Number(obj.strike || 0),
      prima_recibida: Number(obj.prima_recibida || 0),
      comision: Number(obj.comision || 0),
      costo_cierre: Number(obj.costo_cierre || 0),
      estado: obj.estado,
      precio_cierre: obj.precio_cierre ? Number(obj.precio_cierre) : null,
      notas: obj.notas || null,
    } as Trade;
  });
}
