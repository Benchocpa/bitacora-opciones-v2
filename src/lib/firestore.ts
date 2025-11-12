// src/lib/firestore.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';

const app = initializeApp({ /* env */ });
export const db = getFirestore(app);
export const tradesCol = collection(db, 'trades');
