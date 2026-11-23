import { Stack } from 'expo-router';

import { colores } from '@/lib/theme';

/** Más: una página de menú y, desde ella, una página propia por sección. */
export default function MasLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colores.noche900 },
        headerTintColor: colores.niebla100,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colores.noche900 },
      }}>
      <Stack.Screen name="index" options={{ title: 'Más' }} />
      <Stack.Screen name="quienes-somos" options={{ title: 'Quiénes somos' }} />
      <Stack.Screen name="contacto" options={{ title: 'Contacto' }} />
      <Stack.Screen name="donar" options={{ title: 'Donar' }} />
      <Stack.Screen name="acerca" options={{ title: 'Acerca de la app' }} />
    </Stack>
  );
}
