import { useQuery } from '@tanstack/react-query';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { alturaBarra } from '@/components/BarraNavegacion';
import { EstadoLista } from '@/components/EstadoLista';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Cuerpo, Etiqueta } from '@/components/ui/Tipo';
import { api } from '@/lib/api';
import { colores, fuentes } from '@/lib/theme';

export default function QuienesSomosScreen() {
  const personas = useQuery({ queryKey: ['people'], queryFn: api.people });

  if (!personas.data) {
    return <EstadoLista cargando={personas.isLoading} error={personas.isError} vacia={false} textoVacia="" onReintentar={() => personas.refetch()} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      {personas.data.map((p) => (
        <Tarjeta key={p.name}>
          <View style={styles.persona}>
            {p.photoUrl ? <Image source={{ uri: p.photoUrl }} style={styles.foto} /> : <View style={styles.foto} />}
            <View style={styles.texto}>
              <Text style={styles.nombre}>{p.name}</Text>
              <Etiqueta>{p.role}</Etiqueta>
            </View>
          </View>
          <Cuerpo>{p.bio}</Cuerpo>
        </Tarjeta>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, gap: 14, paddingBottom: alturaBarra },
  persona: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  foto: { width: 56, height: 56, borderRadius: 28, backgroundColor: colores.noche700 },
  texto: { flex: 1, gap: 2 },
  nombre: { color: colores.niebla100, fontFamily: fuentes.cuerpoFuerte, fontSize: 16 },
});
