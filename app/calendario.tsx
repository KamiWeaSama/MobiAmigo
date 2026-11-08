// ==========================================
// SECCIÓN DE IMPORTS
// ==========================================

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, FlatList, Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ==========================================
// CONSTANTES DE FECHA Y HORA
// ==========================================

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const ANIOS = Array.from({ length: 21 }, (_, i) => new Date(2026, 9, 25).getFullYear() - 10 + i);
const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// ==========================================
// ESTRUCTURA DE UN EVENTO DEL CALENDARIO
// ==========================================

interface Evento {
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

export default function CalendarioScreen() {
  const router = useRouter();
  const hoy = new Date(2026, 9, 25);

  // ==========================================
  // ESTADOS DE FECHA Y LISTA DE EVENTOS
  // ==========================================

  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [diaSel, setDiaSel] = useState(hoy.getDate());
  const [eventos, setEventos] = useState<Evento[]>([]);

  // ==========================================
  // ESTADOS DE MODALES Y FORMULARIO
  // ==========================================

  const [modal, setModal] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [hora, setHora] = useState('12');
  const [minuto, setMinuto] = useState('00');
  const [repSiemp, setRepSiemp] = useState(false);
  const [repSem, setRepSem] = useState(false);
  const [repMen, setRepMen] = useState(false);

  // ==========================================
  // CARGAR EVENTOS GUARDADOS EN MEMORIA
  // ==========================================

  useEffect(() => {
    AsyncStorage.getItem('@eventos_calendario').then(d => d && setEventos(JSON.parse(d)));
  }, []);

  // ==========================================
  // GUARDAR EVENTOS EN ASYNCSTORAGE
  // ==========================================

  const guardarEventos = async (nuevos: Evento[]) => {
    setEventos(nuevos);
    await AsyncStorage.setItem('@eventos_calendario', JSON.stringify(nuevos));
  };

  // ==========================================
  // CREAR UN NUEVO EVENTO
  // ==========================================

  const agregarEvento = () => {
    if (!nombre.trim()) return Alert.alert('Error', 'Ingresa el nombre.');
    const nuevo: Evento = {
      id: Date.now().toString(), nombre, hora: `${hora}:${minuto}`,
      repiteSiempre: repSiemp, repiteSemanal: repSem, repiteMensual: repMen,
      dia: diaSel, mes, anio
    };
    guardarEventos([...eventos, nuevo]);
    setNombre(''); setRepSiemp(false); setRepSem(false); setRepMen(false); setModal(null);
  };

  // ==========================================
  // ELIMINAR UN EVENTO POR ID
  // ==========================================

  const eliminarEvento = (id: string) => guardarEventos(eventos.filter(e => e.id !== id));

  // ==========================================
  // COMPROBAR SI UN EVENTO APLICA EN UNA FECHA
  // ==========================================
  // Evalúa coincidencia exacta o repeticiones
  // configuradas (siempre, semanal o mensual).

  const aplicaFecha = (e: Evento, d: number, m: number, a: number) => {
    const fCreada = new Date(e.anio, e.mes, e.dia);
    const fEval = new Date(a, m, d);
    if (fEval < fCreada) return false;
    if (e.repiteSiempre) return true;
    if (e.dia === d && e.mes === m && e.anio === a) return true;
    if (e.repiteSemanal && fEval.getDay() === fCreada.getDay()) {
      return e.repiteMensual || (m === e.mes && a === e.anio);
    }
    return e.repiteMensual && !e.repiteSemanal && e.dia === d;
  };

  // Eventos que corresponden al día seleccionado
  const eventosDelDia = eventos.filter(e => aplicaFecha(e, diaSel, mes, anio));

  // ==========================================
  // CALCULAR DÍAS DEL MES ACTUAL
  // ==========================================

  const diasMes = (() => {
    const primerDia = (new Date(anio, mes, 1).getDay() + 6) % 7;
    const total = new Date(anio, mes + 1, 0).getDate();
    return [...Array(primerDia).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  })();

  // ==========================================
  // MODAL SELECTOR REUTILIZABLE
  // ==========================================
  // Se utiliza para seleccionar mes, año, hora y minuto.

  const renderModalSelector = (tipo: string, titulo: string, data: any[], onSelect: (val: any) => void, fmt = (v: any) => v) => (
    <Modal visible={modal === tipo} transparent animationType="fade" onRequestClose={() => setModal('nuevo')}>
      <View style={s.overlay}>
        <View style={[s.content, { maxHeight: '50%' }]}>
          <Text style={s.modalTitle}>{titulo}</Text>
          <FlatList data={data} keyExtractor={(i, idx) => idx.toString()} renderItem={({ item }) => (
            <TouchableOpacity style={s.item} onPress={() => { onSelect(item); setModal('nuevo'); }}>
              <Text style={s.itemText}>{fmt(item)}</Text>
            </TouchableOpacity>
          )} />
          <TouchableOpacity style={s.closeBtn} onPress={() => setModal('nuevo')}><Text style={s.closeText}>Cancelar</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* ========================================== */}
      {/* ENCABEZADO DE LA PANTALLA */}
      {/* ========================================== */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#F8E9E9" /></TouchableOpacity>
        <Text style={s.title}>Calendario</Text>
        <TouchableOpacity onPress={() => setModal('lista')}><Ionicons name="list" size={24} color="#F8E9E9" /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ========================================== */}
        {/* SELECTORES DE MES Y AÑO */}
        {/* ========================================== */}
        <View style={s.selectors}>
          <TouchableOpacity style={s.selBtn} onPress={() => setModal('mes')}><Text style={s.selText}>{MESES[mes]}</Text><Ionicons name="chevron-down" size={18} color="#F8E9E9" /></TouchableOpacity>
          <TouchableOpacity style={s.selBtn} onPress={() => setModal('anio')}><Text style={s.selText}>{anio}</Text><Ionicons name="chevron-down" size={18} color="#F8E9E9" /></TouchableOpacity>
        </View>

        {/* ========================================== */}
        {/* CABECERA DE DÍAS DE LA SEMANA */}
        {/* ========================================== */}
        <View style={s.row}>{DIAS_SEMANA.map((d, i) => <Text key={i} style={s.weekDay}>{d}</Text>)}</View>

        {/* ========================================== */}
        {/* CUADRÍCULA DE DÍAS DEL MES */}
        {/* ========================================== */}
        <View style={s.grid}>
          {diasMes.map((d, i) => {
            const ev = d ? eventos.find(e => aplicaFecha(e, d, mes, anio)) : null;
            const sel = d === diaSel;
            return (
              <TouchableOpacity key={i} style={[s.cell, !d && s.empty, sel && s.selCell, ev && s.hasEv]} disabled={!d} onPress={() => d && setDiaSel(d)}>
                {d && (
                  <View style={{ alignItems: 'center', width: '100%' }}>
                    <Text style={[s.dayText, (sel || ev) && s.selDayText]}>{d}</Text>
                    {ev && <Text style={s.miniEv} numberOfLines={1}>{ev.nombre}</Text>}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ========================================== */}
        {/* LISTA DE EVENTOS DEL DÍA SELECCIONADO */}
        {/* ========================================== */}
        <View style={{ marginTop: 20 }}>
          <View style={s.evHeader}>
            <Text style={s.evTitle}>Eventos del {diaSel} de {MESES[mes]}</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => setModal('nuevo')}><Ionicons name="add" size={20} color="#FFF" /><Text style={{ color: '#FFF', marginLeft: 4 }}>Añadir</Text></TouchableOpacity>
          </View>
          {eventosDelDia.length === 0 ? (
            <View style={s.card}><Ionicons name="calendar-outline" size={24} color="#006EDB" /><Text style={{ color: '#F8E9E9', marginLeft: 10 }}>Sin eventos.</Text></View>
          ) : (
            eventosDelDia.map(e => (
              <View key={e.id} style={s.cardEv}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#F8E9E9', fontSize: 16, fontWeight: '500' }}>{e.nombre}</Text>
                  <Text style={{ color: '#aaa', fontSize: 13, marginTop: 2 }}>🕒 {e.hora} {e.repiteSiempre ? '• Siempre' : e.repiteSemanal ? '• Semanal' : e.repiteMensual ? '• Mensual' : ''}</Text>
                </View>
                <TouchableOpacity onPress={() => eliminarEvento(e.id)}><Ionicons name="trash-outline" size={20} color="#ff4444" /></TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ========================================== */}
      {/* MODAL PARA CREAR NUEVO EVENTO */}
      {/* ========================================== */}
      <Modal visible={modal === 'nuevo'} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <View style={s.overlay}>
          <View style={[s.content, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalTitle}>Nuevo Evento ({diaSel} de {MESES[mes]})</Text>
              <Text style={s.label}>Nombre:</Text>
              <TextInput style={s.input} placeholder="Ej. Reunión" placeholderTextColor="#888" value={nombre} onChangeText={setNombre} />
              
              <Text style={s.label}>Hora:</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity style={[s.timeBtn, { flex: 1, marginRight: 8 }]} onPress={() => setModal('hora')}><Text style={{ color: '#F8E9E9' }}>{hora}</Text></TouchableOpacity>
                <TouchableOpacity style={[s.timeBtn, { flex: 1, marginLeft: 8 }]} onPress={() => setModal('minuto')}><Text style={{ color: '#F8E9E9' }}>{minuto}</Text></TouchableOpacity>
              </View>

              {[['Siempre', repSiemp, setRepSiemp], ['Semanal', repSem, setRepSem], ['Mensual', repMen, setRepMen]].map(([label, val, set]: any, idx) => (
                <View key={idx}>
                  <Text style={s.label}>¿Repetir {label.toLowerCase()}?</Text>
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity style={[s.repBtn, val && s.repAct]} onPress={() => set(true)}><Text style={s.repText}>Sí</Text></TouchableOpacity>
                    <TouchableOpacity style={[s.repBtn, !val && s.repAct]} onPress={() => set(false)}><Text style={s.repText}>No</Text></TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={{ flexDirection: 'row', marginTop: 20 }}>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#493936' }]} onPress={() => setModal(null)}><Text style={{ color: '#F8E9E9' }}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#006EDB' }]} onPress={agregarEvento}><Text style={{ color: '#F8E9E9' }}>Guardar</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================== */}
      {/* MODAL DE LISTA DE TODOS LOS EVENTOS */}
      {/* ========================================== */}
      <Modal visible={modal === 'lista'} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <View style={s.overlay}>
          <View style={[s.content, { maxHeight: '85%' }]}>
            <Text style={s.modalTitle}>Todos los Eventos</Text>
            {eventos.length === 0 ? <Text style={{ color: '#F8E9E9', textAlign: 'center', margin: 20 }}>No hay eventos.</Text> : (
              <FlatList data={eventos} keyExtractor={i => i.id} renderItem={({ item }) => (
                <View style={s.cardEv}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#F8E9E9', fontWeight: '500' }}>{item.nombre}</Text>
                    <Text style={{ color: '#aaa', fontSize: 12 }}>{item.dia} de {MESES[item.mes]} {item.anio} - {item.hora}</Text>
                  </View>
                  <TouchableOpacity onPress={() => eliminarEvento(item.id)}><Ionicons name="trash-outline" size={20} color="#ff4444" /></TouchableOpacity>
                </View>
              )} />
            )}
            <TouchableOpacity style={s.closeBtn} onPress={() => setModal(null)}><Text style={s.closeText}>Cerrar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================== */}
      {/* SELECTORES DESPLEGABLES (MES, AÑO, HORA, MINUTO) */}
      {/* ========================================== */}
      {renderModalSelector('mes', 'Selecciona un Mes', MESES, (i) => setMes(MESES.indexOf(i)))}
      {renderModalSelector('anio', 'Selecciona un Año', ANIOS, setAnio)}
      {renderModalSelector('hora', 'Selecciona la Hora', HORAS, setHora, h => `${h} hrs`)}
      {renderModalSelector('minuto', 'Selecciona el Minuto', MINUTOS, setMinuto, m => `${m} min`)}
    </SafeAreaView>
  );
}

// ==========================================
// ESTILOS DE LA PANTALLA DE CALENDARIO
// ==========================================

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000040' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
  title: { color: '#F8E9E9', fontSize: 24 },
  scroll: { paddingBottom: 30, paddingHorizontal: 16 },
  selectors: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15 },
  selBtn: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0c0c5a', borderRadius: 12, padding: 14, marginHorizontal: 4 },
  selText: { color: '#F8E9E9', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  weekDay: { color: '#F8E9E9', fontSize: 14, fontWeight: 'bold', width: '14%', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#0c0c5a', borderRadius: 14, padding: 10 },
  cell: { width: '14.28%', height: 65, alignItems: 'center', paddingTop: 6, marginBottom: 6 },
  empty: { backgroundColor: 'transparent' },
  selCell: { backgroundColor: '#1a1a8c', borderRadius: 8 },
  hasEv: { backgroundColor: '#141452', borderRadius: 8, borderWidth: 1, borderColor: '#006EDB' },
  dayText: { color: '#F8E9E9', fontSize: 14 },
  selDayText: { fontWeight: 'bold', color: '#FFF' },
  miniEv: { color: '#80bfff', fontSize: 9, textAlign: 'center', marginTop: 2 },
  evHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  evTitle: { color: '#F8E9E9', fontSize: 16 },
  addBtn: { flexDirection: 'row', backgroundColor: '#006EDB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0c0c5a', padding: 16, borderRadius: 14 },
  cardEv: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0c0c5a', padding: 14, borderRadius: 14, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#006EDB' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  content: { width: '85%', backgroundColor: '#0c0c5a', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#F8E9E9', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  label: { color: '#F8E9E9', fontSize: 14, marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: '#1a1a7a', color: '#F8E9E9', padding: 12, borderRadius: 8, fontSize: 16 },
  timeBtn: { backgroundColor: '#1a1a7a', padding: 12, borderRadius: 8, alignItems: 'center' },
  repBtn: { flex: 1, backgroundColor: '#493936', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 3 },
  repAct: { backgroundColor: '#006EDB' },
  repText: { color: '#F8E9E9', fontSize: 13, fontWeight: 'bold' },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a7a', alignItems: 'center' },
  itemText: { color: '#F8E9E9', fontSize: 16 },
  closeBtn: { marginTop: 15, backgroundColor: '#493936', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  closeText: { color: '#F8E9E9', fontSize: 16 },
});
