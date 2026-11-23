/**
 * Tokens de marca tomados de la web (apps/web/src/index.css):
 * noche = fondo azul, oro = acento, niebla = textos secundarios.
 * Tipografías: Clash Display (títulos), Satoshi (texto), Fraunces (acento).
 */
export const colores = {
  noche950: '#070d1a',
  noche900: '#0b1324', // fondo de la app
  noche850: '#0f1b38',
  noche800: '#1b2740', // tarjetas
  noche700: '#24324f',
  noche600: '#2f3d5c',
  oro500: '#e2a927', // acento principal
  oro400: '#f0c35a',
  oro200: '#f6e3b8',
  niebla100: '#dbe3f3', // texto principal sobre fondo oscuro
  niebla200: '#c3cde0',
  niebla300: '#b9c5dc',
  niebla400: '#a9b7d2', // texto secundario
  borde: 'rgba(226, 169, 39, 0.22)',
  bordeSuave: 'rgba(219, 227, 243, 0.10)',
} as const;

export const fuentes = {
  titulo: 'ClashDisplay-Semibold',
  tituloFuerte: 'ClashDisplay-Bold',
  cuerpo: 'Satoshi-Regular',
  cuerpoMedio: 'Satoshi-Medium',
  cuerpoFuerte: 'Satoshi-Bold',
  acento: 'Fraunces_600SemiBold',
} as const;

export const radios = { tarjeta: 18, boton: 999 } as const;
