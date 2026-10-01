// ==========================================
// SECCIÓN DE IMPORTS
// ==========================================

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OpcionesAppsScreen() {

  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* ========================================== */}
      {/* BOTÓN PARA VOLVER */}
      {/* ========================================== */}
      {/* Permite regresar a la pantalla principal */}
      {/* de MobiAmigo sin realizar ningún cambio. */}
      <Pressable
        onPress={() => router.back()}
        style={styles.botonAtras}
      >
        <Ionicons
          name="arrow-back"
          size={32}
          color="#F8E9E9"
        />
      </Pressable>
      {/* ========================================== */}
      {/* TÍTULO DE LA PANTALLA */}
      {/* ========================================== */}

      <View style={styles.header}>

        <Text style={styles.titulo}>
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
          style={styles.botonOpcion}
          onPress={() => router.push("/agregarapps")}
        >

          <Ionicons
            name="add-circle-outline"
            size={75}
            color="#F8E9E9"
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
          style={styles.botonOpcion}
          onPress={() => router.push("/eliminarapps")}
        >
          <Ionicons
            name="remove-circle-outline"
            size={75}
            color="#F8E9E9"
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
    backgroundColor: '#000040',
  },
  // ==========================================
  // BOTÓN ATRÁS
  // ==========================================

  botonAtras: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  // ==========================================
  // ENCABEZADO
  // ==========================================

  header: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titulo: {
    color: '#F8E9E9',
    fontSize: 32,
    fontWeight: '400',
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
    width: '90%',
    height: 180,
    backgroundColor: '#493936',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },

  textoOpcion: {
    color: '#F8E9E9',
    fontSize: 28,
    textAlign: 'center',
    marginTop: 12,
  },

});