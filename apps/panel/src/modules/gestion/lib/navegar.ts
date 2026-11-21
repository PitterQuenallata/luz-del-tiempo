// Navegación por hash (la app usa hash history). Vuelve a la lista o abre una página de edición.
export const irA = (ruta: string) => {
  window.location.hash = `#${ruta}`;
};
