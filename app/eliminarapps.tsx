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
            color={seleccionada ? theme.btnDelete : theme.subtext}
          />

        </Pressable>

      );

    };

  return (

    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* ========================================== */}
      {/* BARRA SUPERIOR Y BOTÓN ATRÁS */}
      {/* ========================================== */}

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
      {/* TÍTULO */}
      {/* ========================================== */}

      <View style={styles.header}>
        <Text style={[styles.titulo, { color: theme.text }]}>
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

          <Text style={[styles.loadingText, { color: theme.text }]}>
            Cargando aplicaciones...
          </Text>

        </View>

      ) : apps.length === 0 ? (

        <View style={styles.center}>

          <Ionicons
            name="apps-outline"
            size={64}
            color={theme.subtext}
          />

          <Text style={[styles.sinAppsText, { color: theme.text }]}>
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
            style={[styles.botonEliminar, { backgroundColor: theme.btnDelete }]}
            onPress={eliminarAppsSeleccionadas}
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
