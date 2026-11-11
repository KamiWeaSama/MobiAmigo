
import React, { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
  isValidRut,
  registerUser,
} from '../services/authService';

export default function RegistroScreen() {

  const router = useRouter();

  // Detectar automáticamente el tema del dispositivo
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // ==========================================
  // PALETA DE COLORES
  // ==========================================

  const theme = {
    bg: isDark ? '#0F172A' : '#FFFDF9',
    card: isDark ? '#1E293B' : '#FFFFFF',
    cardBorder: isDark ? '#334155' : '#D6D3CD',
    text: isDark ? '#F8FAFC' : '#111827',
    subtext: isDark ? '#CBD5E1' : '#4B5563',
    sectionBg: isDark ? '#1E293B' : '#F3F0EA',

    btnRegister: '#15803D',
    btnBack: '#475569',
  };

  // ==========================================
  // DATOS DEL FORMULARIO
  // ==========================================

  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  // Mostrar u ocultar las contraseñas
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // Controlar carga
  const [loading, setLoading] = useState(false);

  // ==========================================
  // REGISTRAR USUARIO
  // ==========================================

  const handleRegister = async () => {

    if (
      rut.trim() === '' ||
      password === '' ||
      confirmarPassword === ''
    ) {
      Alert.alert(
        'Campos incompletos',
        'Debes completar todos los campos.'
      );
      return;
    }

    // Validar RUT
    if (!isValidRut(rut)) {
      Alert.alert(
        'RUT incorrecto',
        'Por favor, ingresa un RUT válido.'
      );
      return;
    }

    // Comprobar longitud de contraseña
    if (password.length < 6) {
      Alert.alert(
        'Contraseña incorrecta',
        'La contraseña debe tener al menos 6 caracteres.'
      );
      return;
    }

    // Comprobar que las contraseñas coincidan
    if (password !== confirmarPassword) {
      Alert.alert(
        'Contraseñas diferentes',
        'Las contraseñas ingresadas no coinciden.'
      );
      return;
    }

    try {

      setLoading(true);

      // Crear cuenta y perfil en Firebase
      await registerUser(rut, password);

      // La sesión queda iniciada automáticamente
      // después de crear la cuenta.
      router.replace('/');

    } catch (error: any) {

      console.log('Error al registrar usuario:', error);

      let mensaje = 'No se pudo crear la cuenta. Inténtalo nuevamente.';

      if (error.code === 'auth/email-already-in-use') {
        mensaje = 'Ya existe una cuenta registrada con este RUT.';
      } else if (error.code === 'auth/weak-password') {
        mensaje = 'La contraseña es demasiado débil.';
      } else if (error.code === 'auth/network-request-failed') {
        mensaje = 'No se pudo conectar con Firebase. Comprueba tu conexión.';
      } else if (error.code === 'permission-denied') {
        mensaje = 'Firebase no permite guardar el perfil. Revisa las reglas de Firestore.';
      } else if (error.message) {
        mensaje = error.message;
      }

      Alert.alert('Error de registro', mensaje);

    } finally {

      setLoading(false);

    }
  };

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (

    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >

      <ScrollView
        contentContainerStyle={styles.scrollGeneral}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ENCABEZADO */}

        <View style={styles.header}>

          <View style={[
            styles.logoContainer,
            { backgroundColor: theme.sectionBg }
          ]}>

            <Ionicons
              name="person-add"
              size={45}
              color={theme.btnRegister}
            />

          </View>

          <Text style={[styles.titulo, { color: theme.text }]}>
            Crear cuenta
          </Text>

          <Text style={[styles.subtitulo, { color: theme.subtext }]}>
            Regístrate para comenzar a utilizar MobiAmigo
          </Text>

        </View>

        {/* FORMULARIO */}

        <View style={styles.formulario}>

          {/* RUT */}

          <Text style={[styles.label, { color: theme.text }]}>
            RUT
          </Text>

          <View style={[
            styles.inputContainer,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder
            }
          ]}>

            <Ionicons
              name="person-outline"
              size={25}
              color={theme.subtext}
            />

            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Ej: 12.345.678-9"
              placeholderTextColor={theme.subtext}
              value={rut}
              onChangeText={setRut}
              autoCapitalize="characters"
              autoCorrect={false}
              keyboardType="default"
            />

          </View>

          {/* CONTRASEÑA */}

          <Text style={[styles.label, { color: theme.text }]}>
            Contraseña
          </Text>

          <View style={[
            styles.inputContainer,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder
            }
          ]}>

            <Ionicons
              name="lock-closed-outline"
              size={25}
              color={theme.subtext}
            />

            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={theme.subtext}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!mostrarPassword}
              autoCapitalize="none"
            />

            <TouchableOpacity
              onPress={() => setMostrarPassword(!mostrarPassword)}
              accessibilityLabel={
                mostrarPassword
                  ? 'Ocultar contraseña'
                  : 'Mostrar contraseña'
              }
            >

              <Ionicons
                name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}
                size={25}
                color={theme.subtext}
              />

            </TouchableOpacity>

          </View>

          {/* CONFIRMAR CONTRASEÑA */}

          <Text style={[styles.label, { color: theme.text }]}>
            Confirmar contraseña
          </Text>

          <View style={[
            styles.inputContainer,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder
            }
          ]}>

            <Ionicons
              name="lock-closed-outline"
              size={25}
              color={theme.subtext}
            />

            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Repite tu contraseña"
              placeholderTextColor={theme.subtext}
              value={confirmarPassword}
              onChangeText={setConfirmarPassword}
              secureTextEntry={!mostrarConfirmacion}
              autoCapitalize="none"
            />

            <TouchableOpacity
              onPress={() => setMostrarConfirmacion(!mostrarConfirmacion)}
              accessibilityLabel={
                mostrarConfirmacion
                  ? 'Ocultar contraseña'
                  : 'Mostrar contraseña'
              }
            >

              <Ionicons
                name={mostrarConfirmacion ? 'eye-off-outline' : 'eye-outline'}
                size={25}
                color={theme.subtext}
              />

            </TouchableOpacity>

          </View>

          {/* BOTÓN REGISTRARSE */}

          <TouchableOpacity
            style={[
              styles.boton,
              { backgroundColor: theme.btnRegister },
              loading && styles.botonDeshabilitado
            ]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >

            {loading ? (

              <ActivityIndicator color="#FFFFFF" size="large" />

            ) : (

              <>

                <Ionicons
                  name="person-add-outline"
                  size={28}
                  color="#FFFFFF"
                />

                <Text style={styles.textoBoton}>
                  Crear cuenta
                </Text>

              </>

            )}

          </TouchableOpacity>

          {/* VOLVER AL LOGIN */}

          <TouchableOpacity
            style={[
              styles.boton,
              { backgroundColor: theme.btnBack }
            ]}
            onPress={() => router.replace('/login')}
            disabled={loading}
            activeOpacity={0.8}
          >

            <Ionicons
              name="arrow-back-outline"
              size={27}
              color="#FFFFFF"
            />

            <Text style={styles.textoBoton}>
              Volver al inicio de sesión
            </Text>

          </TouchableOpacity>

        </View>

      </ScrollView>

    </KeyboardAvoidingView>

  );
}

// ==========================================
// ESTILOS
// ==========================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  scrollGeneral: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 30,
  },

  header: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },

  logoContainer: {
    width: 85,
    height: 85,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  titulo: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  subtitulo: {
    fontSize: 16,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },

  formulario: {
    width: '100%',
  },

  label: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 9,
    marginTop: 16,
  },

  inputContainer: {
    minHeight: 62,
    borderRadius: 15,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  input: {
    flex: 1,
    fontSize: 19,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  boton: {
    width: '100%',
    minHeight: 68,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },

  textoBoton: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginLeft: 12,
    flexShrink: 1,
  },

  botonDeshabilitado: {
    opacity: 0.6,
  },

});
