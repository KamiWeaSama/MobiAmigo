
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
// ESTRUCTURA DE UN EVENTO
// ==========================================

export interface EventoInfo {
  id: string;
  nombre: string;
  hora: string;
  repiteSiempre: boolean;
  repiteSemanal: boolean;
  repiteMensual: boolean;
  dia: number;
  mes: number;
  anio: number;
}

// ==========================================
// OBTENER COLECCIÓN DEL USUARIO
// ==========================================

const obtenerColeccionEventos = () => {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error('No hay una sesión iniciada.');
  }

  return collection(
    db,
    'usuarios',
    usuario.uid,
    'eventosCalendario'
  );
};

// ==========================================
// CREAR O ACTUALIZAR UN EVENTO
// ==========================================

export const guardarEvento = async (evento: EventoInfo) => {
  const coleccion = obtenerColeccionEventos();

  const referencia = doc(coleccion, evento.id);

  await setDoc(referencia, {
    nombre: evento.nombre,
    hora: evento.hora,
    repiteSiempre: evento.repiteSiempre,
    repiteSemanal: evento.repiteSemanal,
    repiteMensual: evento.repiteMensual,
    dia: evento.dia,
    mes: evento.mes,
    anio: evento.anio,
    fechaActualizacion: serverTimestamp(),
  });

};

// ==========================================
// OBTENER TODOS LOS EVENTOS
// ==========================================

export const obtenerEventos = async (): Promise<EventoInfo[]> => {
  const coleccion = obtenerColeccionEventos();

  const resultado = await getDocs(coleccion);

  return resultado.docs.map((documento) => {
    const datos = documento.data();

    return {
      id: documento.id,
      nombre: datos.nombre,
      hora: datos.hora,
      repiteSiempre: datos.repiteSiempre,
      repiteSemanal: datos.repiteSemanal,
      repiteMensual: datos.repiteMensual,
      dia: datos.dia,
      mes: datos.mes,
      anio: datos.anio,
    };
  });
};

// ==========================================
// ELIMINAR UN EVENTO
// ==========================================

export const eliminarEvento = async (id: string) => {
  const coleccion = obtenerColeccionEventos();

  await deleteDoc(doc(coleccion, id));
};

// ==========================================
// MIGRAR EVENTOS ANTIGUOS
// ==========================================
// Importa los eventos que estaban guardados
// anteriormente en AsyncStorage.
// Solo los importa si Firestore está vacío.

export const migrarEventosAntiguos = async (
  eventos: EventoInfo[]
) => {
  if (eventos.length === 0) return;

  const coleccion = obtenerColeccionEventos();

  const resultado = await getDocs(coleccion);

  if (!resultado.empty) return;

  const lote = writeBatch(db);

  eventos.forEach((evento) => {
    const referencia = doc(coleccion, evento.id);

    lote.set(referencia, {
      nombre: evento.nombre,
      hora: evento.hora,
      repiteSiempre: evento.repiteSiempre,
      repiteSemanal: evento.repiteSemanal,
      repiteMensual: evento.repiteMensual,
      dia: evento.dia,
      mes: evento.mes,
      anio: evento.anio,
      fechaActualizacion: serverTimestamp(),
    });
  });

  await lote.commit();
};
