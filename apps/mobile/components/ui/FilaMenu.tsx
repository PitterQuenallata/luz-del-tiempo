import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Cuerpo, Titulo } from '@/components/ui/Tipo';
import { colores, radios } from '@/lib/theme';

type Props = {
  icono: React.ComponentProps<typeof Ionicons>['name'];
  titulo: string;
  descripcion?: string;
  onPress: () => void;
};

/** Fila de menú estándar: ícono, título, descripción y flecha. Lleva a su propia página. */
export function FilaMenu({ icono, titulo, descripcion, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      style={({ pressed }) => [styles.fila, pressed && { opacity: 0.8 }]}>
      <View style={styles.icono}>
        <Ionicons name={icono} size={22} color={colores.oro400} />
      </View>
      <View style={styles.texto}>
        <Titulo style={styles.titulo}>{titulo}</Titulo>
        {descripcion ? <Cuerpo style={styles.descripcion}>{descripcion}</Cuerpo> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colores.niebla400} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radios.tarjeta,
    backgroundColor: colores.noche800,
    borderWidth: 1,
    borderColor: colores.bordeSuave,
  },
  icono: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colores.noche900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: { flex: 1, gap: 2 },
  titulo: { fontSize: 17 },
  descripcion: { fontSize: 13 },
});
