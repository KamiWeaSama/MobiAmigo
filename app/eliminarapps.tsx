
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
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { auth } from '../config/firebase';

import {
  obtenerAplicaciones,
  eliminarAplicaciones,
  migrarAplicacionesAntiguas,
  AplicacionInfo
} from '../services/aplicacionesService';

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
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // ==========================================
  // PALETA DE COLORES (MODO CLARO / OSCURO AUTOMÁTICO)
  // ==========================================

  const theme = {
    bg: isDark ? '#0F172A' : '#FFFDF9',
    card: isDark ? '#1E293B' : '#FFFFFF',
    cardBorder: isDark ? '#334155' : '#D6D3CD',
    cardSelectedBg: isDark ? '#450A0A' : '#FEE2E2',
    cardSelectedBorder: '#DC2626',
    text: isDark ? '#F8FAFC' : '#111827',
    subtext: isDark ? '#94A3B8' : '#6B7280',
    backBg: isDark ? '#1E293B' : '#E5E7EB',
    backBorder: isDark ? '#334155' : '#D1D5DB',
    btnDelete: '#DC2626',
    accent: '#1D4ED8',
  };

  // ==========================================
  // LISTA DE APLICACIONES GUARDADAS
  // ==========================================
  // Aquí se almacenarán todas las aplicaciones
  // seleccionadas por el usuario en Firestore.
  //
  // No importa si están instaladas o no
  // en el dispositivo actual.

  const [apps, setApps] = useState<AppInfo[]>([]);

  // ==========================================
  // APLICACIONES SELECCIONADAS PARA ELIMINAR
  // ==========================================

  const [selectedApps, setSelectedApps] =
    useState<Set<string>>(new Set());

  // ==========================================
  // ESTADO DE CARGA
  // ==========================================

  const [loading, setLoading] = useState<boolean>(true);

  // ==========================================
  // MENSAJE DE ERROR
  // ==========================================

  const [errorMsg, setErrorMsg] =
    useState<string | null>(null);

  // ==========================================
  // CARGAR APLICACIONES GUARDADAS
  // ==========================================

  useEffect(() => {

    let isMounted = true;

    const cargarAppsGuardadas = async () => {

      try {

        const usuario = auth.currentUser;

        if (!usuario) {
          throw new Error('No hay una sesión iniciada.');
        }

        // ==========================================
        // MIGRAR APLICACIONES ANTIGUAS
        // ==========================================
        // Recuperamos las aplicaciones que estaban
        // guardadas anteriormente en @mis_apps.
        //
        // El marcador evita repetir la migración
        // o importar datos a otra cuenta del mismo
        // dispositivo.

        const claveMigracion = '@apps_migracion_v1';

        const migracionRealizada =
          await AsyncStorage.getItem(claveMigracion);

        if (migracionRealizada !== 'true') {

          const datosAntiguos =
            await AsyncStorage.getItem('@mis_apps');

          if (datosAntiguos !== null) {

            const aplicacionesAntiguas: AppInfo[] =
              JSON.parse(datosAntiguos);

            if (Array.isArray(aplicacionesAntiguas)) {

              const aplicacionesParaMigrar: AplicacionInfo[] =
                aplicacionesAntiguas
                  .filter((app) =>
                    app &&
                    typeof app.packageName === 'string'
                  )
                  .map((app) => ({
                    label: app.label || 'Aplicación',
                    packageName: app.packageName,
                  }));

              await migrarAplicacionesAntiguas(
                aplicacionesParaMigrar
              );

            }

          }

          await AsyncStorage.setItem(
            claveMigracion,
            'true'
          );

        }

        // ==========================================
        // OBTENER APLICACIONES DE FIRESTORE
        // ==========================================
        // Esta consulta obtiene todas las aplicaciones
        // seleccionadas por el usuario.
        //
        // No se filtran por las aplicaciones instaladas.

        const aplicacionesFirestore =
          await obtenerAplicaciones();

        // ==========================================
        // OBTENER ICONOS DEL DISPOSITIVO ACTUAL
        // ==========================================
        // Los iconos no se guardan en Firestore.
        // Cada dispositivo utiliza sus propios iconos.

        let aplicacionesInstaladas: AppInfo[] = [];

        try {

          const LauncherKit =
            require('react-native-launcher-kit');

          const InstalledApps =
            LauncherKit.InstalledApps ||
            LauncherKit.default?.InstalledApps ||
            LauncherKit;

          let resultado: any = null;

          if (
            typeof InstalledApps.getApps === 'function'
          ) {

            resultado =
              await InstalledApps.getApps();

          } else if (
            typeof InstalledApps.getSortedApps === 'function'
          ) {

            resultado =
              await InstalledApps.getSortedApps();

          }

          if (Array.isArray(resultado)) {

            aplicacionesInstaladas = resultado;

          }

        } catch (error) {

          console.log(
            'No se pudieron obtener los iconos locales:',
            error
          );

        }

        // ==========================================
        // COMBINAR DATOS DE FIRESTORE E ICONOS LOCALES
        // ==========================================
        // Si la aplicación está instalada, utilizamos
        // su icono local.
        //
        // Si no está instalada, conservamos la app
        // y mostramos un icono genérico.

        const aplicacionesCompletas: AppInfo[] =
          aplicacionesFirestore.map((app) => {

            const appInstalada =
              aplicacionesInstaladas.find(
                (instalada) =>
                  instalada.packageName === app.packageName
              );

            return {
              label: app.label || 'Aplicación',
              packageName: app.packageName,
              icon: appInstalada?.icon,
            };

          });

        // ==========================================
        // GUARDAR CACHÉ LOCAL POR USUARIO
        // ==========================================

        const claveAppsUsuario =
          `@mis_apps_${usuario.uid}`;

        await AsyncStorage.setItem(
          claveAppsUsuario,
          JSON.stringify(aplicacionesFirestore)
        );

        // ==========================================
        // ACTUALIZAR LISTA DE LA PANTALLA
        // ==========================================

        if (isMounted) {

          setApps(aplicacionesCompletas);

        }

      } catch (error: any) {

        console.log(
          'Error al cargar aplicaciones:',
          error
        );

        if (isMounted) {

          setErrorMsg(
            'No se pudieron cargar las aplicaciones: ' +
            (error?.message || error)
          );

        }

      } finally {

        if (isMounted) {
          setLoading(false);
        }

      }

    };

    cargarAppsGuardadas();

    return () => {
      isMounted = false;
    };

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
  // Primero eliminamos los documentos de Firestore.
  // Después actualizamos la caché local del usuario.
  //
  // La eliminación se realiza por packageName,
  // independientemente de si la app está instalada.

  const eliminarAppsSeleccionadas = async () => {

    try {

      const usuario = auth.currentUser;

      if (!usuario) {
        throw new Error('No hay una sesión iniciada.');
      }

      // ==========================================
      // COMPROBAR QUE EXISTAN APPS SELECCIONADAS
      // ==========================================

      if (selectedApps.size === 0) {
        return;
      }

      // ==========================================
      // OBTENER PACKAGE NAMES SELECCIONADOS
      // ==========================================

      const packageNames =
        Array.from(selectedApps);

      // ==========================================
      // ELIMINAR DE FIRESTORE
      // ==========================================

      await eliminarAplicaciones(packageNames);

      // ==========================================
      // ACTUALIZAR LA LISTA DE LA PANTALLA
      // ==========================================

      const nuevasApps = apps.filter(
        (app) =>
          !selectedApps.has(app.packageName)
      );

      setApps(nuevasApps);

      // ==========================================
      // ACTUALIZAR CACHÉ LOCAL POR USUARIO
      // ==========================================

      const claveAppsUsuario =
        `@mis_apps_${usuario.uid}`;

      const aplicacionesParaGuardar: AplicacionInfo[] =
        nuevasApps.map((app) => ({
          label: app.label,
          packageName: app.packageName,
        }));

      await AsyncStorage.setItem(
        claveAppsUsuario,
        JSON.stringify(aplicacionesParaGuardar)
      );

      // ==========================================
      // VOLVER AL INDEX
      // ==========================================

      router.replace('/');

    } catch (error: any) {

      console.log(
        'Error al eliminar aplicaciones:',
        error
      );

      setErrorMsg(
        'No se pudieron eliminar las aplicaciones: ' +
        (error?.message || error)
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
            {
              backgroundColor: seleccionada
                ? theme.cardSelectedBg
                : theme.card,

              borderColor: seleccionada
                ? theme.cardSelectedBorder
                : theme.cardBorder,
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
                name="apps"
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
              style={[
                styles.appName,
                { color: theme.text }
              ]}
              numberOfLines={1}
            >
              {item.label || 'Aplicación'}
            </Text>

          </View>

          {/* ========================================== */}
          {/* MARCA DE SELECCIÓN */}
          {/* ========================================== */}

          <Ionicons
            name={
              seleccionada
                ? 'checkmark-circle'
                : 'ellipse-outline'
            }
            size={34}
            color={
              seleccionada
                ? theme.btnDelete
                : theme.subtext
            }
          />

        </Pressable>

      );

    };

  return (

    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.bg }
      ]}
    >

      {/* ========================================== */}
      {/* BARRA SUPERIOR Y BOTÓN ATRÁS */}
      {/* ========================================== */}

      <View style={styles.barraSuperior}>

        <Pressable
          onPress={() => router.back()}
          style={[
            styles.botonAtras,
            {
              backgroundColor: theme.backBg,
              borderColor: theme.backBorder
            }
          ]}
        >

          <Ionicons
            name="arrow-back"
            size={28}
            color={theme.text}
          />

          <Text
            style={[
              styles.textoBotonAtras,
              { color: theme.text }
            ]}
          >
            Volver
          </Text>

        </Pressable>

      </View>

      {/* ========================================== */}
      {/* TÍTULO */}
      {/* ========================================== */}

      <View style={styles.header}>

        <Text
          style={[
            styles.titulo,
            { color: theme.text }
          ]}
        >
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
            color={theme.accent}
          />

          <Text
            style={[
              styles.loadingText,
              { color: theme.text }
            ]}
          >
            Cargando aplicaciones...
          </Text>

        </View>

      ) : errorMsg ? (

        <View style={styles.center}>

          <Text style={styles.errorText}>
            {errorMsg}
          </Text>

        </View>

      ) : apps.length === 0 ? (

        <View style={styles.center}>

          <Ionicons
            name="apps-outline"
            size={64}
            color={theme.subtext}
          />

          <Text
            style={[
              styles.sinAppsText,
              { color: theme.text }
            ]}
          >
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
          {/* El botón elimina solamente las apps que
              hayan sido seleccionadas previamente. */}

          <Pressable
            style={[
              styles.botonEliminar,
              {
                backgroundColor: theme.btnDelete,
                opacity: selectedApps.size === 0 ? 0.5 : 1,
              }
            ]}
            onPress={eliminarAppsSeleccionadas}
            disabled={selectedApps.size === 0}
          >

            <Ionicons
              name="trash"
              size={28}
              color="#FFFFFF"
            />

            <Text style={styles.textoEliminar}>
              Eliminar seleccionadas ({selectedApps.size})
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
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titulo: {
    fontSize: 32,
    fontWeight: '800',
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
  // BOTÓN ELIMINAR
  // ==========================================

  botonEliminar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 18,
    borderRadius: 16,
    elevation: 4,
  },

  textoEliminar: {
    color: '#FFFFFF',
    fontSize: 22,
    marginLeft: 10,
    fontWeight: '800',
  },

});
