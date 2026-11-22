# Estado y plan — La Luz del Tiempo

> Actualizado: 20/11/2026. Rama `main` en `918b6ba`.
> Documento para retomar el trabajo en un chat nuevo. El plan de producto está en `docs/PLAN.md`; el modelo de datos en `docs/DATABASE.md`.

## 1. Cómo correr el proyecto

Desde la raíz del repo (no desde `apps/panel`):

```bash
colima start                                              # si Docker está apagado (Mac)
docker compose -f infra/compose.yaml up -d                # PostgreSQL
cd apps/api && set -a && . ./.env && set +a && pnpm db:migrate && pnpm db:seed && cd ../..
pnpm dev                                                  # panel :3000, web :5173, API :4000
```

- Cuentas de desarrollo (contraseña `sopademani1`): `mallku@gmail.com` (superadmin), `admin@`, `editor@`, `operador@` (`@luzdeltiempo.local`).
- Panel: `http://localhost:3000` (el login está en `/login`; el cambio inicial en `/new-password`).
- Vite reenvía `/api` a la API en `:4000`, así el panel funciona desde localhost, 127.0.0.1 o la IP de la red.

## 2. Estructura del monorepo

| Carpeta | Qué es | Estado |
|---|---|---|
| `apps/panel` | Panel de administración (plantilla Blakor Admin Pro adaptada) | Usuarios, roles, permisos, auditoría, perfil y primer ingreso listos |
| `apps/api` | API 1 (Hono + Better Auth + Drizzle + PostgreSQL) | Auth, usuarios, roles, permisos, bitácora y perfil listos |
| `packages/shared` | `@luz/shared`: esquemas Zod, países/teléfono, normalización de nombres, contraseña inicial | Usado por API y panel |
| `apps/web` | Web pública (React + Vite) | Datos de prueba (`src/api/mock*.ts`); falta conectarla a la API |
| `apps/mobile`, `apps/radio-api`, `infra` | App Android, API de radio, infraestructura | Pendiente |
| `referencia/plantilla-original` | Copia de la plantilla (solo referencia, fuera del workspace) | Se toma de ahí lo que haga falta |

## 3. Qué está hecho

**Autenticación y primer ingreso**
- Login en `/login` (plantilla v1 en tema claro, logo, fondo de ondas de radio).
- Cuentas con contraseña inicial `Apellido*.` (primer apellido con inicial mayúscula + `*.`). Al entrar por primera vez, el panel lleva a `/new-password`; la API bloquea el resto de rutas (403) hasta cambiarla.
- Cerrar sesión desde el menú lateral, el dock y la barra superior.

**Usuarios** (`/usuarios`, pestaña Directorio)
- Alta: nombres, apellidos, correo, teléfono (código de país con banderas, Bolivia 8 dígitos por defecto), rol. Muestra la contraseña inicial con botón copiar.
- Editar: nombres, teléfono, rol, estado (activo/inactivo), foto de perfil.
- Eliminar: limpio si la cuenta nunca tuvo actividad; lógico si ya entró o hizo cambios. Confirmación con SweetAlert.
- Tabla compacta con último acceso, filtros por estado y rol, cifras en una línea.

**Roles y permisos** (`/usuarios`, pestaña Roles y permisos)
- CRUD de roles (los de sistema no se eliminan; un rol con usuarios tampoco).
- Matriz de permisos editable solo por el superadmin.
- Permisos aplicados hoy: entrar al panel (`panel:acceso`), gestionar usuarios (`usuarios:gestionar`), ver bitácora (`logs:ver`), gestionar roles (`roles:gestionar`), superadmin (`superadmin:gestionar`).
- Las rutas del panel declaran su permiso en TanStack Router (`beforeLoad`); sin permiso → `/403`. El menú solo muestra lo permitido.

**Auditoría** (`/logs`): bitácora de usuarios, sesiones y perfil, con filtro por acción.

**En vivo con varias plataformas**
- El panel guarda el aviso (encendido, título) y una lista de enlaces: YouTube, TikTok, Facebook o radio. Puede haber varios a la vez; cada plataforma aparece una sola vez.
- La web muestra un botón "En vivo en …" por cada enlace activo. Migración `0008`: los enlaces viven en `live_streams`.

**Redes del ministerio**
- Guardadas en los datos del ministerio (`site.info`): YouTube, TikTok, Facebook y la app de Android. El pie de la web y el botón de videos las leen de ahí.
- Panel: Sitio web > Datos del ministerio (WhatsApp, correo, dirección, ciudad y redes). La web muestra solo los campos que tengan dato.
- Pendiente: la cuenta bancaria de donar sigue escrita en el código (AboutAndApp) y los textos de donar son de muestra.

**Programación de emisoras (flujo simple)**
- Emisoras > Programación: un solo selector de emisora. Botones: "Nuevo programa" y "Agregar horario".
- Calendario de esa emisora: clic en una hora libre agrega un horario con día y hora ya puestos. Clic en un programa lo edita.
- Tabla: la misma información en filas, con editar y quitar.
- El relleno ("Cuando no hay programa suena") se cambia desde la línea de arriba o desde la edición de la emisora.

**Programación de emisoras y relleno configurable**
- Cada emisora tiene un campo "Cuando no hay programa, suena": Música (por defecto), Historias, Música e historias, o Nada. Migración `0007`.
- La web muestra solo programas. El relleno (AutoDJ) se ve en el calendario del panel, no en la web.
- Web: la página de radio muestra en cada emisora lo que suena ahora y los dos siguientes (solo programas).
- Panel: el calendario de emisoras es más alto y muestra el relleno (AutoDJ) como franja de fondo.

**Rutas del panel (revisión)**
- Quitadas las rutas de plantilla sin uso: `/auth/404`, `/auth/500`, `/auth/505` y `/505`. Se mantienen `/403`, `/404` y `/500`.
- El calendario ya no es una ruta aparte: vive en Actividades (pestaña Calendario).
- Emisoras > Programación: calendario semanal de las franjas, con filtro por emisora.

**Calendario y programación semanal**
- Librería: FullCalendar 6.1.22 (núcleo MIT, fijado en esa versión; la 7 exige un polyfill de Temporal). Vistas de mes, semana y lista.
- Panel: en Actividades, pestaña Calendario (mes, semana, lista). Las no publicadas en gris. Clic en un evento abre la actividad.
- Web: `/programacion` tiene vista de día (lista) y de semana (cuadrícula de 7 días, bloques por horario). Es propia, sin librería.

**Fotos de emisoras**
- Las emisoras tienen foto (16:9): campo en el panel, miniatura en la tabla y en `/public/stations`. Migración `0006`. El seed carga las cuatro fotos de la demo (solo si la emisora todavía no tiene).

**Optimización de imágenes al subir (servidor)**
- La API procesa cada foto con `sharp`: corrige la orientación, recorta al centro en la proporción del campo, reduce al ancho máximo y comprime a JPEG. Acepta originales de hasta 12 MB.
- El panel envía la foto original con `ratio` y `maxAncho`. Ya no recorta en el navegador.
- Tablas del panel con miniatura: áreas, noticias, actividades (las demás ya la tenían).
- Corrección: las rutas de alta (`/noticias/nueva`, `/actividades/nueva`…) mostraban "este elemento ya no existe".

**Web pública conectada a la API (completa)**
- Todas las secciones leen de `/api/v1/public/*`: portada, áreas, personas, noticias, actividades, emisoras, programación, en vivo y donaciones. Se eliminaron `mock.ts` y `mock-extra.ts`.
- Si la API no responde, la sección muestra el error (no se rellena con datos de prueba).
- La web llama a `/api` y Vite lo reenvía a la API, así funciona desde otros equipos de la red.
- Sin servidor de transmisión: las emisoras no tienen `streamUrl`, así que el reproductor no intenta reproducir.
- Videos de muestra: 21 videos del canal de SUMtv, agrupados por área (biblia, niños, salud) y por serie. Solo para la demo: se reemplazan por los del canal del ministerio desde el panel antes de publicar.
- Datos generales (WhatsApp, correo, dirección) quedaron vacíos: se completan en la base (`site.info`), todavía sin editor en el panel.
- Proporciones: afiches (actividades y programas) 3:4; noticias 16:10; portada, emisoras y áreas 16:9; galería 4:3. La página de actividad muestra el afiche completo al lado del texto.
- Pendiente: las portadas de áreas (3:4 en la portada, 16:9 en su página) siguen con un recorte fuerte en la tarjeta de inicio.

**Edición de imágenes y páginas de edición** (panel)
- Cada edición (portada, áreas, personas, noticias, actividades, videos, series, emisoras, programas) tiene su propia página (`/noticias/:id`, `/contenido/areas/:id`, etc.). Ya no es ventana emergente. La franja horaria sigue como ventana pequeña.
- Proporción fija por campo (16:9 por defecto, 4:5 para personas y 4:3 para la galería). Al subir, la foto se recorta al centro en esa proporción y se reduce a 1600 px (800 px para retratos).
- Editor de Filerobot (`react-filerobot-image-editor@5.0.1`) con el recorte bloqueado a la proporción del campo. Se carga solo al abrirlo.
- Corrección: las ventanas emergentes salían recortadas dentro de las tarjetas (la tarjeta con efecto cristal crea su propio contenedor para lo fijo). Ahora se montan en `body`.
- Pendiente: probar en el navegador el editor y el recorte; la proporción se verificó solo por lectura del código.

**Gestión de contenido** (panel, permisos `contenido:editar`, `estaciones:todas`, `donaciones:ver`)
- Noticias (`/noticias`): título, enlace, resumen, texto, portada, área, autor, estado (borrador, programada, publicada, archivada) y fecha.
- Actividades (`/actividades`): tipo, fechas, lugar, inscripción (WhatsApp o enlace), presentador, costo, cupo y agenda por día.
- Videos (`/videos`): alta con enlace o ID de YouTube, área obligatoria, serie opcional de la misma área. Pestaña Series.
- En vivo (`/en-vivo`): interruptor con plataforma, enlace y título. Exige enlace al encender.
- Emisoras (`/emisoras`): principal, propias y una externa. Programación semanal por emisora (programas y franjas, sin solapes).
- Donaciones (`/donaciones`): formas de donar (QR, transferencia, PayPal, remesa) y necesidades, en texto.
- API: `/api/v1/contenido/*` (noticias, actividades, series, videos, en-vivo), `/api/v1/radio/*`, `/api/v1/donaciones`. Migración `0005`.
- Probado con curl: validaciones (fechas, series de otra área, emisora externa única, franjas que se cruzan, en vivo sin enlace), altas, ediciones y borrados. Pendiente: probar los formularios en el navegador.
- Pendiente de estas secciones: la web todavía no lee noticias, actividades, videos, en vivo, emisoras ni donaciones desde la API. Streaming, oyentes, recibos de donación y notificaciones siguen fuera.

**Contenido web** (`/contenido`, etapa 1, permiso `contenido:editar`)
- Pestaña Portada: diapositivas del carrusel (texto, texto tenue en 3 líneas, botón, imagen, color, orden, publicada).
- Pestaña Áreas: alta, edición y eliminación; plantilla A/B/C, ícono, color, WhatsApp, imagen principal, próximo evento (solo interruptor por ahora) y galería de fotos (plantilla B). El enlace (slug) no se cambia al editar.
- Pestaña Personas: predicadores, autores y equipo, con foto, cargo, biografía y orden.
- API: `/api/v1/contenido/*` (tablas `hero_slides`, `areas`, `area_gallery`, `people`; migración `0004`). Imágenes en `apps/api/uploads/contenido/`, servidas en `/api/v1/contenido/imagenes/:nombre`.
- Probado con curl: altas, ediciones, validación, subida, galería, eliminación y bitácora. Pendiente: probar los formularios en el navegador.
- Imágenes de la landing: las fotos de Gemini (zip `img-pages`) están optimizadas en `apps/web/public/demo/` (JPEG, recorte al tamaño de cada una). Faltan las de personas, nosotros, app y og, que siguen como placeholders.
- Web conectada: portada, áreas y personas se leen de `/api/v1/public/*` (`apps/web/.env.development`). Noticias, actividades, radio, videos y donaciones siguen con datos de prueba.
- Sembrado: `pnpm db:seed-contenido` (desde `apps/api`) copia las imágenes de la demo a `uploads/contenido` y carga el contenido de muestra. Es idempotente.
- Personas: los 4 nombres son de muestra inventados. Las personas reales del ministerio se cargan desde el panel.

**Perfil** (`/perfil`): foto, datos personales, teléfono y cambio de contraseña.

**Stack**
- Panel: React 19, Vite, Tailwind, TanStack Router, Query, Table y Form (con Zod). Build con `tsgo`.
- API: Hono, Better Auth, Drizzle, PostgreSQL 16. Validación con `@luz/shared`.
- Formularios: `useForm` de TanStack Form con esquemas de `@luz/shared`.

## 4. Decisiones que se tomaron (y por qué)

- **Sin borrado físico de cuentas con actividad**: se conserva el historial (eliminación lógica).
- **Contraseña inicial corta permitida**: `minPasswordLength: 4` en Better Auth, porque la contraseña inicial es `Apellido*.`. Las contraseñas que elige el usuario deben tener mínimo 8 (validado en API y panel).
- **Cuentas creadas por admin no inician sesión** (`autoSignIn: false`), para que la creación no cuente como último acceso.
- **Fotos en disco** (`apps/api/uploads/`, ignorado por git). Pendiente pasar a almacenamiento S3/MinIO.
- **Menú**: una sola disposición de referencia (dock por defecto); las otras disposiciones de la plantilla siguen en el código.

## 5. Pendientes

**Probar en navegador**
- Formularios de Contenido web (portada, áreas con galería, personas) y su subida de imágenes.
- Reemplazar los placeholders de `apps/web/public/demo/` por las fotos reales.

**Funcionales**
- Registrar en la bitácora los cambios de roles y permisos (`rol.*`).
- Permisos del catálogo sin módulo aún: `contenido:editar`, `donaciones:ver`, `estaciones:todas`, `estacion:propia`, `servidores:configurar`. Se aplican cuando existan sus módulos.
- Botón "Invitar" del antiguo módulo Staff ya se eliminó; el alta vive solo en Usuarios.

**Siguiente etapa (plan de producto)**
1. ~~**Contenido de la web** en el panel~~ (hecho en API y panel; falta probar en navegador). Pendiente: reglas de archivado de áreas con contenido, cuando existan noticias y actividades.
2. **Conectar la web pública** (`apps/web`) a la API y quitar los datos de prueba.
3. **Noticias y actividades** (con bitácora).
4. **App Android** (`apps/mobile`): noticias, actividades, videos y notificaciones.
5. **Radio**: `apps/radio-api` + Liquidsoap + Icecast.
6. **Despliegue** en VPS con Caddy y HTTPS.

## 6. Reglas de trabajo acordadas

- Antes de crear una pantalla o componente, revisar si existe en `referencia/plantilla-original` y tomarlo de ahí.
- No rehacer la plantilla ni cambiar la estructura del shell sin pedirlo.
- Validaciones en API y panel con los mismos esquemas de `@luz/shared`.
- Confirmaciones de acciones con SweetAlert (`confirmar()` de `shared/lib/confirm.ts`), no con `window.confirm`.
- Verificar en el navegador antes de dar algo por terminado; el usuario prueba y reporta.
- Los commits llevan la línea `Co-Authored-By` del asistente.
