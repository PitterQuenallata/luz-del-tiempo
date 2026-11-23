import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { alturaBarra } from '@/components/BarraNavegacion';
import { EstadoLista } from '@/components/EstadoLista';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Cuerpo, Etiqueta, Titulo } from '@/components/ui/Tipo';
import { api, enlaceYoutube, miniaturaYoutube } from '@/lib/api';
import { colores, fuentes, radios } from '@/lib/theme';

/** Página de un área: su resumen, contacto, emisora, videos, actividades y noticias. */
export default function AreaScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const areas = useQuery({ queryKey: ['areas'], queryFn: api.areas });
  const emisoras = useQuery({ queryKey: ['stations'], queryFn: api.stations });
  const videos = useQuery({ queryKey: ['videos'], queryFn: api.videos });
  const actividades = useQuery({ queryKey: ['activities', {}], queryFn: () => api.activities() });
  const noticias = useQuery({ queryKey: ['posts'], queryFn: api.posts });

  const area = areas.data?.find((a) => a.slug === slug);

  if (!area) {
    return (
      <EstadoLista
        cargando={areas.isLoading}
        error={areas.isError}
        vacia={!areas.isLoading && !areas.isError}
        textoVacia="Esta área no existe o ya no está publicada."
        onReintentar={() => areas.refetch()}
      />
    );
  }

  const emisora = emisoras.data?.find((s) => s.areaSlug === area.slug);
  const videosArea = (videos.data ?? []).filter((v) => v.areaSlug === area.slug);
  const actividadesArea = (actividades.data ?? []).filter((a) => a.areas.some((x) => x.slug === area.slug));
  const noticiasArea = (noticias.data ?? []).filter((p) => p.areaSlug === area.slug);

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <Stack.Screen options={{ title: area.name }} />

      {area.coverUrl ? <Image source={{ uri: area.coverUrl }} style={styles.portada} /> : null}
      <Titulo style={styles.nombre}>{area.name}</Titulo>
      <Cuerpo>{area.content || area.summary}</Cuerpo>

      {area.whatsapp ? (
        <Pressable
          onPress={() => Linking.openURL(`https://wa.me/${area.whatsapp}?text=${encodeURIComponent(`Hola, quiero saber más sobre el área de ${area.name}`)}`)}
          accessibilityRole="button"
          accessibilityLabel={`Escribir al área de ${area.name} por WhatsApp`}
          style={({ pressed }) => [styles.boton, pressed && { opacity: 0.85 }]}>
          <Ionicons name="logo-whatsapp" size={18} color={colores.noche900} />
          <Text style={styles.botonTexto}>Escribir por WhatsApp</Text>
        </Pressable>
      ) : null}

      {emisora ? (
        <View style={styles.bloque}>
          <Etiqueta>Emisora del área</Etiqueta>
          <Tarjeta onPress={() => router.navigate('/(tabs)')} accesible={`Ir a la radio ${emisora.name}`}>
            <Titulo style={styles.subtitulo}>{emisora.name}</Titulo>
            <Cuerpo>{emisora.description}</Cuerpo>
            <Text style={styles.enlace}>Escuchar en la pestaña Radio</Text>
          </Tarjeta>
        </View>
      ) : null}

      {videosArea.length > 0 ? (
        <View style={styles.bloque}>
          <Titulo style={styles.subtitulo}>Videos</Titulo>
          {videosArea.map((v) => (
            <Tarjeta key={v.youtubeId} sinRelleno onPress={() => Linking.openURL(enlaceYoutube(v.youtubeId))} accesible={`Ver video: ${v.title}`}>
              <Image source={{ uri: miniaturaYoutube(v.youtubeId) }} style={styles.miniatura} />
              <View style={styles.pie}>
                <Text style={styles.textoPie}>{v.title}</Text>
              </View>
            </Tarjeta>
          ))}
        </View>
      ) : null}

      {actividadesArea.length > 0 ? (
        <View style={styles.bloque}>
          <Titulo style={styles.subtitulo}>Actividades</Titulo>
          {actividadesArea.map((a) => (
            <Tarjeta key={a.slug} onPress={() => router.push(`/actividad/${a.slug}`)}>
              <Etiqueta>{a.kindLabel}</Etiqueta>
              <Text style={styles.textoPie}>{a.title}</Text>
              <Cuerpo>{a.inicio ? new Date(a.inicio).toLocaleDateString('es-BO', { day: 'numeric', month: 'long' }) : 'Fecha por confirmar'}</Cuerpo>
            </Tarjeta>
          ))}
        </View>
      ) : null}

      {noticiasArea.length > 0 ? (
        <View style={styles.bloque}>
          <Titulo style={styles.subtitulo}>Noticias</Titulo>
          {noticiasArea.map((p) => (
            <Tarjeta key={p.slug}>
              <Text style={styles.textoPie}>{p.title}</Text>
              <Cuerpo>{p.excerpt}</Cuerpo>
            </Tarjeta>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, gap: 18, paddingBottom: alturaBarra },
  portada: { width: '100%', height: 180, borderRadius: radios.tarjeta },
  nombre: { fontSize: 28 },
  subtitulo: { fontSize: 20 },
  bloque: { gap: 10 },
  boton: {
    height: 48,
    borderRadius: radios.boton,
    backgroundColor: colores.oro500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botonTexto: { color: colores.noche900, fontFamily: fuentes.cuerpoFuerte, fontSize: 15 },
  enlace: { color: colores.oro400, fontFamily: fuentes.cuerpoMedio, fontSize: 14 },
  miniatura: { width: '100%', aspectRatio: 16 / 9 },
  pie: { padding: 12 },
  textoPie: { color: colores.niebla100, fontFamily: fuentes.cuerpoFuerte, fontSize: 15 },
});
