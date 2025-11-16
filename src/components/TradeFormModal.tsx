// src/components/TradeFormModal.tsx
import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Button from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Operacion } from "@/types"
import { addOperacion, updateOperacion } from "@/services"
import { validateTrade } from "@/lib/validators"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Operacion | null
}

export default function TradeFormModal({ open, onOpenChange, initial }: Props) {
  const [form, setForm] = useState<Operacion>(
    initial ?? {
      fechaInicio: "",
      fechaVencimiento: "",
      fechaCierre: "",
      ticker: "",
      estrategia: "",
      acciones: 0,
      strike: 0,
      primaRecibida: 0,
      comision: 0,
      costoCierre: 0,
      estado: "abierta",
      precioCierre: 0,
      notas: "",
    }
  )

  useEffect(() => {
    if (initial) setForm(initial)
  }, [initial])

  const onChange =
    (k: keyof Operacion) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      // numéricos
      const numericKeys: Array<keyof Operacion> = [
        "acciones",
        "strike",
        "primaRecibida",
        "comision",
        "costoCierre",
        "precioCierre",
      ]
      setForm((f) => ({
        ...f,
        [k]: numericKeys.includes(k) ? Number(v || 0) : v,
      }))
    }

  const onSubmit = async () => {
    const err = validateTrade?.(form)
    if (err) {
      alert(err)
      return
    }
    if ((form as any).id) {
      await updateOperacion((form as any).id, form)
    } else {
      await addOperacion(form)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{(form as any).id ? "Editar operación" : "Nueva operación"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Label>Ticker</Label>
            <Input value={form.ticker} onChange={onChange("ticker")} placeholder="INTC" />
          </div>
          <div>
            <Label>Estrategia</Label>
            <Input value={form.estrategia} onChange={onChange("estrategia")} placeholder="CSP / CC" />
          </div>
          <div>
            <Label>Fecha inicio</Label>
            <Input type="date" value={form.fechaInicio} onChange={onChange("fechaInicio")} />
          </div>
          <div>
            <Label>Vencimiento</Label>
            <Input type="date" value={form.fechaVencimiento} onChange={onChange("fechaVencimiento")} />
          </div>
          <div>
            <Label>Acciones</Label>
            <Input type="number" value={form.acciones} onChange={onChange("acciones")} />
          </div>
          <div>
            <Label>Strike</Label>
            <Input type="number" value={form.strike} onChange={onChange("strike")} />
          </div>
          <div>
            <Label>Prima recibida</Label>
            <Input type="number" value={form.primaRecibida} onChange={onChange("primaRecibida")} />
          </div>
          <div>
            <Label>Comisión</Label>
            <Input type="number" value={form.comision} onChange={onChange("comision")} />
          </div>
          <div>
            <Label>Costo de cierre</Label>
            <Input type="number" value={form.costoCierre} onChange={onChange("costoCierre")} />
          </div>
          <div className="md:col-span-2">
            <Label>Notas</Label>
            <Input value={form.notas || ""} onChange={onChange("notas")} placeholder="Comentarios..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
