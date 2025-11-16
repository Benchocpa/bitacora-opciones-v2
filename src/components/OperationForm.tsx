import React, { useState } from "react"
import type { Operacion } from "@/types"
import Button from "@/components/ui/button"

type Props = {
  open: boolean
  onClose: () => void
  onSave?: (op: Operacion) => void
}

export default function OperationForm({ open, onClose, onSave }: Props) {
  const [form, setForm] = useState<Partial<Operacion>>({})

  if (!open) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-semibold mb-4">Nueva Operación</h3>
        <input
          placeholder="Ticker"
          className="border p-2 w-full mb-3 rounded"
          value={form.ticker ?? ""}
          onChange={(e) => setForm({ ...form, ticker: e.target.value })}
        />
        {/* puedes agregar más campos aquí */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => {
              onSave?.(form as Operacion)
              onClose()
            }}
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}
