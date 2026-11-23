import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Cuerpo, Etiqueta, Titulo } from '@/components/ui/Tipo';
import { colores, fuentes } from '@/lib/theme';
import type { ScheduleItem, Station } from '@/lib/types';

type Props = {
  emisora: Station;
  programaActual: ScheduleItem | null;
  enVivo: boolean;
};

/**
 * Reproductor de la emisora elegida. Sin enlace de audio (streamUrl vacío) el botón
 * queda deshabilitado: la app no reproduce nada de prueba.
 */
export function Reproductor({ emisora, programaActual, enVivo }: Props) {
  const conAudio = emisora.streamUrl.length > 0;
  const reproductor = useAudioPlayer(conAudio ? { uri: emisora.streamUrl } : null);
  const estado = useAudioPlayerStatus(reproductor);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
  }, []);

  const alternar = () => {
    if (!conAudio) return;
    if (estado.playing) reproductor.pause();
    else reproductor.play();
  };

  const etiquetaBoton = !conAudio ? 'Transmisión por confirmar' : estado.playing ? 'Pausar' : 'Escuchar en vivo';

  return (
    <LinearGradient
      colors={['#0f1c3a', '#17337a', '#0f1c3a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.tarjeta}>
      {emisora.imageUrl ? <Image source={{ uri: emisora.imageUrl }} style={styles.fondo} /> : null}

      <View style={styles.cabecera}>
        {enVivo ? (
          <View style={styles.pastilla}>
            <View style={styles.punto} />
            <Text style={styles.pastillaTexto}>En vivo</Text>
          </View>
        ) : (
          <Etiqueta>{emisora.isMain ? 'Señal principal' : emisora.genre}</Etiqueta>
        )}
      </View>

      <View style={styles.textos}>
        <Titulo style={styles.nombre}>{emisora.name}</Titulo>
        <Cuerpo style={styles.programa}>{programaActual?.programName ?? emisora.nowPlaying ?? emisora.description}</Cuerpo>
        {programaActual?.host ? <Etiqueta>{programaActual.host}</Etiqueta> : null}
      </View>

      <Pressable
        onPress={alternar}
        disabled={!conAudio}
        accessibilityRole="button"
        accessibilityLabel={etiquetaBoton}
        style={({ pressed }) => [styles.boton, !conAudio && styles.botonDeshabilitado, pressed && styles.botonPresionado]}>
        <Ionicons
          name={!conAudio ? 'time-outline' : estado.playing ? 'pause' : 'play'}
          size={20}
          color={conAudio ? colores.noche900 : colores.niebla100}
        />
        <Text style={[styles.botonTexto, !conAudio && styles.botonTextoDeshabilitado]}>{etiquetaBoton}</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    borderRadius: 22,
    padding: 20,
    gap: 18,
    borderWidth: 1,
    borderColor: colores.bordeSuave,
    overflow: 'hidden',
  },
  fondo: { ...StyleSheet.absoluteFill, opacity: 0.18 },
  cabecera: { flexDirection: 'row', alignItems: 'center' },
  pastilla: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(7, 13, 26, 0.55)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: colores.bordeSuave,
  },
  punto: { width: 7, height: 7, borderRadius: 4, backgroundColor: colores.oro400 },
  pastillaTexto: { color: colores.oro200, fontFamily: fuentes.cuerpoMedio, fontSize: 13 },
  textos: { gap: 6 },
  nombre: { fontFamily: fuentes.tituloFuerte, fontSize: 30, lineHeight: 34, color: colores.niebla100 },
  programa: { color: colores.niebla100, fontSize: 17, fontFamily: fuentes.cuerpoFuerte },
  boton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colores.oro500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  botonDeshabilitado: { backgroundColor: colores.noche700 },
  botonPresionado: { backgroundColor: colores.oro400, transform: [{ scale: 0.98 }] },
  botonTexto: { color: colores.noche900, fontFamily: fuentes.cuerpoFuerte, fontSize: 16 },
  botonTextoDeshabilitado: { color: colores.niebla100 },
});
