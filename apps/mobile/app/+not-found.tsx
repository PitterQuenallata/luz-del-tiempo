import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colores } from '@/lib/theme';

export default function NoEncontradaScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrada' }} />
      <View style={styles.contenedor}>
        <Text style={styles.titulo}>Esta pantalla no existe.</Text>
        <Link href="/" style={styles.enlace}>
          <Text style={styles.textoEnlace}>Ir al inicio</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colores.noche900 },
  titulo: { fontSize: 20, fontWeight: 'bold', color: colores.niebla100 },
  enlace: { marginTop: 15, paddingVertical: 15 },
  textoEnlace: { fontSize: 14, color: colores.oro500 },
});
