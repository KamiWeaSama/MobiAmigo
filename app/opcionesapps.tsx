// ==========================================
// SECCIÓN DE IMPORTS
// ==========================================

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { auth } from '../config/firebase';

import {
  obtenerAplicaciones,
  AplicacionInfo
} from '../services/aplicacionesService';

// ==========================================
// INFORMACIÓN DE LAS APLICACIONES
// ==========================================
// Firestore guarda el nombre y el packageName.
// El icono se obtiene localmente desde el dispositivo.

interface AppInfo extends AplicacionInfo {
  icon?: string;
}

export default function OpcionesAppsScreen() {

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
    text: isDark ? '#F8FAFC' : '#111827',
    subtext: isDark ? '#CBD5E1' : '#4B5563',
    backBg: isDark ? '#1E293B' : '#E5E7EB',
    backBorder: isDark ? '#334155' : '#D1D5DB',
    btnAdd: '#15803D',    // Verde claro y amigable para Añadir
    btnDelete: '#DC2626', // Rojo claro e intuitivo para Eliminar
    accent: '#1D4ED8',
  };

  // ==========================================
  // LISTA DE APLICACIONES YA SELECCIONADAS
  // ==========================================
  // Las aplicaciones se consultan desde Firestore.
  // Los iconos se completan con la información local
  // del dispositivo actual.

  const [appsSeleccionadas, setAppsSeleccionadas] = useState<AppInfo[]>([]);

  // ==========================================
  // ESTADO DE CARGA Y MENSAJE DE ERROR
  // ==========================================

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ==========================================
  // CARGAR APLICACIONES DESDE FIRESTORE
  // ==========================================
  // Se utiliza useFocusEffect para actualizar la lista
  // cada vez que el usuario vuelve a esta pantalla.

  useFocusEffect(
    useCallback(() => {

      let isMounted = true;

      const cargarApps = async () => {

        try {

          setLoading(true);
          setErrorMsg(null);

          const usuario = auth.currentUser;

          if (!usuario) {
            throw new Error('No hay una sesión iniciada.');
          }

          // ==========================================
          // OBTENER APLICACIONES DE FIRESTORE
          // ==========================================
          // Esta consulta obtiene las aplicaciones
          // seleccionadas por el usuario en su cuenta.

          const aplicacionesFirestore = await obtenerAplicaciones();

          // ==========================================
          // OBTENER ICONOS DEL DISPOSITIVO ACTUAL
          // ==========================================
          // Los iconos no se guardan en Firestore.
          // Cada dispositivo utiliza sus propios iconos.

          let aplicacionesInstaladas: AppInfo[] = [];

          try {

            const LauncherKit = require('react-native-launcher-kit');

            const InstalledApps =
              LauncherKit.InstalledApps ||
              LauncherKit.default?.InstalledApps ||
              LauncherKit;

            let resultado: any = null;

            if (typeof InstalledApps.getApps === 'function') {

              resultado = await InstalledApps.getApps();

            } else if (typeof InstalledApps.getSortedApps === 'function') {

              resultado = await InstalledApps.getSortedApps();

            }

            if (Array.isArray(resultado)) {
              aplicacionesInstaladas = resultado;
            }

          } catch (error) {

            // Si no se pueden obtener los iconos locales,
            // igualmente mostramos las aplicaciones de Firestore.
            console.log(
              'No se pudieron obtener los iconos locales:',
              error
            );

          }

          // ==========================================
          // COMBINAR APLICACIONES E ICONOS LOCALES
          // ==========================================
          // Si la aplicación está instalada, utilizamos
          // su icono local. Si no, mostramos un icono genérico.

          const aplicacionesCompletas: AppInfo[] =
            aplicacionesFirestore.map((app) => {

              const appInstalada = aplicacionesInstaladas.find(
                (instalada) => instalada.packageName === app.packageName
              );

              return {
                label: app.label || 'Aplicación',
                packageName: app.packageName,
                icon: appInstalada?.icon,
              };

            });

          // ==========================================
          // ACTUALIZAR LA LISTA DE LA PANTALLA
          // ==========================================

          if (isMounted) {
            setAppsSeleccionadas(aplicacionesCompletas);
          }

        } catch (error: any) {

          console.log(
            'Error al cargar aplicaciones seleccionadas:',
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

      cargarApps();

      return () => {
        isMounted = false;
      };

    }, [])
  );

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

        <Text style={[styles.subtitulo, { color: theme.subtext }]}>
          Aplicaciones seleccionadas ({appsSeleccionadas.length})
        </Text>

      </View>

      {/* ========================================== */}
      {/* LISTA DE APLICACIONES YA SELECCIONADAS */}
      {/* ========================================== */}

      {loading ? (

        <View style={styles.contenedorEstado}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.textoEstado, { color: theme.subtext }]}>
            Cargando aplicaciones...
          </Text>
        </View>

      ) : errorMsg ? (

        <View style={styles.contenedorEstado}>
          <Ionicons name="alert-circle-outline" size={54} color="#DC2626" />
          <Text style={styles.textoError}>
            {errorMsg}
          </Text>
        </View>

      ) : (

        <ScrollView
          contentContainerStyle={styles.scrollApps}
          showsVerticalScrollIndicator={false}
        >

          {appsSeleccionadas.length === 0 ? (

            <View style={styles.contenedorVacio}>

              <Ionicons
                name="apps-outline"
                size={64}
                color={theme.subtext}
              />

              <Text style={[styles.textoVacio, { color: theme.subtext }]}>
                Aún no tienes aplicaciones seleccionadas.
              </Text>

            </View>

          ) : (

            <View style={styles.filaCuatro}>

              {appsSeleccionadas.map((item) => (

                <View
                  key={item.packageName}
                  style={[
                    styles.tarjetaApp,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                >

                  {item.icon ? (

                    <Image
                      source={{ uri: item.icon }}
                      style={styles.iconoApp}
                    />

                  ) : (

                    <View
                      style={[
                        styles.iconoAppPlaceholder,
                        { backgroundColor: theme.accent },
                      ]}
                    >
                      <Ionicons name="apps" size={30} color="#FFFFFF" />
                    </View>

                  )}

                  <Text
                    style={[styles.nombreApp, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {item.label || 'Aplicación'}
                  </Text>

                </View>

              ))}

            </View>

          )}

        </ScrollView>

      )}

      {/* ========================================== */}
      {/* BARRA INFERIOR CON LOS 2 BOTONES DE ACCIÓN */}
      {/* ========================================== */}
      {/* Aquí se muestran las dos acciones que el */}
      {/* usuario puede realizar con sus aplicaciones. */}

      <View
        style={[
          styles.barraInferiorOpciones,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.cardBorder,
          },
        ]}
      >

        {/* ========================================== */}
        {/* OPCIÓN: AÑADIR APP */}
        {/* ========================================== */}

        <Pressable
          style={[styles.botonInferior, { backgroundColor: theme.btnAdd }]}
          onPress={() => router.push('/agregarapps')}
        >

          <Ionicons
            name="add-circle"
            size={38}
            color="#FFFFFF"
          />

          <Text style={styles.textoBotonInferior}>
            Añadir app
          </Text>

        </Pressable>

        {/* ========================================== */}
        {/* OPCIÓN: ELIMINAR APP */}
        {/* ========================================== */}

        <Pressable
          style={[styles.botonInferior, { backgroundColor: theme.btnDelete }]}
          onPress={() => router.push('/eliminarapps')}
        >

          <Ionicons
            name="trash"
            size={38}
            color="#FFFFFF"
          />

          <Text style={styles.textoBotonInferior}>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titulo: {
    fontSize: 32,
    fontWeight: '800',
  },

  subtitulo: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 4,
  },

  // ==========================================
  // LISTA DE APLICACIONES SELECCIONADAS
  // ==========================================

  scrollApps: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    flexGrow: 1,
  },

  contenedorEstado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  textoEstado: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },

  textoError: {
    color: '#DC2626',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },

  contenedorVacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  textoVacio: {
    fontSize: 19,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 14,
  },

  filaCuatro: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },

  tarjetaApp: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  iconoApp: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },

  iconoAppPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nombreApp: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },

  // ==========================================
  // BARRA INFERIOR CON BOTONES AÑADIR Y ELIMINAR
  // ==========================================

  barraInferiorOpciones: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 2,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  botonInferior: {
    width: '48%',
    minHeight: 88,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  textoBotonInferior: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
  },

});
