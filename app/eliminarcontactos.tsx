// ==========================================
// SECCIÓN DE IMPORTS
// ==========================================

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ContactInfo,
  guardarContactos,
  leerContactos
} from '../utils/contactos';

export default function EliminarContactosScreen(): React.JSX.Element {

  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // ==========================================
  // PALETA DE COLORES (MODO CLARO / OSCURO AUTOMÁTICO)
  // ==========================================

  const theme = {
    bg: isDark ? '#0F172A' : '#FFFDF9',
    card: isDark ? '#1E293B' : '#FFFFFF',
    cardBorder: isDark ? '#334155' : '#D6D3CD',
    cardSelectedBg: isDark ? '#450A0A' : '#FEE2E2',
    cardSelectedBorder: '#DC2626',
    text: isDark ? '#F8FAFC' : '#111827',
    subtext: isDark ? '#94A3B8' : '#6B7280',
    backBg: isDark ? '#1E293B' : '#E5E7EB',
    backBorder: isDark ? '#334155' : '#D1D5DB',
    btnDelete: '#DC2626',
    btnDisabled: isDark ? '#334155' : '#9CA3AF',
    accent: '#15803D',
  };

  // ==========================================
  // LISTA DE CONTACTOS GUARDADOS
  // ==========================================

  const [lista, setLista] = useState<ContactInfo[]>([]);

  // ==========================================
  // CONTACTOS SELECCIONADOS PARA ELIMINAR
  // ==========================================
  // Se guardan los id de los contactos marcados.

  const [seleccionados, setSeleccionados] =
    useState<Set<string>>(new Set());

  const [loading, setLoading] = useState<boolean>(true);

  // ==========================================
  // CARGAR CONTACTOS GUARDADOS
  // ==========================================

  useEffect(() => {
    const cargar = async () => {
      setLista(await leerContactos());
      setLoading(false);
    };

    cargar();
  }, []);

  // ==========================================
  // SELECCIONAR / DESELECCIONAR CONTACTO
  // ==========================================

  const alternarSeleccion = (id: string) => {
    setSeleccionados((actuales) => {
      const nuevos = new Set(actuales);

      if (nuevos.has(id)) {
        nuevos.delete(id);
      } else {
        nuevos.add(id);
      }

      return nuevos;
    });
  };

  // ==========================================
  // ELIMINAR LOS CONTACTOS SELECCIONADOS
  // ==========================================

  const eliminarSeleccionados = async () => {
    // Si no hay ninguno marcado, no se hace nada
    if (seleccionados.size === 0) {
      return;
    }

    try {
      // Se dejan solo los contactos que NO fueron marcados
      const nuevaLista = lista.filter((c) => !seleccionados.has(c.id));

      setLista(nuevaLista);
      await guardarContactos(nuevaLista);

      // Se vuelve a la pantalla principal
      router.navigate('/');
    } catch (error) {
      console.log('Error al eliminar contactos:', error);
    }
  };

  // ==========================================
  // MOSTRAR CADA CONTACTO
  // ==========================================

  const renderItem: ListRenderItem<ContactInfo> = ({ item }) => {
    const seleccionado = seleccionados.has(item.id);

    return (
      <Pressable
        onPress={() => alternarSeleccion(item.id)}
        style={[
          styles.tarjeta,
          {
            backgroundColor: seleccionado ? theme.cardSelectedBg : theme.card,
            borderColor: seleccionado ? theme.cardSelectedBorder : theme.cardBorder,
          },
          seleccionado && styles.tarjetaSeleccionada
        ]}
      >
        {/* ICONO DEL CONTACTO */}
        <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
          <Ionicons name="call" size={26} color="#FFFFFF" />
        </View>

        {/* NOMBRE Y TELÉFONO */}
        <View style={styles.info}>
          <Text
            style={[styles.nombre, { color: theme.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[styles.telefono, { color: theme.subtext }]}
            numberOfLines={1}
          >
            {item.phoneNumber}
          </Text>
        </View>

        {/* MARCA DE SELECCIÓN */}
        <Ionicons
          name={seleccionado ? 'checkmark-circle' : 'ellipse-outline'}
          size={34}
          color={seleccionado ? theme.btnDelete : theme.subtext}
        />
      </Pressable>
    );
  };

  const hayMarcados = seleccionados.size > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* ========================================== */}
      {/* BARRA SUPERIOR Y BOTÓN ATRÁS */}
      {/* ========================================== */}

      <View style={styles.barraSuperior}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.botonAtras,
            { backgroundColor: theme.backBg, borderColor: theme.backBorder }
          ]}
        >
          <Ionicons name="arrow-back" size={28} color={theme.text} />
          <Text style={[styles.textoBotonAtras, { color: theme.text }]}>
            Volver
          </Text>
        </Pressable>
      </View>

      {/* ========================================== */}
      {/* TÍTULO */}
      {/* ========================================== */}

      <View style={styles.header}>
        <Text style={[styles.titulo, { color: theme.text }]}>
          Eliminar Contactos
        </Text>
      </View>

      {/* ========================================== */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ========================================== */}

      {loading ? (

        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.mensaje, { color: theme.text }]}>
            Cargando contactos...
          </Text>
        </View>

      ) : lista.length === 0 ? (

        <View style={styles.center}>
          <Ionicons name="people-outline" size={64} color={theme.subtext} />
          <Text style={[styles.mensaje, { color: theme.text }]}>
            No hay contactos agregados.
          </Text>
        </View>

      ) : (

        <>
          <FlatList
            data={lista}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />

          {/* ========================================== */}
          {/* BOTÓN ELIMINAR */}
          {/* ========================================== */}
          {/* Se desactiva mientras no haya contactos marcados */}

          <Pressable
            style={[
              styles.botonEliminar,
              { backgroundColor: hayMarcados ? theme.btnDelete : theme.btnDisabled }
            ]}
            onPress={eliminarSeleccionados}
            disabled={!hayMarcados}
          >
            <Ionicons name="trash" size={28} color="#FFFFFF" />
            <Text style={styles.textoEliminar}>
              Eliminar seleccionados ({seleccionados.size})
            </Text>
          </Pressable>
        </>

      )}

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
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 32,
    fontWeight: '800',
  },

  // CONTENEDOR CENTRAL (cargando / sin contactos)
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mensaje: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },

  // LISTA
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // TARJETA DE CONTACTO
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  tarjetaSeleccionada: {
    borderWidth: 2.5,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  nombre: {
    fontSize: 20,
    fontWeight: '700',
  },
  telefono: {
    fontSize: 16,
    marginTop: 2,
  },

  // BOTÓN ELIMINAR
  botonEliminar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 18,
    borderRadius: 16,
    elevation: 4,
  },
  textoEliminar: {
    color: '#FFFFFF',
    fontSize: 22,
    marginLeft: 10,
    fontWeight: '800',
  },

});
