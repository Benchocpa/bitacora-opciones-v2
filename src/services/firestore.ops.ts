import { db } from '@/firebase'
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, getDocs } from 'firebase/firestore'
import type { Operacion } from '@/types'

const COL = 'operaciones' // usa el nombre que pusiste en Firestore

export const api = {
  async add(o: Operacion) {
    await addDoc(collection(db, COL), o)
  },
  async update(id: string, o: Partial<Operacion>) {
    await updateDoc(doc(db, COL, id), o as any)
  },
  async remove(id: string) {
    await deleteDoc(doc(db, COL, id))
  },
  listen(cb: (rows: Operacion[]) => void) {
    const q = query(collection(db, COL), orderBy('created_at', 'desc'))
    const unsub = onSnapshot(q, async () => {
      const snap = await getDocs(query(collection(db, COL)))
      const rows: Operacion[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
      cb(rows)
    })
    return unsub
  }
}
