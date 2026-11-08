# 📱 MobiAmigo — Aplicación Móvil de Asistencia y Accesibilidad en Smartphones para el Adulto Mayor

**Equipo:** MoviAmigo Team  
**Integrantes:** Pablo Gajardo · Martín Rivas · Lucciano Parra · Franco Constanzo · Kevin Viveros  
**Carrera:** Técnico Universitario en Informática  
**Institución:** Universidad Técnica Federico Santa María (UTFSM)  
---


## 🔍 Contexto, Situación Actual y Problemas Detectados

En la actualidad, los teléfonos inteligentes convencionales están diseñados para usuarios nativos digitales, presentando pantallas sobrecargadas de iconos pequeños, notificaciones y configuraciones complejas. Para las personas de la tercera edad, realizar una llamada, revisar un recordatorio médico o abrir una aplicación cotidiana se convierte en un desafío que genera frustración, riesgo de desconfiguración involuntaria, pérdida de comunicación y dependencia constante de familiares o vecinos.

### Problemas Principales Detectados
- **Sobrecarga Visual e Interfaces Complejas:** Decenas de aplicaciones preinstaladas con iconos y textos reducidos.
- **Riesgo de Desconfiguración y Seguridad:** Modificación accidental de ajustes o exposición a enlaces desconocidos.
- **Pérdida de Comunicación y Autonomía:** Barreras para contactar familiares o recordar horarios de medicamentos y citas médicas.
- **Dependencia Continua de Terceros:** Necesidad de asistencia reiterada por parte de familiares o voluntarios.
- **Obsolescencia de Dispositivos Físicos Especializados:** Los teléfonos físicos para adultos mayores suelen ser antiguos frente a los smartphones actuales.

---

## 🎯 Objetivos del Proyecto

### Objetivo Principal
Desarrollar e implementar una aplicación móvil de asistencia y accesibilidad (**MobiAmigo**) que permita a los adultos mayores utilizar las funciones esenciales de su smartphone (aplicaciones frecuentes, recordatorios, calendario y contactos) de manera cómoda, autónoma, segura y libre de confusión.

### Objetivos Específicos
1. **Construir el Módulo Lanzador y Gestor de Aplicaciones Favoritas:** Permitir seleccionar, abrir y eliminar aplicaciones instaladas en el dispositivo ([`app/index.tsx`](./app/index.tsx), [`app/opcionesapps.tsx`](./app/opcionesapps.tsx), [`app/agregarapps.tsx`](./app/agregarapps.tsx) y [`app/eliminarapps.tsx`](./app/eliminarapps.tsx)).
2. **Implementar el Sistema de Recordatorios Rápidos en Primer Plano:** Mostrar recordatorios destacados en la parte superior de la pantalla principal ([`app/agregarecordatorio.tsx`](./app/agregarecordatorio.tsx)).
3. **Desarrollar el Módulo de Calendario Interactivo y Eventos Recurrentes:** Soportar agendamiento de eventos únicos y repetitivos (*Siempre/Diario*, *Semanal* y *Mensual*) ([`app/calendario.tsx`](./app/calendario.tsx)).
4. **Integrar el Acceso a Contactos Frecuentes:** Conectar la interfaz principal con la agenda nativa del teléfono mediante `expo-contacts`.
5. **Garantizar Accesibilidad Visual y Operación Offline:** Interfaz de alto contraste (`#000040` / `#F8E9E9`) con botones de gran tamaño y almacenamiento local persistente con `AsyncStorage`.

---

## 🔄 Entradas y Salidas del Sistema

### Entradas
- **Usuario/Asistente:** Selección de aplicaciones instaladas en el teléfono para fijarlas o retirarlas del inicio.
- **Usuario/Asistente:** Texto descriptivo de un nuevo recordatorio rápido.
- **Usuario/Asistente:** Datos de un evento de calendario (nombre, día/mes/año, hora/minuto y modalidad de repetición: *Siempre*, *Semanal* o *Mensual*).
- **Usuario/Asistente:** Permiso de acceso a contactos y selección de un contacto desde el selector nativo del dispositivo.
- **Usuario:** Toque sobre la tarjeta de una aplicación agregada para iniciarla.

### Salidas
- Panel principal de alto contraste con tarjetas de aplicaciones frecuentes y botones de acción de `180px` de altura.
- Lista ordenada alfabéticamente de aplicaciones instaladas disponibles para agregar (excluyendo las ya agregadas).
- Depuración automática en memoria de aplicaciones que hayan sido desinstaladas del teléfono (evitando "aplicaciones fantasma").
- Tarjetas de recordatorios visibles en primer plano con opción de eliminación directa.
- Cuadrícula de calendario mensual con indicadores de eventos por día y modal de lista general de todos los eventos.
- Ejecución inmediata de la aplicación externa seleccionada mediante su `packageName`.

---

## 📌 Requerimientos del Sistema

### Requerimientos Funcionales (RF)
- **RF-01 — Gestión de Aplicaciones en Pantalla Principal:** Seleccionar aplicaciones instaladas en el dispositivo para fijarlas en la pantalla principal con iconos grandes y texto claro ([`app/agregarapps.tsx`](./app/agregarapps.tsx)).
- **RF-02 — Eliminación y Menú de Opciones de Aplicaciones:** Retirar aplicaciones de la interfaz de MobiAmigo sin desinstalarlas del teléfono, mostrando el menú intermedio Añadir/Eliminar cuando ya existen apps configuradas ([`app/opcionesapps.tsx`](./app/opcionesapps.tsx), [`app/eliminarapps.tsx`](./app/eliminarapps.tsx)).
- **RF-03 — Lanzamiento Directo y Verificación Automática de Apps:** Abrir cualquier aplicación fijada con un toque y verificar automáticamente al cargar si las apps guardadas siguen instaladas ([`app/index.tsx`](./app/index.tsx)).
- **RF-04 — Gestión de Recordatorios Rápidos en Primer Plano:** Crear recordatorios multilínea con altura dinámica y mostrarlos al inicio de la pantalla principal ([`app/agregarecordatorio.tsx`](./app/agregarecordatorio.tsx)).
- **RF-05 — Calendario Mensual y Eventos Recurrentes:** Agendar y consultar eventos por día, mes y año con hora exacta y repetición (*Siempre*, *Semanal*, *Mensual*) ([`app/calendario.tsx`](./app/calendario.tsx)).
- **RF-06 — Integración de Contactos Frecuentes:** Solicitar permisos y abrir el selector nativo de contactos (`expo-contacts`) desde la pantalla principal ([`app/index.tsx`](./app/index.tsx)).
- **RF-07 — Persistencia de Datos Local:** Almacenar localmente en el dispositivo las colecciones `@mis_apps`, `@mis_recordatorios`, `@eventos_calendario` y `@mis_contactos` mediante `AsyncStorage`.

### Requerimientos No Funcionales (RNF y Métricas)

| Código | Tipo | Descripción del Requerimiento | Métrica / Criterio |
| :--- | :--- | :--- | :--- |
| **RNF-01** | No Funcional | Ejecutarse en dispositivos Android 10 o superior mediante compilación Expo / EAS. | Funciona en $\ge 95\%$ de dispositivos Android 10+. |
| **RNF-02** | No Funcional | Interfaz de alto contraste (`#000040` / `#F8E9E9`) con botones e iconos de gran tamaño. | Botones principales de `180px` de alto y fuentes de `16px` a `32px`. |
| **RNF-03** | No Funcional | Interfaz intuitiva que permita completar acciones clave con mínima interacción. | $100\%$ de los casos de uso principales se completan en $\le 3$ toques. |
| **RNF-04** | No Funcional | Tiempos de carga y apertura de aplicaciones rápidos en equipos de gama media/baja. | Tiempo de respuesta y apertura de apps $\le 1,5\text{ s}$. |
| **RNF-05** | No Funcional | Operación autónoma sin conexión a internet y persistencia local íntegra. | $100\%$ de disponibilidad offline en apps, recordatorios y calendario. |

---

## 🛠️ Plataforma de Desarrollo y Arquitectura

| Componente | Tecnología / Librería | Propósito en MobiAmigo |
| :--- | :--- | :--- |
| **Framework Móvil** | `React Native 0.81.5` + `Expo ~54.0.36` | Base móvil multiplataforma optimizada para Android. |
| **Lenguaje** | `TypeScript ~5.9.2` | Tipado estático de entidades (`AppInfo`, `ContactInfo`, `Evento`). |
| **Navegación** | `expo-router ~6.0.24` | Enrutamiento basado en archivos dentro del directorio [`app/`](./app). |
| **Lanzador Nativo** | `react-native-launcher-kit ^3.0.0` | Lectura de apps instaladas (`InstalledApps`) y ejecución (`RNLauncherKitHelper`). |
| **Agenda de Contactos** | `expo-contacts ~15.0.11` | Permisos en tiempo de ejecución y selector nativo (`presentContactPickerAsync`). |
| **Persistencia Offline** | `@react-native-async-storage/async-storage 2.2.0` | Almacenamiento local JSON sin necesidad de conexión a internet. |
| **Compilación Cloud** | `EAS Build` ([`eas.json`](./eas.json)) | Generación de compilaciones Android (`development`, `preview`, `production`). |

### Estructura del Proyecto (`app/`)
- [`app/_layout.tsx`](./app/_layout.tsx): Configura el `Stack` de navegación ocultando el encabezado nativo.
- [`app/index.tsx`](./app/index.tsx): Pantalla principal (recordatorios activos, cuadrícula de aplicaciones favoritas y botones de acceso a **Añadir Apps**, **Añadir Recordatorio**, **Agregar Contactos** y **Calendario**).
- [`app/opcionesapps.tsx`](./app/opcionesapps.tsx): Pantalla de selección de acción (**Añadir app** o **Eliminar app**).
- [`app/agregarapps.tsx`](./app/agregarapps.tsx): Listado y selección de aplicaciones instaladas en el dispositivo que aún no están en el inicio.
- [`app/eliminarapps.tsx`](./app/eliminarapps.tsx): Selección y retiro de aplicaciones fijadas en la pantalla principal.
- [`app/agregarecordatorio.tsx`](./app/agregarecordatorio.tsx): Formulario para crear recordatorios rápidos con campo de texto autoajustable.
- [`app/calendario.tsx`](./app/calendario.tsx): Calendario mensual interactivo, creación de eventos con repetición y listado global de eventos.

---

## 🚀 Instalación y Ejecución

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar el servidor de desarrollo:**
   ```bash
   npx expo start
   ```

3. **Ejecutar en dispositivo o emulador Android (Development Build):**
   ```bash
   npx expo run:android
   ```

---

## 📝 Bitácora de Avances y Modificaciones

- **`[30-09-2026]` Versión Base en React Native y Expo (`65791bc`):** Implementación inicial con Expo Router, lanzador de aplicaciones (`react-native-launcher-kit`), gestión de apps (`agregarapps.tsx`, `eliminarapps.tsx`, `opcionesapps.tsx`) y recordatorios rápidos (`agregarecordatorio.tsx`).
- **`[23-10-2026]` Integración de Contactos y Configuración EAS (`0b4d888`, `ffa1ca2`, `60fa794`):** Incorporación de `expo-contacts`, botón de contactos en la pantalla principal y configuración de `eas.json`.
- **`[30-10-2026]` Módulo de Calendario Interactivo (`2f083dc`, `bfb5ff3`):** Implementación de `app/calendario.tsx` con cuadrícula mensual, eventos recurrentes (*Siempre*, *Semanal*, *Mensual*) y vista general de eventos.
- **`[08-11-2026]` Selector Nativo de Contactos, Comentarios en Español y Documentación (`5f679b9`, `7b927b7`, `e8a331d`, `842871e`, `392265f`):** Actualización de `getContacts` con `presentContactPickerAsync()`, documentación en español de los módulos de código e informe técnico completo en **`MobiAmigo_Documentacion.docx`**.
