// src/components/TradesTable.tsx
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Operacion } from "@/types"
import { computeRoiOperacion } from "@/utils/roi"


type Props = {
  ops: Operacion[]
  onEdit?: (op: Operacion) => void
  onDelete?: (id: string) => Promise<void> | void
  getRoi?: (op: Operacion) => number
}

export default function TradesTable({ ops, onEdit, onDelete, getRoi }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Ticker</TableHead>
          <TableHead>Estrategia</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
          <TableHead className="text-right">Strike</TableHead>
          <TableHead className="text-right">Prima</TableHead>
          <TableHead className="text-right">Costos</TableHead>
          <TableHead className="text-right">ROI</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ops.map((o) => {
          const costos = (o.comision || 0) + (o.costoCierre || 0)
          const roi = (getRoi ? getRoi(o) : computeRoiOperacion(o)) || 0
          return (
            <TableRow key={o.id ?? `${o.ticker}-${o.fechaInicio}`}>
              <TableCell>{o.fechaInicio}</TableCell>
              <TableCell className="font-medium">{o.ticker}</TableCell>
              <TableCell>{o.estrategia}</TableCell>
              <TableCell className="text-right">{o.acciones}</TableCell>
              <TableCell className="text-right">{o.strike}</TableCell>
              <TableCell className="text-right">{o.primaRecibida}</TableCell>
              <TableCell className="text-right">{costos}</TableCell>
              <TableCell className="text-right">{roi.toFixed(2)}%</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => onEdit?.(o)}>Editar</Button>
                  {o.id && (
                    <Button
                      variant="destructive"
                      onClick={() => onDelete?.(o.id!)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
