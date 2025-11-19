import React from "react"

type HistorialEvent = {
  id: string | number
  fecha_evento?: string | null
  ticker?: string
  tipo?: string
  prima?: number | string | null
  comision?: number | string | null
  costo_cierre?: number | string | null
  strike?: number | string | null
  estado?: string
  nota?: string | null
}

type HistorialProps = {
  historial: HistorialEvent[]
}

export default function Historial({ historial }: HistorialProps) {
  if (!historial || historial.length === 0) return null

  return (
    <section className="mt-6 rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">
        Historial de operaciones
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="px-2 py-2">Fecha</th>
              <th className="px-2 py-2">Ticker</th>
              <th className="px-2 py-2">Tipo</th>
              <th className="px-2 py-2 text-right">Prima</th>
              <th className="px-2 py-2 text-right">Comisión</th>
              <th className="px-2 py-2 text-right">Costo cierre</th>
              <th className="px-2 py-2 text-right">Strike</th>
              <th className="px-2 py-2">Estado</th>
              <th className="px-2 py-2">Nota</th>
            </tr>
          </thead>
          <tbody>
            {historial.map((ev) => (
              <tr
                key={ev.id}
                className="border-b last:border-0 hover:bg-slate-50"
              >
                <td className="px-2 py-2">
                  {ev.fecha_evento
                    ? ev.fecha_evento.slice(0, 16).replace("T", " ")
                    : "—"}
                </td>
                <td className="px-2 py-2 font-medium">{ev.ticker}</td>
                <td className="px-2 py-2">{ev.tipo}</td>
                <td className="px-2 py-2 text-right">
                  {Number(ev.prima ?? 0).toFixed(2)}
                </td>
                <td className="px-2 py-2 text-right">
                  {Number(ev.comision ?? 0).toFixed(2)}
                </td>
                <td className="px-2 py-2 text-right">
                  {Number(ev.costo_cierre ?? 0).toFixed(2)}
                </td>
                <td className="px-2 py-2 text-right">
                  {Number(ev.strike ?? 0).toFixed(2)}
                </td>
                <td className="px-2 py-2">{ev.estado}</td>
                <td
                  className="px-2 py-2 max-w-[220px] truncate"
                  title={ev.nota ?? ""}
                >
                  {ev.nota || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
