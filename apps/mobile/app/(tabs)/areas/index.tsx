import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { alturaBarra } from '@/components/BarraNavegacion';
import { EstadoLista } from '@/components/EstadoLista';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Cuerpo, Titulo } from '@/components/ui/Tipo';
import { api } from '@/lib/api';
import { colores, fuentes } from '@/lib/theme';

/** Áreas del ministerio. Cada una tiene su página con videos, actividades, noticias y contacto. */
export default function AreasScreen() {
  const areas = useQuery({ queryKey: ['areas'], queryFn: api.areas });

  if (!areas.data) {
    return <EstadoLista cargando={areas.isLoading} error={areas.isError} vacia={false} textoVacia="" onReintentar={() => areas.refetch()} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      {areas.data.map((a) => (
        <Tarjeta
          key={a.slug}
          sinRelleno
          onPress={() => router.push(`/areas/${a.slug}`)}
          accesible={`Abrir área ${a.name}`}>
          {a.coverUrl ? <Image source={{ uri: a.coverUrl }} style={styles.portada} /> : null}
          <View style={styles.cuerpo}>
            <View style={[styles.punto, { backgroundColor: a.color }]} />
            <Titulo style={styles.titulo}>{a.name}</Titulo>
            <Cuerpo>{a.summary}</Cuerpo>
            <View style={styles.verArea}>
              <Text style={styles.verAreaTexto}>Ver área</Text>
              <Ionicons name="arrow-forward" size={16} color={colores.oro400} />
            </View>
          </View>
        </Tarjeta>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, gap: 16, paddingBottom: alturaBarra },
  portada: { width: '100%', height: 150 },
  cuerpo: { padding: 16, gap: 6 },
  punto: { width: 10, height: 10, borderRadius: 5 },
  titulo: { fontSize: 19 },
  verArea: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  verAreaTexto: { color: colores.oro400, fontFamily: fuentes.cuerpoMedio, fontSize: 14 },
});
