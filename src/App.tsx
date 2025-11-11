
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OperationForm } from '@/components/OperationForm'
import { OperationsTable } from '@/components/OperationsTable'
import { StatsCards } from '@/components/StatsCards'
import { CsvControls } from '@/components/CsvControls'
import { RoiRanking } from '@/components/RoiRanking'
import { RoiBarChart } from '@/components/RoiBarChart'
import { TestRunner } from '@/components/TestRunner'
import { computeKPIs } from '@/utils/roi'
import { Operacion } from '@/types'
import { addOperacion, deleteOperacion, listenOperaciones, updateOperacion } from '@/services.firestore'

const sampleOps: Operacion[] = [
  { fechaInicio: '2025-01-01', fechaVencimiento: '2025-01-17', fechaCierre: '2025-01-10', ticker: 'INTC', estrategia: 'CSP', acciones: 100, strike: 22, primaRecibida: 35, comision: 1.3, costoCierre: 5, estado: 'Cerrada', precioCierre: 0, notas: 'Cierre 80%' },
  { fechaInicio: '2025-02-01', fechaVencimiento: '2025-02-21', fechaCierre: '2025-02-18', ticker: 'CLSK', estrategia: 'CSP', acciones: 100, strike: 5, primaRecibida: 18, comision: 1.3, costoCierre: 0, estado: 'Vencida', precioCierre: 0, notas: '' },
  { fechaInicio: '2025-02-15', fechaVencimiento: '2025-03-21', fechaCierre: '2025-03-20', ticker: 'INTC', estrategia: 'CC', acciones: 100, strike: 37, primaRecibida: 22, comision: 1.3, costoCierre: 0, estado: 'Cerrada', precioCierre: 0, notas: '' },
]

export default function App() {
  const [ops, setOps] = useState<Operacion[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Operacion | null>(null)
  const [testMsg, setTestMsg] = useState('')

  useEffect(() => {
    const unsub = listenOperaciones((arr) => setOps(arr))
    return () => unsub()
  }, [])

  const kpi = useMemo(() => computeKPIs(ops), [ops])

  async function handleSubmit(op: Operacion) {
    if (editing && editing.id) {
      await updateOperacion(editing.id, op)
    } else {
      await addOperacion(op)
    }
    setOpen(false); setEditing(null)
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Bitácora de Opciones</h1>
          <p className="text-muted-foreground">Registra, sincroniza y analiza tus operaciones con ROI general y por ticker.</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvControls ops={ops} onImport={async (arr) => {
            // bulk add
            for (const o of arr) await addOperacion(o)
          }} />
          <TestRunner onResult={setTestMsg} sample={sampleOps} />
          <Button onClick={() => { setEditing(null); setOpen(true) }}>Nueva Operación</Button>
        </div>
      </div>

      {testMsg && <div className="rounded-2xl border p-3">{testMsg}</div>}

      <StatsCards kpi={kpi} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Operaciones</CardTitle></CardHeader>
          <CardContent>
            <OperationsTable
              ops={ops}
              onEdit={(op) => { setEditing(op); setOpen(true) }}
              onDelete={async (id) => await deleteOperacion(id)}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <RoiRanking ops={ops} />
          <RoiBarChart ops={ops} />
        </div>
      </div>

      <OperationForm open={open} onClose={() => { setOpen(false); setEditing(null) }} onSubmit={handleSubmit} initial={editing} />
    </div>
  )
}
