import Constants from 'expo-constants';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { alturaBarra } from '@/components/BarraNavegacion';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Titulo } from '@/components/ui/Tipo';
import { API_URL } from '@/lib/api';
import { colores, fuentes } from '@/lib/theme';

/** Datos de la app: versión, compilación y conexión. Útil para soporte. */
export default function AcercaScreen() {
  const config = Constants.expoConfig;
  const filas: [string, string][] = [
    ['Versión', config?.version ?? '—'],
    ['Compilación Android', String(config?.android?.versionCode ?? '—')],
    ['Compilación iOS', config?.ios?.buildNumber ?? '—'],
    ['Identificador', config?.android?.package ?? config?.ios?.bundleIdentifier ?? '—'],
    ['Conexión con la API', API_URL],
  ];

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <Titulo>La Luz del Tiempo</Titulo>
      <Tarjeta>
        {filas.map(([etiqueta, valor]) => (
          <View key={etiqueta} style={styles.fila}>
            <Text style={styles.etiqueta}>{etiqueta}</Text>
            <Text style={styles.valor} selectable>
              {valor}
            </Text>
          </View>
        ))}
      </Tarjeta>
      <Text style={styles.pie}>Ministerio La Luz del Tiempo · Bolivia</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, gap: 16, paddingBottom: alturaBarra },
  fila: { gap: 2, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colores.bordeSuave },
  etiqueta: { color: colores.niebla400, fontFamily: fuentes.cuerpo, fontSize: 13 },
  valor: { color: colores.niebla100, fontFamily: fuentes.cuerpoMedio, fontSize: 15 },
  pie: { color: colores.niebla400, fontFamily: fuentes.cuerpo, fontSize: 13, textAlign: 'center' },
});
