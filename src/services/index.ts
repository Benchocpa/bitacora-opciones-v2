import type { Operacion } from '@/types'

const BACKEND = import.meta.env.VITE_BACKEND ?? 'firebase' // 'firebase' | 'supabase'

type API = {
  add(o: Operacion): Promise<void>
  update(id: string, o: Partial<Operacion>): Promise<void>
  remove(id: string): Promise<void>
  listen(cb: (rows: Operacion[]) => void): () => void
}

// Declaramos variable globalmente
let api: API

async function init() {
  if (BACKEND === 'supabase') {
    const mod = await import('./supabase.ops')
    api = mod.api
  } else {
    const mod = await import('./firestore.ops')
    api = mod.api
  }
}

// Inicializa una vez al cargar el módulo
await init()

export const addOperacion = (o: Operacion) => api.add(o)
export const updateOperacion = (id: string, o: Partial<Operacion>) => api.update(id, o)
export const deleteOperacion = (id: string) => api.remove(id)
export const listenOperaciones = (cb: (rows: Operacion[]) => void) => api.listen(cb)
