// Funciones compartidas para los contactos
// ==========================================
// Este archivo vive FUERA de la carpeta app/ porque
// no es una pantalla. Lo usan index.tsx y las pantallas
// de opciones y eliminar contactos, así la lógica
// está en un solo lugar.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as contacts from 'expo-contacts';
import { Alert } from 'react-native';

// ==========================================
// INFORMACIÓN DE UN CONTACTO
// ==========================================

export interface ContactInfo {
  id: string;
  name: string;
  phoneNumber?: string;
}

// Clave con la que se guardan en AsyncStorage
export const CLAVE_CONTACTOS = '@mis_contactos';

// Cantidad máxima de contactos permitidos
export const MAX_CONTACTOS = 4;

// ==========================================
// LEER CONTACTOS GUARDADOS
// ==========================================

export const leerContactos = async (): Promise<ContactInfo[]> => {
  try {
    const datos = await AsyncStorage.getItem(CLAVE_CONTACTOS);
    return datos !== null ? JSON.parse(datos) : [];
  } catch (error) {
    console.log('Error al leer contactos:', error);
    return [];
  }
};

// ==========================================
// GUARDAR LA LISTA DE CONTACTOS
// ==========================================

export const guardarContactos = async (lista: ContactInfo[]): Promise<void> => {
  await AsyncStorage.setItem(CLAVE_CONTACTOS, JSON.stringify(lista));
};

// ==========================================
// AGREGAR UN CONTACTO DESDE EL TELÉFONO
// ==========================================
// Devuelve true si se agregó un contacto nuevo
// y false si no (límite alcanzado, permiso negado,
// el usuario canceló, sin número o ya estaba).

export const agregarContactoDesdeTelefono = async (): Promise<boolean> => {
  try {
    // Se lee la lista directamente de la memoria,
    // así nunca se trabaja con datos desactualizados.
    const listaActual = await leerContactos();

    // 1. Comprobar el límite ANTES de abrir el selector
    if (listaActual.length >= MAX_CONTACTOS) {
      Alert.alert(
        'Límite alcanzado',
        `Solo puedes tener ${MAX_CONTACTOS} contactos. Elimina uno para agregar otro.`
      );
      return false;
    }

    // 2. Pedir permiso para leer los contactos
    const { status } = await contacts.requestPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permiso necesario',
        'Para elegir un contacto debes permitir el acceso a tus contactos.'
      );
      return false;
    }

    // 3. Abrir el selector de contactos del teléfono.
    // Se usa "as any" porque según la versión puede devolver
    // el contacto directo o un objeto con la propiedad .contact
    const resultado = (await contacts.presentContactPickerAsync()) as any;

    // Si el usuario cancela, no devuelve nada
    if (!resultado) {
      return false;
    }

    const datosContacto = resultado.contact || resultado;

    const numeroBruto = datosContacto.phoneNumbers?.[0]?.number;

    const nombreContacto =
      datosContacto.name ||
      [datosContacto.firstName, datosContacto.lastName].filter(Boolean).join(' ') ||
      'Contacto';

    if (!numeroBruto) {
      Alert.alert(
        'Sin número',
        'El contacto seleccionado no tiene un número de teléfono.'
      );
      return false;
    }

    const nuevoContacto: ContactInfo = {
      id: datosContacto.id || Date.now().toString(),
      name: nombreContacto,
      phoneNumber: numeroBruto,
    };

    // 4. Evitar repetidos
    const yaExiste = listaActual.some(
      (c) =>
        c.id === nuevoContacto.id ||
        (c.phoneNumber === nuevoContacto.phoneNumber && c.name === nuevoContacto.name)
    );

    if (yaExiste) {
      Alert.alert('Contacto repetido', 'Ese contacto ya está agregado.');
      return false;
    }

    // 5. Guardar
    await guardarContactos([...listaActual, nuevoContacto]);

    return true;
  } catch (error) {
    console.log('Error al agregar contacto:', error);
    return false;
  }
};
