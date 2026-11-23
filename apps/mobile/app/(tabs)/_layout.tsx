import { Tabs } from 'expo-router';

import { BarraNavegacion } from '@/components/BarraNavegacion';
import { Encabezado } from '@/components/Encabezado';
import { colores } from '@/lib/theme';

/**
 * Cinco secciones, cada una con su página. La barra visible la dibuja BarraNavegacion
 * (diseño de Claude Design). Donar vive dentro de Más.
 */
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BarraNavegacion {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colores.noche900 },
        headerShadowVisible: false,
        headerTitle: () => <Encabezado />,
      }}>
      <Tabs.Screen name="noticias" options={{ title: 'Noticias' }} />
      <Tabs.Screen name="areas" options={{ title: 'Áreas', headerShown: false }} />
      {/* Videos sale desde Más: ya no es una pestaña, pero sigue en la app */}
      <Tabs.Screen name="videos" options={{ title: 'Videos', href: null }} />
      <Tabs.Screen name="index" options={{ title: 'Radio' }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="mas" options={{ title: 'Más', headerShown: false }} />
    </Tabs>
  );
}
