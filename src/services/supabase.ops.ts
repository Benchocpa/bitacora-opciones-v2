import { supabase } from '@/lib/supabase'
import type { Operacion } from '@/types'

const TABLE = 'operaciones' // usa el nombre de tu tabla

export const api = {
  async add(o: Operacion) {
    const { error } = await supabase.from(TABLE).insert(o)
    if (error) throw error
  },
  async update(id: string, o: Partial<Operacion>) {
    const { error } = await supabase.from(TABLE).update(o).eq('id', id)
    if (error) throw error
  },
  async remove(id: string) {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) throw error
  },
  listen(cb: (rows: Operacion[]) => void) {
    // carga inicial
    supabase.from(TABLE).select('*').order('created_at', { ascending: false }).then(({ data }) => cb((data??[]) as Operacion[]))
    // realtime
    const ch = supabase
      .channel(`realtime:${TABLE}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, async () => {
        const { data } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false })
        cb((data??[]) as Operacion[])
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }
}
