import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Fraunces_600SemiBold, useFonts } from '@expo-google-fonts/fraunces';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { colores } from '@/lib/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

// La app usa el tema oscuro de la marca (azul noche) en todas las pantallas.
const tema = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colores.noche900, card: colores.noche900, primary: colores.oro500 },
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [clienteConsultas] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 60_000 } } }),
  );

  // Clash Display, Satoshi (en assets/fonts) y Fraunces (paquete de Google Fonts).
  const [fuentesListas, errorFuentes] = useFonts({
    'ClashDisplay-Semibold': require('../assets/fonts/ClashDisplay-Semibold.otf'),
    'ClashDisplay-Bold': require('../assets/fonts/ClashDisplay-Bold.otf'),
    'Satoshi-Regular': require('../assets/fonts/Satoshi-Regular.otf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.otf'),
    Fraunces_600SemiBold,
  });

  useEffect(() => {
    if (errorFuentes) throw errorFuentes;
  }, [errorFuentes]);

  useEffect(() => {
    if (fuentesListas) SplashScreen.hideAsync();
  }, [fuentesListas]);

  if (!fuentesListas) return null;

  return (
    <QueryClientProvider client={clienteConsultas}>
      <ThemeProvider value={tema}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colores.noche900 },
            headerTintColor: colores.niebla100,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colores.noche900 },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
