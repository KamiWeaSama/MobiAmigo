import { StyleSheet, Text, View } from 'react-native';

export default function agregarecordatorio() {
    return (
        <View style={styles.container}>
            <Text style={styles.texto}>Nuevo Recordatorio</Text>
        </View>
    );
}


const styles = StyleSheet.create({
    /*ColorBackGround*/
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000040',
    },
    texto: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
