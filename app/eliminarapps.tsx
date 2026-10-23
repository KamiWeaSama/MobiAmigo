// ==========================================
// SECCIÓN DE IMPORTS
// ==========================================
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ==========================================
// INFORMACIÓN DE LAS APLICACIONES
// ==========================================

interface AppInfo {
  label: string;
  packageName: string;
  icon?: string;
}


export default function EliminarAppsScreen(): React.JSX.Element {

  const router = useRouter();
  // ==========================================
  // LISTA DE APLICACIONES GUARDADAS
  // ==========================================
  // Aquí se almacenarán solamente las aplicaciones
  // que actualmente están agregadas a MobiAmigo.

  const [apps, setApps] = useState<AppInfo[]>([]);

  // ==========================================
  // APLICACIONES SELECCIONADAS PARA ELIMINAR
  // ==========================================
  // Guardamos los packageName de las aplicaciones
  // que el usuario ha seleccionado.

  const [selectedApps, setSelectedApps] =
    useState<Set<string>>(new Set());
  // ==========================================
  // ESTADO DE CARGA
  // ==========================================

  const [loading, setLoading] = useState<boolean>(true);

  // ==========================================
  // CARGAR APLICACIONES GUARDADAS
  // ==========================================

  useEffect(() => {

    const cargarAppsGuardadas = async () => {

      try {

        const datosGuardados =
          await AsyncStorage.getItem('@mis_apps');

        if (datosGuardados !== null) {

          const appsGuardadas: AppInfo[] =
            JSON.parse(datosGuardados);

          setApps(appsGuardadas);

        } else {

          setApps([]);

        }

      } catch (error) {

        console.log(
          "Error al cargar aplicaciones:",
          error
        );

      } finally {

        setLoading(false);

      }

    };

    cargarAppsGuardadas();

  }, []);

  // ==========================================
  // SELECCIONAR / DESELECCIONAR APLICACIÓN
  // ==========================================
  // Cuando el usuario toca una aplicación:
  // - Si estaba seleccionada, se deselecciona.
  // - Si no estaba seleccionada, se selecciona.

  const seleccionarApp = (packageName: string) => {

    setSelectedApps((actuales) => {

      const nuevas = new Set(actuales);

      if (nuevas.has(packageName)) {

        nuevas.delete(packageName);

      } else {

        nuevas.add(packageName);

      }

      return nuevas;

    });

  };
  // ==========================================
  // ELIMINAR APLICACIONES SELECCIONADAS
  // ==========================================
  // Crea una nueva lista dejando solamente las
  // aplicaciones que NO fueron seleccionadas.
  // Después guarda la nueva lista en AsyncStorage.
  const eliminarAppsSeleccionadas = async () => {

    try {

      // Dejamos solamente las aplicaciones
      // que no fueron seleccionadas.
      const nuevasApps = apps.filter(
        (app) =>
          !selectedApps.has(app.packageName)
      );

      // Actualizamos la lista de la pantalla.
      setApps(nuevasApps);

      // Guardamos la nueva lista.
      await AsyncStorage.setItem(
        '@mis_apps',
        JSON.stringify(nuevasApps)
      );

      // Volvemos a la pantalla principal.
      router.replace('/');

    } catch (error) {

      console.log(
        "Error al eliminar aplicaciones:",
        error
      );

    }

  };
  // ==========================================
  // MOSTRAR CADA APLICACIÓN
  // ==========================================

  const renderItem: ListRenderItem<AppInfo> =
    ({ item }) => {

      const seleccionada =
        selectedApps.has(item.packageName);

      return (

        <Pressable
          onPress={() =>
            seleccionarApp(item.packageName)
          }

          style={[
            styles.appCard,

            seleccionada &&
            styles.appCardSeleccionada
          ]}
        >
          {/* ========================================== */}
          {/* ICONO DE LA APLICACIÓN */}
          {/* ========================================== */}

          {item.icon ? (

            <Image
              source={{
                uri: item.icon
              }}
              style={styles.icon}
            />

          ) : (

            <View
              style={[
                styles.icon,
                styles.iconPlaceholder
              ]}
            >

              <Ionicons
                name="apps"
                size={24}
                color="#F8E9E9"
              />

            </View>

          )}

          {/* ========================================== */}
          {/* INFORMACIÓN DE LA APLICACIÓN */}
          {/* ========================================== */}

          <View style={styles.appInfo}>

            <Text
              style={styles.appName}
              numberOfLines={1}
            >
              {item.label || 'Aplicación'}
            </Text>

            <Text
              style={styles.packageName}
              numberOfLines={1}
            >
              {item.packageName}
            </Text>

          </View>

          {/* ========================================== */}
          {/* MARCA DE SELECCIÓN */}
          {/* ========================================== */}

          {seleccionada && (

            <Ionicons
              name="checkmark-circle"
              size={30}
              color="#F8E9E9"
            />

          )}

        </Pressable>

      );

    };

  return (

    <SafeAreaView style={styles.container}>

      {/* ========================================== */}
      {/* BOTÓN ATRÁS */}
      {/* ========================================== */}

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
      {/* TÍTULO */}
      {/* ========================================== */}

      <View style={styles.header}>

        <Text style={styles.titulo}>
          Eliminar Apps
        </Text>

      </View>


      {/* ========================================== */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ========================================== */}

      {loading ? (

        <View style={styles.center}>

          <ActivityIndicator
            size="large"
            color="#0080ff"
          />

          <Text style={styles.loadingText}>
            Cargando aplicaciones...
          </Text>

        </View>

      ) : apps.length === 0 ? (

        <View style={styles.center}>

          <Ionicons
            name="apps-outline"
            size={60}
            color="#F8E9E9"
          />

          <Text style={styles.sinAppsText}>
            No hay aplicaciones agregadas.
          </Text>

        </View>

      ) : (

        <>
          {/* ========================================== */}
          {/* LISTA DE APLICACIONES */}
          {/* ========================================== */}

          <FlatList
            data={apps}
            keyExtractor={(item) =>
              item.packageName
            }
            renderItem={renderItem}
            contentContainerStyle={
              styles.listContent
            }
          />
          {/* ========================================== */}
          {/* BOTÓN ELIMINAR */}
          {/* ========================================== */}
          {/* El botón elimina solamente las apps que */}
          {/* hayan sido seleccionadas previamente. */}
          <Pressable
            style={styles.botonEliminar}
            onPress={eliminarAppsSeleccionadas}
          >

            <Ionicons
              name="trash-outline"
              size={28}
              color="#F8E9E9"
            />

            <Text style={styles.textoEliminar}>
              Eliminar seleccionadas
            </Text>

          </Pressable>

        </>

      )}

    </SafeAreaView>

  );

}

// ==========================================
// ESTILOS DE LA PANTALLA
// ==========================================

const styles = StyleSheet.create({
  // ==========================================
  // CONTENEDOR PRINCIPAL
  // ==========================================

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
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titulo: {
    color: '#F8E9E9',
    fontSize: 32,
    fontWeight: '400',
  },

  // ==========================================
  // CONTENEDOR CENTRAL
  // ==========================================

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#F8E9E9',
  },

  sinAppsText: {
    marginTop: 15,
    fontSize: 20,
    color: '#F8E9E9',
    textAlign: 'center',
  },

  // ==========================================
  // LISTA
  // ==========================================

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // ==========================================
  // TARJETA DE APLICACIÓN
  // ==========================================

  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0c5a',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },

  // ==========================================
  // TARJETA SELECCIONADA
  // ==========================================

  appCardSeleccionada: {
    borderWidth: 2,
    borderColor: '#F8E9E9',
  },

  // ==========================================
  // ICONO
  // ==========================================

  icon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 14,
  },

  iconPlaceholder: {
    backgroundColor: '#493936',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ==========================================
  // INFORMACIÓN DE LA APP
  // ==========================================

  appInfo: {
    flex: 1,
  },

  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8E9E9',
  },

  packageName: {
    fontSize: 12,
    color: '#a08ba1',
    marginTop: 2,
  },

  // ==========================================
  // BOTÓN ELIMINAR
  // ==========================================

  botonEliminar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#493936',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 14,
  },

  textoEliminar: {
    color: '#F8E9E9',
    fontSize: 20,
    marginLeft: 10,
    fontWeight: '600',
  },

});