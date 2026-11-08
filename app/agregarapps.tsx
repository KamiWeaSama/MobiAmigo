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
  TextInput,
  useColorScheme,
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
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // ==========================================
  // PALETA DE COLORES (MODO CLARO / OSCURO AUTOMÁTICO)
  // ==========================================
  const theme = {
    bg: isDark ? '#0F172A' : '#FFFDF9',
    card: isDark ? '#1E293B' : '#FFFFFF',
    cardBorder: isDark ? '#334155' : '#D6D3CD',
    cardSelectedBg: isDark ? '#064E3B' : '#DCFCE7',
    cardSelectedBorder: '#15803D',
    text: isDark ? '#F8FAFC' : '#111827',
    subtext: isDark ? '#94A3B8' : '#6B7280',
    backBg: isDark ? '#1E293B' : '#E5E7EB',
    backBorder: isDark ? '#334155' : '#D1D5DB',
    btnConfirm: '#15803D',
    accent: '#1D4ED8',
  };

  // ==========================================
  // LISTA DE APLICACIONES INSTALADAS
  // ==========================================
  // Aquí se guardan todas las aplicaciones
  // instaladas en el teléfono.

  const [apps, setApps] = useState<AppInfo[]>([]);

  // ==========================================
  // BUSCADOR DE APLICACIONES
  // ==========================================
  const [busqueda, setBusqueda] = useState<string>('');

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
            {
              backgroundColor: seleccionada ? theme.cardSelectedBg : theme.card,
              borderColor: seleccionada ? theme.cardSelectedBorder : theme.cardBorder,
            },
            seleccionada && styles.appCardSeleccionada
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
                styles.iconPlaceholder,
                { backgroundColor: theme.accent }
              ]}
            >

              <Ionicons
                name="cube-outline"
                size={28}
                color="#FFFFFF"
              />

            </View>

          )}
          {/* ========================================== */}
          {/* INFORMACIÓN DE LA APLICACIÓN */}
          {/* ========================================== */}

          <View style={styles.appInfo}>

            <Text
              style={[styles.appName, { color: theme.text }]}
              numberOfLines={1}
            >
              {item.label || 'Aplicación'}
            </Text>

          </View>
          {/* ========================================== */}
          {/* MARCA DE SELECCIÓN */}
          {/* ========================================== */}

          <Ionicons
            name={seleccionada ? "checkmark-circle" : "ellipse-outline"}
            size={34}
            color={seleccionada ? theme.btnConfirm : theme.subtext}
          />

        </Pressable>

      );

    };

  // ==========================================
  // FILTRAR APLICACIONES
  // ==========================================
  // Se crea una lista nueva que solamente contiene
  // las aplicaciones que todavía NO están agregadas
  // en el index y que coinciden con el buscador.
  const appsDisponibles =
    apps.filter((app) => {

      const yaExiste =
        appsYaAgregadas.some(
          (appAgregada) =>
            appAgregada.packageName ===
            app.packageName
        );

      const coincideBusqueda =
        (app.label || '')
          .toLowerCase()
          .includes(busqueda.trim().toLowerCase());

      return !yaExiste && coincideBusqueda;

    });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* ========================================== */}
      {/* BARRA SUPERIOR Y BOTÓN ATRÁS */}
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
          Añadir Apps
        </Text>
      </View>

      {/* ========================================== */}
      {/* BUSCADOR DE APLICACIONES */}
      {/* ========================================== */}

      {!loading && !errorMsg && (
        <View
          style={[
            styles.contenedorBuscador,
            { backgroundColor: theme.card, borderColor: theme.cardBorder }
          ]}
        >
          <Ionicons name="search" size={24} color={theme.subtext} />
          <TextInput
            style={[styles.inputBuscador, { color: theme.text }]}
            placeholder="Buscar aplicación por nombre..."
            placeholderTextColor={theme.subtext}
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <Pressable onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={24} color={theme.subtext} />
            </Pressable>
          )}
        </View>
      )}

      {/* ========================================== */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ========================================== */}

      {loading ? (

        <View style={styles.center}>

          <ActivityIndicator
            size="large"
            color={theme.accent}
          />

          <Text style={[styles.loadingText, { color: theme.text }]}>
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
        <View style={styles.center}>

          <Ionicons
            name="checkmark-circle-outline"
            size={64}
            color={theme.btnConfirm}
          />

          <Text style={[styles.sinAppsText, { color: theme.text }]}>
            {busqueda.trim().length > 0
              ? 'No se encontraron aplicaciones con ese nombre.'
              : 'No hay aplicaciones nuevas para agregar.'}
          </Text>

        </View>

      ) : (

        <>
          {/* ========================================== */}
          {/* LISTA DE APLICACIONES DISPONIBLES */}
          {/* ========================================== */}
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
          <Pressable
            style={[styles.botonConfirmar, { backgroundColor: theme.btnConfirm }]}
            onPress={confirmarSeleccion}
          >
            <Ionicons
              name="checkmark-circle"
              size={30}
              color="#FFFFFF"
            />
            <Text style={styles.textoConfirmar}>
              Confirmar selección ({selectedApps.size})
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
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titulo: {
    fontSize: 32,
    fontWeight: '800',
  },
  // ==========================================
  // BUSCADOR
  // ==========================================
  contenedorBuscador: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  inputBuscador: {
    flex: 1,
    fontSize: 18,
    marginLeft: 10,
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
    fontSize: 18,
    fontWeight: '600',
  },

  errorText: {
    fontSize: 18,
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '600',
  },

  sinAppsText: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: '600',
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
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  // ==========================================
  // TARJETA SELECCIONADA
  // ==========================================

  appCardSeleccionada: {
    borderWidth: 2.5,
  },
  // ==========================================
  // ICONO
  // ==========================================

  icon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginRight: 16,
  },

  iconPlaceholder: {
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
    fontSize: 20,
    fontWeight: '700',
  },

  // ==========================================
  // BOTÓN CONFIRMAR
  // ==========================================

  botonConfirmar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 18,
    borderRadius: 16,
    elevation: 4,
  },

  textoConfirmar: {
    color: '#FFFFFF',
    fontSize: 22,
    marginLeft: 10,
    fontWeight: '800',
  },

});
