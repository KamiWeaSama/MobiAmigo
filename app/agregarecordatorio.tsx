// ==========================================
// SECCIÓN DE IMPORTS COMPLETOS
// ==========================================
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function agregarecordatorio() {
  const router = useRouter();
  const [texto, setTexto] = useState('');

  // Función para guardar el recordatorio en la memoria local
  const guardarRecordatorioLocal = async () => {
    if (texto.trim() === '') {
      Alert.alert("Error", "Por favor, escribe un recordatorio.");
      return;
    }

    try {
      const datosExistentes = await AsyncStorage.getItem('@mis_recordatorios');
      let listaActual: string[] = [];
      
      if (datosExistentes !== null) {
        listaActual = JSON.parse(datosExistentes);
      }

      const nuevaLista = [texto, ...listaActual];
      await AsyncStorage.setItem('@mis_recordatorios', JSON.stringify(nuevaLista));

      setTexto(''); // Limpia la caja para poder escribir otro
      Alert.alert("¡Listo!", "Recordatorio creado correctamente.");

    } catch (error) {
      console.log("Error al guardar desde el formulario:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Botón atrás */}
      <Pressable 
        onPress={() => {
        if (router.canGoBack()) {
        router.back();
        } else {
        // Reemplaza '/inicio' por la ruta principal de tu app
        router.replace('/inicio'); 
        }
        }} 
      style={styles.botonAtras}
    >
      <Ionicons name="arrow-back" size={32} color="#F8E9E9" />
    </Pressable>


      {/* Título de la pantalla */}
      <View style={styles.header}>
        <Text style={styles.text}>Nuevo Recordatorio</Text>
      </View>

      {/* Formulario Centrado */}
      <View style={styles.contenido}>
        <TextInput
            style={styles.input}
            placeholder="Escribe el recordatorio aquí..."
            placeholderTextColor="#a08ba1" 
            value={texto}
            onChangeText={(val) => setTexto(val)} 
        />

        <TouchableOpacity style={styles.botonEnviar} onPress={guardarRecordatorioLocal}>
          <Text style={styles.textoBotonEnviar}>Crear Recordatorio</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000040',
    paddingTop: 40,
  },
  botonAtras: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10, 
  },
  header: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { 
    color: '#F8E9E9',
    fontSize: 32,
    fontWeight: '400',
  },
  contenido: {
    flex: 1,
    justifyContent: 'center', // Centra la caja y el botón verticalmente en la pantalla
    paddingHorizontal: 24,    // Margen a los lados para que no toque los bordes
  },
  input: {
    backgroundColor: '#0c0c5a', 
    color: '#ffffff',           
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,           
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#1e1e82',     
    marginBottom: 24,           // Separación generosa con el botón
    width: '100%',
  },
  botonEnviar: {
    backgroundColor: '#0080ff',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  textoBotonEnviar: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
