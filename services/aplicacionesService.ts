
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { auth, db } from '../config/firebase';

// ==========================================
// INFORMACIÓN DE LAS APLICACIONES
// ==========================================

export interface AplicacionInfo {
  label: string;
  packageName: string;
}

// ==========================================
// OBTENER COLECCIÓN DEL USUARIO
// ==========================================

const obtenerColeccionAplicaciones = () => {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error('No hay una sesión iniciada.');
  }

  return collection(
    db,
    'usuarios',
    usuario.uid,
    'aplicaciones'
  );
};

// ==========================================
// OBTENER APLICACIONES DE FIRESTORE
// ==========================================

export const obtenerAplicaciones = async (): Promise<AplicacionInfo[]> => {
  const coleccion = obtenerColeccionAplicaciones();

  const resultado = await getDocs(coleccion);

  return resultado.docs.map((documento) => ({
    label: documento.data().label,
    packageName: documento.data().packageName,
  }));
};

// ==========================================
// GUARDAR APLICACIONES EN FIRESTORE
// ==========================================

export const guardarAplicaciones = async (
  aplicaciones: AplicacionInfo[]
) => {
  const coleccion = obtenerColeccionAplicaciones();

  const lote = writeBatch(db);

  aplicaciones.forEach((app) => {
    const referencia = doc(
      coleccion,
      app.packageName
    );

    lote.set(referencia, {
      label: app.label,
      packageName: app.packageName,
      fechaActualizacion: serverTimestamp(),
    }, { merge: true });
  });

  await lote.commit();
};

// ==========================================
// ELIMINAR APLICACIONES DE FIRESTORE
// ==========================================

export const eliminarAplicaciones = async (
  packageNames: string[]
) => {
  const coleccion = obtenerColeccionAplicaciones();

  const lote = writeBatch(db);

  packageNames.forEach((packageName) => {
    const referencia = doc(
      coleccion,
      packageName
    );

    lote.delete(referencia);
  });

  await lote.commit();
};

// ==========================================
// MIGRAR APLICACIONES ANTIGUAS
// ==========================================

export const migrarAplicacionesAntiguas = async (
  aplicaciones: AplicacionInfo[]
) => {
  if (aplicaciones.length === 0) return;

  // Guardamos las aplicaciones antiguas sin reemplazar
  // las que ya existan en Firestore.
  await guardarAplicaciones(aplicaciones);
};
