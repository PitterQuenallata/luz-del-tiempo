import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { alturaBarra } from '@/components/BarraNavegacion';
import { EstadoLista } from '@/components/EstadoLista';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Etiqueta, Titulo } from '@/components/ui/Tipo';
import { api } from '@/lib/api';
import { colores, fuentes } from '@/lib/theme';

type Icono = React.ComponentProps<typeof Ionicons>['name'];

export default function ContactoScreen() {
  const sitio = useQuery({ queryKey: ['site'], queryFn: api.site });

  if (!sitio.data) {
    return <EstadoLista cargando={sitio.isLoading} error={sitio.isError} vacia={false} textoVacia="" onReintentar={() => sitio.refetch()} />;
  }
  const s = sitio.data;
  const redes = s.redes ?? {};

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <Titulo>Escríbenos o llámanos</Titulo>
      <Tarjeta>
        {s.whatsappDisplay ? (
          <Fila icono="logo-whatsapp" texto={s.whatsappDisplay} onPress={() => Linking.openURL(`https://wa.me/${s.whatsapp}`)} />
        ) : null}
        {s.email ? <Fila icono="mail-outline" texto={s.email} onPress={() => Linking.openURL(`mailto:${s.email}`)} /> : null}
        {s.address ? <Fila icono="location-outline" texto={s.address} /> : null}
      </Tarjeta>

      <Etiqueta>Síguenos</Etiqueta>
      <Tarjeta>
        {redes.youtube ? <Fila icono="logo-youtube" texto="YouTube" onPress={() => Linking.openURL(redes.youtube!)} /> : null}
        {redes.facebook ? <Fila icono="logo-facebook" texto="Facebook" onPress={() => Linking.openURL(redes.facebook!)} /> : null}
        {redes.tiktok ? <Fila icono="logo-tiktok" texto="TikTok" onPress={() => Linking.openURL(redes.tiktok!)} /> : null}
      </Tarjeta>
    </ScrollView>
  );
}

function Fila({ icono, texto, onPress }: { icono: Icono; texto: string; onPress?: () => void }) {
  const contenido = (
    <View style={styles.fila}>
      <Ionicons name={icono} size={20} color={colores.oro500} />
      <Text style={styles.filaTexto}>{texto}</Text>
    </View>
  );
  if (!onPress) return contenido;
  return (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={texto}>
      {contenido}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, gap: 14, paddingBottom: alturaBarra },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  filaTexto: { color: colores.niebla100, fontFamily: fuentes.cuerpoMedio, fontSize: 15, flex: 1 },
});
