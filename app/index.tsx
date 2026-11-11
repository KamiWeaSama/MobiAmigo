// ==========================================

// SECCIÓN DE IMPORTS

// ==========================================

import { Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import * as contacts from 'expo-contacts';

import { useFocusEffect, useRouter } from 'expo-router';

import { useCallback, useState } from 'react';

import {

  Alert,

  Image,

  Linking,

  Modal,

  Pressable,

  ScrollView,

  StyleSheet,

  Text,

  TouchableOpacity,

  useColorScheme,

  View

} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

// ==========================================

// FIREBASE Y SERVICIOS

// ==========================================

import { auth } from '../config/firebase';

import {

  eliminarRecordatorio as eliminarRecordatorioFirestore,

  migrarRecordatoriosAntiguos,

  obtenerRecordatorios,

  RecordatorioInfo

} from '../services/recordatoriosService';

import {

  AplicacionInfo,

  migrarAplicacionesAntiguas,

  obtenerAplicaciones

} from '../services/aplicacionesService';

import {

  ContactoInfo,

  eliminarContacto as eliminarContactoFirestore,

  guardarContacto,

  migrarContactosAntiguos,

  obtenerContactos

} from '../services/contactosService';

// ==========================================

// INFORMACIÓN DE LAS APLICACIONES,

// CONTACTOS Y EVENTOS

// ==========================================

interface AppInfo {

  label: string;

  packageName: string;

  icon?: string;

}

type ContactInfo = ContactoInfo;

interface EventoCalendario {

  id: string;

  nombre: string;

  hora: string;

  repiteSiempre: boolean;

  repiteSemanal: boolean;

  repiteMensual: boolean;

  dia: number;

  mes: number;

  anio: number;

}

const MESES_CORTOS = [

  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',

  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'

];

// ==========================================
// PASOS DEL TUTORIAL DE BIENVENIDA Y USO
// ==========================================

const PASOS_TUTORIAL = [

  {

    titulo: '¡Bienvenido a MobiAmigo!',

    descripcion:

      'Esta aplicación fue creada para que uses tu teléfono de forma fácil, cómoda y con botones grandes.\n\nEn la barra de abajo siempre tendrás los 4 botones principales.',

    icono: 'heart-circle' as const,

    color: '#1D4ED8',

  },

  {

    titulo: '1. Añadir Apps (Botón Azul)',

    descripcion:

      'Toca el botón azul "Añadir Apps" en la barra inferior para elegir tus aplicaciones favoritas (como WhatsApp, Cámara o Banco) y abrirlas con un solo toque.',

    icono: 'apps' as const,

    color: '#1D4ED8',

  },

  {

    titulo: '2. Recordatorios (Botón Naranja)',

    descripcion:

      'Toca el botón naranja "Recordatorio" para escribir avisos rápidos, como tomar tus medicamentos. Aparecerán arriba del todo en tu pantalla.',

    icono: 'notifications' as const,

    color: '#D97706',

  },

  {

    titulo: '3. Contactos (Botón Verde)',

    descripcion:

      'Toca el botón verde "Contactos" para guardar a tus familiares o amigos. Luego solo toca su tarjeta en el inicio para llamarlos de inmediato.',

    icono: 'call' as const,

    color: '#15803D',

  },

  {

    titulo: '4. Calendario (Botón Morado)',

    descripcion:

      'Toca el botón morado "Calendario" para anotar tus controles médicos o reuniones con fecha y hora. ¡Los más cercanos también te avisarán en el inicio!',

    icono: 'calendar' as const,

    color: '#6D28D9',

  },

];



// ==========================================

// CLAVES DE ALMACENAMIENTO

// ==========================================

// Cada usuario tendrá su propia copia local

// de sus recordatorios.

const obtenerClaveRecordatorios = (uid: string) => {

  return `@mis_recordatorios\_${uid}`;

};

// Cada usuario tendrá su propia copia local

// de sus aplicaciones.

const obtenerClaveApps = (uid: string) => {

  return `@mis_apps\_${uid}`;

};

// Cada usuario tendrá su propia copia local

// de sus contactos.

const obtenerClaveContactos = (uid: string) => {

  return `@mis_contactos\_${uid}`;

};

// Esta marca evita importar los recordatorios antiguos

// más de una vez en el mismo dispositivo.

const CLAVE_MIGRACION_RECORDATORIOS =

  '@recordatorios_migracion_v1';

// Esta marca evita importar las aplicaciones antiguas

// más de una vez en el mismo dispositivo.

const CLAVE_MIGRACION_APPS =

  '@apps_migracion_v1';

// Esta marca evita importar los contactos antiguos

// más de una vez en el mismo dispositivo.

const CLAVE_MIGRACION_CONTACTOS =

  '@contactos_migracion_v1';

// ==========================================

// COMPONENTE PRINCIPAL

// ==========================================

export default function App() {

  const router = useRouter();

  const scheme = useColorScheme();

  const isDark = scheme === 'dark';

  // ==========================================

  // PALETA DE COLORES (MODO CLARO / OSCURO)

  // ==========================================

  const theme = {

    bg: isDark ? '#0F172A' : '#FFFDF9',

    card: isDark ? '#1E293B' : '#FFFFFF',

    cardBorder: isDark ? '#334155' : '#D6D3CD',

    text: isDark ? '#F8FAFC' : '#111827',

    subtext: isDark ? '#CBD5E1' : '#4B5563',

    sectionBg: isDark ? '#1E293B' : '#F3F0EA',

    btnApps: '#1D4ED8',

    btnRecordatorio: '#D97706',

    btnContactos: '#15803D',

    btnCalendario: '#6D28D9',

    danger: '#DC2626',

  };

  // ==========================================

  // ESTADOS DE LA PANTALLA

  // ==========================================

  // Cada recordatorio tiene su propio ID de Firestore.

  const [listaRecordatorios, setListaRecordatorios] =

    useState<RecordatorioInfo[]>([]);

  // Lista de eventos cercanos del calendario.

  const [eventosCercanos, setEventosCercanos] =

    useState<EventoCalendario[]>([]);

  // Aplicaciones instaladas y seleccionadas en MobiAmigo.

  const [listaApps, setListaApps] =

    useState<AppInfo[]>([]);

  // Cantidad total de aplicaciones guardadas en Firestore.

  // Incluye las que no están instaladas en este dispositivo.

  const [cantidadAppsGuardadas, setCantidadAppsGuardadas] =

    useState<number>(0);

  // Lista de contactos guardados.

  const [listaContactos, setListaContactos] =

    useState<ContactInfo[]>([]);

  // Estados para el menú, el tutorial y la información del equipo.
  const [menuAbierto, setMenuAbierto] = useState<boolean>(false);
  const [modalInfoVisible, setModalInfoVisible] = useState<boolean>(false);
  const [tutorialVisible, setTutorialVisible] = useState<boolean>(false);
  const [pasoTutorial, setPasoTutorial] = useState<number>(0);

  // ==========================================

  // CARGAR DATOS GUARDADOS

  // ==========================================

  useFocusEffect(

    useCallback(() => {

      // ==========================================

      // CARGAR RECORDATORIOS DESDE FIRESTORE

      // ==========================================

      const cargarRecordatoriosDeMemoria = async () => {

        try {

          const usuario = auth.currentUser;

          if (!usuario) {

            setListaRecordatorios([]);

            return;

          }

          const uid = usuario.uid;

          const claveLocal = obtenerClaveRecordatorios(uid);

          // ==========================================

          // MIGRAR RECORDATORIOS ANTIGUOS

          // ==========================================

          const migracionRealizada =

            await AsyncStorage.getItem(

              CLAVE_MIGRACION_RECORDATORIOS

            );

          if (migracionRealizada === null) {

            const datosAntiguos =

              await AsyncStorage.getItem('@mis_recordatorios');

            let recordatoriosAntiguos: string[] = [];

            if (datosAntiguos !== null) {

              const datosParseados = JSON.parse(datosAntiguos);

              if (Array.isArray(datosParseados)) {

                recordatoriosAntiguos = datosParseados

                  .filter((item) => typeof item === 'string');

              }

            }

            await migrarRecordatoriosAntiguos(

              recordatoriosAntiguos

            );

            await AsyncStorage.setItem(

              CLAVE_MIGRACION_RECORDATORIOS,

              'completada'

            );

          }

          // ==========================================

          // RECUPERAR RECORDATORIOS DESDE FIRESTORE

          // ==========================================

          const recordatoriosNube =

            await obtenerRecordatorios();

          setListaRecordatorios(recordatoriosNube);

          // ==========================================

          // ACTUALIZAR COPIA LOCAL DEL USUARIO

          // ==========================================

          await AsyncStorage.setItem(

            claveLocal,

            JSON.stringify(recordatoriosNube)

          );

        } catch (error) {

          console.log(

            'Error al sincronizar recordatorios:',

            error

          );

          Alert.alert(

            'Error de sincronización',

            'No se pudieron recuperar tus recordatorios. Comprueba tu conexión a internet.'

          );

        }

      };

      // ==========================================

      // CARGAR EVENTOS CERCANOS DEL CALENDARIO

      // ==========================================

      const cargarEventosDeMemoria = async () => {

        try {

          const datosEventos =

            await AsyncStorage.getItem('@eventos_calendario');

          if (datosEventos !== null) {

            const listaEventos: EventoCalendario[] =

              JSON.parse(datosEventos);

            const ordenados = [...listaEventos].sort((a, b) => {

              const fechaA =

                new Date(a.anio, a.mes, a.dia).getTime();

              const fechaB =

                new Date(b.anio, b.mes, b.dia).getTime();

              if (fechaA !== fechaB) {

                return fechaA - fechaB;

              }

              return (a.hora || '').localeCompare(b.hora || '');

            });

            setEventosCercanos(ordenados.slice(0, 3));

          } else {

            setEventosCercanos([]);

          }

        } catch (error) {

          console.log(

            'Error al cargar eventos del calendario:',

            error

          );

        }

      };

      // ==========================================

      // CARGAR APLICACIONES DESDE FIRESTORE

      // ==========================================

      const cargarAppsDeMemoria = async () => {

        try {

          // ==========================================

          // OBTENER USUARIO AUTENTICADO

          // ==========================================

          const usuario = auth.currentUser;

          if (!usuario) {

            setListaApps([]);

            setCantidadAppsGuardadas(0);

            return;

          }

          const uid = usuario.uid;

          const claveLocal = obtenerClaveApps(uid);

          // ==========================================

          // MIGRAR APLICACIONES ANTIGUAS

          // ==========================================

          const migracionRealizada =

            await AsyncStorage.getItem(CLAVE_MIGRACION_APPS);

          if (migracionRealizada === null) {

            const datosAntiguos =

              await AsyncStorage.getItem('@mis_apps');

            let aplicacionesAntiguas: AplicacionInfo[] = [];

            if (datosAntiguos !== null) {

              const datosParseados = JSON.parse(datosAntiguos);

              if (Array.isArray(datosParseados)) {

                aplicacionesAntiguas = datosParseados

                  .filter((item: any) =>

                    item &&

                    typeof item.label === 'string' &&

                    typeof item.packageName === 'string'

                  )

                  .map((item: any) => ({

                    label: item.label,

                    packageName: item.packageName,

                  }));

              }

            }

            await migrarAplicacionesAntiguas(

              aplicacionesAntiguas

            );

            await AsyncStorage.setItem(

              CLAVE_MIGRACION_APPS,

              'completada'

            );

          }

          // ==========================================

          // RECUPERAR APLICACIONES DESDE FIRESTORE

          // ==========================================

          const aplicacionesNube =

            await obtenerAplicaciones();

          // Guardamos la cantidad total de aplicaciones

          // que tiene el usuario en Firestore.

          setCantidadAppsGuardadas(aplicacionesNube.length);

          // ==========================================

          // ACTUALIZAR COPIA LOCAL DEL USUARIO

          // ==========================================

          // Guardamos TODAS las aplicaciones de Firestore.

          // No filtramos las que no estén instaladas.

          // Esto permite recuperarlas en otro dispositivo.

          await AsyncStorage.setItem(

            claveLocal,

            JSON.stringify(aplicacionesNube)

          );

          // ==========================================

          // OBTENER APLICACIONES INSTALADAS

          // EN EL TELÉFONO

          // ==========================================

          const LauncherKit =

            require('react-native-launcher-kit');

          const InstalledApps =

            LauncherKit.InstalledApps ||

            LauncherKit.default?.InstalledApps ||

            LauncherKit;

          let resultado: any = null;

          if (typeof InstalledApps.getApps === 'function') {

            resultado = await InstalledApps.getApps();

          } else if (

            typeof InstalledApps.getSortedApps === 'function'

          ) {

            resultado = await InstalledApps.getSortedApps();

          }

          const aplicacionesInstaladas: AppInfo[] =

            Array.isArray(resultado) ? resultado : [];

          // ==========================================

          // COMBINAR FIRESTORE CON LAS APPS INSTALADAS

          // ==========================================

          const aplicacionesActuales: AppInfo[] = [];

          for (const appNube of aplicacionesNube) {

            // Buscamos la aplicación en el dispositivo.

            const appInstalada = aplicacionesInstaladas.find(

              (app) =>

                app.packageName === appNube.packageName

            );

            // Si no está instalada, no se muestra en el index.

            // Pero sigue guardada en Firestore y AsyncStorage.

            if (appInstalada) {

              aplicacionesActuales.push({

                label: appInstalada.label || appNube.label,

                packageName: appNube.packageName,

                icon: appInstalada.icon

              });

            }

          }

          // ==========================================

          // ACTUALIZAR LA LISTA EN PANTALLA

          // ==========================================

          setListaApps(aplicacionesActuales);

        } catch (error) {

          console.log(

            'Error al sincronizar aplicaciones:',

            error

          );

          // ==========================================

          // RECUPERAR COPIA LOCAL SI FALLA FIRESTORE

          // ==========================================

          try {

            const usuario = auth.currentUser;

            if (usuario) {

              const claveLocal = obtenerClaveApps(usuario.uid);

              const datosLocales =

                await AsyncStorage.getItem(claveLocal);

              if (datosLocales !== null) {

                const aplicacionesLocales: AplicacionInfo[] =

                  JSON.parse(datosLocales);

                setCantidadAppsGuardadas(

                  aplicacionesLocales.length

                );

                // Intentamos recuperar también los iconos

                // desde las aplicaciones instaladas localmente.

                const LauncherKit =

                  require('react-native-launcher-kit');

                const InstalledApps =

                  LauncherKit.InstalledApps ||

                  LauncherKit.default?.InstalledApps ||

                  LauncherKit;

                let resultado: any = null;

                if (typeof InstalledApps.getApps === 'function') {

                  resultado = await InstalledApps.getApps();

                } else if (

                  typeof InstalledApps.getSortedApps === 'function'

                ) {

                  resultado = await InstalledApps.getSortedApps();

                }

                const aplicacionesInstaladas: AppInfo[] =

                  Array.isArray(resultado) ? resultado : [];

                const aplicacionesActuales: AppInfo[] = [];

                for (const appLocal of aplicacionesLocales) {

                  const appInstalada = aplicacionesInstaladas.find(

                    (app) =>

                      app.packageName === appLocal.packageName

                  );

                  if (appInstalada) {

                    aplicacionesActuales.push({

                      label: appLocal.label || appInstalada.label,

                      packageName: appLocal.packageName,

                      icon: appInstalada.icon

                    });

                  }

                }

                setListaApps(aplicacionesActuales);

              }

            }

          } catch (errorLocal) {

            console.log(

              'Error al recuperar aplicaciones locales:',

              errorLocal

            );

          }

          Alert.alert(

            'Error de sincronización',

            'No se pudieron recuperar tus aplicaciones. Comprueba tu conexión a internet.'

          );

        }

      };

      // ==========================================

      // CARGAR CONTACTOS DESDE FIRESTORE

      // ==========================================

      const cargarContactosDeMemoria = async () => {

        try {

          const usuario = auth.currentUser;

          if (!usuario) {

            setListaContactos([]);

            return;

          }

          const uid = usuario.uid;

          const claveLocal = obtenerClaveContactos(uid);

          // ==========================================

          // MIGRAR CONTACTOS ANTIGUOS

          // ==========================================

          const migracionRealizada =

            await AsyncStorage.getItem(

              CLAVE_MIGRACION_CONTACTOS

            );

          if (migracionRealizada === null) {

            const datosAntiguos =

              await AsyncStorage.getItem('@mis_contactos');

            let contactosAntiguos: ContactInfo[] = [];

            if (datosAntiguos !== null) {

              const datosParseados = JSON.parse(datosAntiguos);

              if (Array.isArray(datosParseados)) {

                contactosAntiguos = datosParseados

                  .filter((item: any) =>

                    item &&

                    typeof item.name === 'string' &&

                    typeof item.phoneNumber === 'string'

                  )

                  .map((item: any) => ({

                    id: String(item.id || Date.now()),

                    name: item.name,

                    phoneNumber: item.phoneNumber,

                  }));

              }

            }

            await migrarContactosAntiguos(contactosAntiguos);

            await AsyncStorage.setItem(

              CLAVE_MIGRACION_CONTACTOS,

              'completada'

            );

          }

          // ==========================================

          // RECUPERAR CONTACTOS DESDE FIRESTORE

          // ==========================================

          const contactosNube = await obtenerContactos();

          setListaContactos(contactosNube);

          // ==========================================

          // ACTUALIZAR COPIA LOCAL DEL USUARIO

          // ==========================================

          await AsyncStorage.setItem(

            claveLocal,

            JSON.stringify(contactosNube)

          );

        } catch (error) {

          console.log(

            'Error al sincronizar contactos:',

            error

          );

          // ==========================================

          // RECUPERAR COPIA LOCAL SI FALLA FIRESTORE

          // ==========================================

          try {

            const usuario = auth.currentUser;

            if (usuario) {

              const claveLocal = obtenerClaveContactos(usuario.uid);

              const datosLocales =

                await AsyncStorage.getItem(claveLocal);

              if (datosLocales !== null) {

                setListaContactos(JSON.parse(datosLocales));

              }

            }

          } catch (errorLocal) {

            console.log(

              'Error al recuperar contactos locales:',

              errorLocal

            );

          }

          Alert.alert(

            'Error de sincronización',

            'No se pudieron recuperar tus contactos. Comprueba tu conexión a internet.'

          );

        }

      };

      // ==========================================

      // EJECUTAR CARGA DE DATOS

      // ==========================================

      // Mostrar el tutorial solamente la primera vez que se abre MobiAmigo.
      const comprobarTutorialPrimeraVez = async () => {
        try {
          const yaVisto = await AsyncStorage.getItem('@tutorial_visto');
          if (yaVisto === null) {
            setPasoTutorial(0);
            setTutorialVisible(true);
          }
        } catch (error) {
          console.log('Error al comprobar tutorial:', error);
        }
      };

      cargarContactosDeMemoria();

      cargarRecordatoriosDeMemoria();

      cargarEventosDeMemoria();

      cargarAppsDeMemoria();

      comprobarTutorialPrimeraVez();

    }, [])

  );

  // ==========================================
  // FINALIZAR O SALTAR EL TUTORIAL
  // ==========================================

  const cerrarTutorial = async () => {
    try {
      setTutorialVisible(false);
      await AsyncStorage.setItem('@tutorial_visto', 'true');
    } catch (error) {
      console.log('Error al guardar estado del tutorial:', error);
    }
  };

  // ==========================================

  // ELIMINAR RECORDATORIO

  // ==========================================

  const eliminarRecordatorio = async (id: string) => {

    try {

      const usuario = auth.currentUser;

      if (!usuario) {

        Alert.alert(

          'Error',

          'No hay una sesión iniciada.'

        );

        return;

      }

      await eliminarRecordatorioFirestore(id);

      const nuevaLista = listaRecordatorios.filter(

        (recordatorio) => recordatorio.id !== id

      );

      setListaRecordatorios(nuevaLista);

      await AsyncStorage.setItem(

        obtenerClaveRecordatorios(usuario.uid),

        JSON.stringify(nuevaLista)

      );

    } catch (error) {

      console.log(

        'Error al eliminar recordatorio:',

        error

      );

      Alert.alert(

        'Error',

        'No se pudo eliminar el recordatorio. Comprueba tu conexión e inténtalo nuevamente.'

      );

    }

  };

  // ==========================================

  // ABRIR APLICACIÓN

  // ==========================================

  const abrirAplicacion = async (packageName: string) => {

    try {

      const LauncherKit =

        require('react-native-launcher-kit');

      const RNLauncherKitHelper =

        LauncherKit.RNLauncherKitHelper;

      if (

        typeof RNLauncherKitHelper.launchApplication === 'function'

      ) {

        await RNLauncherKitHelper.launchApplication(packageName);

      } else {

        console.log(

          'No se encontró launchApplication en RNLauncherKitHelper'

        );

      }

    } catch (error) {

      console.log(

        'Error al abrir aplicación:',

        error

      );

    }

  };

  // ==========================================

  // GESTIONAR APLICACIONES

  // ==========================================

  const gestionarAplicaciones = () => {

    if (cantidadAppsGuardadas === 0) {

      // Si no hay aplicaciones guardadas en Firestore,

      // se pasa directamente a añadir aplicaciones.

      router.push('/agregarapps');

    } else {

      // Si existen aplicaciones guardadas en la nube,

      // se muestran las opciones Añadir / Eliminar.

      router.push('/opcionesapps');

    }

  };

  // ==========================================

  // OBTENER Y GUARDAR CONTACTOS DEL DISPOSITIVO

  // ==========================================

  const getContacts = async () => {

    try {

      const usuario = auth.currentUser;

      if (!usuario) {

        Alert.alert(

          'Error',

          'No hay una sesión iniciada.'

        );

        return;

      }

      const { status } =

        await contacts.requestPermissionsAsync();

      if (status === 'granted') {

        const resultadoPicker =

          (await contacts.presentContactPickerAsync()) as any;

        if (resultadoPicker) {

          const datosContacto =

            resultadoPicker.contact || resultadoPicker;

          if (datosContacto) {

            const numeroBruto =

              datosContacto.phoneNumbers?.[0]?.number;

            const nombreContacto =

              datosContacto.name ||

              [

                datosContacto.firstName,

                datosContacto.lastName

              ].filter(Boolean).join(' ') ||

              'Contacto';

            if (!numeroBruto) {

              Alert.alert(

                'Sin número',

                'El contacto seleccionado no tiene un número de teléfono.'

              );

              return;

            }

            const nuevoContacto: Omit<ContactInfo, 'id'> = {

              name: nombreContacto,

              phoneNumber: numeroBruto,

            };

            // ==========================================

            // COMPROBAR SI EL CONTACTO YA EXISTE

            // ==========================================

            const yaExiste = listaContactos.some(

              (c) =>

                c.phoneNumber === nuevoContacto.phoneNumber &&

                c.name === nuevoContacto.name

            );

            if (yaExiste) {

              Alert.alert(

                'Contacto existente',

                'Este contacto ya está guardado en MobiAmigo.'

              );

              return;

            }

            // ==========================================

            // GUARDAR CONTACTO EN FIRESTORE

            // ==========================================

            const contactoGuardado =

              await guardarContacto(nuevoContacto);

            const nuevaLista = [

              ...listaContactos,

              contactoGuardado

            ];

            setListaContactos(nuevaLista);

            // ==========================================

            // ACTUALIZAR COPIA LOCAL DEL USUARIO

            // ==========================================

            await AsyncStorage.setItem(

              obtenerClaveContactos(usuario.uid),

              JSON.stringify(nuevaLista)

            );

            Alert.alert(

              'Contacto agregado',

              `${contactoGuardado.name} se agregó correctamente.`

            );

          }

        }

      } else {

        Alert.alert(

          'Permiso necesario',

          'Debes permitir el acceso a tus contactos para seleccionar uno.'

        );

      }

    } catch (error) {

      console.log(

        'Error al guardar contacto:',

        error

      );

      Alert.alert(

        'Error',

        'No se pudo guardar el contacto. Comprueba tu conexión e inténtalo nuevamente.'

      );

    }

  };

  // ==========================================

  // LLAMAR Y ELIMINAR CONTACTO

  // ==========================================

  const llamarContacto = (contacto: ContactInfo) => {

    if (contacto.phoneNumber) {

      const numeroLimpio =

        contacto.phoneNumber.replace(/[^\d+]/g, '');

      Linking.openURL(`tel:${numeroLimpio}`);

    }

  };

  const eliminarContacto = async (id: string) => {

    try {

      const usuario = auth.currentUser;

      if (!usuario) {

        Alert.alert(

          'Error',

          'No hay una sesión iniciada.'

        );

        return;

      }

      // ==========================================

      // ELIMINAR CONTACTO DE FIRESTORE

      // ==========================================

      await eliminarContactoFirestore(id);

      // ==========================================

      // ACTUALIZAR LISTA EN PANTALLA

      // ==========================================

      const nuevaLista = listaContactos.filter(

        (c) => c.id !== id

      );

      setListaContactos(nuevaLista);

      // ==========================================

      // ACTUALIZAR COPIA LOCAL DEL USUARIO

      // ==========================================

      await AsyncStorage.setItem(

        obtenerClaveContactos(usuario.uid),

        JSON.stringify(nuevaLista)

      );

    } catch (error) {

      console.log(

        'Error al eliminar contacto:',

        error

      );

      Alert.alert(

        'Error',

        'No se pudo eliminar el contacto. Comprueba tu conexión e inténtalo nuevamente.'

      );

    }

  };

  // ==========================================

  // COMPROBAR SI EXISTEN NOTIFICACIONES

  // ==========================================

  const hayNotificaciones =

    listaRecordatorios.length > 0 ||

    eventosCercanos.length > 0;

  // ==========================================

  // INTERFAZ PRINCIPAL

  // ==========================================

return (

    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

      <ScrollView contentContainerStyle={styles.scrollGeneral} showsVerticalScrollIndicator={false}>

        {/* ========================================== */}

        {/* ENCABEZADO SUPERIOR IZQUIERDO (MENÚ + LOGO + NOMBRE) */}

        {/* ========================================== */}

        <View

          style={[

            styles.header,

            { borderBottomColor: theme.cardBorder },

          ]}

        >

          <View style={styles.filaIzquierdaHeader}>

            {/* Botón tipo hamburguesa (☰) como en Facebook */}

            <Pressable

              style={[

                styles.botonMenu,

                { backgroundColor: theme.sectionBg, borderColor: theme.cardBorder },

              ]}

              onPress={() => setMenuAbierto(true)}

            >

              <Ionicons name="menu" size={30} color={theme.text} />

            </Pressable>

            <Image

              source={require('../assets/images/icon.png')}

              style={styles.logoHeader}

            />

            <Text style={[styles.titulo, { color: theme.text }]}>

              MobiAmigo

            </Text>

          </View>

        </View>

        {/* ========================================== */}

        {/* 1. ZONA DE NOTIFICACIONES MÁS CERCANAS */}

        {/* ========================================== */}

        {hayNotificaciones && (

          <View style={styles.zonaNotificaciones}>

            <Text style={[styles.tituloSeccion, { color: theme.text }]}>

              🔔 Avisos y Recordatorios

            </Text>

            {/* Recordatorios rápidos */}

            {listaRecordatorios.map((item) => (

              <View

                key={item.id}

                style={[

                  styles.tarjetaRecordatorio,

                  {

                    backgroundColor: theme.card,

                    borderColor: theme.cardBorder,

                    borderLeftColor: theme.btnRecordatorio,

                  },

                ]}

              >

                <View style={styles.bloqueTexto}>

                  <Ionicons

                    name="notifications"

                    size={26}

                    color={theme.btnRecordatorio}

                    style={styles.iconoTarjeta}

                  />

                  <Text style={[styles.textoTarjeta, { color: theme.text }]}>

                    {item.texto}

                  </Text>

                </View>

                <TouchableOpacity

                  style={styles.botonEliminar}

                  onPress={() => eliminarRecordatorio(item.id)}

                  accessibilityLabel="Borrar recordatorio"

                >

                  <Ionicons

                    name="trash"

                    size={24}

                    color={theme.danger}

                  />

                </TouchableOpacity>

              </View>

            ))}

            {/* Eventos más cercanos del calendario */}

            {eventosCercanos.map((ev) => (

              <Pressable

                key={`ev-${ev.id}`}

                onPress={() => router.push('/calendario')}

                style={[

                  styles.tarjetaRecordatorio,

                  {

                    backgroundColor: theme.card,

                    borderColor: theme.cardBorder,

                    borderLeftColor: theme.btnCalendario,

                  },

                ]}

              >

                <View style={styles.bloqueTexto}>

                  <Ionicons

                    name="calendar"

                    size={26}

                    color={theme.btnCalendario}

                    style={styles.iconoTarjeta}

                  />

                  <View style={{ flex: 1 }}>

                    <Text style={[styles.textoTarjeta, { color: theme.text }]}>

                      {ev.nombre}

                    </Text>

                    <Text style={[styles.fechaEventoTexto, { color: theme.subtext }]}>

                      📅 {ev.dia} de {MESES_CORTOS[ev.mes]} • 🕒 {ev.hora} hrs

                    </Text>

                  </View>

                </View>

                <Ionicons

                  name="chevron-forward"

                  size={22}

                  color={theme.subtext}

                />

              </Pressable>

            ))}

          </View>

        )}

        {/* ========================================== */}

        {/* 2. FILA DE 4 CONTACTOS */}

        {/* ========================================== */}

        {listaContactos.length > 0 && (

          <View style={styles.seccionContenedor}>

            <Text style={[styles.tituloSeccion, { color: theme.text }]}>

              📞 Mis Contactos (Toca para llamar)

            </Text>

            <View style={styles.filaCuatro}>

              {listaContactos.map((contacto) => (

                <Pressable

                  key={contacto.id}

                  style={[

                    styles.tarjetaCuatro,

                    {

                      backgroundColor: theme.card,

                      borderColor: theme.cardBorder,

                    },

                  ]}

                  onPress={() => llamarContacto(contacto)}

                >

                  <TouchableOpacity
                    style={styles.botonQuitarMini}
                    onPress={() => eliminarContacto(contacto.id)}
                    accessibilityLabel="Eliminar contacto"
                  >
                    <Ionicons name="close-circle" size={20} color={theme.danger} />
                  </TouchableOpacity>

                  <View style={[styles.avatarContacto, { backgroundColor: theme.btnContactos }]}>

                    <Ionicons name="call" size={26} color="#FFFFFF" />

                  </View>

                  <Text

                    style={[styles.nombreItemCuatro, { color: theme.text }]}

                    numberOfLines={2}

                  >

                    {contacto.name}

                  </Text>

                </Pressable>

              ))}

            </View>

          </View>

        )}

        {/* ========================================== */}

        {/* 3. FILA DE 4 APLICACIONES */}

        {/* ========================================== */}

        {listaApps.length > 0 && (

          <View style={styles.seccionContenedor}>

            <Text style={[styles.tituloSeccion, { color: theme.text }]}>

              📱 Mis Aplicaciones

            </Text>

            <View style={styles.filaCuatro}>

              {listaApps.map((item) => (

                <Pressable

                  key={item.packageName}

                  style={[

                    styles.tarjetaCuatro,

                    {

                      backgroundColor: theme.card,

                      borderColor: theme.cardBorder,

                    },

                  ]}

                  onPress={() => abrirAplicacion(item.packageName)}

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

                      style={[

                        styles.iconoAppPlaceholder,

                        { backgroundColor: theme.btnApps }

                      ]}

                    >

                      <Ionicons

                        name="apps"

                        size={30}

                        color="#FFFFFF"

                      />

                    </View>

                  )}

                  {/* ========================================== */}

                  {/* NOMBRE DE LA APLICACIÓN */}

                  {/* ========================================== */}

                  <Text

                    style={[styles.nombreItemCuatro, { color: theme.text }]}

                    numberOfLines={2}

                  >

                    {item.label || 'Aplicación'}

                  </Text>

                </Pressable>

              ))}

            </View>

          </View>

        )}

      </ScrollView>

      {/* ========================================== */}

      {/* BARRA INFERIOR RECTANGULAR CON LOS 4 BOTONES */}

      {/* ========================================== */}

      <View

        style={[

          styles.barraInferior,

          {

            backgroundColor: theme.card,

            borderTopColor: theme.cardBorder,

          },

        ]}

      >

        {/* ========================================== */}

        {/* BOTÓN AÑADIR APPS */}

        {/* ========================================== */}

        <Pressable

          style={[styles.botonBarra, { backgroundColor: theme.btnApps }]}

          onPress={gestionarAplicaciones}

        >

          <Ionicons

            name="apps"

            size={30}

            color="#FFFFFF"

          />

          <Text style={styles.textoBotonBarra} numberOfLines={2}>

            Añadir Apps

          </Text>

        </Pressable>

        {/* ========================================== */}

        {/* BOTÓN AÑADIR RECORDATORIO */}

        {/* ========================================== */}

        <Pressable

          style={[styles.botonBarra, { backgroundColor: theme.btnRecordatorio }]}

          onPress={() => router.push("/agregarecordatorio")}

        >

          <Ionicons

            name="notifications"

            size={30}

            color="#FFFFFF"

          />

          <Text style={styles.textoBotonBarra} numberOfLines={2}>

            Recordatorio

          </Text>

        </Pressable>

        {/* ========================================== */}

        {/* BOTÓN AGREGAR CONTACTOS */}

        {/* ========================================== */}

        <Pressable

          style={[styles.botonBarra, { backgroundColor: theme.btnContactos }]}

          onPress={getContacts}

        >

          <Ionicons

            name="call"

            size={30}

            color="#FFFFFF"

          />

          <Text style={styles.textoBotonBarra} numberOfLines={2}>

            Contactos

          </Text>

        </Pressable>

        {/* ========================================== */}

        {/* BOTÓN CALENDARIO */}

        {/* ========================================== */}

        <Pressable

          style={[styles.botonBarra, { backgroundColor: theme.btnCalendario }]}

          onPress={() => router.push('/calendario')}

        >

          <Ionicons

            name="calendar"

            size={30}

            color="#FFFFFF"

          />

          <Text style={styles.textoBotonBarra} numberOfLines={2}>

            Calendario

          </Text>

        </Pressable>

      </View>

      {/* ========================================== */}

      {/* MENÚ SOBREPUESTO (ESTILO FACEBOOK) */}

      {/* ========================================== */}

      <Modal

        visible={menuAbierto}

        transparent

        animationType="fade"

        onRequestClose={() => setMenuAbierto(false)}

      >

        <Pressable

          style={styles.overlayMenuSobrepuesto}

          onPress={() => setMenuAbierto(false)}

        >

          <Pressable

            style={[

              styles.panelMenuSobrepuesto,

              {

                backgroundColor: theme.card,

                borderColor: theme.cardBorder,

              },

            ]}

            onPress={(e) => e.stopPropagation()}

          >

            {/* Cabecera del menú sobrepuesto */}

            <View

              style={[

                styles.cabeceraMenuSobrepuesto,

                { borderBottomColor: theme.cardBorder },

              ]}

            >

              <Image

                source={require('../assets/images/icon.png')}

                style={styles.logoMenuSobrepuesto}

              />

              <Text style={[styles.tituloMenuSobrepuesto, { color: theme.text }]}>

                Menú MobiAmigo

              </Text>

              <TouchableOpacity

                onPress={() => setMenuAbierto(false)}

                style={styles.botonCerrarMenu}

              >

                <Ionicons name="close" size={28} color={theme.text} />

              </TouchableOpacity>

            </View>

            {/* Opción 1: Ver Tutorial de Uso */}

            <TouchableOpacity

              style={[

                styles.tarjetaOpcionMenu,

                {

                  backgroundColor: theme.sectionBg,

                  borderColor: theme.cardBorder,

                },

              ]}

              onPress={() => {

                setMenuAbierto(false);

                setPasoTutorial(0);

                setTutorialVisible(true);

              }}

            >

              <View

                style={[

                  styles.iconoCirculoMenu,

                  { backgroundColor: theme.btnRecordatorio },

                ]}

              >

                <Ionicons name="school" size={26} color="#FFFFFF" />

              </View>

              <View style={{ flex: 1 }}>

                <Text style={[styles.textoOpcionMenu, { color: theme.text }]}>

                  Ver Tutorial de Uso

                </Text>

                <Text style={[styles.subtextoOpcionMenu, { color: theme.subtext }]}>

                  Aprende paso a paso cómo usar la app

                </Text>

              </View>

              <Ionicons name="chevron-forward" size={22} color={theme.subtext} />

            </TouchableOpacity>

            {/* Opción 2: Info (Equipo de Trabajo) */}

            <TouchableOpacity

              style={[

                styles.tarjetaOpcionMenu,

                {

                  backgroundColor: theme.sectionBg,

                  borderColor: theme.cardBorder,

                },

              ]}

              onPress={() => {

                setMenuAbierto(false);

                setModalInfoVisible(true);

              }}

            >

              <View

                style={[

                  styles.iconoCirculoMenu,

                  { backgroundColor: theme.btnApps },

                ]}

              >

                <Ionicons name="information-circle" size={28} color="#FFFFFF" />

              </View>

              <View style={{ flex: 1 }}>

                <Text style={[styles.textoOpcionMenu, { color: theme.text }]}>

                  Info (Equipo de Trabajo)

                </Text>

                <Text style={[styles.subtextoOpcionMenu, { color: theme.subtext }]}>

                  Integrantes, equipo externo e institución

                </Text>

              </View>

              <Ionicons name="chevron-forward" size={22} color={theme.subtext} />

            </TouchableOpacity>

          </Pressable>

        </Pressable>

      </Modal>

      {/* ========================================== */}

      {/* MODAL DEL TUTORIAL DE PRIMERA VEZ (5 PASOS) */}

      {/* ========================================== */}

      <Modal

        visible={tutorialVisible}

        transparent

        animationType="fade"

        onRequestClose={cerrarTutorial}

      >

        <View style={styles.overlayModal}>

          <View

            style={[

              styles.contenidoModalInfo,

              {

                backgroundColor: theme.card,

                borderColor: theme.cardBorder,

              },

            ]}

          >

            {/* Indicador de paso y botón Saltar */}

            <View style={styles.filaSuperiorTutorial}>

              <Text style={[styles.indicadorPasoTexto, { color: theme.subtext }]}>

                Paso {pasoTutorial + 1} de {PASOS_TUTORIAL.length}

              </Text>

              <TouchableOpacity onPress={cerrarTutorial}>

                <Text style={[styles.textoSaltarTutorial, { color: theme.danger }]}>

                  Saltar ✕

                </Text>

              </TouchableOpacity>

            </View>

            {/* Ícono o Logo del paso actual */}

            <View style={styles.contenedorIconoTutorial}>

              {pasoTutorial === 0 ? (

                <Image

                  source={require('../assets/images/icon.png')}

                  style={styles.logoGrandeTutorial}

                />

              ) : (

                <View

                  style={[

                    styles.circuloIconoTutorial,

                    { backgroundColor: PASOS_TUTORIAL[pasoTutorial].color },

                  ]}

                >

                  <Ionicons

                    name={PASOS_TUTORIAL[pasoTutorial].icono}

                    size={58}

                    color="#FFFFFF"

                  />

                </View>

              )}

            </View>

            {/* Título y explicación del paso */}

            <Text style={[styles.tituloPasoTutorial, { color: theme.text }]}>

              {PASOS_TUTORIAL[pasoTutorial].titulo}

            </Text>

            <Text style={[styles.descripcionPasoTutorial, { color: theme.text }]}>

              {PASOS_TUTORIAL[pasoTutorial].descripcion}

            </Text>

            {/* Puntos indicadores de progreso */}

            <View style={styles.filaPuntosTutorial}>

              {PASOS_TUTORIAL.map((_, idx) => (

                <View

                  key={idx}

                  style={[

                    styles.puntoTutorial,

                    {

                      backgroundColor:

                        idx === pasoTutorial

                          ? PASOS_TUTORIAL[pasoTutorial].color

                          : theme.cardBorder,

                      width: idx === pasoTutorial ? 26 : 10,

                    },

                  ]}

                />

              ))}

            </View>

            {/* Botones Anterior / Siguiente / ¡Comenzar! */}

            <View style={styles.filaBotonesTutorial}>

              {pasoTutorial > 0 && (

                <Pressable

                  style={[

                    styles.botonTutorialSecundario,

                    {

                      backgroundColor: theme.sectionBg,

                      borderColor: theme.cardBorder,

                    },

                  ]}

                  onPress={() => setPasoTutorial(pasoTutorial - 1)}

                >

                  <Text

                    style={[

                      styles.textoBotonTutorialSecundario,

                      { color: theme.text },

                    ]}

                  >

                    ← Anterior

                  </Text>

                </Pressable>

              )}

              <Pressable

                style={[

                  styles.botonTutorialPrincipal,

                  {

                    backgroundColor: PASOS_TUTORIAL[pasoTutorial].color,

                  },

                ]}

                onPress={() => {

                  if (pasoTutorial < PASOS_TUTORIAL.length - 1) {

                    setPasoTutorial(pasoTutorial + 1);

                  } else {

                    cerrarTutorial();

                  }

                }}

              >

                <Text style={styles.textoBotonTutorialPrincipal}>

                  {pasoTutorial < PASOS_TUTORIAL.length - 1

                    ? 'Siguiente →'

                    : '¡Comenzar a usar!'}

                </Text>

              </Pressable>

            </View>

          </View>

        </View>

      </Modal>

      {/* ========================================== */}

      {/* MODAL DE INFORMACIÓN DEL EQUIPO DE TRABAJO */}

      {/* ========================================== */}

      <Modal

        visible={modalInfoVisible}

        transparent

        animationType="fade"

        onRequestClose={() => setModalInfoVisible(false)}

      >

        <View style={styles.overlayModal}>

          <View

            style={[

              styles.contenidoModalInfo,

              {

                backgroundColor: theme.card,

                borderColor: theme.cardBorder,

              },

            ]}

          >

            <View style={styles.cabeceraModalInfo}>

              <Image

                source={require('../assets/images/icon.png')}

                style={styles.logoModalInfo}

              />

              <View style={{ flex: 1 }}>

                <Text style={[styles.tituloModalInfo, { color: theme.text }]}>

                  MobiAmigo

                </Text>

                <Text style={[styles.subtituloModalInfo, { color: theme.subtext }]}>

                  Versión 1.0.0

                </Text>

              </View>

            </View>

            <View

              style={[

                styles.cajaSeccionInfo,

                { backgroundColor: theme.sectionBg, borderColor: theme.cardBorder },

              ]}

            >

              <Text style={[styles.tituloBloqueInfo, { color: theme.text }]}>

                👥 Equipo de Trabajo (MoviAmigo Team)

              </Text>

              <Text style={[styles.itemIntegrante, { color: theme.text }]}>

                • Pablo Gajardo

              </Text>

              <Text style={[styles.itemIntegrante, { color: theme.text }]}>

                • Martín Rivas

              </Text>

              <Text style={[styles.itemIntegrante, { color: theme.text }]}>

                • Lucciano Parra

              </Text>

              <Text style={[styles.itemIntegrante, { color: theme.text }]}>

                • Franco Constanzo

              </Text>

              <Text style={[styles.itemIntegrante, { color: theme.text }]}>

                • Kevin Viveros

              </Text>

            </View>

            <View

              style={[

                styles.cajaSeccionInfo,

                { backgroundColor: theme.sectionBg, borderColor: theme.cardBorder },

              ]}

            >

              <Text style={[styles.tituloBloqueInfo, { color: theme.text }]}>

                🤝 Equipo Externo

              </Text>

              <View style={styles.filaEquipoExterno}>

                <Image

                  source={require('../assets/images/SKA_Logo_D-1.png')}

                  style={styles.logoEquipoExterno}

                  resizeMode="contain"

                />

                <View style={{ flex: 1 }}>

                  <Text style={[styles.nombreEquipoExterno, { color: theme.text }]}>

                    Ska Matsuki

                  </Text>

                  <Text style={[styles.rolEquipoExterno, { color: theme.subtext }]}>

                    Colaboración y Desarrollo Externo

                  </Text>

                </View>

              </View>

            </View>

            <View

              style={[

                styles.cajaSeccionInfo,

                { backgroundColor: theme.sectionBg, borderColor: theme.cardBorder },

              ]}

            >

              <Text style={[styles.tituloBloqueInfo, { color: theme.text }]}>

                🎓 Institución

              </Text>

              <Text style={[styles.textoInstitucion, { color: theme.subtext }]}>

                Técnico Universitario en Informática{'\n'}

                Universidad Técnica Federico Santa María (UTFSM)

              </Text>

            </View>

            <Pressable

              style={[styles.botonCerrarInfo, { backgroundColor: theme.btnApps }]}

              onPress={() => setModalInfoVisible(false)}

            >

              <Text style={styles.textoBotonCerrarInfo}>Cerrar</Text>

            </Pressable>

          </View>

        </View>

      </Modal>

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

  },

  // ==========================================

  // SCROLL GENERAL

  // ==========================================

  scrollGeneral: {

    paddingBottom: 20,

  },

  // ==========================================

  // ENCABEZADO SUPERIOR IZQUIERDO Y MENÚ

  // ==========================================

  header: {

    width: '100%',

    paddingVertical: 12,

    paddingHorizontal: 16,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    borderBottomWidth: 1.5,

    marginBottom: 10,

  },

  filaIzquierdaHeader: {

    flexDirection: 'row',

    alignItems: 'center',

  },

  botonMenu: {

    width: 46,

    height: 46,

    borderRadius: 12,

    borderWidth: 1.5,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 10,

  },

  logoHeader: {

    width: 44,

    height: 44,

    borderRadius: 12,

    marginRight: 10,

  },

  titulo: {

    fontSize: 28,

    fontWeight: '800',

    letterSpacing: 0.4,

  },

  // ==========================================

  // MENÚ SOBREPUESTO (ESTILO FACEBOOK)

  // ==========================================

  overlayMenuSobrepuesto: {

    flex: 1,

    backgroundColor: 'rgba(0,0,0,0.55)',

    justifyContent: 'flex-start',

    alignItems: 'flex-start',

    paddingTop: 58,

    paddingHorizontal: 14,

  },

  panelMenuSobrepuesto: {

    width: '92%',

    maxWidth: 360,

    borderRadius: 20,

    borderWidth: 1.5,

    padding: 16,

    elevation: 12,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 6 },

    shadowOpacity: 0.35,

    shadowRadius: 8,

  },

  cabeceraMenuSobrepuesto: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingBottom: 12,

    marginBottom: 12,

    borderBottomWidth: 1.5,

  },

  logoMenuSobrepuesto: {

    width: 38,

    height: 38,

    borderRadius: 10,

    marginRight: 10,

  },

  tituloMenuSobrepuesto: {

    flex: 1,

    fontSize: 21,

    fontWeight: '800',

  },

  botonCerrarMenu: {

    padding: 4,

  },

  tarjetaOpcionMenu: {

    flexDirection: 'row',

    alignItems: 'center',

    padding: 12,

    borderRadius: 14,

    borderWidth: 1.5,

    marginBottom: 10,

  },

  iconoCirculoMenu: {

    width: 46,

    height: 46,

    borderRadius: 23,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 12,

  },

  textoOpcionMenu: {

    fontSize: 18,

    fontWeight: '800',

  },

  subtextoOpcionMenu: {

    fontSize: 13,

    fontWeight: '600',

    marginTop: 2,

  },

  // ==========================================

  // ESTILOS DEL TUTORIAL DE PRIMERA VEZ

  // ==========================================

  filaSuperiorTutorial: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 12,

  },

  indicadorPasoTexto: {

    fontSize: 16,

    fontWeight: '700',

  },

  textoSaltarTutorial: {

    fontSize: 17,

    fontWeight: '800',

  },

  contenedorIconoTutorial: {

    alignItems: 'center',

    justifyContent: 'center',

    marginVertical: 14,

  },

  logoGrandeTutorial: {

    width: 110,

    height: 110,

    borderRadius: 26,

  },

  circuloIconoTutorial: {

    width: 110,

    height: 110,

    borderRadius: 55,

    alignItems: 'center',

    justifyContent: 'center',

    elevation: 4,

  },

  tituloPasoTutorial: {

    fontSize: 25,

    fontWeight: '800',

    textAlign: 'center',

    marginBottom: 12,

  },

  descripcionPasoTutorial: {

    fontSize: 19,

    fontWeight: '600',

    textAlign: 'center',

    lineHeight: 27,

    marginBottom: 18,

  },

  filaPuntosTutorial: {

    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',

    marginBottom: 20,

    gap: 8,

  },

  puntoTutorial: {

    height: 10,

    borderRadius: 5,

  },

  filaBotonesTutorial: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    gap: 10,

  },

  botonTutorialSecundario: {

    flex: 1,

    paddingVertical: 15,

    borderRadius: 14,

    borderWidth: 1.5,

    alignItems: 'center',

    justifyContent: 'center',

  },

  textoBotonTutorialSecundario: {

    fontSize: 18,

    fontWeight: '800',

  },

  botonTutorialPrincipal: {

    flex: 1.4,

    paddingVertical: 15,

    borderRadius: 14,

    alignItems: 'center',

    justifyContent: 'center',

    elevation: 3,

  },

  textoBotonTutorialPrincipal: {

    color: '#FFFFFF',

    fontSize: 19,

    fontWeight: '800',

  },

  // ==========================================

  // TÍTULOS DE SECCIÓN

  // ==========================================

  tituloSeccion: {

    fontSize: 20,

    fontWeight: '700',

    marginBottom: 10,

  },

  // ==========================================

  // ZONA DE RECORDATORIOS Y NOTIFICACIONES

  // ==========================================

  zonaNotificaciones: {

    width: '100%',

    paddingHorizontal: 16,

    marginBottom: 14,

  },

  // ==========================================

  // TARJETA DE RECORDATORIO / EVENTO

  // ==========================================

  tarjetaRecordatorio: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    padding: 16,

    borderRadius: 16,

    marginBottom: 10,

    borderWidth: 1.5,

    borderLeftWidth: 7,

    elevation: 2,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 1 },

    shadowOpacity: 0.1,

    shadowRadius: 2,

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

    fontSize: 19,

    fontWeight: '600',

    flex: 1,

  },

  fechaEventoTexto: {

    fontSize: 15,

    marginTop: 4,

    fontWeight: '500',

  },

  // ==========================================

  // BOTÓN ELIMINAR

  // ==========================================

  botonEliminar: {

    padding: 6,

  },

  // ==========================================

  // SECCIONES DE 4 ELEMENTOS POR FILA (CONTACTOS Y APPS)

  // ==========================================

  seccionContenedor: {

    width: '100%',

    paddingHorizontal: 16,

    marginBottom: 14,

  },

  filaCuatro: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'flex-start',

    gap: 8,

  },

  tarjetaCuatro: {

    width: '23%',

    alignItems: 'center',

    paddingVertical: 10,

    paddingHorizontal: 4,

    borderRadius: 16,

    borderWidth: 1.5,

    position: 'relative',

    elevation: 2,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 1 },

    shadowOpacity: 0.1,

    shadowRadius: 2,

  },

  botonQuitarMini: {

    position: 'absolute',

    top: 2,

    right: 2,

    zIndex: 5,

  },

  avatarContacto: {

    width: 50,

    height: 50,

    borderRadius: 25,

    alignItems: 'center',

    justifyContent: 'center',

  },

  // ==========================================

  // ICONO DE APLICACIÓN

  // ==========================================

  iconoApp: {

    width: 50,

    height: 50,

    borderRadius: 12,

  },

  // ==========================================

  // ICONO DE APLICACIÓN SIN IMAGEN

  // ==========================================

  iconoAppPlaceholder: {

    width: 50,

    height: 50,

    borderRadius: 12,

    alignItems: 'center',

    justifyContent: 'center',

  },

  // ==========================================

  // NOMBRE DE CONTACTO O APLICACIÓN EN FILA DE 4

  // ==========================================

  nombreItemCuatro: {

    fontSize: 13,

    fontWeight: '700',

    marginTop: 6,

    textAlign: 'center',

  },

  // ==========================================

  // BARRA INFERIOR RECTANGULAR CON LOS 4 BOTONES

  // ==========================================

  barraInferior: {

    width: '100%',

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    paddingHorizontal: 10,

    paddingVertical: 10,

    borderTopWidth: 2,

    elevation: 10,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: -2 },

    shadowOpacity: 0.15,

    shadowRadius: 4,

  },

  // ==========================================

  // BOTÓN DE LA BARRA INFERIOR

  // ==========================================

  botonBarra: {

    width: '23.5%',

    minHeight: 82,

    borderRadius: 14,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 4,

    paddingVertical: 8,

    elevation: 3,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.2,

    shadowRadius: 3,

  },

  // ==========================================

  // TEXTO DE LOS BOTONES DE LA BARRA

  // ==========================================

  textoBotonBarra: {

    color: '#FFFFFF',

    fontSize: 13,

    fontWeight: '800',

    textAlign: 'center',

    marginTop: 5,

  },

  // ==========================================

  // MODAL DE INFORMACIÓN DEL EQUIPO

  // ==========================================

  overlayModal: {

    flex: 1,

    backgroundColor: 'rgba(0,0,0,0.6)',

    justifyContent: 'center',

    alignItems: 'center',

    paddingHorizontal: 20,

  },

  contenidoModalInfo: {

    width: '100%',

    borderRadius: 22,

    borderWidth: 1.5,

    padding: 22,

    elevation: 8,

  },

  cabeceraModalInfo: {

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 16,

  },

  logoModalInfo: {

    width: 58,

    height: 58,

    borderRadius: 14,

    marginRight: 14,

  },

  tituloModalInfo: {

    fontSize: 26,

    fontWeight: '800',

  },

  subtituloModalInfo: {

    fontSize: 16,

    fontWeight: '600',

    marginTop: 2,

  },

  cajaSeccionInfo: {

    borderRadius: 16,

    borderWidth: 1.5,

    padding: 14,

    marginBottom: 14,

  },

  tituloBloqueInfo: {

    fontSize: 18,

    fontWeight: '800',

    marginBottom: 8,

  },

  itemIntegrante: {

    fontSize: 17,

    fontWeight: '600',

    marginVertical: 2,

  },

  filaEquipoExterno: {

    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 4,

  },

  logoEquipoExterno: {

    width: 58,

    height: 58,

    marginRight: 14,

  },

  nombreEquipoExterno: {

    fontSize: 19,

    fontWeight: '800',

  },

  rolEquipoExterno: {

    fontSize: 14,

    fontWeight: '600',

    marginTop: 2,

  },

  textoInstitucion: {

    fontSize: 16,

    fontWeight: '600',

    lineHeight: 22,

  },

  botonCerrarInfo: {

    marginTop: 4,

    paddingVertical: 14,

    borderRadius: 14,

    alignItems: 'center',

    justifyContent: 'center',

  },

  textoBotonCerrarInfo: {

    color: '#FFFFFF',

    fontSize: 19,

    fontWeight: '800',

  },

});
