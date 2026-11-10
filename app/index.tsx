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
// INFORMACIÓN DE LAS APLICACIONES, CONTACTOS Y EVENTOS
// ==========================================

interface AppInfo {
  label: string;
  packageName: string;
  icon?: string;
}

interface ContactInfo {
  id: string;
  name: string;
  phoneNumber?: string;
}

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

export default function App() {
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
    sectionBg: isDark ? '#1E293B' : '#F3F0EA',
    // Colores semánticos de botones principales
    btnApps: '#1D4ED8',         // Azul vivo
    btnRecordatorio: '#D97706', // Ámbar / Naranja cálido
    btnContactos: '#15803D',    // Verde esmeralda
    btnCalendario: '#6D28D9',   // Morado / Índigo
    danger: '#DC2626',
  };

  // Lista de recordatorios rápidos
  const [listaRecordatorios, setListaRecordatorios] =
    useState<string[]>([]);

  // Lista de eventos cercanos del calendario
  const [eventosCercanos, setEventosCercanos] =
    useState<EventoCalendario[]>([]);

  // Lista de aplicaciones seleccionadas
  const [listaApps, setListaApps] =
    useState<AppInfo[]>([]);

  // Lista de contactos guardados
  const [listaContactos, setListaContactos] =
    useState<ContactInfo[]>([]);

  // Estado para el menú desplegable (☰) y el modal de "Info"
  const [menuAbierto, setMenuAbierto] = useState<boolean>(false);
  const [modalInfoVisible, setModalInfoVisible] = useState<boolean>(false);

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
      // CARGAR EVENTOS CERCANOS DEL CALENDARIO
      // ==========================================

      const cargarEventosDeMemoria = async () => {
        try {
          const datosEventos = await AsyncStorage.getItem('@eventos_calendario');
          if (datosEventos !== null) {
            const listaEventos: EventoCalendario[] = JSON.parse(datosEventos);
            // Ordenar por fecha y hora más cercanas y mostrar los próximos 3
            const ordenados = [...listaEventos].sort((a, b) => {
              const fechaA = new Date(a.anio, a.mes, a.dia).getTime();
              const fechaB = new Date(b.anio, b.mes, b.dia).getTime();
              if (fechaA !== fechaB) return fechaA - fechaB;
              return (a.hora || '').localeCompare(b.hora || '');
            });
            setEventosCercanos(ordenados.slice(0, 3));
          } else {
            setEventosCercanos([]);
          }
        } catch (error) {
          console.log("Error al cargar eventos del calendario:", error);
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

          // Se convierten los datos guardados en una lista
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
          // De esta manera, las aplicaciones que se desinstalaron
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
      // CARGAR CONTACTOS GUARDADOS
      // ==========================================

      const cargarContactosDeMemoria = async () => {
        try {
          const datosGuardados = await AsyncStorage.getItem('@mis_contactos');
          if (datosGuardados !== null) {
            setListaContactos(JSON.parse(datosGuardados));
          } else {
            setListaContactos([]);
          }
        } catch (error) {
          console.log("Error al cargar contactos: ", error);
        }
      };

      // ==========================================
      // EJECUTAR CARGA DE DATOS
      // ==========================================

      cargarContactosDeMemoria();
      cargarRecordatoriosDeMemoria();
      cargarEventosDeMemoria();
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
      // Esto carga toda la librería de react-native-launcher-kit
      const LauncherKit =
        require('react-native-launcher-kit');

      const RNLauncherKitHelper =
        LauncherKit.RNLauncherKitHelper;

      if (
        typeof RNLauncherKitHelper.launchApplication ===
        'function'
      ) {
        // Esto carga la app mediante su packageName
        // por ejemplo "com.android.chrome" que es Google Chrome
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

  // ==========================================
  // OBTENER Y GUARDAR CONTACTOS DEL DISPOSITIVO
  // ==========================================

  const getContacts = async () => {
    try {
      const { status } = await contacts.requestPermissionsAsync();

      if (status === 'granted') {
        // EXPLICACIÓN: Añadimos 'as any' al final para que permita usar '.contact' sin errores
        const resultadoPicker = (await contacts.presentContactPickerAsync()) as any;
        
        if (resultadoPicker) {
          const datosContacto = resultadoPicker.contact || resultadoPicker;

          if (datosContacto) {
            // EXPLICACIÓN: Corregimos la ortografía, usamos [0] para el primer elemento y ?.number para su valor
            const numeroBruto = datosContacto.phoneNumbers?.[0]?.number;
            const nombreContacto =
              datosContacto.name ||
              [datosContacto.firstName, datosContacto.lastName].filter(Boolean).join(' ') ||
              'Contacto';

            console.log('Número obtenido:', numeroBruto);

            if (!numeroBruto) {
              Alert.alert('Sin número', 'El contacto seleccionado no tiene un número de teléfono.');
              return;
            }

            const nuevoContacto: ContactInfo = {
              id: datosContacto.id || Date.now().toString(),
              name: nombreContacto,
              phoneNumber: numeroBruto,
            };

            const yaExiste = listaContactos.some(
              (c) => c.phoneNumber === nuevoContacto.phoneNumber && c.name === nuevoContacto.name
            );

            if (!yaExiste) {
              const nuevaLista = [...listaContactos, nuevoContacto];
              setListaContactos(nuevaLista);
              await AsyncStorage.setItem('@mis_contactos', JSON.stringify(nuevaLista));
            }
          }
        }
      }
    } catch (error) {
      console.log('Error:', error);
    }
  };

  // ==========================================
  // LLAMAR Y ELIMINAR CONTACTO
  // ==========================================

  const llamarContacto = (contacto: ContactInfo) => {
    if (contacto.phoneNumber) {
      const numeroLimpio = contacto.phoneNumber.replace(/[^\d+]/g, '');
      Linking.openURL(`tel:${numeroLimpio}`);
    }
  };

  const eliminarContacto = async (id: string) => {
    try {
      const nuevaLista = listaContactos.filter((c) => c.id !== id);
      setListaContactos(nuevaLista);
      await AsyncStorage.setItem('@mis_contactos', JSON.stringify(nuevaLista));
    } catch (error) {
      console.log('Error al eliminar contacto:', error);
    }
  };

  const hayNotificaciones =
    listaRecordatorios.length > 0 || eventosCercanos.length > 0;

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
            {/* Botón tipo hamburguesa (☰) como en la imagen */}
            <Pressable
              style={[
                styles.botonMenu,
                { backgroundColor: theme.sectionBg, borderColor: theme.cardBorder },
              ]}
              onPress={() => setMenuAbierto(!menuAbierto)}
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
        {/* MENÚ DESPLEGABLE CON LA OPCIÓN DE "INFO" */}
        {/* ========================================== */}

        {menuAbierto && (
          <View
            style={[
              styles.menuDesplegable,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.opcionMenu}
              onPress={() => {
                setMenuAbierto(false);
                setModalInfoVisible(true);
              }}
            >
              <Ionicons
                name="information-circle"
                size={26}
                color={theme.btnApps}
              />
              <Text style={[styles.textoOpcionMenu, { color: theme.text }]}>
                Info (Equipo de Trabajo)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================== */}
        {/* 1. ZONA DE NOTIFICACIONES MÁS CERCANAS */}
        {/* ========================================== */}

        {hayNotificaciones && (
          <View style={styles.zonaNotificaciones}>
            <Text style={[styles.tituloSeccion, { color: theme.text }]}>
              🔔 Avisos y Recordatorios
            </Text>

            {/* Recordatorios rápidos */}
            {listaRecordatorios.map((item, index) => (
              <View
                key={`rec-${index}`}
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
                    {item}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.botonEliminar}
                  onPress={() => eliminarRecordatorio(index)}
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
  menuDesplegable: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  opcionMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  textoOpcionMenu: {
    fontSize: 19,
    fontWeight: '700',
    marginLeft: 10,
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
