import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIs } from "@/utils/roi";

interface Props {
  kpis: KPIs;
}

export function StatsCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Prima</CardTitle>
        </CardHeader>
        <CardContent>${kpis.prima.toFixed(2)}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Costos</CardTitle>
        </CardHeader>
        <CardContent>${kpis.costos.toFixed(2)}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Neto</CardTitle>
        </CardHeader>
        <CardContent>${kpis.neto.toFixed(2)}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>ROI</CardTitle>
        </CardHeader>
        <CardContent>{(kpis.roi * 100).toFixed(2)}%</CardContent>
      </Card>
    </div>
  );
}
