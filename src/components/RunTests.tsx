// src/components/RunTests.tsx
import { Button } from "@/components/ui/button";
import { exportCSV, importCSV } from "@/lib/csv";
import { computeKPIs, computeRoiPorTicker, Trade } from "@/lib/roi";
import { useState } from "react";

export function RunTests() {
  const [log, setLog] = useState<string>('');

  function append(line: string) {
    setLog(prev => prev + line + '\n');
  }

  function run() {
    setLog('');
    const sample: Trade[] = [
      { fecha_inicio:'2025-01-01', fecha_vencimiento:'2025-02-01', fecha_cierre:'2025-01-20', ticker:'AAPL', estrategia:'Covered Call', acciones:100, strike:200, prima_recibida:500, comision:2, costo_cierre:0, estado:'cerrada', precio_cierre: null, notas:'' },
      { fecha_inicio:'2025-01-05', fecha_vencimiento:'2025-02-05', fecha_cierre:'', ticker:'MSFT', estrategia:'Cash-Secured Put', acciones:100, strike:150, prima_recibida:300, comision:2, costo_cierre:50, estado:'cerrada', precio_cierre: null, notas:'' },
      { fecha_inicio:'2025-01-10', fecha_vencimiento:'2025-02-10', fecha_cierre:'', ticker:'AAPL', estrategia:'Put Credit Spread', acciones:100, strike:190, prima_recibida:250, comision:4, costo_cierre:0, estado:'abierta', precio_cierre: null, notas:'Incluye comas, "comillas"' },
    ];

    // CSV roundtrip
    const csv = exportCSV(sample);
    append('CSV exportado:\n' + csv.split('\n').slice(0, 2).join('\n') + '\n...');
    const parsed = importCSV(csv);
    const sameLength = parsed.length === sample.length;
    const notesPreserved = parsed[2].notas?.includes('comillas') ?? false;
    append(`CSV parse: length ok=${sameLength}, notas preservadas=${notesPreserved}`);

    // KPIs
    const kpis = computeKPIs(sample);
    append(`KPIs -> operaciones=${kpis.totalOperaciones}, primas=${kpis.sumaPrimas.toFixed(2)}, costos=${kpis.totalCostos.toFixed(2)}, neto=${kpis.gananciaNeta.toFixed(2)}, capital=${kpis.capitalInvertido.toFixed(2)}, ROI=${kpis.roiGeneral.toFixed(2)}%`);

    // ROI por ticker
    const rtk = computeRoiPorTicker(sample);
    append('ROI por ticker: ' + rtk.map(r => `${r.ticker}:${r.roi.toFixed(2)}%`).join(', '));
  }

  return (
    <div className="space-y-2">
      <Button onClick={run}>Run Tests</Button>
      <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">{log}</pre>
    </div>
  );
}
