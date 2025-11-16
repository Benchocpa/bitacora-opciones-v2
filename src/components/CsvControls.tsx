import React, { ChangeEvent } from 'react'
import Button from '@/components/ui/button'
import { exportCSV, importCSV } from '@/utils/csv'
import type { Operacion } from '@/types'

type Props = {
  ops: Operacion[]
  onImport?: (rows: Operacion[]) => void
}

export default function CsvControls({ ops, onImport }: Props) {
  const handleExport = () => exportCSV(ops)

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const rows = importCSV(text) as Operacion[]
    onImport?.(rows)
    // limpia el input para poder re-importar el mismo archivo si hace falta
    e.currentTarget.value = ''
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" onClick={handleExport}>Exportar CSV</Button>
      <label className="cursor-pointer">
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleImport}
        />
        <span className="inline-block px-4 py-2 border rounded hover:bg-muted">
          Importar CSV
        </span>
      </label>
    </div>
  )
}
