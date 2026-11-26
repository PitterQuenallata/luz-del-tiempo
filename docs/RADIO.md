# Radio — Icecast + Liquidsoap + radio-api

> Actualizado: 26/11/2026 (Icecast por emisora, Fase 6). Antes: 23/11/2026. Probada solo la `radio-api` (sin Docker); Icecast y Liquidsoap aún no se levantaron.

## 1. Cómo está armada

```
Locutor (BUTT/OBS) ──► :base+5 Liquidsoap (harbor) ─┐
                                                    ├─► Icecast de la emisora :base ──► Oyentes (web, app)
AutoDJ (carpeta de audios por estación) ─────────┘        ▲
                                                           │ estado y oyentes
API 1 (apps/api) ──token──► radio-api :4100 ───────────────┘
                              │
                              └─► escribe stations.json y guarda los audios
```

| Pieza | Dónde | Qué hace |
|---|---|---|
| **Icecast** | `infra/radio/liquidsoap/` (Icecast 2 dentro de la imagen Debian de Liquidsoap) | Un Icecast por emisora, como AzuraCast. Cada estación escucha en su puerto de oyentes (base de su bloque): `http://<servidor>:8000/principal`, `:8010/musica`… |
| **Liquidsoap** | `infra/radio/liquidsoap/radio.liq` (imagen propia `infra/radio/liquidsoap/Dockerfile`, basada en `savonet/liquidsoap:v2.4.6`) | AutoDJ 24/7 por estación y entrada en vivo. Si entra un locutor, tiene prioridad; si no hay audios, transmite silencio. |
| **radio-api** | `apps/radio-api` (Hono + Node) | API 2. Solo le habla la API 1, con `Authorization: Bearer <RADIO_API_TOKEN>`. |

- **Como AzuraCast en el motor, no en el panel**: cada estación tiene su Icecast y su Liquidsoap, y su bloque de 10 puertos (oyentes, control y locutores) desde 8000. No usamos AzuraCast en sí: duplicaría el panel (usuarios, roles, estaciones). La lógica de dueños, operadores y límites vive en la API 1 y la base de datos (`docs/DATABASE.md`).
- **Capacidad**: hasta 20 estaciones (8000–8199). Cada estación encendida usa ~200 MB de RAM (Liquidsoap) más su Icecast.
- **Emisoras y estaciones**: cada emisora contiene sus estaciones (sección 6). Una emisora de un tercero tiene una sola estación y un responsable.
- **Encender, apagar, AutoDJ y activar o pausar cada playlist** (sin reiniciar nada): van en `data/config/estado.txt`, una línea por clave: `slug 1|0` (emisora), `slug.autodj 1|0` (AutoDJ), `slug/playlist 1|0` (playlist en esa emisora). Liquidsoap lo lee cada 2 s. **No corta a las demás** (probado).
- **Cambios de estructura** (reinician Liquidsoap, un corte de unos segundos para todas): crear o borrar una emisora, la primera vez que una emisora sale al aire, cambiar punto de transmisión, contraseña, calidad o nombre de salida, crear, borrar o cambiar el modo, peso o horarios de una playlist de la biblioteca. `stations.json` solo cambia en esos casos.
- **Borradores** (`status = draft`): se crean con su punto de transmisión, pero no se envían a la radio ni salen al aire ni en la web hasta que se activen.
- **Contraseña del locutor**: cada estación tiene la suya (`livePassword`). La radio-api nunca la devuelve. Icecast tiene una contraseña de fuente interna que solo usa Liquidsoap.

## 2. Levantarla

Desde la raíz del repo:

```bash
cp infra/radio/.env.example infra/radio/.env     # cambiar todas las contraseñas
docker compose -f infra/radio/compose.yaml up -d --build
docker compose -f infra/radio/compose.yaml logs -f liquidsoap
```

Los datos quedan en `infra/radio/data/` (ignorado por git):
- `data/config/stations.json`: estaciones (lo escribe la radio-api).
- `data/music/<slug>/`: audios del AutoDJ de cada estación.

| Puerto | Servicio | Para quién |
|---|---|---|
| 8000 + 10·n | Icecast de la estación n | Oyentes: `http://<host>:<puerto>/<mount>` (la principal es 8000). Admin en `/admin/` de cada una |
| 8000–8199 | Bloque | 20 estaciones, 10 puertos cada una: oyentes (base), control (base+4), locutores (base+5) |
| base+5 | Liquidsoap harbor | Locutores en vivo (la principal: 8005). Mount = slug de la estación, contraseña = `livePassword` |
| 4100 | radio-api | Solo la API 1 |

**Sin Docker** (solo la radio-api, para desarrollar): `cp apps/radio-api/.env.example apps/radio-api/.env` y `pnpm --filter @luz/radio-api dev:local` (no lo uses si Docker ya tiene la radio-api encendida: ambas usan el puerto 4100).

## 3. Endpoints de la radio-api

Todos los `/v1/*` piden `Authorization: Bearer <RADIO_API_TOKEN>`.

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/health` | Sin token. `{"status":"ok"}` |
| GET | `/v1/stations` | Estaciones + estado en Icecast (en línea, oyentes, canción) |
| GET | `/v1/stations/:slug` | Una estación + espacio usado |
| PUT | `/v1/stations/:slug` | Crea o actualiza. Body: `name`, `mount`, `livePassword` (mín. 8), opcionales `bitrate` (32–320, 128), `autodj`, `enabled`, `maxListeners` (≤ 2000), `storageQuotaMb` (≤ 10240). 409 si el mount ya lo usa otra estación |
| DELETE | `/v1/stations/:slug` | Quita la estación (los audios quedan en disco) |
| GET | `/v1/listeners` | Oyentes por estación, para guardar muestras cada 1–5 min |
| GET | `/v1/stations/:slug/tracks` | Audios del AutoDJ + cuota |
| POST | `/v1/stations/:slug/tracks` | Sube un audio (multipart, campo `file`, máx. 300 MB). mp3, ogg, opus, m4a, aac, flac, wav. 409 si pasa la cuota |
| DELETE | `/v1/stations/:slug/tracks/:file` | Borra un audio |

Ejemplo:

```bash
curl -X PUT http://localhost:4100/v1/stations/principal \
  -H "Authorization: Bearer $RADIO_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Radio La Luz del Tiempo","mount":"/principal","livePassword":"cambiar1234"}'
curl -H "Authorization: Bearer $RADIO_API_TOKEN" -F file=@cancion.mp3 \
  http://localhost:4100/v1/stations/principal/tracks
# Escuchar: http://localhost:8000/principal
```

## 4. Dónde corre

| Entorno | Estado |
|---|---|
| **PC Windows (desarrollo)** | ❌ **No se pudo levantar.** Esa PC tiene un Windows 11 modificado (MiniOS, build Insider 26300). WSL falla al crear su máquina virtual (`Wsl/Service/RegisterDistro/CreateVm/0x8007273f`, "dirección incompatible con el protocolo"), así que Docker Desktop no arranca. Se probó `wsl --shutdown`, reiniciar Docker y `netsh winsock reset` + reinicio, sin éxito. Problema del sistema operativo, no del proyecto: no volver a intentarlo en esa PC. |
| **Mac M1 (desarrollo)** | Recomendado. OrbStack/Colima/Docker Desktop. Las imágenes tienen versión ARM. |
| **VPS (producción)** | Contabo Cloud VPS 4: 4 vCPU, 8 GB RAM, 100 GB SSD, puerto 200 Mbit/s, tráfico ilimitado. Ubuntu 24.04 LTS. A 128 kbps, el puerto alcanza para ~1.000+ oyentes simultáneos. |

## 5. Pendientes

**Hecho en el panel (menú por secciones):**
- **Informes**: oyentes por hora del día y por día de la semana, pico y promedio por emisora, y el historial de reproducción de cada estación.
- **Sistema** (superadmin): copias de seguridad con hora y días de retención configurables, tareas de fondo y registros de la radio.
- **Medios → Revisión**: posibles duplicados y audios sin asignar a ninguna lista.
- **Emitiendo** (estación): pista que suena, siguiente lista y últimas canciones.

**Pendiente** (lista completa en `docs/PENDIENTES-PRODUCCION.md`):
- Copia externa: hecha con un destino local (probada). Falta probarla por SSH contra el destino real y decidir dónde guardarla.
  - Se configura en Sistema → «Copia externa». Vacío = apagada.
  - Requisitos en el servidor: `rsync` y `openssh-client`, y una clave SSH sin contraseña para el usuario que corre la API.
  - La retención en el destino no se aplica sola: las copias viejas hay que borrarlas allá.
- Despliegue en el Contabo VPS (Docker + restaurar `.env` y una copia; no se ha probado allí).
- Prueba del emisor .exe con el inicio de sesión de locutor.

**Próximo plan (no empezado):**
- Emisora apagada u oculta (`visibleInMinistry = false`) debe desaparecer de la **web** y de la **app móvil**: hoy el interruptor solo apaga el stream, y el reproductor público todavía no lo consulta.

## 5b. Calidades y redes inestables (medido el 26/11/2026)

- **Audio real** (con `ffprobe`): la variante `alta` (configurada 128) sale a ~134 kbps de audio y la `baja` (configurada 48) a ~51 kbps. La codificación es correcta.
- **Lo que viaja por la red** (segmentos HLS de 4 s): `alta` ~211 kbps y `baja` ~97 kbps. Casi el doble de la baja configurada.
- **Causa**: el empaquetado MPEG-TS de Liquidsoap/ffmpeg mete ~25 % de bytes de más por segmento. Un remux sin recodificar del mismo segmento lo baja de 108 KB a 82 KB, pero no encontramos opción en Liquidsoap que lo quite.
- **Efecto en redes lentas**: la variante «baja» necesita ~100 kbps de red, así que no protege a quien tiene menos de eso.
- **Cambio de calidad**: reinicia solo esa estación. Medido: los oyentes de `musica` tuvieron huecos de hasta ~0,7 s y reconectaron solos. `principal` no tuvo ningún corte.
- **Codificador descartado como causa**: la imagen de Liquidsoap trae `libfdk_aac` (como AzuraCast). Con los dos codificadores a 48 kbps, en el mismo intervalo, `libfdk_aac` escribió 167 KB y el nativo 170 KB. El peso extra está en el empaquetado MPEG-TS, no en el codificador.
- **Decisión pendiente**: bajar `calidad_baja` (por ejemplo a 24 kbps) o revisar las opciones del muxer MPEG-TS / el formato del HLS. Ninguna está hecha.

## 6. Emisoras, estaciones y archivos

Tres niveles:

- **Emisora** (`radios`): el contenedor, p. ej. «Radio La Luz del Tiempo». Tiene su archivo y sus **listas de producción** (`station_playlists.radio_id`), que todas sus estaciones pueden activar. Una emisora de un tercero tiene un **responsable** (`ownerUserId`) y **una sola estación**.
- **Estación** (`stations`): lo que transmite (mount, contraseña, AutoDJ, interruptor). Pertenece a una emisora. Tiene su archivo y sus listas (`station_playlists.station_id`).
- **Archivo**: en cada nivel. El de la estación lo usa solo esa estación; el de la emisora lo usan sus estaciones cuando las activan.

Reglas de acceso (API, `acceso.ts`):

- `estaciones:todas` (superadmin, admin): todo.
- `estacion:propia` (operador de un tercero): solo las estaciones de su emisora (`ownerUserId`). No ve otras emisoras, no crea emisoras ni estaciones, y no cambia estado, enlace ni visibilidad de su estación.

Al crear una estación se elige **Crear AutoDJ**: nace con su propia lista («Música automática», vacía). Sin AutoDJ, solo transmite. Una estación nunca activa listas de otra: las de la emisora solo suenan si ella las activa con «Suena aquí» (`estado.txt`).

Almacenamiento en la radio-api: cada archivo es una carpeta. La de la estación es su `slug`; la de la emisora es `arch-<12 primeros caracteres del id de la emisora>`. Las pistas de la emisora llevan esa carpeta en la lista (`arch-…/archivo.mp3`).


## 7. Web y app

- `GET /public/stations`: estaciones de **Luz del Tiempo** (emisora del ministerio), con su emisora. Es lo que muestran la web (`/radio`) y la app.
- `GET /public/emisoras` y `GET /public/emisoras/:slug`: emisoras de **terceros** publicadas, cada una con su única estación. La web las muestra como tarjetas en `/radio` y tiene una página propia, `/emisora/:slug`, con solo reproducir y lo básico.
- Una emisora o estación oculta (`visibleInMinistry = false`) o no activa (`status ≠ active`) no sale en ninguna lista pública.
- Solo puede haber una emisora principal: el panel bloquea la marca si ya existe otra, y la API la rechaza.
