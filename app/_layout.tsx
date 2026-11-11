
import { useEffect, useState } from 'react';

import {
  Stack,
  useRouter,
  useSegments,
} from 'expo-router';

import {
  onAuthStateChanged,
  User,
} from 'firebase/auth';

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import { auth } from '../config/firebase';

export default function RootLayout() {

  const router = useRouter();
  const segments = useSegments();

  // Usuario actualmente autenticado
  const [user, setUser] = useState<User | null>(null);

  // Saber si Firebase terminó de comprobar la sesión
  const [authReady, setAuthReady] = useState(false);

  // ==========================================
  // COMPROBAR SESIÓN DE FIREBASE
  // ==========================================

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {

      setUser(currentUser);
      setAuthReady(true);

    });

    // Dejar de escuchar cuando se desmonte el componente
    return unsubscribe;

  }, []);

  // ==========================================
  // CONTROLAR LA NAVEGACIÓN
  // ==========================================

  useEffect(() => {
  if (!authReady) return;

  // Permitir el acceso sin sesión al login y al registro
  const estaEnPantallaPublica =
    segments[0] === 'login' ||
    segments[0] === 'registro';

  if (user) {

    // Si ya inició sesión, no necesita estar en login o registro
    if (estaEnPantallaPublica) {
      router.replace('/');
    }

  } else {

    // Si no inició sesión, solamente puede acceder
    // al login o al registro
    if (!estaEnPantallaPublica) {
      router.replace('/login');
    }

  }

}, [user, authReady, segments]);

  // ==========================================
  // ESPERAR A FIREBASE
  // ==========================================

  if (!authReady) {

    return (
      <View style={styles.loadingContainer}>

        <ActivityIndicator
          size="large"
          color="#6D28D9"
        />

      </View>
    );

  }

  // ==========================================
  // NAVEGACIÓN PRINCIPAL
  // ==========================================

  return (

    <Stack screenOptions={{ headerShown: false }}>

      <Stack.Screen name="login" />

      <Stack.Screen name="index" />

    </Stack>

  );

}

// ==========================================
// ESTILOS
// ==========================================

const styles = StyleSheet.create({

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
  },

});
