
import {
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
  deleteUser,
} from 'firebase/auth';

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { auth, db } from '../config/firebase';

// --------------------------------------------------
// CONVERTIR RUT A UN CORREO INTERNO
// --------------------------------------------------

function rutToEmail(rut: string): string {
  const rutLimpio = rut
    .replace(/\./g, '')
    .replace(/-/g, '')
    .toUpperCase();

  return `${rutLimpio}@usuarios.mobiamigo.app`;
}

// --------------------------------------------------
// VALIDAR RUT CHILENO
// --------------------------------------------------

export function isValidRut(rut: string): boolean {
  const rutLimpio = rut
    .replace(/\./g, '')
    .replace(/-/g, '')
    .toUpperCase();

  if (!/^\d{7,8}[0-9K]$/.test(rutLimpio)) {
    return false;
  }

  const cuerpo = rutLimpio.slice(0, -1);
  const digitoIngresado = rutLimpio.slice(-1);

  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;

    multiplicador++;

    if (multiplicador > 7) {
      multiplicador = 2;
    }
  }

  const resultado = 11 - (suma % 11);

  let digitoCalculado = '';

  if (resultado === 11) {
    digitoCalculado = '0';
  } else if (resultado === 10) {
    digitoCalculado = 'K';
  } else {
    digitoCalculado = resultado.toString();
  }

  return digitoIngresado === digitoCalculado;
}

// --------------------------------------------------
// REGISTRAR USUARIO
// --------------------------------------------------

export async function registerUser(
  rut: string,
  password: string
): Promise<UserCredential> {

  if (!isValidRut(rut)) {
    throw new Error('El RUT ingresado no es válido.');
  }

  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  const email = rutToEmail(rut);

  // Crear cuenta en Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  try {
    // Crear perfil del usuario en Cloud Firestore
    await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
      tipoUsuario: 'usuario',
      esAnonimo: false,
      fechaRegistro: serverTimestamp(),
    });

  } catch (error) {

    // Si falla la creación del perfil, intentamos eliminar
    // la cuenta recién creada para evitar dejarla incompleta.
    try {
      await deleteUser(userCredential.user);
    } catch (errorEliminacion) {
      console.error('No se pudo eliminar la cuenta incompleta:', errorEliminacion);
    }

    throw error;
  }

  return userCredential;
}

// --------------------------------------------------
// INICIAR SESIÓN
// --------------------------------------------------

export async function loginUser(
  rut: string,
  password: string
): Promise<UserCredential> {

  if (!isValidRut(rut)) {
    throw new Error('El RUT ingresado no es válido.');
  }

  const email = rutToEmail(rut);

  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return userCredential;
}

// --------------------------------------------------
// INGRESAR SIN REGISTRARSE
// --------------------------------------------------

export async function loginGuest(): Promise<UserCredential> {
  const userCredential = await signInAnonymously(auth);

  return userCredential;
}

// --------------------------------------------------
// CERRAR SESIÓN
// --------------------------------------------------

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
