import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as contacts from 'expo-contacts';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AppInfo {
  label: string;
  packageName: string;
  icon?: string;
}

export default function App() {
  const router = useRouter();

  const [listaRecordatorios, setListaRecordatorios] =
    useState<string[]>([]);

  const [listaApps, setListaApps] =
    useState<AppInfo[]>([]);

  useFocusEffect(
    useCallback(() => {
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

      const cargarAppsDeMemoria = async () => {
        try {
          const datosGuardados =
            await AsyncStorage.getItem('@mis_apps');

          if (datosGuardados === null) {
            setListaApps([]);
            return;
          }

          const appsGuardadas: AppInfo[] =
            JSON.parse(datosGuardados);

          const LauncherKit =
            require('react-native-launcher-kit');

          const InstalledApps =
            LauncherKit.InstalledApps;

          const appsInstaladas =
            await InstalledApps.getApps();

          const appsActuales =
            appsGuardadas.filter((app) => {
              return appsInstaladas.some(
                (appInstalada: AppInfo) =>
                  appInstalada.packageName ===
                  app.packageName
              );
            });

          setListaApps(appsActuales);

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

      cargarRecordatoriosDeMemoria();
      cargarAppsDeMemoria();
    }, [])
  );

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

  const abrirAplicacion = async (
    packageName: string
  ) => {
    try {
      const LauncherKit =
        require('react-native-launcher-kit');

      const RNLauncherKitHelper =
        LauncherKit.RNLauncherKitHelper;

      if (
        typeof RNLauncherKitHelper.launchApplication ===
        'function'
      ) {
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

  const gestionarAplicaciones = () => {
    if (listaApps.length === 0) {
      router.push("/agregarapps");
    } else {
      router.push("/opcionesapps");
    }
  };

  const getContacts = async () => {
    const {status} = await contacts.requestPermissionsAsync();

    if (status === 'garanted') {
      const { data } = await contacts.getContactsAsync({
        fields: [contacts.Fields.PhoneNumbers, contacts.Fields.Emails],
      });

      if (data.length > 0) {
        const primerContacto = data[0];
        console.log('Nombre:', primerContacto.name);
        console.log('Telefono: ', primerContacto.PhoneNumbers[0]?.number);
      }
    } else {
      console.log('No existe el permiso del usuario.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollGeneral} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.titulo}>
            MobiAmigo
          </Text>
        </View>

        <View style={styles.zonaNotificaciones}>
          {listaRecordatorios.length > 0 && (
            <View>
              {listaRecordatorios.map(
                (item, index) => (
                  <View
                    key={index}
                    style={styles.tarjetaRecordatorio}
                  >
                    <View style={styles.bloqueTexto}>
                      <Ionicons
                        name="notifications-sharp"
                        size={20}
                        color="#0080ff"
                        style={styles.iconoTarjeta}
                      />
                      <Text
                        style={styles.textoTarjeta}
                      >
                        {item}
                      </Text>
                    </View>

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
            </View>
          )}
        </View>

        {listaApps.length > 0 && (
          <View style={styles.zonaApps}>
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
                <Text
                  style={styles.nombreApp}
                  numberOfLines={1}
                >
                  {item.label || 'Aplicación'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.contenedorBotones}>
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

        <View style={styles.contenedorBotones}>
          <Pressable style={styles.boton} onPress={getContacts}>
            <Ionicons
              name="person-outline"
              size={70}
              color="#F8E9E9"
            />
            <Text style={styles.textoBoton}>
              Agregar Contactos
            </Text>
          </Pressable>

          <Pressable 
            style={styles.boton} 
            onPress={() => router.push('/calendario')}
          >
            <Ionicons
              name="today-outline"
              size={70}
              color="#F8E9E9"
            />
            <Text style={styles.textoBoton}>
              Calendario
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000040',
  },
  scrollGeneral: {
    paddingBottom: 30,
  },
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
  zonaNotificaciones: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 5,
  },
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
  bloqueTexto: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  iconoTarjeta: {
    marginRight: 12,
  },
  textoTarjeta: {
    color: '#F8E9E9',
    fontSize: 16,
    flex: 1,
  },
  botonEliminar: {
    padding: 4,
  },
  zonaApps: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  tarjetaApp: {
    width: '30%',
    marginRight: '3%',
    marginBottom: 15,
    alignItems: 'center',
    backgroundColor: '#0c0c5a',
    padding: 10,
    borderRadius: 14,
  },
  iconoApp: {
    width: 55,
    height: 55,
    borderRadius: 12,
  },
  iconoAppPlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 12,
    backgroundColor: '#493936',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombreApp: {
    color: '#F8E9E9',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  contenedorBotones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 0,
    marginBottom: 20,
    width: '100%',
  },
  boton: {
    width: '48%',
    height: 180,
    backgroundColor: '#493936',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  textoBoton: {
    color: '#F8E9E9',
    fontSize: 22,
    textAlign: 'center',
    marginTop: 8,
  },
  brownButton: {
    backgroundColor: '#4E3629', 
    borderRadius: 14,           
    paddingVertical: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,             
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,               
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  }
});