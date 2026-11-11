
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { auth, db } from '../config/firebase';

// Estructura de cada recordatorio almacenado en Firestore.
export interface RecordatorioInfo {
  id: string;
  texto: string;
}

// Obtener la colección de recordatorios del usuario autenticado.
const obtenerColeccionRecordatorios = () => {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error('No hay una sesión iniciada.');
  }

  return collection(db, 'usuarios', usuario.uid, 'recordatorios');
};

// Crear un recordatorio en Firestore.
export const crearRecordatorio = async (texto: string) => {
  const coleccion = obtenerColeccionRecordatorios();

  const referencia = await addDoc(coleccion, {
    texto: texto.trim(),
    fechaCreacion: serverTimestamp(),
  });

  return {
    id: referencia.id,
    texto: texto.trim(),
  };
};

// Obtener todos los recordatorios del usuario.
export const obtenerRecordatorios = async (): Promise<RecordatorioInfo[]> => {
  const coleccion = obtenerColeccionRecordatorios();

  const consulta = query(
    coleccion,
    orderBy('fechaCreacion', 'desc')
  );

  const resultado = await getDocs(consulta);

  return resultado.docs.map((documento) => ({
    id: documento.id,
    texto: documento.data().texto,
  }));
};

// Eliminar un recordatorio de Firestore usando su ID.
export const eliminarRecordatorio = async (id: string) => {
  const coleccion = obtenerColeccionRecordatorios();

  await deleteDoc(doc(coleccion, id));
};

// Importar los recordatorios antiguos de AsyncStorage.
// Esta función solo importa los datos si Firestore todavía está vacío.
export const migrarRecordatoriosAntiguos = async (textos: string[]) => {
  const coleccion = obtenerColeccionRecordatorios();
  const resultado = await getDocs(coleccion);

  // Si ya existen recordatorios en la nube, no se reemplazan.
  if (!resultado.empty || textos.length === 0) {
    return;
  }

  // Se utiliza un ID estable para evitar duplicados si se reintenta.
  const lote = writeBatch(db);

  textos.forEach((texto, indice) => {
    const referencia = doc(coleccion, `migrado_${indice}`);

    lote.set(referencia, {
      texto,
      fechaCreacion: serverTimestamp(),
    });
  });

  await lote.commit();
};
