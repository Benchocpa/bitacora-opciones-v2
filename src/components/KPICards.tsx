// src/components/KPICards.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Acepta kpis con campos opcionales para evitar crasheos por undefined
type KPIsLoose = Partial<{
  sumaPrimas: number
  totalCostos: number
  gananciaNeta: number
  roiGeneral: number
  totalOperaciones: number   // nombre “nuevo”
  total: number              // nombre “viejo” por compatibilidad
  capitalInvertido: number
}>

export default function KPICards({ kpis }: { kpis: KPIsLoose }) {
  const items = [
    { label: "Prima",        value: kpis.sumaPrimas },
    { label: "Costos",       value: kpis.totalCostos },
    { label: "Neto",         value: kpis.gananciaNeta },
    { label: "ROI General",  value: kpis.roiGeneral, suffix: "%" },
    {
      label: "Operaciones",
      value: kpis.totalOperaciones ?? kpis.total ?? 0, // tolera ambos nombres
    },
    { label: "Capital Inv.", value: kpis.capitalInvertido },
  ]

  // Nunca revienta aunque venga undefined, null o string
  const fmt = (v: unknown) => {
    const n = Number(v ?? 0)
    if (!Number.isFinite(n)) return "0"
    return n.toFixed(2)
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {items.map((i) => (
        <Card key={i.label}>
          <CardHeader>
            <CardTitle className="text-sm">{i.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {fmt(i.value)}
              {i.suffix ?? ""}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
