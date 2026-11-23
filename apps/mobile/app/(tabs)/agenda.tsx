import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { EstadoLista } from '@/components/EstadoLista';
import { Cuerpo, Etiqueta, Titulo } from '@/components/ui/Tipo';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { api } from '@/lib/api';
import { colores, fuentes, radios } from '@/lib/theme';
import { alturaBarra } from '@/components/BarraNavegacion';

type Estado = 'proximas' | 'pasadas';

/** Agenda: campañas, escuelas, talleres, cursos y eventos. Filtros arriba; toca una actividad para verla e inscribirte. */
export default function AgendaScreen() {
  const [estado, setEstado] = useState<Estado>('proximas');
  const [tipo, setTipo] = useState<string>('todas');
  const [area, setArea] = useState<string>('todas');
  const [gratis, setGratis] = useState(false);

  const filtros = { estado, tipo: tipo === 'todas' ? undefined : tipo, area: area === 'todas' ? undefined : area, gratis: gratis || undefined };
  const consulta = useQuery({ queryKey: ['activities', filtros], queryFn: () => api.activities(filtros) });
  const meta = useQuery({ queryKey: ['agenda-filtros'], queryFn: api.agendaFiltros });
  const datos = consulta.data ?? [];

  return (
    <FlatList
      data={datos}
      keyExtractor={(item) => item.slug}
      contentContainerStyle={styles.lista}
      refreshing={consulta.isRefetching}
      onRefresh={() => consulta.refetch()}
      ListHeaderComponent={
        <View style={styles.filtros}>
          <View style={styles.fila}>
            {(['proximas', 'pasadas'] as const).map((e) => (
              <Pastilla key={e} activo={estado === e} onPress={() => setEstado(e)}>
                {e === 'proximas' ? 'Próximas' : 'Ya realizadas'}
              </Pastilla>
            ))}
            <Pastilla activo={gratis} onPress={() => setGratis((v) => !v)}>Gratis</Pastilla>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fila}>
            <Pastilla activo={tipo === 'todas'} onPress={() => setTipo('todas')}>Todas</Pastilla>
            {(meta.data?.tipos ?? []).map((t) => (
              <Pastilla key={t.valor} activo={tipo === t.valor} onPress={() => setTipo(t.valor)}>{t.etiqueta}</Pastilla>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fila}>
            <Pastilla activo={area === 'todas'} onPress={() => setArea('todas')}>Todas las áreas</Pastilla>
            {(meta.data?.areas ?? []).map((a) => (
              <Pastilla key={a.slug} activo={area === a.slug} onPress={() => setArea(a.slug)}>{a.name}</Pastilla>
            ))}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={
        <EstadoLista
          cargando={consulta.isLoading}
          error={consulta.isError}
          vacia={!consulta.isLoading && !consulta.isError}
          textoVacia={estado === 'proximas' ? 'No hay actividades con estos filtros.' : 'No hay actividades realizadas con estos filtros.'}
          onReintentar={() => consulta.refetch()}
        />
      }
      renderItem={({ item }) => {
        const fecha = item.inicio ? new Date(item.inicio) : null;
        return (
          <Tarjeta sinRelleno onPress={() => router.push(`/actividad/${item.slug}`)}>
            {item.coverUrl ? <Image source={{ uri: item.coverUrl }} style={styles.portada} /> : null}
            <View style={styles.fila2}>
              <View style={styles.fecha}>
                {fecha ? (
                  <>
                    <Text style={styles.dia}>{fecha.getDate()}</Text>
                    <Text style={styles.mes}>{fecha.toLocaleDateString('es-BO', { month: 'short' }).replace('.', '')}</Text>
                  </>
                ) : (
                  <Text style={styles.mes}>Pronto</Text>
                )}
              </View>
              <View style={styles.texto}>
                <Etiqueta>{item.kindLabel}</Etiqueta>
                <Titulo style={styles.titulo}>{item.title}</Titulo>
                <Cuerpo>
                  {fecha ? fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : 'Fecha por confirmar'}
                  {item.cantidadSesiones > 1 ? ` · ${item.cantidadSesiones} sesiones` : ''}
                </Cuerpo>
                <Cuerpo>
                  {item.isVirtual ? 'Virtual' : item.lugar ?? 'Lugar por confirmar'}
                  {' · '}
                  {item.isFree ? 'Gratis' : `Bs ${item.priceAmount ?? ''}`}
                </Cuerpo>
              </View>
            </View>
          </Tarjeta>
        );
      }}
    />
  );
}

function Pastilla({ activo, onPress, children }: { activo: boolean; onPress: () => void; children: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      style={[styles.pastilla, activo && styles.pastillaActiva]}
    >
      <Text style={[styles.pastillaTexto, activo && styles.pastillaTextoActivo]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16, gap: 16, flexGrow: 1, paddingBottom: alturaBarra },
  filtros: { gap: 10, marginBottom: 6 },
  fila: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pastilla: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radios.boton, borderWidth: 1, borderColor: colores.bordeSuave },
  pastillaActiva: { borderColor: colores.oro500, backgroundColor: 'rgba(226,169,39,0.15)' },
  pastillaTexto: { color: colores.niebla400, fontFamily: fuentes.cuerpoMedio, fontSize: 13 },
  pastillaTextoActivo: { color: colores.oro400 },
  portada: { width: '100%', height: 150 },
  fila2: { flexDirection: 'row', gap: 14, padding: 16 },
  fecha: {
    width: 58,
    height: 66,
    borderRadius: 14,
    backgroundColor: colores.noche900,
    borderWidth: 1,
    borderColor: colores.bordeSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dia: { color: colores.oro400, fontFamily: fuentes.tituloFuerte, fontSize: 24, lineHeight: 26 },
  mes: { color: colores.niebla400, fontFamily: fuentes.cuerpoMedio, fontSize: 12, textTransform: 'uppercase' },
  texto: { flex: 1, gap: 4 },
  titulo: { fontSize: 18 },
});
