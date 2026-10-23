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


export default function AgregarAppsScreen(): React.JSX.Element {
  const router = useRouter();
  // ==========================================
  // LISTA DE APLICACIONES INSTALADAS
  // ==========================================
  // Aquí se guardan todas las aplicaciones
  // instaladas en el teléfono.

  const [apps, setApps] = useState<AppInfo[]>([]);
  // ==========================================
  // APLICACIONES SELECCIONADAS
  // ==========================================
  // Aquí guardamos las aplicaciones nuevas
  // que el usuario quiere agregar a MobiAmigo.

  const [selectedApps, setSelectedApps] =
    useState<Set<string>>(new Set());
  // ==========================================
  // APLICACIONES QUE YA ESTÁN AGREGADAS
  // ==========================================
  // Guardamos los packageName de las aplicaciones
  // que ya aparecen en el index.
  // Estas aplicaciones no se mostrarán nuevamente
  // en la lista de "Añadir Apps".

  const [appsYaAgregadas, setAppsYaAgregadas] =
    useState<AppInfo[]>([]);
  // ==========================================
  // ESTADO DE CARGA
  // ==========================================
  const [loading, setLoading] =
    useState<boolean>(true);
  // ==========================================
  // MENSAJE DE ERROR
  // ==========================================
  const [errorMsg, setErrorMsg] =
    useState<string | null>(null);
  // ==========================================
  // CARGAR APLICACIONES INSTALADAS
  // ==========================================

  useEffect(() => {

    let isMounted = true;
    const cargarApps = async () => {

      try {
        // ==========================================
        // CONECTAR CON LA LIBRERÍA
        // ==========================================

        const LauncherKit =
          require('react-native-launcher-kit');

        const InstalledApps =
          LauncherKit.InstalledApps ||
          LauncherKit.default?.InstalledApps ||
          LauncherKit;
        let result: any = null;
        // ==========================================
        // OBTENER APLICACIONES
        // ==========================================
        if (
          typeof InstalledApps.getApps ===
          'function'
        ) {

          result =
            await InstalledApps.getApps();

        } else if (
          typeof InstalledApps.getSortedApps ===
          'function'
        ) {

          result =
            await InstalledApps.getSortedApps();

        }
        // ==========================================
        // INFORMACIÓN PARA DEPURACIÓN
        // ==========================================

        console.log(
          "=========================================="
        );

        console.log(
          "TIPO DE RESULTADO RECIBIDO:",
          typeof result
        );

        console.log(
          "CANTIDAD DE APPS:",
          Array.isArray(result)
            ? result.length
            : "No es un arreglo"
        );

        console.log(
          "=========================================="
        );


        if (
          Array.isArray(result) &&
          result.length > 0
        ) {

          console.log(
            "PRIMERA APP:",
            result[0]
          );

          console.log(
            "ICONO:",
            result[0].icon
          );

        }
        // ==========================================
        // GUARDAR LAS APLICACIONES EN LA PANTALLA
        // ==========================================

        if (isMounted) {

          if (
            Array.isArray(result) &&
            result.length > 0
          ) {

            const sortedApps =
              [...result].sort((a, b) =>
                (a.label || '').localeCompare(
                  b.label || ''
                )
              );

            setApps(sortedApps);

          } else {

            setErrorMsg(
              'No se encontraron aplicaciones en el dispositivo.'
            );

          }

        }

      } catch (error: any) {

        console.error(
          'Error al obtener aplicaciones:',
          error
        );

        if (isMounted) {

          setErrorMsg(
            'Error al leer aplicaciones: ' +
            (error?.message || error)
          );

        }

      } finally {

        if (isMounted) {

          setLoading(false);

        }

      }

    };

    cargarApps();
    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================
  // CARGAR APLICACIONES YA AGREGADAS
  // ==========================================
  // Leemos @mis_apps para saber qué aplicaciones
  // ya están actualmente en MobiAmigo.
  // Estas aplicaciones serán ocultadas de la lista.
  useEffect(() => {

    const cargarAppsGuardadas = async () => {

      try {

        const datosGuardados =
          await AsyncStorage.getItem(
            '@mis_apps'
          );

        if (datosGuardados !== null) {

          const appsGuardadas: AppInfo[] =
            JSON.parse(datosGuardados);

          setAppsYaAgregadas(
            appsGuardadas
          );

        } else {

          setAppsYaAgregadas([]);

        }

      } catch (error) {

        console.log(
          "Error al cargar apps guardadas:",
          error
        );

      }

    };
    cargarAppsGuardadas();
  }, []);

  // ==========================================
  // SELECCIONAR / DESELECCIONAR APP
  // ==========================================
  // Si la app estaba seleccionada:
  // se deselecciona.
  // Si no estaba seleccionada:
  // se selecciona.
  const seleccionarApp = (
    packageName: string
  ) => {
    setSelectedApps((actuales) => {

      const nuevas =
        new Set(actuales);

      if (
        nuevas.has(packageName)
      ) {

        nuevas.delete(packageName);

      } else {

        nuevas.add(packageName);

      }
      return nuevas;

    });

  };
  // ==========================================
  // CONFIRMAR SELECCIÓN
  // ==========================================
  // Primero conserva las aplicaciones que ya
  // estaban agregadas.
  // Después agrega las nuevas aplicaciones
  // seleccionadas por el usuario.
  // Finalmente guarda todo nuevamente en
  // @mis_apps.
  const confirmarSeleccion =
    async () => {
      try {
        // ==========================================
        // OBTENER LAS NUEVAS APLICACIONES
        // ==========================================
        // Buscamos solamente las aplicaciones que
        // fueron seleccionadas en esta pantalla.
        const nuevasApps =
          apps.filter((app) =>
            selectedApps.has(
              app.packageName
            )
          );
        // ==========================================
        // COMBINAR APPS ANTIGUAS Y NUEVAS
        // ==========================================
        const todasLasApps = [
          ...appsYaAgregadas,
          ...nuevasApps
        ];
        // ==========================================
        // GUARDAR EN MEMORIA
        // ==========================================
        await AsyncStorage.setItem(
          '@mis_apps',
          JSON.stringify(
            todasLasApps
          )
        );
        // ==========================================
        // VOLVER AL INDEX
        // ==========================================

        router.replace('/');
      } catch (error) {

        console.log(
          "Error al guardar aplicaciones:",
          error
        );

        setErrorMsg(
          "No se pudieron guardar las aplicaciones."
        );

      }

    };

  // ==========================================
  // MOSTRAR CADA APLICACIÓN
  // ==========================================

  const renderItem:
    ListRenderItem<AppInfo> =
    ({ item }) => {

      const seleccionada =
        selectedApps.has(
          item.packageName
        );

      return (

        <Pressable

          onPress={() =>
            seleccionarApp(
              item.packageName
            )
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
                name="cube-outline"
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
              size={28}
              color="#F8E9E9"
            />

          )}

        </Pressable>

      );

    };
  // ==========================================
  // FILTRAR APLICACIONES
  // ==========================================
  // Se crea una lista nueva que solamente contiene
  // las aplicaciones que todavía NO están agregadas
  // en el index.
  // De esta manera las aplicaciones que ya están
  // en el index no aparecen en esta pantalla.
  const appsDisponibles =
    apps.filter((app) => {

      const yaExiste =
        appsYaAgregadas.some(
          (appAgregada) =>
            appAgregada.packageName ===
            app.packageName
        );

      return !yaExiste;

    });

  return (
    <SafeAreaView style={styles.container}>

      {/* ========================================== */}
      {/* BOTÓN ATRÁS */}
      {/* ========================================== */}

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
          Añadir Apps
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

      ) : errorMsg ? (

        <View style={styles.center}>

          <Text style={styles.errorText}>
            {errorMsg}
          </Text>

        </View>

      ) : appsDisponibles.length === 0 ? (
        // ==========================================
        // NO HAY APLICACIONES NUEVAS
        // ==========================================
        // Si todas las aplicaciones instaladas ya
        // están agregadas en el index, mostramos
        // este mensaje.
        <View style={styles.center}>

          <Ionicons
            name="checkmark-circle-outline"
            size={60}
            color="#F8E9E9"
          />

          <Text style={styles.sinAppsText}>
            No hay aplicaciones nuevas para agregar.
          </Text>

        </View>

      ) : (

        <>
          {/* ========================================== */}
          {/* LISTA DE APLICACIONES DISPONIBLES */}
          {/* ========================================== */}
          {/* Aquí solamente aparecen aplicaciones */}
          {/* que todavía no están en el index. */}
          <FlatList

            data={appsDisponibles}

            keyExtractor={(item) =>
              item.packageName
            }

            renderItem={renderItem}

            contentContainerStyle={
              styles.listContent
            }

          />
          {/* ========================================== */}
          {/* BOTÓN CONFIRMAR SELECCIÓN */}
          {/* ========================================== */}
          {/* Guarda las nuevas aplicaciones y conserva */}
          {/* las que ya estaban agregadas. */}
          <Pressable
            style={styles.botonConfirmar}
            onPress={confirmarSeleccion}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={28}
              color="#F8E9E9"
            />
            <Text style={styles.textoConfirmar}>
              Confirmar selección
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

  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
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
  // BOTÓN CONFIRMAR
  // ==========================================

  botonConfirmar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#493936',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 14,
  },

  textoConfirmar: {
    color: '#F8E9E9',
    fontSize: 20,
    marginLeft: 10,
    fontWeight: '600',
  },

});