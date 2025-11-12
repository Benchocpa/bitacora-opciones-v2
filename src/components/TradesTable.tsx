// src/components/TradesTable.tsx
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeRoiOperacion, Trade } from "@/lib/roi";

type Props = {
  trades: (Trade & { id: string })[];
  onEdit: (t: Trade & { id: string }) => void;
  onDelete: (id: string) => void;
};

export function TradesTable({ trades, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Ticker</TableHead>
            <TableHead>Estrategia</TableHead>
            <TableHead>Acciones</TableHead>
            <TableHead>Strike</TableHead>
            <TableHead>Prima</TableHead>
            <TableHead>Comisión</TableHead>
            <TableHead>Cierre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>ROI operación</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map(t => (
            <TableRow key={t.id}>
              <TableCell>{t.fecha_inicio}</TableCell>
              <TableCell>{t.ticker}</TableCell>
              <TableCell>{t.estrategia}</TableCell>
              <TableCell>{t.acciones}</TableCell>
              <TableCell>{t.strike.toFixed(2)}</TableCell>
              <TableCell>{t.prima_recibida.toFixed(2)}</TableCell>
              <TableCell>{t.comision.toFixed(2)}</TableCell>
              <TableCell>{t.costo_cierre.toFixed(2)}</TableCell>
              <TableCell>{t.estado}</TableCell>
              <TableCell>{computeRoiOperacion(t).toFixed(2)}%</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(t)}>Editar</Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(t.id)}>Eliminar</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
