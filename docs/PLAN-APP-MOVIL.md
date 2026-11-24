# Plan de la app móvil (Expo)

Estado: pendiente de aprobación. Rama local `feat/app-mobile-fase0`.

Decisiones abiertas:
- [ ] Radio: ¿hay URL de transmisión o hay que construir el servidor (`apps/radio-api`)?
- [ ] Notificaciones push: ¿antes o después de publicar?

## Fase 0 · Base
- [x] Proyecto Expo con expo-router en `apps/mobile`
- [x] Identidad: La Luz del Tiempo, `com.vidastudio.laluzdeltiempo`
- [x] Colores de la marca (`constants/marca.ts`)
- [x] Cliente de la API pública (`lib/api.ts`)
- [x] QueryClient con caché (`lib/query.ts`)
- [x] Verificado: tsc, bundle de Android y expo-doctor (18/18)
- [ ] Subir a `main` (esperando aprobación)

## Fase 1 · Radio (bloqueada por la decisión de streaming)
- [ ] Reproductor en vivo con ecualizador y botón de reproducir
- [ ] Mini-reproductor visible en todas las pantallas
- [ ] Reproducción en segundo plano y controles en la pantalla de bloqueo
- [ ] Aviso de transmisión en vivo, con botón para cerrarlo
- [ ] Cambio de emisora

## Fase 2 · Inicio
- [ ] Carrusel de portada, con la foto de respaldo
- [ ] "Hoy en la radio" (programación del día)
- [ ] Videos, actividades, áreas y noticias
- [ ] Esqueletos de carga y estados de error

## Fase 3 · Contenido
- [ ] Programación por día
- [ ] Áreas y su detalle
- [ ] Actividades: detalle, agendar en el calendario y compartir
- [ ] Videos
- [ ] Noticias con progreso de lectura

## Fase 4 · Donar y contacto
- [ ] Formas de donar, con copiar la cuenta
- [ ] Contacto por WhatsApp
- [ ] Quiénes somos

## Fase 5 · Avisos push
- [ ] Registro de tokens en la API
- [ ] Aviso de transmisión en vivo
- [ ] Aviso de actividades nuevas

## Fase 6 · Publicación
- [ ] Iconos y pantalla de inicio (splash)
- [ ] Pruebas en teléfonos reales
- [ ] Builds con EAS y pruebas internas (Play Console y TestFlight)
- [ ] Política de privacidad y datos para las tiendas
