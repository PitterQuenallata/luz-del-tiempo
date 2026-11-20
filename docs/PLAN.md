# Plan de desarrollo — Ministerio La Luz del Tiempo

> Actualizado: 19/11/2026. El alcance creció: el cliente es un **ministerio completo** (radio, escuelas, campañas, videos, lives), no solo una radio.
> Entregas del contrato: **Etapa 1: 04/12/2026** · **Entrega final: 21/12/2026**.

---

## 1. Visión general

```
Ministerio
├── Radio (multi-emisora, streaming 24/7)  ← incluye estaciones de terceros (operadores)
├── Áreas: Salud · Música · Biblia · Niños · … (página propia con plantilla)
│     └── Evento programado (opcional, se activa desde el panel)
├── Actividades: escuelas de vacaciones, escuela de música, talleres, campañas, estudios bíblicos
├── Videos: enlaces de YouTube (nunca se suben al VPS)
├── En vivo: aviso de live en YouTube / TikTok
└── Noticias · Quiénes somos · Donar · Contacto
```

---

## 2. Áreas con plantillas

Cada área (Salud, Música, Biblia, etc.) tiene una página propia que se crea desde el panel, **sin programar**.

### 2.1 Plantillas (3 fijas)
Todas usan el mismo fondo y estilo de la web; solo cambian imágenes, textos y la distribución.

| Plantilla | Distribución | Ideal para |
|---|---|---|
| **A — Portada grande** | Imagen hero a todo ancho + texto + bloques | Áreas con buena foto (Música, Salud) |
| **B — Texto + galería** | Texto a la izquierda, galería de 3–6 fotos a la derecha | Escuelas, talleres |
| **C — Simple** | Imagen pequeña + texto | Áreas nuevas con poco contenido |

### 2.2 Qué se configura en el panel (crear / editar área)
- Nombre, slug (`/salud`), icono/color de acento.
- Plantilla (A, B o C).
- Imagen de portada + galería (se convierten a WebP y se redimensionan al subir).
- **Contenido**: qué es, qué hace, a quién va dirigido (editor de texto enriquecido).
- Contacto del área (WhatsApp del responsable, opcional).
- Mostrar en menú: sí/no · Orden.
- Vínculos opcionales: estación de radio del área, playlist de YouTube.

### 2.3 Evento programado (toggle)
En la pantalla de editar área hay una sección **"Programar evento"** con un interruptor:

- **Desactivado** → la página muestra solo la información del área (qué es, qué hace, contenido).
- **Activado** → aparecen los campos del evento:
  - Título, tipo (escuela, taller, campaña, estudio bíblico, otro)
  - Fecha de inicio y fin, horario (o "todos los sábados 15:00")
  - Lugar o "Virtual" + link
  - Imagen del evento
  - Botón de inscripción: WhatsApp (mensaje prellenado) o link externo
  - Cupos (opcional, solo informativo)

  La página del área muestra un bloque destacado **"Próximo evento"** con cuenta regresiva y botón de inscripción. El evento también aparece en `/actividades` y en el inicio.

- **Cuando la fecha de fin pasa**, el evento se oculta solo (la página vuelve a mostrar solo la información) y queda en el historial de actividades.
- Al activar/publicar un evento: opción "Enviar notificación a la app".

> Técnicamente el evento es un registro de `actividades` vinculado al área. El toggle solo crea/edita ese registro desde la misma pantalla, para que sea fácil para el equipo.

---

### 2.4 Contenido editable de la web (no solo áreas)
Además de las áreas, el panel debe poder cambiar sin programar:
- **Hero del inicio** (carrusel): imagen, título, subtítulo, botón y orden.
- **Predicadores** y **autores** (foto, nombre, bio, redes/contacto), que se enlazan desde noticias, videos y actividades.
- Otros bloques que cambian con el tiempo (banners de campaña, aviso de "En vivo", textos de "Quiénes somos" y "Donar").

Todo esto se edita desde el panel y la web lo lee de la API.

## 3. Actividades (vista general)
- `/actividades`: lista + calendario de todas las actividades (de áreas o sueltas).
- Filtros por área y tipo. Estados automáticos: próximo / en curso / terminado.
- Es la evolución de la "Agenda" del contrato.

## 4. Videos (YouTube)
- En el panel solo se **pega el link**: se extraen el ID, la miniatura y el título (oEmbed, sin API key).
- Se asigna área y serie (ej. "Podcast Salud", "Demostraciones de música").
- En la web se usa una **fachada liviana** (miniatura → el iframe carga al hacer clic).
- `/videos` con filtros por área/serie. Cada área muestra sus últimos videos.
- *Futuro (Fase 3):* sincronización automática con el feed RSS del canal.

## 5. En vivo (YouTube / TikTok)
- Switch en el panel: **"Estamos en vivo"** + plataforma + link.
- Banner rojo en web y app; YouTube se incrusta, TikTok solo con botón (no se puede incrustar).
- Opción de enviar notificación push al activarlo.

---

## 6. Usuarios y roles

El ministerio podría prestar su streaming a **otras radios**. Para eso se crean usuarios que solo ven la configuración de **su** estación.

### 6.1 Roles

| Rol | Quién | Acceso |
|---|---|---|
| **Superadmin** | Desarrollador (Blakor.tech) | Todo, incluida la configuración de servidores, Icecast/Liquidsoap y los límites. |
| **Admin** | Responsable del ministerio | Todo el contenido, usuarios, todas las estaciones y donaciones. No toca servidores. |
| **Editor** | Equipo del ministerio | Noticias, áreas, actividades, videos y en vivo. Sin donaciones, oyentes ni usuarios. |
| **Operador de estación** | Radio externa (o encargado de una estación propia) | **Solo su estación**. |

### 6.2 Operador de estación
- **Un usuario = una sola estación** (`station_id` obligatorio para este rol). Una estación puede tener más de un operador (por defecto se permite; se puede limitar a uno).
- El admin lo crea desde **Panel → Usuarios → Nuevo operador**: nombre, correo, contraseña temporal y estación asignada (existente o nueva).
- Al entrar ve un panel reducido con solo:
  - Datos de la estación: nombre, logo, descripción, género
  - AutoDJ: subir/ordenar audios y playlists, rotación
  - Programación semanal de su estación
  - Credenciales para transmitir en vivo (host, puerto, mount, contraseña de fuente) y botón para regenerarlas
  - Estado: al aire / AutoDJ / caído y oyentes actuales
  - Estadísticas básicas de oyentes
  - **URL del stream + reproductor embebible** (código para pegar en su propia web)
- No puede ver: otras estaciones, noticias, donaciones, oyentes del ministerio, usuarios ni notificaciones.

### 6.3 Límites por estación (los fija el superadmin)
El VPS es de 4 vCPU / 8 GB / 100 GB y lo paga el ministerio, así que cada estación externa tiene topes:
- **Almacenamiento del AutoDJ**: **5 GB por defecto, máximo 10 GB** por estación. Solo el superadmin lo cambia, dentro de ese tope. Es el riesgo más real.
  - La API rechaza la subida si se pasa de la cuota (se verifica antes de guardar el archivo, no después).
  - El operador ve una barra "usado / disponible" en su panel.
  - Aviso al superadmin cuando una estación pasa del 90 % o el disco del VPS pasa del 80 %.
- Oyentes simultáneos máximos.
- Bitrate (ej. 64–128 kbps).
- Activa / suspendida (si una radio deja de cumplir, se suspende sin borrarla).

### 6.4 Visibilidad
Cada estación tiene `tipo: propia | externa` y `visible_en_ministerio: sí/no`.
Por defecto las externas **no** aparecen en la web ni en la app del ministerio (solo usan el streaming), salvo que el admin lo active.

### 6.5 Implementación
- Better Auth con plugin de admin/roles; la verificación del rol y del `station_id` se hace **en la API 1** (no solo ocultando botones en el panel).
- Cada endpoint de estaciones filtra por `station_id` del usuario si es operador.
- La API 2 (radio-api) solo recibe órdenes de la API 1, nunca del operador directamente.
- Contraseñas de fuente de Icecast únicas por estación (mount por estación).
- Registro de auditoría: quién cambió qué en cada estación.

---

## 7. Modelo de datos

> ✅ Diseño completo en [`DATABASE.md`](DATABASE.md) (32 tablas, permisos, reglas). Lo de abajo es el resumen original.

```
areas          id, slug, nombre, plantilla(A|B|C), portada, galeria[], contenido,
               color, icono, whatsapp, en_menu, orden, station_id?, yt_playlist?
actividades    id, area_id?, tipo, titulo, descripcion, inicio, fin, horario_texto,
               lugar, virtual_url, imagen, inscripcion_tipo(whatsapp|link), inscripcion_valor,
               cupos?, notificar, publicado
videos         id, youtube_id, titulo, miniatura, area_id?, serie_id?, destacado, publicado_en
series         id, nombre, area_id?
en_vivo        (fila única) activo, plataforma(youtube|tiktok|radio), url, titulo, desde
stations       id, nombre, slug, logo, descripcion, tipo(propia|externa), visible_en_ministerio,
               estado(activa|suspendida), mount, source_password, bitrate,
               max_oyentes, cuota_mb (default 5120, máx 10240)
users          (Better Auth) + role(superadmin|admin|editor|operador), station_id?
audit_log      id, user_id, accion, entidad, entidad_id, cambios, fecha
```
(+ posts, programas, donaciones, oyentes, notificaciones ya previstos)

---

## 8. Mapa del sitio

Cada sección tiene su propia página con una cabecera común (como las subpáginas de SUMtv).

```
/                        Inicio (portada, en vivo, programación de hoy, videos, actividades, áreas, emisoras, noticias)
/radio                   En vivo: reproductor grande + todas las emisoras visibles
/programacion            Guía semanal: día por día, "Ahora" resaltado, filtro por emisora
/videos                  Videos de YouTube con filtros por área y serie
/noticias                Lista de noticias        /noticias/:slug   Noticia
/areas                   Todas las áreas          /areas/:slug      Área con su plantilla (portada grande | texto + galería | simple) + evento si está activo
/actividades             Próximas actividades     /actividades/:slug Actividad: fecha, horario, lugar, inscripción
/nosotros                Historia, misión, qué hacemos, equipo
/donar                   Formas de donar, necesidades del ministerio, contacto
/contacto                WhatsApp, correo, dirección y mensaje rápido
```
App Android: pestañas **Radio · Noticias · Actividades · Videos** + banner de en vivo.

### 8.1 Análisis de SUMtv Latino (referencia, 19/11/2026)

| Módulo de SUMtv | Qué tiene | En nuestro proyecto | Estado |
|---|---|---|---|
| Acerca | Quiénes somos, contacto, oradores con perfil, socios, empleo, "Invitar a un orador" (formulario) | `/nosotros` (historia + equipo) y `/contacto` | ✅ Contrato. Perfil por orador e "Invitar orador": Fase 3 |
| Donaciones | Formas de donar, donar en línea (pasarela externa), donaciones benéficas, vehículos, acciones, necesidades del ministerio | `/donar`: QR, transferencia, depósito, remesa, necesidades y WhatsApp | ✅ Contrato. Pago en línea con tarjeta: Fase 3 |
| Eventos | Lista, evento con lugar, presentador, precio, horario diario y botón Registrarse | `/actividades` y `/actividades/:slug` (inscripción por WhatsApp o enlace) | ✅ Contrato. Inscripción en línea con base de datos: Fase 3 |
| SUMtv (TV) | En vivo 24/7, guía de programación (Ahora / Anterior / Hoy / Siguiente), series, escuela sabática, podcasts, sermones | `/radio`, `/programacion`, `/videos` (series = `video_series`) | ✅ Contrato |
| Recursos | Manuales de estudio, boletines, artículos, declaraciones (PDF) | Por ahora noticias. Biblioteca de PDF descargables: tabla `resources` | Fase 3 |
| Tienda | Sitio aparte (sumtv.store): catálogo, carrito, cuenta, lista de deseos | — | ❌ Fuera de contrato. Futuro proyecto aparte |
| Inglés | Sitio aparte en inglés | — | Futuro (columnas `*_i18n`) |
| Buscador | Búsqueda en todo el sitio | — | Fase 3 (`tsvector` en Postgres) |

**Conclusión:** casi todo lo de SUMtv ya cabe en nuestras tablas. Lo nuevo para el futuro es: `resources` (PDF), perfiles de predicadores con formulario de invitación, pago en línea, buscador, inglés y la tienda (otro proyecto).

---

## 9. Reparto por etapas

| Etapa | Fecha | Incluye |
|---|---|---|
| **Etapa 1** | 04/12/2026 | Identidad visual, web base, **áreas con 3 plantillas**, panel de publicaciones y áreas, roles admin/editor, VPS + dominio + HTTPS |
| **Etapa 2** | 21/12/2026 | Actividades + evento programado por área, videos YouTube, switch en vivo, donaciones, oyentes, notificaciones, multi-emisora + **operadores de estación con límites**, streaming 24/7, app Android, capacitación |
| **Fase 3** (cotizar aparte) | 2027 | Inscripciones en línea (ojo: datos de menores), sync automático de YouTube, podcast RSS (Spotify), galerías de campañas, certificados, cobro a radios externas, biblioteca de recursos PDF, perfiles de predicadores + "invitar a un predicador", pago en línea, buscador, inglés |
| **Futuro aparte** | — | **Tienda en línea** (como sumtv.store): catálogo, carrito, pagos, envíos. Es otro proyecto, no está en el contrato |

> ⚠️ El calendario es ajustado: lo nuevo de Etapa 2 (operadores, videos, en vivo) entra a buena voluntad; si algo se atrasa, se mueve primero el panel de operadores, que no es urgente según el cliente.

## 10. Pendientes con el cliente
- [ ] ¿El ministerio tiene nombre propio distinto de "Radio La Luz del Tiempo"? Afecta logo y marca (antes del 04/12).
- [ ] Lista inicial de áreas y qué plantilla quiere para cada una + fotos.
- [ ] ¿Las radios externas pagarán por el servicio? ¿Quién les da soporte?
- [ ] Alinear contrato (solo Android) vs compromiso (Android + iPhone).
- [ ] Canal de YouTube y cuenta de TikTok (links).
