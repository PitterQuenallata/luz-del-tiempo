import { Stack } from 'expo-router';

import { Encabezado } from '@/components/Encabezado';
import { colores } from '@/lib/theme';

/** Áreas: la lista y, desde ella, la página de cada área (con su botón de regreso). */
export default function AreasLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colores.noche900 },
        headerTintColor: colores.niebla100,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colores.noche900 },
      }}>
      <Stack.Screen name="index" options={{ headerTitle: () => <Encabezado /> }} />
      <Stack.Screen name="[slug]" options={{ title: 'Área' }} />
    </Stack>
  );
}
