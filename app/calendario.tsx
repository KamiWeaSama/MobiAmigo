// ==========================================
// SECCIÓN DE IMPORTS
// ==========================================

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, FlatList, Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, useColorScheme, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ==========================================
// CONSTANTES DE FECHA Y HORA
// ==========================================

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const ANIOS = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);
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
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // ==========================================
  // PALETA DE COLORES (MODO CLARO / OSCURO AUTOMÁTICO)
  // ==========================================

  const theme = {
    bg: isDark ? '#0F172A' : '#FFFDF9',
    card: isDark ? '#1E293B' : '#FFFFFF',
    cardBorder: isDark ? '#334155' : '#D6D3CD',
    inputBg: isDark ? '#0F172A' : '#F3F4F6',
    text: isDark ? '#F8FAFC' : '#111827',
    subtext: isDark ? '#CBD5E1' : '#4B5563',
    backBg: isDark ? '#1E293B' : '#E5E7EB',
    backBorder: isDark ? '#334155' : '#D1D5DB',
    primary: '#6D28D9',
    accentBlue: '#1D4ED8',
    success: '#15803D',
    danger: '#DC2626',
    inactiveBtn: isDark ? '#334155' : '#E5E7EB',
    inactiveText: isDark ? '#CBD5E1' : '#374151',
    hasEvBg: isDark ? '#312E81' : '#EDE9FE',
  };

  const hoy = new Date();

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
    if (!nombre.trim()) return Alert.alert('Error', 'Ingresa el nombre del evento.');
    const nuevo: Evento = {
      id: Date.now().toString(), nombre: nombre.trim(), hora: `${hora}:${minuto}`,
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

  const renderModalSelector = (tipo: string, titulo: string, data: any[], onSelect: (val: any) => void, fmt = (v: any) => v) => {
    const volverA = (tipo === 'hora' || tipo === 'minuto') ? 'nuevo' : null;
    return (
      <Modal visible={modal === tipo} transparent animationType="fade" onRequestClose={() => setModal(volverA)}>
        <View style={s.overlay}>
          <View style={[s.content, { maxHeight: '60%', backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>{titulo}</Text>
            <FlatList data={data} keyExtractor={(i, idx) => idx.toString()} renderItem={({ item }) => (
              <TouchableOpacity style={[s.item, { borderBottomColor: theme.cardBorder }]} onPress={() => { onSelect(item); setModal(volverA); }}>
                <Text style={[s.itemText, { color: theme.text }]}>{fmt(item)}</Text>
              </TouchableOpacity>
            )} />
            <TouchableOpacity style={[s.closeBtn, { backgroundColor: theme.danger }]} onPress={() => setModal(volverA)}>
              <Text style={s.closeText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.bg }]}>
      {/* ========================================== */}
      {/* ENCABEZADO DE LA PANTALLA */}
      {/* ========================================== */}
      <View style={s.header}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: theme.backBg, borderColor: theme.backBorder }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={26} color={theme.text} />
          <Text style={[s.backBtnText, { color: theme.text }]}>Volver</Text>
        </TouchableOpacity>

        <Text style={[s.title, { color: theme.text }]}>Calendario</Text>

        <TouchableOpacity
          style={[s.listBtn, { backgroundColor: theme.primary }]}
          onPress={() => setModal('lista')}
        >
          <Ionicons name="list" size={24} color="#FFFFFF" />
          <Text style={s.listBtnText}>Ver todos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ========================================== */}
        {/* SELECTORES DE MES Y AÑO */}
        {/* ========================================== */}
        <View style={s.selectors}>
          <TouchableOpacity
            style={[s.selBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => setModal('mes')}
          >
            <Text style={[s.selText, { color: theme.text }]}>{MESES[mes]}</Text>
            <Ionicons name="chevron-down" size={22} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.selBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => setModal('anio')}
          >
            <Text style={[s.selText, { color: theme.text }]}>{anio}</Text>
            <Ionicons name="chevron-down" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* ========================================== */}
        {/* CABECERA DE DÍAS DE LA SEMANA */}
        {/* ========================================== */}
        <View style={s.row}>
          {DIAS_SEMANA.map((d, i) => (
            <Text key={i} style={[s.weekDay, { color: theme.text }]}>{d}</Text>
          ))}
        </View>

        {/* ========================================== */}
        {/* CUADRÍCULA DE DÍAS DEL MES */}
        {/* ========================================== */}
        <View style={[s.grid, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {diasMes.map((d, i) => {
            const ev = d ? eventos.find(e => aplicaFecha(e, d, mes, anio)) : null;
            const sel = d === diaSel;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  s.cell,
                  !d && s.empty,
                  ev && { backgroundColor: theme.hasEvBg, borderRadius: 10, borderWidth: 1.5, borderColor: theme.primary },
                  sel && { backgroundColor: theme.primary, borderRadius: 10 },
                ]}
                disabled={!d}
                onPress={() => d && setDiaSel(d)}
              >
                {d && (
                  <View style={{ alignItems: 'center', width: '100%' }}>
                    <Text
                      style={[
                        s.dayText,
                        { color: sel ? '#FFFFFF' : theme.text },
                        (sel || ev) && s.selDayText,
                      ]}
                    >
                      {d}
                    </Text>
                    {ev && (
                      <Text
                        style={[
                          s.miniEv,
                          { color: sel ? '#FFFFFF' : theme.primary },
                        ]}
                        numberOfLines={1}
                      >
                        • {ev.nombre}
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ========================================== */}
        {/* LISTA DE EVENTOS DEL DÍA SELECCIONADO */}
        {/* ========================================== */}
        <View style={{ marginTop: 22 }}>
          <View style={s.evHeader}>
            <Text style={[s.evTitle, { color: theme.text }]}>
              Eventos del {diaSel} de {MESES[mes]}
            </Text>
            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: theme.success }]}
              onPress={() => setModal('nuevo')}
            >
              <Ionicons name="add-circle" size={24} color="#FFF" />
              <Text style={s.addBtnText}>Añadir</Text>
            </TouchableOpacity>
          </View>

          {eventosDelDia.length === 0 ? (
            <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Ionicons name="calendar-outline" size={28} color={theme.primary} />
              <Text style={{ color: theme.text, marginLeft: 12, fontSize: 18, fontWeight: '600' }}>
                Sin eventos programados para este día.
              </Text>
            </View>
          ) : (
            eventosDelDia.map(e => (
              <View
                key={e.id}
                style={[
                  s.cardEv,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                    borderLeftColor: theme.primary,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>
                    {e.nombre}
                  </Text>
                  <Text style={{ color: theme.subtext, fontSize: 16, marginTop: 4, fontWeight: '500' }}>
                    🕒 {e.hora} hrs {e.repiteSiempre ? '• Todos los días' : e.repiteSemanal ? '• Cada semana' : e.repiteMensual ? '• Cada mes' : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => eliminarEvento(e.id)} style={{ padding: 6 }}>
                  <Ionicons name="trash" size={26} color={theme.danger} />
                </TouchableOpacity>
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
          <View style={[s.content, { maxHeight: '92%', backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[s.modalTitle, { color: theme.text }]}>
                Nuevo Evento ({diaSel} de {MESES[mes]})
              </Text>

              <Text style={[s.label, { color: theme.text }]}>Nombre del evento:</Text>
              <TextInput
                style={[
                  s.input,
                  { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.cardBorder },
                ]}
                placeholder="Ej. Control médico, Reunión..."
                placeholderTextColor={theme.subtext}
                value={nombre}
                onChangeText={setNombre}
              />
              
              <Text style={[s.label, { color: theme.text }]}>Hora:</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity
                  style={[
                    s.timeBtn,
                    { flex: 1, marginRight: 8, backgroundColor: theme.inputBg, borderColor: theme.cardBorder },
                  ]}
                  onPress={() => setModal('hora')}
                >
                  <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>{hora} hrs</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    s.timeBtn,
                    { flex: 1, marginLeft: 8, backgroundColor: theme.inputBg, borderColor: theme.cardBorder },
                  ]}
                  onPress={() => setModal('minuto')}
                >
                  <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>{minuto} min</Text>
                </TouchableOpacity>
              </View>

              {[['Siempre', repSiemp, setRepSiemp], ['Semanal', repSem, setRepSem], ['Mensual', repMen, setRepMen]].map(([label, val, set]: any, idx) => (
                <View key={idx}>
                  <Text style={[s.label, { color: theme.text }]}>¿Repetir {label.toLowerCase()}?</Text>
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                      style={[
                        s.repBtn,
                        { backgroundColor: val ? theme.success : theme.inactiveBtn },
                      ]}
                      onPress={() => set(true)}
                    >
                      <Text style={[s.repText, { color: val ? '#FFFFFF' : theme.inactiveText }]}>Sí</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        s.repBtn,
                        { backgroundColor: !val ? theme.accentBlue : theme.inactiveBtn },
                      ]}
                      onPress={() => set(false)}
                    >
                      <Text style={[s.repText, { color: !val ? '#FFFFFF' : theme.inactiveText }]}>No</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={{ flexDirection: 'row', marginTop: 24 }}>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: theme.danger }]}
                  onPress={() => setModal(null)}
                >
                  <Text style={s.actionBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: theme.success }]}
                  onPress={agregarEvento}
                >
                  <Text style={s.actionBtnText}>Guardar</Text>
                </TouchableOpacity>
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
          <View style={[s.content, { maxHeight: '85%', backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>Todos los Eventos</Text>
            {eventos.length === 0 ? (
              <Text style={{ color: theme.text, textAlign: 'center', margin: 20, fontSize: 18 }}>
                No hay eventos guardados.
              </Text>
            ) : (
              <FlatList data={eventos} keyExtractor={i => i.id} renderItem={({ item }) => (
                <View
                  style={[
                    s.cardEv,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.cardBorder,
                      borderLeftColor: theme.primary,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 19, fontWeight: '700' }}>
                      {item.nombre}
                    </Text>
                    <Text style={{ color: theme.subtext, fontSize: 15, marginTop: 4, fontWeight: '500' }}>
                      📅 {item.dia} de {MESES[item.mes]} {item.anio} • 🕒 {item.hora} hrs
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => eliminarEvento(item.id)} style={{ padding: 6 }}>
                    <Ionicons name="trash" size={26} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              )} />
            )}
            <TouchableOpacity
              style={[s.closeBtn, { backgroundColor: theme.primary }]}
              onPress={() => setModal(null)}
            >
              <Text style={s.closeText}>Cerrar</Text>
            </TouchableOpacity>
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  backBtnText: {
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 6,
  },
  title: { fontSize: 24, fontWeight: '800' },
  listBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  listBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
  scroll: { paddingBottom: 30, paddingHorizontal: 16 },
  selectors: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 14 },
  selBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginHorizontal: 4,
  },
  selText: { fontSize: 19, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekDay: { fontSize: 16, fontWeight: '800', width: '14%', textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 8,
  },
  cell: {
    width: '14.28%',
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  empty: { backgroundColor: 'transparent' },
  dayText: { fontSize: 17, fontWeight: '600' },
  selDayText: { fontWeight: '800' },
  miniEv: { fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  evHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  evTitle: { fontSize: 20, fontWeight: '800', flex: 1, marginRight: 8 },
  addBtn: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  addBtnText: { color: '#FFF', marginLeft: 6, fontSize: 17, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  cardEv: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderLeftWidth: 7,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center' },
  content: { width: '90%', borderRadius: 20, borderWidth: 1.5, padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  input: { padding: 14, borderRadius: 12, borderWidth: 1.5, fontSize: 19 },
  timeBtn: { padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  repBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 4 },
  repText: { fontSize: 17, fontWeight: '800' },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
  actionBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  item: { paddingVertical: 14, borderBottomWidth: 1, alignItems: 'center' },
  itemText: { fontSize: 20, fontWeight: '700' },
  closeBtn: { marginTop: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  closeText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
});
