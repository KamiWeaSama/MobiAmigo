// ==========================================
// SECCIÓN DE IMPORTS
// ==========================================

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  agregarContactoDesdeTelefono,
  leerContactos,
  MAX_CONTACTOS
} from '../utils/contactos';

export default function OpcionesContactosScreen() {

  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // ==========================================
  // PALETA DE COLORES (MODO CLARO / OSCURO AUTOMÁTICO)
  // ==========================================

  const theme = {
    bg: isDark ? '#0F172A' : '#FFFDF9',
    text: isDark ? '#F8FAFC' : '#111827',
    subtext: isDark ? '#CBD5E1' : '#4B5563',
    backBg: isDark ? '#1E293B' : '#E5E7EB',
    backBorder: isDark ? '#334155' : '#D1D5DB',
    btnAdd: '#15803D',    // Verde para Añadir
    btnDelete: '#DC2626', // Rojo para Eliminar
    btnDisabled: isDark ? '#334155' : '#9CA3AF', // Gris cuando no se puede añadir
  };

  // ==========================================
  // CANTIDAD DE CONTACTOS GUARDADOS
  // ==========================================
  // Se vuelve a leer cada vez que la pantalla
  // aparece, para que el contador esté al día.

  const [cantidad, setCantidad] = useState<number>(0);

  useFocusEffect(
    useCallback(() => {
      const cargarCantidad = async () => {
        const lista = await leerContactos();
        setCantidad(lista.length);
      };

      cargarCantidad();
    }, [])
  );

  const limiteAlcanzado = cantidad >= MAX_CONTACTOS;

  // ==========================================
  // AÑADIR CONTACTO
  // ==========================================
  // Abre el selector de contactos del teléfono.
  // Si se agrega uno, vuelve a la pantalla principal.

  const anadirContacto = async () => {
    const agregado = await agregarContactoDesdeTelefono();

    if (agregado) {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* ========================================== */}
      {/* BARRA SUPERIOR Y BOTÓN PARA VOLVER */}
      {/* ========================================== */}

      <View style={styles.barraSuperior}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.botonAtras,
            { backgroundColor: theme.backBg, borderColor: theme.backBorder }
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={28}
            color={theme.text}
          />
          <Text style={[styles.textoBotonAtras, { color: theme.text }]}>
            Volver
          </Text>
        </Pressable>
      </View>

      {/* ========================================== */}
      {/* TÍTULO Y CONTADOR */}
      {/* ========================================== */}

      <View style={styles.header}>
        <Text style={[styles.titulo, { color: theme.text }]}>
          Contactos
        </Text>
        <Text style={[styles.contador, { color: theme.subtext }]}>
          {cantidad} de {MAX_CONTACTOS} contactos
        </Text>
      </View>

      {/* ========================================== */}
      {/* OPCIONES DE CONTACTOS */}
      {/* ========================================== */}

      <View style={styles.contenedorOpciones}>

        {/* ========================================== */}
        {/* OPCIÓN: AÑADIR CONTACTO */}
        {/* ========================================== */}
        {/* Si ya hay 4 contactos, el botón se desactiva */}

        <Pressable
          style={[
            styles.botonOpcion,
            { backgroundColor: limiteAlcanzado ? theme.btnDisabled : theme.btnAdd }
          ]}
          onPress={anadirContacto}
          disabled={limiteAlcanzado}
        >
          <Ionicons
            name={limiteAlcanzado ? 'lock-closed' : 'person-add'}
            size={80}
            color="#FFFFFF"
          />

          <Text style={styles.textoOpcion}>
            {limiteAlcanzado ? 'Máximo alcanzado' : 'Añadir contacto'}
          </Text>
        </Pressable>

        {/* ========================================== */}
        {/* OPCIÓN: ELIMINAR CONTACTO */}
        {/* ========================================== */}

        <Pressable
          style={[styles.botonOpcion, { backgroundColor: theme.btnDelete }]}
          onPress={() => router.push('/eliminarcontactos')}
        >
          <Ionicons
            name="trash"
            size={80}
            color="#FFFFFF"
          />

          <Text style={styles.textoOpcion}>
            Eliminar contacto
          </Text>
        </Pressable>

      </View>

    </SafeAreaView>
  );
}

// ==========================================
// ESTILOS DE LA PANTALLA
// ==========================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  // BARRA SUPERIOR Y BOTÓN ATRÁS
  barraSuperior: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  botonAtras: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  textoBotonAtras: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },

  // ENCABEZADO
  header: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 34,
    fontWeight: '800',
  },
  contador: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
  },

  // CONTENEDOR DE LAS OPCIONES
  contenedorOpciones: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  // BOTONES DE AÑADIR Y ELIMINAR
  botonOpcion: {
    width: '92%',
    height: 190,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  textoOpcion: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },

});
