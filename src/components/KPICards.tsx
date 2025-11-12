// src/components/KPICards.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIs } from "@/lib/roi";

export function KPICards({ kpis }: { kpis: KPIs }) {
  const items = [
    { label: 'Prima', value: kpis.sumaPrimas },
    { label: 'Costos', value: kpis.totalCostos },
    { label: 'Neto', value: kpis.gananciaNeta },
    { label: 'ROI General', value: kpis.roiGeneral, suffix: '%' },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {items.map(i => (
        <Card key={i.label}>
          <CardHeader>
            <CardTitle className="text-sm">{i.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {i.value.toFixed(2)}{i.suffix || ''}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
