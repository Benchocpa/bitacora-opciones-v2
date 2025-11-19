import { supabase } from "../supabaseClient"

export async function cargarHistorial() {
  const { data, error } = await supabase
    .from("historial_operaciones")
    .select("*")
    .order("fecha_evento", { ascending: false })

  if (error) throw error
  return data
}

export async function registrarEventoHistorial(evento: {
  tipo: string
  ticker: string
  prima: number
  comision: number
  costoCierre: number
  strike: number
  estado: string
  nota?: string | null
}) {
  const { error } = await supabase
    .from("historial_operaciones")
    .insert({
      tipo: evento.tipo,
      ticker: evento.ticker,
      prima: evento.prima,
      comision: evento.comision,
      costo_cierre: evento.costoCierre,
      strike: evento.strike,
      estado: evento.estado,
      nota: evento.nota ?? null,
    })

  if (error) throw error
}
