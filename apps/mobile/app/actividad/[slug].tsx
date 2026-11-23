import { useQuery, useMutation } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { alturaBarra } from '@/components/BarraNavegacion';
import { EstadoLista } from '@/components/EstadoLista';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Cuerpo, Etiqueta, Titulo } from '@/components/ui/Tipo';
import { api } from '@/lib/api';
import { colores, fuentes, radios } from '@/lib/theme';

const PAISES: [string, string][] = [['+591', 'Bolivia'], ['+51', 'Perú'], ['+54', 'Argentina'], ['+55', 'Brasil'], ['+56', 'Chile'], ['+57', 'Colombia'], ['+1', 'EE. UU.'], ['+34', 'España']];

const hora = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : '');
const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Por confirmar');

/** Ficha de una actividad: fechas y programa, personas, precio, inscripción y contacto. */
export default function ActividadScreen() {
  const { slug = '' } = useLocalSearchParams<{ slug: string }>();
  const consulta = useQuery({ queryKey: ['activity', slug], queryFn: () => api.activity(slug) });
  const a = consulta.data;

  if (consulta.isLoading || consulta.isError || !a) {
    return (
      <ScrollView contentContainerStyle={styles.pantalla}>
        <Stack.Screen options={{ title: 'Actividad' }} />
        <EstadoLista
          cargando={consulta.isLoading}
          error={consulta.isError}
          vacia={!consulta.isLoading && !consulta.isError}
          textoVacia="Esta actividad ya no está disponible."
          onReintentar={() => consulta.refetch()}
        />
      </ScrollView>
    );
  }

  const primera = a.sesiones[0];
  const ultima = a.sesiones[a.sesiones.length - 1];
  const precio = a.isFree ? 'Gratis' : `Bs ${a.priceAmount ?? ''}${a.priceNote ? ` · ${a.priceNote}` : ''}`;

  return (
    <ScrollView contentContainerStyle={styles.pantalla}>
      <Stack.Screen options={{ title: "Agenda" }} />

      {a.coverUrl ? <Image source={{ uri: a.coverUrl }} style={styles.portada} /> : null}
      <Etiqueta>{a.kindLabel}{a.areas.length ? ` · ${a.areas.map((x) => x.name).join(', ')}` : ''}</Etiqueta>
      <Titulo style={styles.titulo}>{a.title}</Titulo>
      {a.summary ? <Cuerpo>{a.summary}</Cuerpo> : null}

      <Tarjeta>
        <Dato etiqueta="Fecha" valor={a.sesiones.length > 1 && ultima ? `${fecha(primera?.startsAt ?? null)} al ${fecha(ultima.startsAt)}` : fecha(primera?.startsAt ?? null)} />
        <Dato etiqueta="Lugar" valor={a.isVirtual ? 'Virtual' : a.lugar ?? 'Por confirmar'} />
        <Dato etiqueta="Precio" valor={precio} />
        {a.cupo.capacidad ? <Dato etiqueta="Cupos" valor={a.cupo.lleno ? 'Cupo lleno' : a.cupo.lugaresLibres !== null ? `Quedan ${a.cupo.lugaresLibres} de ${a.cupo.capacidad}` : `${a.cupo.capacidad}`} /> : null}
      </Tarjeta>

      {a.content ? <Cuerpo style={styles.parrafo}>{a.content}</Cuerpo> : null}

      <Seccion titulo={a.sesiones.length > 1 ? 'Fechas y programa' : 'Programa'}>
        {a.sesiones.map((s) => (
          <Tarjeta key={s.startsAt}>
            <Text style={styles.subtitulo}>{fecha(s.startsAt)} · {hora(s.startsAt)}{s.endsAt ? ` a ${hora(s.endsAt)}` : ''}</Text>
            {!a.isVirtual && s.lugar ? <Cuerpo>{s.lugar.name}{s.lugar.address ? ` · ${s.lugar.address}` : ''}{s.locationNote ? ` (${s.locationNote})` : ''}</Cuerpo> : null}
            {s.programa.map((p, i) => (
              <Cuerpo key={i}>
                {p.startTime ? `${p.startTime}  ` : ''}{p.title}{p.persona ? ` · ${p.persona.name}` : ''}
              </Cuerpo>
            ))}
          </Tarjeta>
        ))}
      </Seccion>

      {a.personas.length > 0 ? (
        <Seccion titulo="Quiénes participan">
          {a.personas.map((p) => (
            <Tarjeta key={p.name + p.roleLabel}>
              <Etiqueta>{p.roleLabel}</Etiqueta>
              <Text style={styles.subtitulo}>{p.name}</Text>
              <Cuerpo>{p.roleTitle}</Cuerpo>
            </Tarjeta>
          ))}
        </Seccion>
      ) : null}

      {a.qrInscripcionUrl || a.qrSubidoUrl ? (
        <Seccion titulo="Códigos QR">
          <View style={styles.filaQr}>
            {a.qrInscripcionUrl ? (
              <View style={styles.qrItem}>
                <Image source={{ uri: a.qrInscripcionUrl }} style={styles.qr} accessibilityLabel={`QR para inscribirse en `} />
                <Cuerpo>Escanea para inscribirte</Cuerpo>
              </View>
            ) : null}
            {a.qrSubidoUrl ? (
              <View style={styles.qrItem}>
                <Image source={{ uri: a.qrSubidoUrl }} style={styles.qr} resizeMode="contain" accessibilityLabel={`QR de pago de `} />
                <Cuerpo>QR para pagar</Cuerpo>
              </View>
            ) : null}
          </View>
        </Seccion>
      ) : null}
      <Inscripcion slug={a.slug} titulo={a.title} inscripcionWeb={a.inscripcionApp} pasada={a.pasada} lleno={a.cupo.lleno} gratis={a.isFree} precio={precio} />

      {a.canales.length > 0 && !a.pasada ? (
        <Seccion titulo="Otras formas de inscribirte">
          {a.canales.map((c) => (
            <Pressable
              key={c.channel}
              accessibilityRole="link"
              onPress={() =>
                Linking.openURL(
                  c.channel === 'whatsapp'
                    ? `https://wa.me/${c.value.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, quiero inscribirme en: ${a.title}`)}`
                    : c.channel === 'correo'
                      ? `mailto:${c.value}`
                      : c.value,
                )
              }
              style={styles.boton}
            >
              <Text style={styles.botonTexto}>
                {c.channel === 'whatsapp' ? 'Inscribirme por WhatsApp' : c.channel === 'correo' ? 'Inscribirme por correo' : 'Inscribirme por enlace'}
              </Text>
            </Pressable>
          ))}
        </Seccion>
      ) : null}

      {a.report || a.galeria.length > 0 ? (
        <Seccion titulo="Lo que se hizo">
          {a.report ? <Cuerpo>{a.report}</Cuerpo> : null}
          {a.galeria.map((g, i) => (
            <Image key={i} source={{ uri: g.imageUrl }} style={styles.foto} accessibilityLabel={g.caption || a.title} />
          ))}
        </Seccion>
      ) : null}
    </ScrollView>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.seccion}>
      <Titulo style={styles.subtituloSeccion}>{titulo}</Titulo>
      {children}
    </View>
  );
}

function Inscripcion({
  slug, titulo, inscripcionWeb, pasada, lleno, gratis, precio,
}: { slug: string; titulo: string; inscripcionWeb: boolean; pasada: boolean; lleno: boolean; gratis: boolean; precio: string }) {
  const [datos, setDatos] = useState({ fullName: '', phoneCode: '+591', phone: '', email: '' });
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<string | null>(null);
  const enviar = useMutation({
    mutationFn: () => api.inscribir(slug, datos),
    onSuccess: (mensaje) => { setListo(mensaje); setError(null); },
    onError: (e: Error) => setError(e.message),
  });

  if (pasada) return <Seccion titulo="Inscripción"><Cuerpo>Esta actividad ya se realizó.</Cuerpo></Seccion>;
  if (listo) return <Seccion titulo="Inscripción"><Text style={styles.exito}>{listo}</Text></Seccion>;
  if (!inscripcionWeb) return null;
  if (lleno) return <Seccion titulo="Inscripción"><Cuerpo>Ya no hay lugares disponibles.</Cuerpo></Seccion>;

  return (
    <Seccion titulo="Inscripción">
      <Cuerpo>{titulo}</Cuerpo>
      <TextInput style={styles.campo} placeholder="Nombre completo" placeholderTextColor={colores.niebla400} value={datos.fullName} onChangeText={(v) => setDatos({ ...datos, fullName: v })} autoComplete="name" />
      <View style={styles.filaCampos}>
        <View style={styles.pais}>
          {PAISES.map(([codigo, nombre]) => (
            <Pressable key={codigo} onPress={() => setDatos({ ...datos, phoneCode: codigo })} accessibilityRole="button" accessibilityState={{ selected: datos.phoneCode === codigo }} style={[styles.paisOpcion, datos.phoneCode === codigo && styles.paisActivo]}>
              <Text style={styles.paisTexto}>{codigo} {nombre}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <TextInput style={styles.campo} placeholder="Teléfono (WhatsApp)" placeholderTextColor={colores.niebla400} keyboardType="phone-pad" value={datos.phone} onChangeText={(v) => setDatos({ ...datos, phone: v })} />
      <TextInput style={styles.campo} placeholder="Correo (opcional)" placeholderTextColor={colores.niebla400} keyboardType="email-address" autoCapitalize="none" value={datos.email} onChangeText={(v) => setDatos({ ...datos, email: v })} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={() => enviar.mutate()} disabled={enviar.isPending} accessibilityRole="button" style={[styles.boton, styles.botonOro, enviar.isPending && { opacity: 0.6 }]}>
        <Text style={[styles.botonTexto, styles.botonOroTexto]}>{enviar.isPending ? 'Enviando…' : gratis ? 'Inscribirme gratis' : 'Inscribirme'}</Text>
      </Pressable>
      {!gratis ? <Cuerpo>{precio}</Cuerpo> : null}
    </Seccion>
  );
}

const styles = StyleSheet.create({
  pantalla: { padding: 16, gap: 14, paddingBottom: alturaBarra + 16 },
  portada: { width: '100%', height: 200, borderRadius: radios.tarjeta },
  titulo: { fontSize: 26 },
  parrafo: { marginTop: 4 },
  seccion: { gap: 10, marginTop: 8 },
  subtituloSeccion: { fontSize: 20 },
  subtitulo: { color: colores.niebla100, fontFamily: fuentes.cuerpoMedio, fontSize: 15 },
  dato: { gap: 2, paddingVertical: 6 },
  datoEtiqueta: { color: colores.niebla400, fontFamily: fuentes.cuerpoMedio, fontSize: 12 },
  datoValor: { color: colores.niebla100, fontFamily: fuentes.cuerpoMedio, fontSize: 15 },
  campo: {
    borderWidth: 1, borderColor: colores.bordeSuave, borderRadius: radios.tarjeta, color: colores.niebla100,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, backgroundColor: colores.noche900,
  },
  filaCampos: { flexDirection: 'row' },
  pais: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  paisOpcion: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radios.boton, borderWidth: 1, borderColor: colores.bordeSuave },
  paisActivo: { borderColor: colores.oro500 },
  paisTexto: { color: colores.niebla400, fontSize: 12 },
  boton: { borderWidth: 1, borderColor: colores.oro500, borderRadius: radios.boton, paddingVertical: 12, alignItems: 'center' },
  botonOro: { backgroundColor: colores.oro500, borderColor: colores.oro500 },
  botonTexto: { color: colores.oro400, fontFamily: fuentes.cuerpoMedio, fontSize: 15 },
  botonOroTexto: { color: colores.noche900 },
  error: { color: '#fca5a5', fontSize: 14 },
  exito: { color: colores.oro400, fontFamily: fuentes.cuerpoMedio, fontSize: 16 },
  foto: { width: "100%", height: 220, borderRadius: radios.tarjeta },
  filaQr: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  qrItem: { alignItems: "center", gap: 8 },
  qr: { width: 150, height: 150, borderRadius: radios.tarjeta, backgroundColor: "#ffffff" },
});
