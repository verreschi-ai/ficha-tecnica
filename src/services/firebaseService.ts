import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential 
} from 'firebase/auth';
import { TechnicalSheet, RawIngredientItem, User } from '../types';

// Firebase configuration using environment variables or safe defaults
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyMockKeyForDevelopmentModeOnly",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "margem-de-chef.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "margem-de-chef",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "margem-de-chef.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'A senha deve ter no mínimo 8 caracteres.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos uma letra maiúscula.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos uma letra minúscula.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos um número.' };
  }
  return { valid: true };
}

/**
 * Script de Inicialização e Modelos de Dados para o Cloud Firestore
 * Coleções: 'usuarios', 'insumos', 'receitas'
 */

// 1. Inicializar / Sincronizar Usuário
export async function syncUserToFirestore(user: User): Promise<void> {
  try {
    const userRef = doc(db, 'usuarios', user.id || user.email);
    await setDoc(userRef, {
      ...user,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log("[Firestore] Usuário sincronizado com sucesso:", user.email);
  } catch (err) {
    console.error("[Firestore Error] Falha ao sincronizar usuário:", err);
  }
}

// 2. Sincronizar Insumos (Coleção 'insumos') com Reatividade
export async function saveInsumoToFirestore(userId: string, insumo: RawIngredientItem): Promise<void> {
  try {
    const insumoRef = doc(db, 'insumos', insumo.id || `ins-${Date.now()}`);
    await setDoc(insumoRef, {
      ...insumo,
      userId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("[Firestore Error] Falha ao salvar insumo:", err);
  }
}

export async function fetchInsumosFromFirestore(userId: string): Promise<RawIngredientItem[]> {
  try {
    const q = query(collection(db, 'insumos'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const items: RawIngredientItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as RawIngredientItem);
    });
    return items;
  } catch (err) {
    console.error("[Firestore Error] Falha ao buscar insumos:", err);
    return [];
  }
}

// 3. Sincronizar Receitas / Fichas Técnicas (Coleção 'receitas') com Reatividade
export async function saveReceitaToFirestore(userId: string, receita: TechnicalSheet): Promise<void> {
  try {
    const receitaRef = doc(db, 'receitas', receita.id || `rec-${Date.now()}`);
    await setDoc(receitaRef, {
      ...receita,
      userId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("[Firestore Error] Falha ao salvar receita:", err);
  }
}

export async function fetchReceitasFromFirestore(userId: string): Promise<TechnicalSheet[]> {
  try {
    const q = query(collection(db, 'receitas'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const items: TechnicalSheet[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as TechnicalSheet);
    });
    return items;
  } catch (err) {
    console.error("[Firestore Error] Falha ao buscar receitas:", err);
    return [];
  }
}

// 4. Listener Reativo em Tempo Real para Insumos e Receitas
export function subscribeToUserData(userId: string, onInsumosUpdate: (insumos: RawIngredientItem[]) => void, onReceitasUpdate: (receitas: TechnicalSheet[]) => void) {
  const qInsumos = query(collection(db, 'insumos'), where('userId', '==', userId));
  const unsubInsumos = onSnapshot(qInsumos, (snapshot) => {
    const items: RawIngredientItem[] = [];
    snapshot.forEach((d) => items.push(d.data() as RawIngredientItem));
    onInsumosUpdate(items);
  });

  const qReceitas = query(collection(db, 'receitas'), where('userId', '==', userId));
  const unsubReceitas = onSnapshot(qReceitas, (snapshot) => {
    const items: TechnicalSheet[] = [];
    snapshot.forEach((d) => items.push(d.data() as TechnicalSheet));
    onReceitasUpdate(items);
  });

  return () => {
    unsubInsumos();
    unsubReceitas();
  };
}
