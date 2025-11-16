import React from "react"
import type { Operacion } from "@/types"
import { computeRoiPorTicker } from "@/utils/roi"

type Props = { ops: Operacion[] }

export default function RoiRanking({ ops }: Props) {
  const ranking = computeRoiPorTicker(ops)
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 10)

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">Ranking de ROI por Empresa</h3>
      <ul className="space-y-1 text-sm">
        {ranking.map((r) => (
          <li key={r.ticker} className="flex justify-between">
            <span>{r.ticker}</span>
            <span className="font-medium">{r.roi.toFixed(2)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
