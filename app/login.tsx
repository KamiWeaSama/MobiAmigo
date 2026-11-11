
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

// Importar las funciones de autenticación de Firebase
import {
    isValidRut,
    loginGuest,
    loginUser,
} from '../services/authService';

export default function LoginScreen() {

  const router = useRouter();

  // Detectar automáticamente el tema del dispositivo
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // ==========================================
  // PALETA DE COLORES (MODO CLARO / OSCURO)
  // ==========================================

  const theme = {
    bg: isDark ? '#0F172A' : '#FFFDF9',
    card: isDark ? '#1E293B' : '#FFFFFF',
    cardBorder: isDark ? '#334155' : '#D6D3CD',
    text: isDark ? '#F8FAFC' : '#111827',
    subtext: isDark ? '#CBD5E1' : '#4B5563',
    sectionBg: isDark ? '#1E293B' : '#F3F0EA',

    // Colores semánticos de los botones
    btnLogin: '#1D4ED8',
    btnRegister: '#15803D',
    btnGuest: '#D97706',

    danger: '#DC2626',
  };

  // ==========================================
  // DATOS DEL FORMULARIO
  // ==========================================

  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');

  // Controlar la visibilidad de la contraseña
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // Controlar el estado de carga
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState('');

  // ==========================================
  // INICIAR SESIÓN CON RUT Y CONTRASEÑA
  // ==========================================

  const handleLogin = async () => {

    if (rut.trim() === '' || password.trim() === '') {
      Alert.alert(
        'Campos incompletos',
        'Debes ingresar tu RUT y contraseña.'
      );
      return;
    }

    // Comprobar que el RUT sea válido
    if (!isValidRut(rut)) {
      Alert.alert(
        'RUT incorrecto',
        'Por favor, ingresa un RUT válido.'
      );
      return;
    }

    try {

      setLoading(true);
      setOperation('login');

      // Intentar iniciar sesión en Firebase
      await loginUser(rut, password);

      // Entrar a la pantalla principal
      router.replace('/');

    } catch (error: any) {

      console.log('Error de inicio de sesión:', error);

      let mensaje = 'No se pudo iniciar sesión. Inténtalo nuevamente.';

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        mensaje = 'El RUT o la contraseña son incorrectos.';

      } else if (error.code === 'auth/too-many-requests') {
        mensaje = 'Demasiados intentos. Inténtalo más tarde.';
      }

      Alert.alert('Error de inicio de sesión', mensaje);

    } finally {

      setLoading(false);
      setOperation('');

    }
  };

  // ==========================================
  // INGRESAR COMO INVITADO
  // ==========================================

  const handleGuestLogin = async () => {

    try {

      setLoading(true);
      setOperation('guest');

      // Crear una sesión anónima en Firebase
      await loginGuest();

      // Entrar a la pantalla principal
      router.replace('/');

    } catch (error: any) {

      console.log('Error al ingresar como invitado:', error);

      Alert.alert(
        'Error',
        'No fue posible ingresar como invitado. Inténtalo nuevamente.'
      );

    } finally {

      setLoading(false);
      setOperation('');

    }
  };

  // ==========================================
  // ABRIR PANTALLA DE REGISTRO
  // ==========================================

  const handleRegister = () => {

   router.push('/registro');

  };

  // ==========================================
  // INTERFAZ PRINCIPAL
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

        {/* ========================================== */}
        {/* ENCABEZADO */}
        {/* ========================================== */}

        <View style={styles.header}>

          <View style={[
            styles.logoContainer,
            { backgroundColor: theme.sectionBg }
          ]}>

            <Ionicons
              name="phone-portrait"
              size={48}
              color={theme.btnLogin}
            />

          </View>

          <Text style={[styles.titulo, { color: theme.text }]}>
            MobiAmigo
          </Text>

          <Text style={[styles.subtitulo, { color: theme.subtext }]}>
            Tu asistente fácil y rápido
          </Text>

        </View>

        {/* ========================================== */}
        {/* FORMULARIO */}
        {/* ========================================== */}

        <View style={styles.formulario}>

          {/* Campo RUT */}

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

          {/* Campo contraseña */}

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
              placeholder="Ingresa tu contraseña"
              placeholderTextColor={theme.subtext}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!mostrarPassword}
              autoCapitalize="none"
            />

            {/* Mostrar u ocultar contraseña */}

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

          {/* ========================================== */}
          {/* BOTÓN INICIAR SESIÓN */}
          {/* ========================================== */}

          <TouchableOpacity
            style={[
              styles.boton,
              { backgroundColor: theme.btnLogin },
              loading && styles.botonDeshabilitado
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >

            {loading && operation === 'login' ? (

              <ActivityIndicator color="#FFFFFF" size="large" />

            ) : (

              <>

                <Ionicons
                  name="log-in-outline"
                  size={30}
                  color="#FFFFFF"
                />

                <Text style={styles.textoBoton}>
                  Iniciar sesión
                </Text>

              </>

            )}

          </TouchableOpacity>

          {/* ========================================== */}
          {/* BOTÓN REGISTRARSE */}
          {/* ========================================== */}

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

            <Ionicons
              name="person-add-outline"
              size={30}
              color="#FFFFFF"
            />

            <Text style={styles.textoBoton}>
              Registrarse
            </Text>

          </TouchableOpacity>

          {/* ========================================== */}
          {/* SEPARADOR */}
          {/* ========================================== */}

          <View style={styles.separadorContainer}>

            <View style={[
              styles.separador,
              { backgroundColor: theme.cardBorder }
            ]} />

            <Text style={[
              styles.textoSeparador,
              { color: theme.subtext }
            ]}>
              O TAMBIÉN
            </Text>

            <View style={[
              styles.separador,
              { backgroundColor: theme.cardBorder }
            ]} />

          </View>

          {/* ========================================== */}
          {/* BOTÓN INGRESAR COMO INVITADO */}
          {/* ========================================== */}

          <TouchableOpacity
            style={[
              styles.boton,
              { backgroundColor: theme.btnGuest },
              loading && styles.botonDeshabilitado
            ]}
            onPress={handleGuestLogin}
            disabled={loading}
            activeOpacity={0.8}
          >

            {loading && operation === 'guest' ? (

              <ActivityIndicator color="#FFFFFF" size="large" />

            ) : (

              <>

                <Ionicons
                  name="person-outline"
                  size={30}
                  color="#FFFFFF"
                />

                <Text style={styles.textoBoton}>
                  Ingresar sin registrarse
                </Text>

              </>

            )}

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

  // ==========================================
  // CONTENEDOR PRINCIPAL
  // ==========================================

  container: {
    flex: 1,
  },

  scrollGeneral: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 30,
  },

  // ==========================================
  // ENCABEZADO
  // ==========================================

  header: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
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
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  subtitulo: {
    fontSize: 17,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ==========================================
  // FORMULARIO
  // ==========================================

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

  // ==========================================
  // BOTONES
  // ==========================================

  boton: {
    width: '100%',
    minHeight: 68,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginTop: 17,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },

  textoBoton: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    marginLeft: 12,
    flexShrink: 1,
  },

  botonDeshabilitado: {
    opacity: 0.6,
  },

  // ==========================================
  // SEPARADOR
  // ==========================================

  separadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 5,
  },

  separador: {
    flex: 1,
    height: 1.5,
  },

  textoSeparador: {
    fontSize: 13,
    fontWeight: '700',
    marginHorizontal: 15,
  },

});
