import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colores } from '@/lib/theme';

type Props = {
  cargando: boolean;
  error: boolean;
  vacia: boolean;
  textoVacia: string;
  onReintentar: () => void;
};

/** Estado de carga, error o lista vacía. Se muestra en lugar de la lista. */
export function EstadoLista({ cargando, error, vacia, textoVacia, onReintentar }: Props) {
  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colores.oro500} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centro}>
        <Text style={styles.texto}>No se pudo cargar. Revisa la conexión con la API.</Text>
        <Pressable onPress={onReintentar} style={styles.boton}>
          <Text style={styles.textoBoton}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }
  if (vacia) {
    return (
      <View style={styles.centro}>
        <Text style={styles.texto}>{textoVacia}</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  texto: { color: colores.niebla400, textAlign: 'center', fontSize: 15 },
  boton: { borderWidth: 1, borderColor: colores.oro500, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 20 },
  textoBoton: { color: colores.oro500, fontWeight: '600' },
});
