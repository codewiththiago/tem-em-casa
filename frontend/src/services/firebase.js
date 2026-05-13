import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return { idToken, user: result.user };
}

export async function signOutUser() {
  await signOut(auth);
}

export async function getIdToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

const FIREBASE_ERRORS = {
  'auth/email-already-in-use':   'Este e-mail já está cadastrado.',
  'auth/weak-password':          'Senha muito fraca (mínimo 6 caracteres).',
  'auth/invalid-email':          'E-mail inválido.',
  'auth/wrong-password':         'Senha incorreta.',
  'auth/user-not-found':         'E-mail não encontrado.',
  'auth/invalid-credential':     'E-mail ou senha incorretos.',
  'auth/too-many-requests':      'Muitas tentativas. Aguarde e tente novamente.',
  'auth/popup-closed-by-user':   'Login cancelado. Tente novamente.',
  'auth/cancelled-popup-request':'Login cancelado. Tente novamente.',
  'auth/popup-blocked':          'Popup bloqueado pelo navegador. Permita popups para este site.',
  'auth/unauthorized-domain':    'Domínio não autorizado no Firebase. Adicione localhost em Authentication → Authorized domains.',
  'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
  'auth/internal-error':         'Erro interno do Firebase. Tente novamente.',
};

export function firebaseErrorMsg(err) {
  return FIREBASE_ERRORS[err?.code] || 'Falha na autenticação. Tente novamente.';
}

export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await result.user.getIdToken();
  return { idToken, user: result.user };
}

export async function registerWithEmail(email, password) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await result.user.getIdToken();
  return { idToken, user: result.user };
}
