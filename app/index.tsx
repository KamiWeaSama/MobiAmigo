// ==========================================
// SECCIÓN DE IMPORTS COMPLETOS (CORREGIDOS)
// ==========================================
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const router = useRouter(); 
  const [listaRecordatorios, setListaRecordatorios] = useState<string[]>([]);

  // Carga automática al entrar/volver a la pantalla
  useFocusEffect(
    useCallback(() => {
      const cargarRecordatoriosDeMemoria = async () => {
        try {
          const datosGuardados = await AsyncStorage.getItem('@mis_recordatorios');
          if (datosGuardados !== null) {
            setListaRecordatorios(JSON.parse(datosGuardados));
          } else {
            setListaRecordatorios([]); 
          }
        } catch (error) {
          console.log("Error al cargar memoria:", error);
        }
      };
      cargarRecordatoriosDeMemoria();
    }, [])
  );

  // Función para eliminar un recordatorio individual
  const eliminarRecordatorio = async (indexParaEliminar: number) => {
    try {
      const nuevaLista = listaRecordatorios.filter((_, index) => index !== indexParaEliminar);
      setListaRecordatorios(nuevaLista);
      await AsyncStorage.setItem('@mis_recordatorios', JSON.stringify(nuevaLista));
    } catch (error) {
      console.log("Error al eliminar:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* 1. Encabezado */}
      <View style={styles.header}>
        <Text style={styles.titulo}>MobiAmigo</Text>
      </View>

      {/* 2. ZONA DE NOTIFICACIONES (ARRIBA) */}
      <View style={styles.zonaNotificaciones}>
        {listaRecordatorios.length > 0 && (
          <ScrollView contentContainerStyle={styles.scrollNotificaciones}>
            {listaRecordatorios.map((item, index) => (
              <View key={index} style={styles.tarjetaRecordatorio}>
                <View style={styles.bloqueTexto}>
                  <Ionicons name="notifications-sharp" size={20} color="#0080ff" style={styles.iconoTarjeta} />
                  <Text style={styles.textoTarjeta}>{item}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.botonEliminar} 
                  onPress={() => eliminarRecordatorio(index)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* 3. CONTENEDOR DE DOS BOTONES (ABAJO) */}
      <View style={styles.contenedorBotones}>

        {/* Añadir Apps */}
        <Pressable
          style={styles.boton}
          onPress={() => console.log("Añadir Apps")}
        >
          <Ionicons
            name="apps"
            size={70}
            color="#F8E9E9"
          />
          <Text style={styles.textoBoton}>
            Añadir Apps
          </Text>
        </Pressable>

        {/* Añadir Recordatorio */}
        <Pressable
          style={styles.boton}
          onPress={() => router.push("/agregarecordatorio")}
        >
          <Ionicons
            name="calendar-outline"
            size={70}
            color="#F8E9E9"
          />
          <Text style={styles.textoBoton}>
            Añadir
          </Text>
          <Text style={styles.textoBoton}>
            Recordatorio
          </Text>
        </Pressable>

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000040',
  },
  header: {
    width: '100%',
    height: 80, // Reducido ligeramente de 100 a 80 para ganar espacio vertical
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    color: '#F8E9E9',
    fontSize: 40,
    fontWeight: '400',
  },
  zonaNotificaciones: {
    //flex: 1, 
    width: '100%',
    marginTop: 5, // Muy pegado al título superior
  },
  scrollNotificaciones: {
    paddingHorizontal: 16,
    paddingBottom: 10, // Menos espacio interno al final del scroll
  },
  tarjetaRecordatorio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', 
    backgroundColor: '#0c0c5a', 
    padding: 16,
    borderRadius: 14,
    marginBottom: 8, // Reducido el espacio entre cada renglón de recordatorio
    borderLeftWidth: 4,
    borderLeftColor: '#0080ff', 
  },
  bloqueTexto: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, 
    paddingRight: 10,
  },
  iconoTarjeta: {
    marginRight: 12,
  },
  textoTarjeta: {
    color: '#F8E9E9',
    fontSize: 16,
    flex: 1, 
  },
  botonEliminar: {
    padding: 4,
  },
  contenedorBotones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 0, // Puesto en 0 para eliminar por completo la separación con la lista de arriba
    marginBottom: 20, // Pequeño margen abajo para que los botones no toquen el borde físico del teléfono
    width: '100%',
  },
  boton: {
    width: '48%',
    height: 180,
    backgroundColor: '#493936',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  textoBoton: {
    color: '#F8E9E9',
    fontSize: 22,
    textAlign: 'center',
    marginTop: 8,
  },
});
