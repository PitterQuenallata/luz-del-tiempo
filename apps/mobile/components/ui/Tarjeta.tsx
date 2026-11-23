import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colores, radios } from '@/lib/theme';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  /** Degradado de banda de la web (azul con borde dorado) para destacar una tarjeta. */
  destacada?: boolean;
  accesible?: string;
  /** Sin relleno interior (para tarjetas con foto a todo el ancho). */
  sinRelleno?: boolean;
};

/** Tarjeta base: superficie noche-800 con borde dorado suave. */
export function Tarjeta({ children, onPress, style, destacada, accesible, sinRelleno }: Props) {
  const relleno = sinRelleno ? styles.sinPadding : undefined;
  const contenido = destacada ? (
    <LinearGradient
      colors={['#0f1c3a', '#17337a', '#0f1c3a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.interior, relleno]}>
      {children}
    </LinearGradient>
  ) : (
    <View style={[styles.interior, styles.superficie, relleno]}>{children}</View>
  );

  if (!onPress) return <View style={[styles.base, style]}>{contenido}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accesible}
      style={({ pressed }) => [styles.base, style, pressed && styles.presionada]}>
      {contenido}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radios.tarjeta, overflow: 'hidden', borderWidth: 1, borderColor: colores.bordeSuave },
  interior: { padding: 16, gap: 10 },
  superficie: { backgroundColor: colores.noche800 },
  sinPadding: { padding: 0 },
  presionada: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
