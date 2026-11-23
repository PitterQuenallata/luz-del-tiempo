import { ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { FilaMenu } from '@/components/ui/FilaMenu';
import { alturaBarra } from '@/components/BarraNavegacion';

/** Página de Más: cada fila lleva a su propia página. */
export default function MasScreen() {
  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <FilaMenu icono="play-circle-outline" titulo="Videos" descripcion="Prédicas, estudios y mensajes del ministerio" onPress={() => router.push('/videos')} />
      <FilaMenu icono="people-outline" titulo="Quiénes somos" descripcion="Nuestro equipo y nuestra historia" onPress={() => router.push('/mas/quienes-somos')} />
      <FilaMenu icono="chatbubbles-outline" titulo="Contacto" descripcion="WhatsApp, correo y redes" onPress={() => router.push('/mas/contacto')} />
      <FilaMenu icono="heart-outline" titulo="Donar" descripcion="Cómo apoyar la radio y las campañas" onPress={() => router.push('/mas/donar')} />
      <FilaMenu icono="information-circle-outline" titulo="Acerca de la app" descripcion="Versión y datos de la aplicación" onPress={() => router.push('/mas/acerca')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, gap: 12, paddingBottom: alturaBarra },
});
