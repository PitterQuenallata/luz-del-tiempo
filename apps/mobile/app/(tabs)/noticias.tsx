import { useQuery } from '@tanstack/react-query';
import { FlatList, Image, StyleSheet, View } from 'react-native';

import { EstadoLista } from '@/components/EstadoLista';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Cuerpo, Etiqueta, Titulo } from '@/components/ui/Tipo';
import { api } from '@/lib/api';
import { alturaBarra } from '@/components/BarraNavegacion';

export default function NoticiasScreen() {
  const consulta = useQuery({ queryKey: ['posts'], queryFn: api.posts });
  const datos = consulta.data ?? [];

  return (
    <FlatList
      data={datos}
      keyExtractor={(item) => item.slug}
      contentContainerStyle={styles.lista}
      refreshing={consulta.isRefetching}
      onRefresh={() => consulta.refetch()}
      ListEmptyComponent={
        <EstadoLista
          cargando={consulta.isLoading}
          error={consulta.isError}
          vacia={!consulta.isLoading && !consulta.isError}
          textoVacia="Todavía no hay noticias publicadas."
          onReintentar={() => consulta.refetch()}
        />
      }
      renderItem={({ item }) => (
        <Tarjeta sinRelleno>
          {item.coverUrl ? <Image source={{ uri: item.coverUrl }} style={styles.portada} /> : null}
          <View style={styles.cuerpo}>
            <Etiqueta>{new Date(item.publishedAt).toLocaleDateString('es-BO', { day: 'numeric', month: 'long' })}</Etiqueta>
            <Titulo style={styles.titulo}>{item.title}</Titulo>
            <Cuerpo>{item.excerpt}</Cuerpo>
          </View>
        </Tarjeta>
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16, gap: 16, flexGrow: 1, paddingBottom: alturaBarra },
  portada: { width: '100%', height: 180 },
  cuerpo: { padding: 16, gap: 6 },
  titulo: { fontSize: 19, lineHeight: 24 },
});
