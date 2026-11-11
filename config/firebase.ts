
import { initializeApp, getApp, getApps } from 'firebase/app';

import { getAuth } from 'firebase/auth';

import { getFirestore } from 'firebase/firestore';

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Evitar inicializar Firebase más de una vez
const app = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

// Firebase selecciona la persistencia adecuada para el navegador
const auth = getAuth(app);

// Inicializar Firestore
const db = getFirestore(app);

export { auth, db };
