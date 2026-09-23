import { useRouter } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
export default function App() {
  const router = useRouter();
  return (
    <View style={styles.container}>

      

      {/* Título */}
      <View style={styles.header}>
        <Text style={styles.titulo}>MobiAmigo</Text>
      </View>


      {/* Botones */}
      <View style={styles.contenedorBotones}>

        {/* Añadir Apps */}
        <Pressable
          style={styles.boton}
          onPress={() => console.log("Añadir Apps")}
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


        {/* Añadir Recordatorio */}
        <Pressable
          style={styles.boton}
          onPress={() => router.push("/agregarecordatorio")}
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

    </View>
  );
}


const styles = StyleSheet.create({
  /*ColorBackGround Inicio*/
  container: {
    flex: 1,
    backgroundColor: '#000040',
    paddingTop: 40,
  },

  /* Encabezado */

  header: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titulo: {
    color: '#F8E9E9',
    fontSize: 40,
    fontWeight: '400',
  },


  /* Contenedor de los dos botones */

  contenedorBotones: {
    flexDirection: 'row',
    justifyContent: 'space-between',

    paddingHorizontal: 16,
    marginTop: 40,
  },


  /* Botones grandes */

  boton: {
    width: '48%',
    height: 330,

    backgroundColor: '#493936',

    borderRadius: 22,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 10,
  },


  textoBoton: {
    color: '#F8E9E9',
    fontSize: 30,
    textAlign: 'center',
    marginTop: 15,
  },

});