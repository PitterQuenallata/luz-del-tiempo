// Apariencia del panel: color de acento y ancho del contenido.
// Se guarda en localStorage (preferencia de cada equipo) y se aplica como variables CSS.

export type AccentId = 'gold' | 'emerald' | 'violet' | 'blue';
export type ContainerWidth = 'fluid' | 'boxed';

export const ACCENTS: { id: AccentId; label: string; color: string; foreground: string }[] = [
  { id: 'gold', label: 'Dorado La Luz', color: '#e2a927', foreground: '#0b1324' },
  { id: 'emerald', label: 'Esmeralda', color: '#10b981', foreground: '#ffffff' },
  { id: 'violet', label: 'Violeta', color: '#8b5cf6', foreground: '#ffffff' },
  { id: 'blue', label: 'Azul real', color: '#3b82f6', foreground: '#ffffff' },
];

const KEY_ACCENT = 'luz_accent';
const KEY_CONTAINER = 'luz_container';

const leer = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const guardar = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* almacenamiento no disponible: se usan los valores por defecto */
  }
};

export const getAccent = (): AccentId => {
  const stored = leer(KEY_ACCENT);
  return ACCENTS.some((a) => a.id === stored) ? (stored as AccentId) : 'gold';
};

export const getContainer = (): ContainerWidth => (leer(KEY_CONTAINER) === 'boxed' ? 'boxed' : 'fluid');

export const applyAccent = (id: AccentId) => {
  const accent = ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
  const root = document.documentElement.style;
  root.setProperty('--primary', accent.color);
  root.setProperty('--accent', accent.color);
  root.setProperty('--ring', accent.color);
  root.setProperty('--primary-foreground', accent.foreground);
  root.setProperty('--accent-foreground', accent.foreground);
};

export const saveAccent = (id: AccentId) => {
  guardar(KEY_ACCENT, id);
  applyAccent(id);
};

export const saveContainer = (value: ContainerWidth) => guardar(KEY_CONTAINER, value);
