import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EstadoLista } from '@/components/EstadoLista';
import { Reproductor } from '@/components/Reproductor';
import { Cuerpo, Etiqueta, Titulo } from '@/components/ui/Tipo';
import { api } from '@/lib/api';
import { colores, fuentes, radios } from '@/lib/theme';
import { alturaBarra } from '@/components/BarraNavegacion';

/** Radio: la emisora que suena, las emisoras y la programación de hoy. */
export default function RadioScreen() {
  const emisoras = useQuery({ queryKey: ['stations'], queryFn: api.stations });
  const programacion = useQuery({ queryKey: ['schedule'], queryFn: api.schedule, refetchInterval: 60_000 });
  const envivo = useQuery({ queryKey: ['live'], queryFn: api.live, refetchInterval: 60_000 });

  const [elegida, setElegida] = useState<string | null>(null);
  const lista = emisoras.data ?? [];
  const emisora = useMemo(
    () => lista.find((s) => s.slug === elegida) ?? lista.find((s) => s.isMain) ?? lista[0],
    [lista, elegida],
  );

  const ahora = new Date();
  const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  const programas = programacion.data ?? [];
  const programaActual = programas.find((p) => p.start <= hora && hora < p.end && !p.relleno) ?? null;

  if (!emisora) {
    return (
      <EstadoLista
        cargando={emisoras.isLoading}
        error={emisoras.isError}
        vacia={!emisoras.isLoading && !emisoras.isError}
        textoVacia="No hay emisoras configuradas."
        onReintentar={() => emisoras.refetch()}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <Reproductor emisora={emisora} programaActual={programaActual} enVivo={!!envivo.data?.isLive} />

      <View style={styles.bloque}>
        <Titulo>Emisoras</Titulo>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fila}>
          {lista.map((s) => {
            const activa = s.slug === emisora.slug;
            return (
              <Pressable
                key={s.slug}
                onPress={() => setElegida(s.slug)}
                accessibilityRole="button"
                accessibilityLabel={`Escuchar ${s.name}`}
                accessibilityState={{ selected: activa }}
                style={[styles.emisora, activa && styles.emisoraActiva]}>
                {s.imageUrl ? <Image source={{ uri: s.imageUrl }} style={styles.emisoraImagen} /> : null}
                <Text style={styles.emisoraNombre} numberOfLines={2}>
                  {s.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.bloque}>
        <Titulo>Programación de hoy</Titulo>
        {programacion.isLoading ? <ActivityIndicator color={colores.oro500} /> : null}
        {programacion.isError ? <Cuerpo>No se pudo cargar la programación.</Cuerpo> : null}
        {!programacion.isLoading && !programacion.isError && programas.length === 0 ? (
          <Cuerpo>No hay programas para hoy.</Cuerpo>
        ) : null}
        {programas.map((p) => (
          <View key={`${p.start}-${p.programName}`} style={styles.programa}>
            <Text style={styles.hora}>{p.start}</Text>
            <View style={styles.textoPrograma}>
              <Text style={styles.nombrePrograma}>{p.programName}</Text>
              {p.host ? <Cuerpo style={styles.conductor}>{p.host}</Cuerpo> : null}
            </View>
            {p.isLive ? <Etiqueta>En vivo</Etiqueta> : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, gap: 28, paddingBottom: alturaBarra },
  bloque: { gap: 12 },
  fila: { gap: 10 },
  emisora: {
    width: 150,
    borderRadius: radios.tarjeta,
    borderWidth: 1,
    borderColor: colores.bordeSuave,
    backgroundColor: colores.noche800,
    overflow: 'hidden',
  },
  emisoraActiva: { borderColor: colores.oro500, borderWidth: 2 },
  emisoraImagen: { width: '100%', height: 90 },
  emisoraNombre: { color: colores.niebla100, fontFamily: fuentes.cuerpoFuerte, fontSize: 14, padding: 10 },
  programa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colores.noche800,
    borderRadius: radios.tarjeta,
    padding: 14,
    borderWidth: 1,
    borderColor: colores.bordeSuave,
  },
  hora: { color: colores.oro400, fontFamily: fuentes.tituloFuerte, fontSize: 16, width: 56 },
  textoPrograma: { flex: 1, gap: 2 },
  nombrePrograma: { color: colores.niebla100, fontFamily: fuentes.cuerpoFuerte, fontSize: 15 },
  conductor: { fontSize: 13 },
});
