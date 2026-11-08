// ==========================================
// SECCIÓN DE IMPORTS
// ==========================================

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OpcionesAppsScreen() {

  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // ==========================================
  // PALETA DE COLORES (MODO CLARO / OSCURO AUTOMÁTICO)
  // ==========================================

  const theme = {
    bg: isDark ? '#0F172A' : '#FFFDF9',
    text: isDark ? '#F8FAFC' : '#111827',
    backBg: isDark ? '#1E293B' : '#E5E7EB',
    backBorder: isDark ? '#334155' : '#D1D5DB',
    btnAdd: '#15803D',    // Verde claro y amigable para Añadir
    btnDelete: '#DC2626', // Rojo claro e intuitivo para Eliminar
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* ========================================== */}
      {/* ENCABEZADO Y BOTÓN PARA VOLVER */}
      {/* ========================================== */}
      {/* Permite regresar a la pantalla principal */}
      {/* de MobiAmigo sin realizar ningún cambio. */}

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
      {/* TÍTULO DE LA PANTALLA */}
      {/* ========================================== */}

      <View style={styles.header}>
        <Text style={[styles.titulo, { color: theme.text }]}>
          Aplicaciones
        </Text>
      </View>

      {/* ========================================== */}
      {/* OPCIONES DE APLICACIONES */}
      {/* ========================================== */}
      {/* Aquí se muestran las dos acciones que el */}
      {/* usuario puede realizar con sus aplicaciones. */}
      <View style={styles.contenedorOpciones}>
        {/* ========================================== */}
        {/* OPCIÓN: AÑADIR APP */}
        {/* ========================================== */}
        {/* Lleva a la pantalla donde se muestran */}
        {/* todas las aplicaciones instaladas para */}
        {/* poder seleccionar nuevas aplicaciones. */}

        <Pressable
          style={[styles.botonOpcion, { backgroundColor: theme.btnAdd }]}
          onPress={() => router.push("/agregarapps")}
        >
          <Ionicons
            name="add-circle"
            size={80}
            color="#FFFFFF"
          />

          <Text style={styles.textoOpcion}>
            Añadir app
          </Text>
        </Pressable>

        {/* ========================================== */}
        {/* OPCIÓN: ELIMINAR APP */}
        {/* ========================================== */}
        {/* Lleva a la pantalla donde posteriormente */}
        {/* mostraremos solamente las aplicaciones que */}
        {/* están actualmente agregadas a MobiAmigo. */}
        <Pressable
          style={[styles.botonOpcion, { backgroundColor: theme.btnDelete }]}
          onPress={() => router.push("/eliminarapps")}
        >
          <Ionicons
            name="trash"
            size={80}
            color="#FFFFFF"
          />

          <Text style={styles.textoOpcion}>
            Eliminar app
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

  // Fondo principal de MobiAmigo
  container: {
    flex: 1,
  },
  // ==========================================
  // BARRA SUPERIOR Y BOTÓN ATRÁS
  // ==========================================
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
  // ==========================================
  // ENCABEZADO
  // ==========================================

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
  // ==========================================
  // CONTENEDOR DE LAS OPCIONES
  // ==========================================

  contenedorOpciones: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  // ==========================================
  // BOTONES DE AÑADIR Y ELIMINAR
  // ==========================================

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
