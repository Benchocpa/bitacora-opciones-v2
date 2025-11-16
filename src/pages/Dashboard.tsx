// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { exportCSV, importCSV } from "@/lib/csv";
import TradesTable from "@/components/TradesTable";
import TradeFormModal from "@/components/TradeFormModal";
import KPICards from "@/components/KPICards";
import { computeKPIs, computeRoiGeneral } from "@/utils/roi";
import type { Trade } from "@/types";
import RoiBarChart from "@/components/RoiBarChart";

export default function Dashboard() {
  const [trades, setTrades] = useState<(Trade & { id: string })[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editItem, setEditItem] = useState<(Trade & { id: string }) | null>(null);

  useEffect(() => {
    // Carga inicial
    supabase.from('trades').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setTrades((data || []) as any);
    });

    // Realtime suscripción
    const channel = supabase
      .channel('public:trades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, payload => {
        supabase.from('trades').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          setTrades((data || []) as any);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const kpis = useMemo(() => computeKPIs(trades), [trades]);
  const roiTicker = useMemo(() => computeRoiPorTicker(trades), [trades]);

  async function onDelete(id: string) {
    await supabase.from('trades').delete().eq('id', id);
  }

  function onExportCSV() {
    const csv = exportCSV(trades);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bitacora_opciones.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function onImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const text = String(reader.result);
      const rows = importCSV(text);
      if (rows.length) await supabase.from('trades').insert(rows);
    };
    reader.readAsText(file);
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Bitácora de Opciones</h1>
        <div className="flex gap-2">
          <Button onClick={() => { setEditItem(null); setOpenModal(true); }}>Nueva operación</Button>
          <Button variant="outline" onClick={onExportCSV}>Exportar CSV</Button>
          <label className="cursor-pointer">
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onImportCSV} />
            <span className="inline-block px-4 py-2 border rounded hover:bg-muted">Importar CSV</span>
          </label>
        </div>
      </div>

      <KPICards kpis={kpis} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium mb-2">Ranking de empresas por ROI</h2>
          <div className="rounded border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-2">Ticker</th>
                  <th className="text-right p-2">ROI</th>
                  <th className="text-right p-2">Neto</th>
                  <th className="text-right p-2">Capital</th>
                </tr>
              </thead>
              <tbody>
                {roiTicker.map(r => (
                  <tr key={r.ticker} className="border-t">
                    <td className="p-2">{r.ticker}</td>
                    <td className="p-2 text-right">{r.roi.toFixed(2)}%</td>
                    <td className="p-2 text-right">{r.neto.toFixed(2)}</td>
                    <td className="p-2 text-right">{r.capital.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-medium mb-2">ROI por ticker</h2>
          <RoiBarChart data={roiTicker.map(r => ({ ticker: r.ticker, roi: Number(r.roi.toFixed(2)) }))} />
        </div>
      </div>

      <TradesTable
        trades={trades as any}
        onEdit={(t) => { setEditItem(t); setOpenModal(true); }}
        onDelete={onDelete}
      />

      <TradeFormModal
        open={openModal}
        onOpenChange={setOpenModal}
        initial={editItem}
      />
    </div>
  );
}
