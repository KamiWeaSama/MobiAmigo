import React, { useState } from 'react';
// 1. CORREGIDO: Añadido TextInput en la lista de importaciones
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Notificaciones() {
  const router = useRouter();
  const [texto, setTexto] = useState('');

  return (
    <View style={styles.container}>
      {/* Botón atrás */}
      <Pressable onPress={() => router.back()} style={styles.botonAtras}>
        <Ionicons name="arrow-back" size={28} color="#F8E9E9" />
      </Pressable>

      {/* Título de la pantalla */}
      <Text style={styles.text}>Notificaciones</Text>

      {/* 2. CORREGIDO: Unificado en un solo contenedor limpio */}
      <View style={styles.contenido}>
        {/* CONTENEDOR DE TEXTO (INPUT) */}
        <TextInput
            style={styles.input}
            placeholder="Escribe algo aquí..."
            placeholderTextColor="#a08ba1" 
            value={texto}
            onChangeText={(val) => setTexto(val)} 
        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000040' // Volviste al fondo azul oscuro, ¡se ve genial!
  },
  botonAtras: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10, 
  },
  text: { 
    position: 'absolute',
    color: '#F8E9E9',
    fontSize: 20,
    top: 50,
    right: 20,
    fontWeight: '600',
  },
  contenido: {
    flex: 1,
    marginTop: 110, 
    paddingHorizontal: 20,
  },
  // 3. CORREGIDO: Agregados los estilos del input para que la caja se renderice bien
  input: {
    backgroundColor: '#0c0c5a', // Un azul un poco más claro que el fondo para que resalte
    color: '#ffffff',           
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,           
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#1e1e82',     
  },
});
