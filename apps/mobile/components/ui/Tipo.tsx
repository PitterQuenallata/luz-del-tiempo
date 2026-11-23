import { StyleSheet, Text, type TextProps } from 'react-native';

import { colores, fuentes } from '@/lib/theme';

/** Título de sección o pantalla (Clash Display, como la web). */
export function Titulo({ style, ...props }: TextProps) {
  return <Text {...props} style={[estilos.titulo, style]} />;
}

/** Texto de cuerpo (Satoshi). Tono secundario por defecto para descripciones. */
export function Cuerpo({ style, ...props }: TextProps) {
  return <Text {...props} style={[estilos.cuerpo, style]} />;
}

/** Etiqueta pequeña de categoría (tipo oración, en oro, como .eyebrow de la web). */
export function Etiqueta({ style, ...props }: TextProps) {
  return <Text {...props} style={[estilos.etiqueta, style]} />;
}

const estilos = StyleSheet.create({
  titulo: { color: colores.niebla100, fontFamily: fuentes.titulo, fontSize: 22, letterSpacing: -0.2 },
  cuerpo: { color: colores.niebla300, fontFamily: fuentes.cuerpo, fontSize: 15, lineHeight: 21 },
  etiqueta: { color: colores.oro400, fontFamily: fuentes.cuerpoMedio, fontSize: 13 },
});
