import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colores, fuentes, radios } from '@/lib/theme';

type Opcion = { id: string; titulo: string };

type Props = {
  opciones: Opcion[];
  valor: string;
  onCambiar: (id: string) => void;
  etiqueta: string;
};

/** Filtros en píldora, como los de la web (.chips). Una sola opción activa a la vez. */
export function Chips({ opciones, valor, onCambiar, etiqueta }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.fila}
      accessibilityLabel={etiqueta}>
      {opciones.map((o) => {
        const activa = o.id === valor;
        return (
          <Pressable
            key={o.id}
            onPress={() => onCambiar(o.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: activa }}
            style={[styles.pildora, activa && styles.pildoraActiva]}>
            <Text style={[styles.texto, activa && styles.textoActivo]}>{o.titulo}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fila: { gap: 8, paddingVertical: 4 },
  pildora: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radios.boton,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.noche800,
  },
  pildoraActiva: { backgroundColor: colores.oro500, borderColor: colores.oro500 },
  texto: { color: colores.niebla200, fontFamily: fuentes.cuerpoMedio, fontSize: 14 },
  textoActivo: { color: colores.noche900, fontFamily: fuentes.cuerpoFuerte },
});
