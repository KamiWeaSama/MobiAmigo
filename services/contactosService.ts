
// ==========================================
// SERVICIO DE CONTACTOS
// ==========================================

import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    serverTimestamp,
    setDoc,
    writeBatch,
} from 'firebase/firestore';

import { auth, db } from '../config/firebase';

// ==========================================
// INTERFAZ DE LOS CONTACTOS
// ==========================================

export interface ContactoInfo {
  id: string;
  name: string;
  phoneNumber?: string;
}

// ==========================================
// OBTENER COLECCIÓN DEL USUARIO
// ==========================================

const obtenerColeccionContactos = () => {

  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error('No hay una sesión iniciada.');
  }

  return collection(
    db,
    'usuarios',
    usuario.uid,
    'contactos'
  );

};

// ==========================================
// GUARDAR UN CONTACTO EN FIRESTORE
// ==========================================

export const guardarContacto = async (
  contacto: Omit<ContactoInfo, 'id'>
): Promise<ContactoInfo> => {

  const coleccion = obtenerColeccionContactos();

  // Firestore genera un identificador único.
  const referencia = doc(coleccion);

  const nuevoContacto: ContactoInfo = {
    id: referencia.id,
    name: contacto.name,
    phoneNumber: contacto.phoneNumber,
  };

  await setDoc(referencia, {
    name: nuevoContacto.name,
    phoneNumber: nuevoContacto.phoneNumber,
    fechaActualizacion: serverTimestamp(),
  });

  return nuevoContacto;

};

// ==========================================
// RECUPERAR CONTACTOS DESDE FIRESTORE
// ==========================================

export const obtenerContactos = async (): Promise<ContactoInfo[]> => {

  const coleccion = obtenerColeccionContactos();

  const resultado = await getDocs(coleccion);

  return resultado.docs.map((documento) => {

    const datos = documento.data();

    return {
      id: documento.id,
      name: datos.name,
      phoneNumber: datos.phoneNumber,
    };

  });

};

// ==========================================
// ELIMINAR UN CONTACTO DE FIRESTORE
// ==========================================

export const eliminarContacto = async (id: string) => {

  const coleccion = obtenerColeccionContactos();

  const referencia = doc(coleccion, id);

  await deleteDoc(referencia);

};

// ==========================================
// MIGRAR CONTACTOS ANTIGUOS
// ==========================================

export const migrarContactosAntiguos = async (
  contactos: ContactoInfo[]
) => {

  if (contactos.length === 0) return;

  const coleccion = obtenerColeccionContactos();

  // Comprobamos si el usuario ya tiene contactos en Firebase.
  const resultado = await getDocs(coleccion);

  if (!resultado.empty) return;

  const lote = writeBatch(db);

  contactos.forEach((contacto) => {

    // Generamos un ID nuevo para cada contacto.
    const referencia = doc(coleccion);

    lote.set(referencia, {
      name: contacto.name,
      phoneNumber: contacto.phoneNumber || '',
      fechaActualizacion: serverTimestamp(),
    });

  });

  await lote.commit();

};
