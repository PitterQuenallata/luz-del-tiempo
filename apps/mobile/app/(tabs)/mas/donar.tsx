import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { alturaBarra } from '@/components/BarraNavegacion';
import { EstadoLista } from '@/components/EstadoLista';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Cuerpo, Etiqueta, Titulo } from '@/components/ui/Tipo';
import { api } from '@/lib/api';
import { colores, fuentes, radios } from '@/lib/theme';
import type { DonationMethod } from '@/lib/types';

/** Donar: formas de donación y en qué se usa. Todo viene de la API. */
export default function DonarScreen() {
  const metodos = useQuery({ queryKey: ['donation-methods'], queryFn: api.donationMethods });
  const necesidades = useQuery({ queryKey: ['donation-needs'], queryFn: api.needs });

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <View style={styles.bloque}>
        <Titulo>Tu ofrenda mantiene la radio al aire</Titulo>
        <Cuerpo>Elige la forma que te sea más cómoda. Cada aporte se usa en la radio, las escuelas y las campañas.</Cuerpo>
      </View>

      {metodos.isLoading ? <ActivityIndicator color={colores.oro500} /> : null}
      {metodos.isError ? (
        <EstadoLista cargando={false} error vacia={false} textoVacia="" onReintentar={() => metodos.refetch()} />
      ) : null}
      {(metodos.data ?? []).map((m) => (
        <MetodoDonacion key={m.id} metodo={m} />
      ))}

      {necesidades.data?.length ? (
        <View style={styles.bloque}>
          <Titulo>¿En qué se usa?</Titulo>
          {necesidades.data.map((n) => (
            <Tarjeta key={n.title}>
              <Titulo style={styles.tituloNecesidad}>{n.title}</Titulo>
              <Cuerpo>{n.body}</Cuerpo>
            </Tarjeta>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function MetodoDonacion({ metodo }: { metodo: DonationMethod }) {
  const [copiado, setCopiado] = useState(false);
  const [verQr, setVerQr] = useState(false);
  const esQr = metodo.id === 'qr';

  const copiar = async () => {
    await Clipboard.setStringAsync(metodo.lines.join('\n'));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  };

  return (
    <Tarjeta>
      <Etiqueta>{metodo.title}</Etiqueta>
      <Cuerpo>{metodo.detail}</Cuerpo>
      {metodo.lines.map((linea) => (
        <Text key={linea} style={styles.linea}>
          {linea}
        </Text>
      ))}

      {esQr ? (
        <BotonAccion
          icono="qr-code-outline"
          texto="Ver código QR"
          etiqueta="Ver código QR para donar"
          onPress={() => setVerQr(true)}
        />
      ) : metodo.lines.length > 0 ? (
        <BotonAccion
          icono={copiado ? 'checkmark' : 'copy-outline'}
          texto={copiado ? 'Copiado' : 'Copiar datos'}
          etiqueta={`Copiar datos de ${metodo.title}`}
          onPress={copiar}
        />
      ) : null}

      {esQr ? <DialogoQr visible={verQr} onCerrar={() => setVerQr(false)} /> : null}
    </Tarjeta>
  );
}

function BotonAccion({
  icono,
  texto,
  etiqueta,
  onPress,
}: {
  icono: React.ComponentProps<typeof Ionicons>['name'];
  texto: string;
  etiqueta: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={({ pressed }) => [styles.boton, pressed && { opacity: 0.8 }]}>
      <Ionicons name={icono} size={18} color={colores.noche900} />
      <Text style={styles.botonTexto}>{texto}</Text>
    </Pressable>
  );
}

/** Diálogo modal con el QR para donar desde el banco. */
function DialogoQr({ visible, onCerrar }: { visible: boolean; onCerrar: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={styles.velo}>
        <View style={styles.dialogo} accessibilityViewIsModal>
          <View style={styles.dialogoCabecera}>
            <Titulo style={styles.dialogoTitulo}>QR desde tu banco</Titulo>
            <Pressable onPress={onCerrar} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={12}>
              <Ionicons name="close" size={24} color={colores.niebla100} />
            </Pressable>
          </View>
          <Cuerpo>Abre la app de tu banco, elige pagar con QR y escanea este código.</Cuerpo>
          {/* Espacio del código: la imagen del QR la entrega el ministerio. */}
          <View style={styles.qr}>
            <Ionicons name="qr-code-outline" size={64} color={colores.niebla400} />
            <Text style={styles.qrTexto}>Código QR por confirmar</Text>
          </View>
          <Pressable onPress={onCerrar} accessibilityRole="button" style={styles.boton}>
            <Text style={styles.botonTexto}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, gap: 16, paddingBottom: alturaBarra },
  bloque: { gap: 10 },
  tituloNecesidad: { fontSize: 17 },
  linea: { color: colores.niebla100, fontFamily: fuentes.cuerpoMedio, fontSize: 15 },
  boton: {
    marginTop: 4,
    height: 44,
    borderRadius: radios.boton,
    backgroundColor: colores.oro500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botonTexto: { color: colores.noche900, fontFamily: fuentes.cuerpoFuerte, fontSize: 15 },
  velo: { flex: 1, backgroundColor: 'rgba(7, 13, 26, 0.75)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  dialogo: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    padding: 20,
    gap: 16,
    backgroundColor: colores.noche800,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  dialogoCabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dialogoTitulo: { fontSize: 20 },
  qr: {
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colores.borde,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  qrTexto: { color: colores.niebla400, fontFamily: fuentes.cuerpoMedio, fontSize: 14 },
});
