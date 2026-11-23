import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colores, fuentes } from '@/lib/theme';

type Icono = React.ComponentProps<typeof Ionicons>['name'];

/** Lo que usa la barra del estado y la navegación de las pestañas (subconjunto de React Navigation). */
type BottomTabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  emitter: { emit: (evento: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean } };
  navigateToTab: (routeKey: string) => void;
};

/** Orden fijo de la barra, igual que el menú de la web: Noticias, Áreas, Radio (centro), Agenda, Más. */
const ITEMS: { nombre: string; titulo: string; icono: Icono }[] = [
  { nombre: 'noticias', titulo: 'Noticias', icono: 'newspaper-outline' },
  { nombre: 'areas', titulo: 'Áreas', icono: 'grid-outline' },
  { nombre: 'index', titulo: 'Radio', icono: 'radio-outline' },
  { nombre: 'agenda', titulo: 'Agenda', icono: 'calendar-outline' },
  { nombre: 'mas', titulo: 'Más', icono: 'ellipsis-horizontal' },
];

/**
 * Barra flotante de la app (diseño de Claude Design): píldora con cuatro secciones
 * y el botón de Radio elevado en el centro.
 */
export function BarraNavegacion({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activa = state.routes[state.index]?.name;

  return (
    <View pointerEvents="box-none" style={[styles.contenedor, { bottom: Math.max(insets.bottom, 12) + 4 }]}>
      <View style={styles.barra}>
        {ITEMS.map((item) => {
          const ruta = state.routes.find((r) => r.name === item.nombre);
          if (!ruta) return null;
          const seleccionada = activa === item.nombre || (item.nombre === 'mas' && activa?.startsWith('mas'));

          const irA = () => {
            const evento = emitter.emit({ type: 'tabPress', target: ruta.key, canPreventDefault: true });
            if (!seleccionada && !evento.defaultPrevented) navigateToTab(ruta.key);
          };

          if (item.nombre === 'index') {
            return (
              <View key={item.nombre} style={styles.central}>
                <Pressable
                  onPress={irA}
                  accessibilityRole="tab"
                  accessibilityLabel="Radio en vivo"
                  accessibilityState={{ selected: seleccionada }}
                  style={({ pressed }) => [styles.botonCentral, pressed && { transform: [{ scale: 0.96 }] }]}>
                  <Ionicons name={item.icono} size={28} color={colores.noche900} />
                </Pressable>
                <Text style={[styles.titulo, { color: seleccionada ? colores.oro400 : colores.niebla400 }]}>{item.titulo}</Text>
              </View>
            );
          }

          return (
            <Pressable
              key={item.nombre}
              onPress={irA}
              accessibilityRole="tab"
              accessibilityLabel={item.titulo}
              accessibilityState={{ selected: seleccionada }}
              style={styles.item}>
              <Ionicons
                name={item.icono}
                size={24}
                color={seleccionada ? colores.oro400 : colores.niebla400}
              />
              <Text style={[styles.titulo, { color: seleccionada ? colores.oro400 : colores.niebla400 }]}>
                {item.titulo}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Espacio que deben dejar libre las pantallas para que la barra no tape el contenido. */
export const alturaBarra = 104;

const styles = StyleSheet.create({
  contenedor: { position: 'absolute', left: 12, right: 12 },
  barra: {
    height: 74,
    borderRadius: 26,
    backgroundColor: colores.noche800,
    borderWidth: 1,
    borderColor: colores.borde,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  item: { flex: 1, height: 60, alignItems: 'center', justifyContent: 'center', gap: 4 },
  titulo: { fontFamily: fuentes.cuerpoMedio, fontSize: 11.5 },
  central: { flex: 1, height: 60, alignItems: "center", justifyContent: "flex-end", gap: 4 },
  botonCentral: {
    marginTop: -62,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colores.oro500,
    alignItems: 'center',
    justifyContent: 'center',
    // Anillo del mismo color que la barra, como el box-shadow del diseño.
    borderWidth: 7,
    borderColor: colores.noche800,
  },
});
