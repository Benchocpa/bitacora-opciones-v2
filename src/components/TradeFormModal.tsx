// src/components/TradeFormModal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { Trade } from '@/lib/roi';
import { validateTrade } from '@/lib/validators';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Trade | null;
};

const empty: Trade = {
  fecha_inicio: '',
  fecha_vencimiento: '',
  fecha_cierre: '',
  ticker: '',
  estrategia: '',
  acciones: 100,
  strike: 0,
  prima_recibida: 0,
  comision: 0,
  costo_cierre: 0,
  estado: 'abierta',
  precio_cierre: null,
  notas: ''
};

export function TradeFormModal({ open, onOpenChange, initial }: Props) {
  const [form, setForm] = useState<Trade>(initial || empty);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => { setForm(initial || empty); setErrors([]); }, [initial, open]);

  function set<K extends keyof Trade>(key: K, val: Trade[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function onSubmit() {
    const errs = validateTrade(form);
    setErrors(errs);
    if (errs.length) return;
    setLoading(true);
    if ((initial as any)?.id) {
      await supabase.from('trades').update(form).eq('id', (initial as any).id);
    } else {
      await supabase.from('trades').insert(form);
    }
    setLoading(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar operación' : 'Nueva operación'}</DialogTitle>
        </DialogHeader>

        {errors.length > 0 && (
          <div className="text-red-600 text-sm space-y-1">
            {errors.map(e => <div key={e}>• {e}</div>)}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fechas */}
          <div>
            <Label>Fecha inicio</Label>
            <Input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} />
          </div>
          <div>
            <Label>Fecha vencimiento</Label>
            <Input type="date" value={form.fecha_vencimiento} onChange={e => set('fecha_vencimiento', e.target.value)} />
          </div>
          <div>
            <Label>Fecha cierre</Label>
            <Input type="date" value={form.fecha_cierre || ''} onChange={e => set('fecha_cierre', e.target.value)} />
          </div>

          {/* Ticker, estrategia */}
          <div>
            <Label>Ticker</Label>
            <Input value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())} />
          </div>
          <div>
            <Label>Estrategia</Label>
            <Input value={form.estrategia} onChange={e => set('estrategia', e.target.value)} />
          </div>

          {/* Números */}
          <div>
            <Label>Acciones</Label>
            <Input type="number" value={form.acciones} onChange={e => set('acciones', Number(e.target.value))} />
          </div>
          <div>
            <Label>Strike</Label>
            <Input type="number" step="0.01" value={form.strike} onChange={e => set('strike', Number(e.target.value))} />
          </div>
          <div>
            <Label>Prima recibida</Label>
            <Input type="number" step="0.01" value={form.prima_recibida} onChange={e => set('prima_recibida', Number(e.target.value))} />
          </div>
          <div>
            <Label>Comisión</Label>
            <Input type="number" step="0.01" value={form.comision} onChange={e => set('comision', Number(e.target.value))} />
          </div>
          <div>
            <Label>Costo cierre</Label>
            <Input type="number" step="0.01" value={form.costo_cierre} onChange={e => set('costo_cierre', Number(e.target.value))} />
          </div>
          <div>
            <Label>Estado</Label>
            <Input value={form.estado} onChange={e => set('estado', e.target.value as any)} />
          </div>
          <div>
            <Label>Precio cierre</Label>
            <Input type="number" step="0.01" value={form.precio_cierre ?? ''} onChange={e => set('precio_cierre', Number(e.target.value))} />
          </div>

          {/* Notas */}
          <div className="md:col-span-2">
            <Label>Notas</Label>
            <Input value={form.notas || ''} onChange={e => set('notas', e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={loading}>{initial ? 'Guardar' : 'Agregar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
