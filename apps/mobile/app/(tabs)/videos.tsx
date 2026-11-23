import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Image, Linking, SectionList, StyleSheet, Text, View } from 'react-native';

import { alturaBarra } from '@/components/BarraNavegacion';
import { EstadoLista } from '@/components/EstadoLista';
import { Chips } from '@/components/ui/Chips';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Etiqueta, Titulo } from '@/components/ui/Tipo';
import { api, enlaceYoutube, miniaturaYoutube } from '@/lib/api';
import { colores, fuentes } from '@/lib/theme';
import type { Video } from '@/lib/types';

const TODAS = 'todas';

/** Videos: filtro por área (como en la web) y agrupados por serie. */
export default function VideosScreen() {
  const videos = useQuery({ queryKey: ['videos'], queryFn: api.videos });
  const areas = useQuery({ queryKey: ['areas'], queryFn: api.areas });
  const [area, setArea] = useState<string>(TODAS);

  const opciones = [
    { id: TODAS, titulo: 'Todas' },
    ...(areas.data ?? []).map((a) => ({ id: a.slug, titulo: a.name })),
  ];

  const secciones = useMemo(() => {
    const filtrados = (videos.data ?? []).filter((v) => area === TODAS || v.areaSlug === area);
    const grupos = new Map<string, Video[]>();
    for (const v of filtrados) {
      const clave = v.seriesName ?? 'Otros videos';
      grupos.set(clave, [...(grupos.get(clave) ?? []), v]);
    }
    return [...grupos.entries()].map(([titulo, data]) => ({ titulo, data }));
  }, [videos.data, area]);

  const vacia = !videos.isLoading && !videos.isError && secciones.length === 0;

  return (
    <SectionList
      sections={secciones}
      keyExtractor={(item) => item.youtubeId}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.lista}
      refreshing={videos.isRefetching}
      onRefresh={() => videos.refetch()}
      ListHeaderComponent={
        <View style={styles.filtros}>
          <Chips opciones={opciones} valor={area} onCambiar={setArea} etiqueta="Filtrar videos por área" />
        </View>
      }
      ListEmptyComponent={
        <EstadoLista
          cargando={videos.isLoading}
          error={videos.isError}
          vacia={vacia}
          textoVacia="No hay videos en esta área todavía."
          onReintentar={() => videos.refetch()}
        />
      }
      renderSectionHeader={({ section }) => <Titulo style={styles.serie}>{section.titulo}</Titulo>}
      renderItem={({ item }) => (
        <Tarjeta
          sinRelleno
          onPress={() => Linking.openURL(enlaceYoutube(item.youtubeId))}
          accesible={`Ver video: ${item.title}`}>
          <Image source={{ uri: miniaturaYoutube(item.youtubeId) }} style={styles.miniatura} />
          <View style={styles.cuerpo}>
            <Titulo style={styles.titulo}>{item.title}</Titulo>
            <Text style={styles.fecha}>{new Date(item.publishedAt).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>
        </Tarjeta>
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16, gap: 14, paddingBottom: alturaBarra },
  filtros: { marginBottom: 10 },
  serie: { fontSize: 18, marginTop: 10, marginBottom: 4 },
  miniatura: { width: '100%', aspectRatio: 16 / 9 },
  cuerpo: { padding: 14, gap: 4 },
  titulo: { fontSize: 17, lineHeight: 22 },
  fecha: { color: colores.niebla400, fontFamily: fuentes.cuerpo, fontSize: 13 },
});
