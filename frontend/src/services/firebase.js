import { initializeApp } from 'firebase/app';
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider, signInWithPopup, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

// indexedDBLocalPersistence fixes the "missing initial state" error in Capacitor WebViews
// (sessionStorage is not shared between the WebView and Chrome Custom Tabs)
export const auth = initializeAuth(app, {
  persistence: Capacitor.isNativePlatform()
    ? indexedDBLocalPersistence
    : browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  if (Capacitor.isNativePlatform()) {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    const { App } = await import('@capacitor/app');

    const idToken = await new Promise(async (resolve, reject) => {
      let settled = false;
      let nativeUserReady = false;
      let activityDone = false;
      const listeners = [];

      const removeAll = async () => { for (const l of listeners) await l.remove(); };

      // Only resolve after BOTH: native user confirmed + Google Sign-In activity finished.
      // This ensures getIdToken is never called while the activity transition is in progress,
      // which is what causes Capacitor to drop the callback ("Couldn't save" bug).
      const tryResolve = async () => {
        if (settled || !nativeUserReady || !activityDone) return;
        settled = true;
        await removeAll();
        try {
          let token;
          if (auth.currentUser) {
            token = await auth.currentUser.getIdToken(false);
          } else {
            const { token: t } = await FirebaseAuthentication.getIdToken({ forceRefresh: false });
            token = t;
          }
          resolve(token);
        } catch (err) { reject(err); }
      };

      listeners.push(await FirebaseAuthentication.addListener('authStateChange', async (result) => {
        if (result.user) { nativeUserReady = true; await tryResolve(); }
      }));
      listeners.push(await FirebaseAuthentication.addListener('idTokenChange', async (result) => {
        if (result.user) { nativeUserReady = true; await tryResolve(); }
      }));
      listeners.push(await App.addListener('resume', async () => {
        activityDone = true;
        await tryResolve();
      }));

      FirebaseAuthentication.signInWithGoogle().catch(async (err) => {
        if (!settled) { settled = true; await removeAll(); reject(err); }
      });

      setTimeout(async () => {
        if (!settled) {
          settled = true;
          await removeAll();
          reject(new Error('Google Sign-In timeout — verifique a configuração do OAuth no Google Cloud Console'));
        }
      }, 30000);
    });

    return { idToken, user: auth.currentUser };
  }
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
