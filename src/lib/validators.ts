// src/lib/validators.ts
import type { Operacion } from "@/types"

export function validateTrade(op: Operacion): string | null {
  if (!op.ticker) return "El ticker es obligatorio"
  if (!op.estrategia) return "La estrategia es obligatoria"
  if (!op.fechaInicio) return "La fecha de inicio es obligatoria"
  if (!op.fechaVencimiento) return "La fecha de vencimiento es obligatoria"
  if ((op.acciones ?? 0) <= 0) return "Las acciones deben ser > 0"
  if ((op.strike ?? 0) <= 0) return "El strike debe ser > 0"
  if ((op.primaRecibida ?? 0) < 0) return "La prima recibida no puede ser negativa"
  if ((op.comision ?? 0) < 0) return "La comisión no puede ser negativa"
  if ((op.costoCierre ?? 0) < 0) return "El costo de cierre no puede ser negativo"
  return null
}
