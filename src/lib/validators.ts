// src/lib/validators.ts
import { Trade } from './roi';

export function validateTrade(t: Trade): string[] {
  const errors: string[] = [];
  if (!t.fecha_inicio) errors.push('fecha_inicio es requerida');
  if (!t.fecha_vencimiento) errors.push('fecha_vencimiento es requerida');
  if (!t.ticker) errors.push('ticker es requerido');
  if (!t.estrategia) errors.push('estrategia es requerida');
  if (!t.estado) errors.push('estado es requerido');
  if (t.acciones <= 0) errors.push('acciones debe ser > 0');
  if (t.strike < 0) errors.push('strike no puede ser negativo');
  if (t.comision < 0) errors.push('comision no puede ser negativa');
  if (t.costo_cierre < 0) errors.push('costo_cierre no puede ser negativo');
  return errors;
}
