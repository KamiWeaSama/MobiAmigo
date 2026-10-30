import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const anioActualSistema = new Date(2026, 9, 25).getFullYear();
const ANIOS = Array.from({ length: 21 }, (_, index) => anioActualSistema - 10 + index);

const HORAS = Array.from({ length: 24 }, (_, i) => (i < 10 ? `0${i}` : `${i}`));
const MINUTOS = Array.from({ length: 60 }, (_, i) => (i < 10 ? `0${i}` : `${i}`));

interface EventoCalendario {
  id: string;
  nombre: string;
  hora: string;
  repiteSemanal: boolean;
  repiteMensual: boolean;
  dia: number;
  mes: number;
  anio: number;
}

export default function CalendarioScreen() {
  const router = useRouter();
  
  const fechaActual = new Date(2026, 9, 25); 
  const [mesActual, setMesActual] = useState(fechaActual.getMonth());
  const [anioActual, setAnioActual] = useState(fechaActual.getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState(fechaActual.getDate());

  // Modales
  const [modalMesVisible, setModalMesVisible] = useState(false);
  const [modalAnioVisible, setModalAnioVisible] = useState(false);
  const [modalHoraVisible, setModalHoraVisible] = useState(false);
  const [modalMinutoVisible, setModalMinutoVisible] = useState(false);
  const [modalNuevoEventoVisible, setModalNuevoEventoVisible] = useState(false);

  // Campos del formulario
  const [nombreEvento, setNombreEvento] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('12');
  const [minutoSeleccionado, setMinutoSeleccionado] = useState('00');
  const [repiteSemanal, setRepiteSemanal] = useState(false);
  const [repiteMensual, setRepiteMensual] = useState(false);

  const [eventos, setEventos] = useState<EventoCalendario[]>([]);

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      const datos = await AsyncStorage.getItem('@eventos_calendario');
      if (datos !== null) {
        setEventos(JSON.parse(datos));
      }
    } catch (error) {
      console.log('Error al cargar eventos:', error);
    }
  };

  const guardarNuevoEvento = async () => {
    if (!nombreEvento.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del evento.');
      return;
    }

    const horaFormateada = `${horaSeleccionada}:${minutoSeleccionado}`;

    const nuevoEvento: EventoCalendario = {
      id: Date.now().toString(),
      nombre: nombreEvento,
      hora: horaFormateada,
      repiteSemanal,
      repiteMensual,
      dia: diaSeleccionado,
      mes: mesActual,
      anio: anioActual,
    };

    const nuevosEventos = [...eventos, nuevoEvento];
    setEventos(nuevosEventos);

    try {
      await AsyncStorage.setItem('@eventos_calendario', JSON.stringify(nuevosEventos));
      setNombreEvento('');
      setHoraSeleccionada('12');
      setMinutoSeleccionado('00');
      setRepiteSemanal(false);
      setRepiteMensual(false);
      setModalNuevoEventoVisible(false);
    } catch (error) {
      console.log('Error al guardar evento:', error);
    }
  };

  const eliminarEvento = async (id: string) => {
    const nuevosEventos = eventos.filter((ev) => ev.id !== id);
    setEventos(nuevosEventos);
    try {
      await AsyncStorage.setItem('@eventos_calendario', JSON.stringify(nuevosEventos));
    } catch (error) {
      console.log('Error al eliminar evento:', error);
    }
  };

  // Lógica precisa para verificar si un evento debe aparecer en una fecha determinada
  const eventoAplicaEnFecha = (ev: EventoCalendario, diaCheck: number, mesCheck: number, anioCheck: number) => {
    const fechaCreada = new Date(ev.anio, ev.mes, ev.dia);
    const fechaEvaluada = new Date(anioCheck, mesCheck, diaCheck);

    // No mostrar si la fecha es anterior a la creación del evento
    if (fechaEvaluada < fechaCreada) return false;

    // 1. Coincidencia Exacta
    if (ev.dia === diaCheck && ev.mes === mesCheck && ev.anio === anioCheck) {
      return true;
    }

    // 2. Si repite Semanalmente
    if (ev.repiteSemanal) {
      const mismoDiaSemana = fechaEvaluada.getDay() === fechaCreada.getDay();

      if (mismoDiaSemana) {
        // Si NO activa repetición mensual, se repite solo en el mes en que se creó
        if (!ev.repiteMensual) {
          if (mesCheck === ev.mes && anioCheck === ev.anio) {
            return true;
          }
        } else {
          // Si activa Semanal + Mensual, se repite en todos los meses siguientes el mismo día de la semana
          return true;
        }
      }
    }

    // 3. Si repite Mensualmente (únicamente sin repetición semanal)
    if (ev.repiteMensual && !ev.repiteSemanal) {
      if (ev.dia === diaCheck) {
        return true;
      }
    }

    return false;
  };

  const obtenerEventoParaDia = (dia: number | null) => {
    if (dia === null) return null;
    return eventos.find((ev) => eventoAplicaEnFecha(ev, dia, mesActual, anioActual));
  };

  const eventosDelDia = eventos.filter((ev) => eventoAplicaEnFecha(ev, diaSeleccionado, mesActual, anioActual));

  const obtenerDiasDelMes = (mes: number, anio: number) => {
    const primerDiaDelMes = new Date(anio, mes, 1).getDay();
    const primerDiaAjustado = primerDiaDelMes === 0 ? 6 : primerDiaDelMes - 1;
    const totalDias = new Date(anio, mes + 1, 0).getDate();
    const dias = [];

    for (let i = 0; i < primerDiaAjustado; i++) {
      dias.push(null);
    }
    for (let dia = 1; dia <= totalDias; dia++) {
      dias.push(dia);
    }
    return dias;
  };

  const diasDelMes = obtenerDiasDelMes(mesActual, anioActual);

  return (
    <SafeAreaView style={styles.container}>
      {/* ENCABEZADO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.botonVolver}>
          <Ionicons name="arrow-back" size={24} color="#F8E9E9" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Calendario</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* SELECTORES DE MES Y AÑO */}
        <View style={styles.contenedorSelectores}>
          <TouchableOpacity style={styles.botonSelector} onPress={() => setModalMesVisible(true)}>
            <Text style={styles.textoSelector}>{MESES[mesActual]}</Text>
            <Ionicons name="chevron-down" size={18} color="#F8E9E9" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonSelector} onPress={() => setModalAnioVisible(true)}>
            <Text style={styles.textoSelector}>{anioActual}</Text>
            <Ionicons name="chevron-down" size={18} color="#F8E9E9" />
          </TouchableOpacity>
        </View>

        {/* DÍAS DE LA SEMANA */}
        <View style={styles.gridDiasSemana}>
          {DIAS_SEMANA.map((dia, index) => (
            <Text key={index} style={styles.textoDiaSemana}>{dia}</Text>
          ))}
        </View>

        {/* GRILLA DE DÍAS */}
        <View style={styles.gridDias}>
          {diasDelMes.map((dia, index) => {
            const esSeleccionado = dia === diaSeleccionado;
            const eventoEnDia = obtenerEventoParaDia(dia);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.celdaDia,
                  dia === null && styles.celdaVacia,
                  esSeleccionado && styles.celdaSeleccionada,
                  eventoEnDia !== null && styles.celdaConEvento
                ]}
                disabled={dia === null}
                onPress={() => dia && setDiaSeleccionado(dia)}
              >
                {dia !== null && (
                  <View style={styles.contenedorTextoDia}>
                    <Text style={[styles.textoDia, (esSeleccionado || eventoEnDia !== null) && styles.textoDiaSeleccionado]}>
                      {dia}
                    </Text>
                    {eventoEnDia && (
                      <View style={styles.infoMiniEventoContainer}>
                        <Text style={styles.miniNombreEvento} numberOfLines={1}>
                          {eventoEnDia.nombre}
                        </Text>
                        <Text style={styles.miniHoraEvento}>
                          {eventoEnDia.hora}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ZONA DE EVENTOS DEL DÍA SELECCIONADO */}
        <View style={styles.zonaEventos}>
          <View style={styles.cabeceraZonaEventos}>
            <Text style={styles.tituloEventos}>
              Eventos del {diaSeleccionado} de {MESES[mesActual]}
            </Text>
            <TouchableOpacity 
              style={styles.botonAgregarEvento} 
              onPress={() => setModalNuevoEventoVisible(true)}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.textoBotonAgregar}>Añadir</Text>
            </TouchableOpacity>
          </View>

          {eventosDelDia.length === 0 ? (
            <View style={styles.tarjetaEventoVacia}>
              <Ionicons name="calendar-outline" size={30} color="#0080ff" />
              <Text style={styles.textoSinEventos}>No hay eventos programados para este día.</Text>
            </View>
          ) : (
            eventosDelDia.map((ev) => (
              <View key={ev.id} style={styles.tarjetaEvento}>
                <View style={styles.infoEvento}>
                  <Text style={styles.nombreEventoText}>{ev.nombre}</Text>
                  <Text style={styles.horaEventoText}>
                    🕒 {ev.hora} {ev.repiteSemanal ? '• (Semanal)' : ''} {ev.repiteMensual ? '• (Mensual)' : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => eliminarEvento(ev.id)} style={styles.botonEliminarEvento}>
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* MODAL NUEVO EVENTO */}
      <Modal visible={modalNuevoEventoVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>Nuevo Evento ({diaSeleccionado} de {MESES[mesActual]})</Text>
            
            <Text style={styles.labelInput}>Nombre del evento:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Reunión, Cita..."
              placeholderTextColor="#888"
              value={nombreEvento}
              onChangeText={setNombreEvento}
            />

            <Text style={styles.labelInput}>Hora:</Text>
            <View style={styles.contenedorFilaHoras}>
              <TouchableOpacity 
                style={[styles.inputSelectorHora, { flex: 1, marginRight: 8 }]} 
                onPress={() => setModalHoraVisible(true)}
              >
                <Text style={styles.textoHoraSeleccionada}>Hr: {horaSeleccionada}</Text>
                <Ionicons name="chevron-down" size={16} color="#F8E9E9" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.inputSelectorHora, { flex: 1, marginLeft: 8 }]} 
                onPress={() => setModalMinutoVisible(true)}
              >
                <Text style={styles.textoHoraSeleccionada}>Min: {minutoSeleccionado}</Text>
                <Ionicons name="chevron-down" size={16} color="#F8E9E9" />
              </TouchableOpacity>
            </View>

            {/* Repetir Semanalmente */}
            <Text style={styles.labelInput}>¿Repetir semanalmente?</Text>
            <View style={styles.contenedorOpcionesRepeticion}>
              <TouchableOpacity 
                style={[styles.botonOpcionRepeticion, repiteSemanal && styles.opcionSeleccionada]}
                onPress={() => setRepiteSemanal(true)}
              >
                <Text style={styles.textoOpcionRepeticion}>Sí</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.botonOpcionRepeticion, !repiteSemanal && styles.opcionSeleccionada]}
                onPress={() => setRepiteSemanal(false)}
              >
                <Text style={styles.textoOpcionRepeticion}>No</Text>
              </TouchableOpacity>
            </View>

            {/* Repetir Mensualmente */}
            <Text style={styles.labelInput}>¿Repetir mensualmente?</Text>
            <View style={styles.contenedorOpcionesRepeticion}>
              <TouchableOpacity 
                style={[styles.botonOpcionRepeticion, repiteMensual && styles.opcionSeleccionada]}
                onPress={() => setRepiteMensual(true)}
              >
                <Text style={styles.textoOpcionRepeticion}>Sí</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.botonOpcionRepeticion, !repiteMensual && styles.opcionSeleccionada]}
                onPress={() => setRepiteMensual(false)}
              >
                <Text style={styles.textoOpcionRepeticion}>No</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.botonesModalContainer}>
              <TouchableOpacity 
                style={[styles.botonModalAccion, { backgroundColor: '#493936' }]} 
                onPress={() => setModalNuevoEventoVisible(false)}
              >
                <Text style={styles.textoBotonModal}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.botonModalAccion, { backgroundColor: '#0080ff' }]} 
                onPress={guardarNuevoEvento}
              >
                <Text style={styles.textoBotonModal}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DESPLEGABLE HORA */}
      <Modal visible={modalHoraVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContenido, { maxHeight: '50%' }]}>
            <Text style={styles.modalTitulo}>Selecciona la Hora</Text>
            <FlatList
              data={HORAS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setHoraSeleccionada(item); setModalHoraVisible(false); }}
                >
                  <Text style={[styles.modalTextoItem, item === horaSeleccionada && styles.modalTextoSeleccionado]}>
                    {item} hrs
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalBotonCerrar} onPress={() => setModalHoraVisible(false)}>
              <Text style={styles.modalTextoCerrar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DESPLEGABLE MINUTO */}
      <Modal visible={modalMinutoVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContenido, { maxHeight: '50%' }]}>
            <Text style={styles.modalTitulo}>Selecciona el Minuto</Text>
            <FlatList
              data={MINUTOS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setMinutoSeleccionado(item); setModalMinutoVisible(false); }}
                >
                  <Text style={[styles.modalTextoItem, item === minutoSeleccionado && styles.modalTextoSeleccionado]}>
                    {item} min
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalBotonCerrar} onPress={() => setModalMinutoVisible(false)}>
              <Text style={styles.modalTextoCerrar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL MES */}
      <Modal visible={modalMesVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContenido, { maxHeight: '60%' }]}>
            <Text style={styles.modalTitulo}>Selecciona un Mes</Text>
            <FlatList
              data={MESES}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setMesActual(index); setModalMesVisible(false); }}
                >
                  <Text style={[styles.modalTextoItem, index === mesActual && styles.modalTextoSeleccionado]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalBotonCerrar} onPress={() => setModalMesVisible(false)}>
              <Text style={styles.modalTextoCerrar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL AÑO CORREGIDO (Lista con Scroll limpia) */}
      <Modal visible={modalAnioVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContenido, { maxHeight: '50%' }]}>
            <Text style={styles.modalTitulo}>Selecciona un Año</Text>
            <FlatList
              data={ANIOS}
              keyExtractor={(item) => item.toString()}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setAnioActual(item); setModalAnioVisible(false); }}
                >
                  <Text style={[styles.modalTextoItem, item === anioActual && styles.modalTextoSeleccionado]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalBotonCerrar} onPress={() => setModalAnioVisible(false)}>
              <Text style={styles.modalTextoCerrar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000040' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
  botonVolver: { padding: 8 },
  titulo: { color: '#F8E9E9', fontSize: 24, fontWeight: '400' },
  scrollContainer: { paddingBottom: 30, paddingHorizontal: 16 },
  contenedorSelectores: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15 },
  botonSelector: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0c0c5a', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, marginHorizontal: 4 },
  textoSelector: { color: '#F8E9E9', fontSize: 16, fontWeight: '500' },
  gridDiasSemana: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  textoDiaSemana: { color: '#F8E9E9', fontSize: 14, fontWeight: 'bold', width: '14%', textAlign: 'center' },
  gridDias: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', backgroundColor: '#0c0c5a', borderRadius: 14, padding: 10 },
  celdaDia: { width: '14.28%', height: 65, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 6, marginBottom: 6 },
  celdaVacia: { backgroundColor: 'transparent' },
  celdaSeleccionada: { backgroundColor: '#1a1a8c', borderRadius: 8 },
  celdaConEvento: { backgroundColor: '#141452', borderRadius: 8, borderWidth: 1, borderColor: '#0080ff' },
  contenedorTextoDia: { alignItems: 'center', width: '100%' },
  textoDia: { color: '#F8E9E9', fontSize: 14 },
  textoDiaSeleccionado: { fontWeight: 'bold', color: '#FFFFFF' },
  infoMiniEventoContainer: { width: '100%', paddingHorizontal: 2, alignItems: 'center', marginTop: 2 },
  miniNombreEvento: { color: '#b3d1ff', fontSize: 9, textAlign: 'center' },
  miniHoraEvento: { color: '#80bfff', fontSize: 8, textAlign: 'center' },
  zonaEventos: { marginTop: 20 },
  cabeceraZonaEventos: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tituloEventos: { color: '#F8E9E9', fontSize: 16 },
  botonAgregarEvento: { flexDirection: 'row', backgroundColor: '#0080ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  textoBotonAgregar: { color: '#FFFFFF', marginLeft: 4, fontWeight: '500' },
  tarjetaEventoVacia: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0c0c5a', padding: 16, borderRadius: 14 },
  textoSinEventos: { color: '#F8E9E9', fontSize: 14, marginLeft: 12, flex: 1 },
  tarjetaEvento: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0c0c5a', padding: 14, borderRadius: 14, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#0080ff' },
  infoEvento: { flex: 1 },
  nombreEventoText: { color: '#F8E9E9', fontSize: 16, fontWeight: '500' },
  horaEventoText: { color: '#aaa', fontSize: 13, marginTop: 4 },
  botonEliminarEvento: { padding: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContenido: { width: '85%', maxHeight: '80%', backgroundColor: '#0c0c5a', borderRadius: 16, padding: 20 },
  modalTitulo: { color: '#F8E9E9', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  labelInput: { color: '#F8E9E9', fontSize: 14, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#1a1a7a', color: '#F8E9E9', padding: 12, borderRadius: 8, fontSize: 16 },
  contenedorFilaHoras: { flexDirection: 'row', justifyContent: 'space-between' },
  inputSelectorHora: { backgroundColor: '#1a1a7a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8 },
  textoHoraSeleccionada: { color: '#F8E9E9', fontSize: 15 },
  contenedorOpcionesRepeticion: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  botonOpcionRepeticion: { flex: 1, backgroundColor: '#493936', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 3 },
  opcionSeleccionada: { backgroundColor: '#0080ff' },
  textoOpcionRepeticion: { color: '#F8E9E9', fontSize: 13, fontWeight: 'bold' },
  botonesModalContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  botonModalAccion: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  textoBotonModal: { color: '#F8E9E9', fontSize: 16, fontWeight: '500' },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a7a', alignItems: 'center' },
  modalTextoItem: { color: '#F8E9E9', fontSize: 16 },
  modalTextoSeleccionado: { color: '#0080ff', fontWeight: 'bold' },
  modalBotonCerrar: { marginTop: 15, backgroundColor: '#493936', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  modalTextoCerrar: { color: '#F8E9E9', fontSize: 16, fontWeight: '500' },
});