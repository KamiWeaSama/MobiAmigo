import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function agregarecordatorio() {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [alturaInput, setAlturaInput] = useState(55); // Estado para la altura dinámica

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

      setTexto(''); 
      setAlturaInput(55); // Resetea la altura al guardar
      Alert.alert("¡Listo!", "Recordatorio creado correctamente.");

    } catch (error) {
      console.log("Error al guardar desde el formulario:", error);
    }
  };

  return (
    <View style={styles.container}>
      
      {/* Botón atrás */}
      <Pressable 
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/'); 
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
          // Estilo dinámico que combina la base con la altura calculada
          style={[styles.input, { height: Math.max(55, alturaInput) }]}
          placeholder="Escribe el recordatorio aquí..."
          placeholderTextColor="#a08ba1" 
          value={texto}
          onChangeText={(val) => setTexto(val)} 
          
          // CONFIGURACIÓN PARA EL SALTO DE LÍNEA
          multiline={true}
          blurOnSubmit={false}
          submitBehavior="newline"
          textAlignVertical="top"
          onContentSizeChange={(e) =>
            setAlturaInput(e.nativeEvent.contentSize.height)
          }
        />

        <TouchableOpacity style={styles.botonEnviar} onPress={guardarRecordatorioLocal}>
          <Text style={styles.textoBotonEnviar}>Crear Recordatorio</Text>
        </TouchableOpacity>
      </View>

    </View>
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
    justifyContent: 'center', 
    paddingHorizontal: 24,    
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
    marginBottom: 24,           
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