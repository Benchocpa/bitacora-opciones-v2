import React from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { computeRoiPorTicker } from "@/utils/roi"
import type { Operacion } from "@/types"

type Props = { ops: Operacion[] }

export default function RoiBarChart({ ops }: Props) {
  const data = computeRoiPorTicker(ops)

  return (
    <div className="p-4 border rounded-lg h-64">
      <h3 className="font-semibold mb-2">ROI por Ticker</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="ticker" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="roi" fill="#4f46e5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
