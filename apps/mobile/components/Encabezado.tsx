import { Image, StyleSheet, Text, View } from 'react-native';

import { colores, fuentes } from '@/lib/theme';

/** Encabezado con el logo de la marca, igual en todas las secciones (como en la web). */
export function Encabezado() {
  return (
    <View style={styles.encabezado}>
      <Image source={require('../assets/images/logo-marca.png')} style={styles.logo} />
      <Text style={styles.marca}>La Luz del Tiempo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 30, height: 30, borderRadius: 8 },
  marca: { color: colores.niebla100, fontFamily: fuentes.titulo, fontSize: 18 },
});
