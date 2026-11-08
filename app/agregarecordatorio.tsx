// ==========================================
// SECCIÓN DE IMPORTS
// ==========================================

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function agregarecordatorio() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // ==========================================
  // PALETA DE COLORES (MODO CLARO / OSCURO AUTOMÁTICO)
  // ==========================================

  const theme = {
    bg: isDark ? '#0F172A' : '#FFFDF9',
    card: isDark ? '#1E293B' : '#FFFFFF',
    cardBorder: isDark ? '#334155' : '#9CA3AF',
    text: isDark ? '#F8FAFC' : '#111827',
    subtext: isDark ? '#94A3B8' : '#6B7280',
    backBg: isDark ? '#1E293B' : '#E5E7EB',
    backBorder: isDark ? '#334155' : '#D1D5DB',
    btnSubmit: '#D97706',
  };

  // ==========================================
  // ESTADOS DEL FORMULARIO
  // ==========================================

  const [texto, setTexto] = useState('');
  const [alturaInput, setAlturaInput] = useState(110);

  // ==========================================
  // GUARDAR RECORDATORIO EN MEMORIA LOCAL
  // ==========================================

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

      const nuevaLista = [texto.trim(), ...listaActual];
      await AsyncStorage.setItem('@mis_recordatorios', JSON.stringify(nuevaLista));

      setTexto(''); 
      setAlturaInput(110);
      Alert.alert("¡Listo!", "Recordatorio creado correctamente.", [
        { text: "Aceptar", onPress: () => router.replace('/') }
      ]);

    } catch (error) {
      console.log("Error al guardar desde el formulario:", error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      
      {/* ========================================== */}
      {/* BARRA SUPERIOR Y BOTÓN PARA VOLVER */}
      {/* ========================================== */}

      <View style={styles.barraSuperior}>
        <Pressable 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/'); 
            }
          }} 
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
      {/* TÍTULO DE LA PANTALLA */}
      {/* ========================================== */}

      <View style={styles.header}>
        <Text style={[styles.text, { color: theme.text }]}>
          Nuevo Recordatorio
        </Text>
      </View>

      {/* ========================================== */}
      {/* FORMULARIO DE RECORDATORIO */}
      {/* ========================================== */}

      <View style={styles.contenido}>
        <Text style={[styles.etiquetaCampo, { color: theme.text }]}>
          ¿Qué necesitas recordar?
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              height: Math.max(110, alturaInput),
              backgroundColor: theme.card,
              color: theme.text,
              borderColor: theme.cardBorder,
            },
          ]}
          placeholder="Ej: Tomar mi pastilla a las 8 de la mañana..."
          placeholderTextColor={theme.subtext} 
          value={texto}
          onChangeText={(val) => setTexto(val)} 
          
          // CONFIGURACIÓN PARA EL SALTO DE LÍNEA
          multiline={true}
          blurOnSubmit={false}
          submitBehavior="newline"
          textAlignVertical="top"
          onContentSizeChange={(e) =>
            setAlturaInput(e.nativeEvent.contentSize.height + 24)
          }
        />

        <TouchableOpacity
          style={[styles.botonEnviar, { backgroundColor: theme.btnSubmit }]}
          onPress={guardarRecordatorioLocal}
        >
          <Ionicons name="notifications" size={28} color="#FFFFFF" />
          <Text style={styles.textoBotonEnviar}>
            Crear Recordatorio
          </Text>
        </TouchableOpacity>
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
  header: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { 
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  contenido: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  etiquetaCampo: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 18,           
    fontSize: 22,
    borderWidth: 2,
    marginBottom: 28,           
    width: '100%',
  },
  botonEnviar: {
    flexDirection: 'row',
    paddingVertical: 20,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  textoBotonEnviar: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 10,
  }
});
