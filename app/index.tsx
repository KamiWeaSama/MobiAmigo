import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AppInfo {
  label: string;
  packageName: string;
  icon?: string;
}

export default function App() {
  const router = useRouter();

  // Lista de recordatorios
  const [listaRecordatorios, setListaRecordatorios] =
    useState<string[]>([]);

  // Lista de aplicaciones seleccionadas
  const [listaApps, setListaApps] =
    useState<AppInfo[]>([]);


  // ==========================================
  // CARGAR DATOS GUARDADOS
  // ==========================================

  useFocusEffect(
    useCallback(() => {

      // ==========================================
      // CARGAR RECORDATORIOS GUARDADOS
      // ==========================================

      const cargarRecordatoriosDeMemoria = async () => {
        try {

          const datosGuardados =
            await AsyncStorage.getItem(
              '@mis_recordatorios'
            );

          if (datosGuardados !== null) {

            setListaRecordatorios(
              JSON.parse(datosGuardados)
            );

          } else {

            setListaRecordatorios([]);

          }

        } catch (error) {

          console.log(
            "Error al cargar memoria:",
            error
          );

        }
      };


      // ==========================================
      // CARGAR APLICACIONES GUARDADAS
      // ==========================================
      // Además de cargar las aplicaciones
      // se comprueba si todavía están instaladas.
      // Si una aplicación fue desinstalada,
      // se elimina automáticamente de @mis_apps.

      const cargarAppsDeMemoria = async () => {

        try {

          // ==========================================
          // OBTENER APPS GUARDADAS EN MOBIAMIGO
          // ==========================================

          const datosGuardados =
            await AsyncStorage.getItem('@mis_apps');


          // Si no existen aplicaciones guardadas
          if (datosGuardados === null) {

            setListaApps([]);

            return;

          }
          // se comvierten los datos guardados en una lista

          const appsGuardadas: AppInfo[] =
            JSON.parse(datosGuardados);
          // ==========================================
          // OBTENER APPS INSTALADAS EN EL TELÉFONO
          // ==========================================

          const LauncherKit =
            require('react-native-launcher-kit');

          const InstalledApps =
            LauncherKit.InstalledApps;

          const appsInstaladas =
            await InstalledApps.getApps();
          // ==========================================
          // COMPROBAR QUÉ APPS SIGUEN INSTALADAS
          // ==========================================

          const appsActuales =
            appsGuardadas.filter((app) => {

              return appsInstaladas.some(
                (appInstalada: AppInfo) =>
                  appInstalada.packageName ===
                  app.packageName
              );

            });

          // ==========================================
          // ACTUALIZAR LA LISTA EN PANTALLA
          // ==========================================
          setListaApps(appsActuales);

          // ==========================================
          // GUARDAR LA LISTA ACTUALIZADA
          // ==========================================
          // De esta manera, las aplicaciones que se desintalaron 
          // se eliminan de la memoria

          await AsyncStorage.setItem(
            '@mis_apps',
            JSON.stringify(appsActuales)
          );


        } catch (error) {

          console.log(
            "Error al comprobar aplicaciones instaladas:",
            error
          );

        }

      };
      // ==========================================
      // EJECUTAR CARGA DE DATOS
      // ==========================================

      cargarRecordatoriosDeMemoria();
      cargarAppsDeMemoria();

    }, [])
  );

  // ==========================================
  // ELIMINAR RECORDATORIO
  // ==========================================

  const eliminarRecordatorio = async (
    indice: number
  ) => {

    try {

      const nuevaLista =
        listaRecordatorios.filter(
          (_, index) => index !== indice
        );

      setListaRecordatorios(nuevaLista);

      await AsyncStorage.setItem(
        '@mis_recordatorios',
        JSON.stringify(nuevaLista)
      );

    } catch (error) {

      console.log(
        "Error al eliminar recordatorio:",
        error
      );

    }

  };

  // ==========================================
  // ABRIR APLICACIÓN
  // ==========================================

  const abrirAplicacion = async (
    packageName: string
  ) => {

    try {
      //esto carga toda la libreria de react-native-launcher-kit
      const LauncherKit =
        require('react-native-launcher-kit');

      const RNLauncherKitHelper =
        LauncherKit.RNLauncherKitHelper;

      if (
        typeof RNLauncherKitHelper.launchApplication ===
        'function'
      ) {
        //esto carga la app mediandote su packageName 
        //por ejemplo "com.android.chrome" que es google chrome
        await RNLauncherKitHelper.launchApplication(
          packageName
        );

      } else {

        console.log(
          "No se encontró launchApplication en RNLauncherKitHelper"
        );

      }

    } catch (error) {

      console.log(
        "Error al abrir aplicación:",
        error
      );
    }
  };

  // ==========================================
  // GESTIONAR APLICACIONES
  // ==========================================
  const gestionarAplicaciones = () => {

    if (listaApps.length === 0) {

      // Si no hay aplicaciones agregadas en el index,
      // se va directamente a agregar apps

      router.push("/agregarapps");
    } else {
      // Si ya existen aplicaciones,
      // se muestran las opciones Añadir / Eliminar

      router.push("/opcionesapps");
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* ========================================== */}
      {/* ENCABEZADO */}
      {/* ========================================== */}

      <View style={styles.header}>

        <Text style={styles.titulo}>
          MobiAmigo
        </Text>

      </View>


      {/* ========================================== */}
      {/* ZONA DE RECORDATORIOS */}
      {/* ========================================== */}

      <View style={styles.zonaNotificaciones}>

        {listaRecordatorios.length > 0 && (

          <ScrollView
            contentContainerStyle={
              styles.scrollNotificaciones
            }
            showsVerticalScrollIndicator={true}
          >

            {listaRecordatorios.map(
              (item, index) => (

                <View
                  key={index}
                  style={styles.tarjetaRecordatorio}
                >

                  {/* ========================================== */}
                  {/* TEXTO DEL RECORDATORIO */}
                  {/* ========================================== */}

                  <View style={styles.bloqueTexto}>

                    <Ionicons
                      name="notifications-sharp"
                      size={20}
                      color="#0080ff"
                      style={styles.iconoTarjeta}
                    />


                    {/* 
                    */}

                    <Text
                      style={styles.textoTarjeta}
                    >
                      {item}
                    </Text>

                  </View>


                  {/* ========================================== */}
                  {/* BOTÓN ELIMINAR */}
                  {/* ========================================== */}

                  <TouchableOpacity
                    style={styles.botonEliminar}
                    onPress={() =>
                      eliminarRecordatorio(index)
                    }
                  >

                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color="#ff4444"
                    />

                  </TouchableOpacity>

                </View>

              )
            )}

          </ScrollView>

        )}

      </View>


      {/* ========================================== */}
      {/* ZONA DE APLICACIONES */}
      {/* ========================================== */}

      {listaApps.length > 0 && (

        <View style={styles.zonaApps}>

          <ScrollView
            contentContainerStyle={styles.scrollApps}
          >

            {listaApps.map((item) => (

              <Pressable
                key={item.packageName}
                style={styles.tarjetaApp}
                onPress={() =>
                  abrirAplicacion(
                    item.packageName
                  )
                }
              >

                {/* ========================================== */}
                {/* ICONO DE LA APLICACIÓN */}
                {/* ========================================== */}

                {item.icon ? (

                  <Image
                    source={{
                      uri: item.icon
                    }}
                    style={styles.iconoApp}
                  />

                ) : (

                  <View
                    style={
                      styles.iconoAppPlaceholder
                    }
                  >
                    <Ionicons
                      name="apps"
                      size={35}
                      color="#F8E9E9"
                    />

                  </View>

                )}
                {/* ========================================== */}
                {/* NOMBRE DE LA APLICACIÓN */}
                {/* ========================================== */}

                <Text
                  style={styles.nombreApp}
                  numberOfLines={1}
                >
                  {item.label || 'Aplicación'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ========================================== */}
      {/* BOTONES INFERIORES */}
      {/* ========================================== */}

      <View style={styles.contenedorBotones}>

        {/* ========================================== */}
        {/* BOTÓN AÑADIR APPS */}
        {/* ========================================== */}

        <Pressable
          style={styles.boton}
          onPress={gestionarAplicaciones}
        >
          <Ionicons
            name="apps"
            size={70}
            color="#F8E9E9"
          />
          <Text style={styles.textoBoton}>
            Añadir Apps
          </Text>

        </Pressable>
        {/* ========================================== */}
        {/* BOTÓN AÑADIR RECORDATORIO */}
        {/* ========================================== */}
        <Pressable
          style={styles.boton}
          onPress={() =>
            router.push(
              "/agregarecordatorio"
            )
          }
        >

          <Ionicons
            name="calendar-outline"
            size={70}
            color="#F8E9E9"
          />
          <Text style={styles.textoBoton}>
            Añadir
          </Text>

          <Text style={styles.textoBoton}>
            Recordatorio
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
    backgroundColor: '#000040',
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
  // ZONA DE RECORDATORIOS
  // ==========================================
  zonaNotificaciones: {
    // La zona ocupa todo el ancho
    width: '100%',
    marginTop: 5,
    // ==========================================
    // ALTURA MÁXIMA
    // ==========================================
    // esta zona no crecerá más de 180 píxeles.
    maxHeight: 180,
  },
  // ==========================================
  // SCROLL DE RECORDATORIOS
  // ==========================================
  //si supera los 180 pixeles se activa un scroll que permite mover los recordatorios
  scrollNotificaciones: {

    paddingHorizontal: 16,

    paddingBottom: 10,
  },
  // ==========================================
  // TARJETA DE RECORDATORIO
  // ==========================================

  tarjetaRecordatorio: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    backgroundColor: '#0c0c5a',

    padding: 16,

    borderRadius: 14,

    marginBottom: 8,

    borderLeftWidth: 4,

    borderLeftColor: '#0080ff',

  },
  // ==========================================
  // BLOQUE DEL TEXTO
  // ==========================================
  bloqueTexto: {

    flexDirection: 'row',

    alignItems: 'center',

    flex: 1,

    paddingRight: 10,

  },
  // ==========================================
  // ICONO DEL RECORDATORIO
  // ==========================================

  iconoTarjeta: {

    marginRight: 12,

  },
  // ==========================================
  // TEXTO DEL RECORDATORIO
  // ==========================================

  textoTarjeta: {

    color: '#F8E9E9',

    fontSize: 16,

    flex: 1,

  },
  // ==========================================
  // BOTÓN ELIMINAR
  // ==========================================
  botonEliminar: {

    padding: 4,

  },
  // ==========================================
  // ZONA DE APLICACIONES
  // ==========================================
  zonaApps: {

    width: '100%',
    flex: 1,
  },
  // ==========================================
  // SCROLL DE APLICACIONES
  // ==========================================

  scrollApps: {

    paddingHorizontal: 16,

    paddingTop: 10,

    paddingBottom: 10,

    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'flex-start',

  },
  // ==========================================
  // TARJETA DE APLICACIÓN
  // ==========================================

  tarjetaApp: {

    width: '30%',

    marginRight: '3%',

    marginBottom: 15,

    alignItems: 'center',

    backgroundColor: '#0c0c5a',

    padding: 10,

    borderRadius: 14,

  },
  // ==========================================
  // ICONO DE APLICACIÓN
  // ==========================================

  iconoApp: {

    width: 55,

    height: 55,

    borderRadius: 12,

  },
  // ==========================================
  // ICONO DE APLICACIÓN SIN IMAGEN
  // ==========================================

  iconoAppPlaceholder: {

    width: 55,

    height: 55,

    borderRadius: 12,

    backgroundColor: '#493936',

    alignItems: 'center',

    justifyContent: 'center',

  },
  // ==========================================
  // NOMBRE DE LA APLICACIÓN
  // ==========================================

  nombreApp: {

    color: '#F8E9E9',

    fontSize: 14,

    marginTop: 6,

    textAlign: 'center',

  },
  // ==========================================
  // CONTENEDOR DE BOTONES INFERIORES
  // ==========================================

  contenedorBotones: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    paddingHorizontal: 16,

    marginTop: 0,

    marginBottom: 20,

    width: '100%',

  },
  // ==========================================
  // BOTÓN INFERIOR
  // ==========================================

  boton: {

    width: '48%',

    height: 180,

    backgroundColor: '#493936',

    borderRadius: 12,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 10,

  },
  // ==========================================
  // TEXTO DE LOS BOTONES
  // ==========================================

  textoBoton: {

    color: '#F8E9E9',

    fontSize: 22,

    textAlign: 'center',

    marginTop: 8,

  },
});