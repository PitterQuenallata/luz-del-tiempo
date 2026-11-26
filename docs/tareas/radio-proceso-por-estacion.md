# Radio: arquitectura por fases, como AzuraCast

Objetivo: que la radio se comporte como AzuraCast en fluidez, seguridad y estabilidad.
Cambiar una emisora no debe cortar a las demás, y el cliente no debe notar reinicios.
Estamos en desarrollo: se puede cambiar la estructura, pero cada fase deja la radio funcionando.

## Qué hace AzuraCast (código clonado, ver memoria `reference_azuracast_fuente`)

| Tema | AzuraCast | Antes en La Luz del Tiempo | Después de la Fase 1 |
|---|---|---|---|
| Procesos | Un programa de supervisord por estación (`Configuration::getSupervisorProgramName`) | Un solo Liquidsoap para todas | Un proceso de Liquidsoap por emisora **encendida** (`supervisa.sh`) |
| Reinicio | `restart()` solo toca el programa de esa estación (`AbstractLocalAdapter.php`) | Cambiar `stations.json` apaga a todas | `radio.liq` compara **su propia entrada** y se cierra; el supervisor la vuelve a levantar |
| Configuración | `liquidsoap.liq` generado por estación (`Liquidsoap/ConfigWriter.php`) | Un `radio.liq` para todas | El mismo `radio.liq` con `STATION_SLUG`; cada proceso crea solo su emisora |
| Puertos | Stream y DJ por estación (`getStreamPort`, por defecto frontend+5); API interna = puerto −1 | Harbor fijo 8005 | `harbor_port` por emisora (8005–8010), asignado por la radio-api |
| Caché | `LIQ_CACHE_SYSTEM_DIR` / `LIQ_CACHE_USER_DIR` por estación | Caché compartida: los procesos se pisan | Caché propia por estación (`/tmp/radio-run/cache/<slug>`) |
| Apagada | La estación se quita del supervisor (`removeLocalServices`) | Proceso siempre vivo, con compuerta | Proceso detenido: no gasta memoria |
| Cambios en caliente | API de control por HTTP con clave por estación (`azuracast.liq`, `server.harbor`) | Archivos que se leen cada 2 s (`estado.txt`, `saltar/`, `programas.txt`) | Pendiente (Fase 3) |

## Fase 1: un proceso por emisora (HECHA, sin subir a git)

Cambios:
- `infra/radio/liquidsoap/supervisa.sh` (nuevo): un vigilante por estación. Reinicia con espera creciente si
  se cae en menos de 30 s (hasta 30 s). Detiene la que sale de la lista. Caché propia por estación.
- `infra/radio/liquidsoap/radio.liq`: lee `STATION_SLUG`; crea solo esa estación; usa `st.harbor_port`;
  se cierra solo si cambia su entrada en `stations.json` (ya no compara el archivo entero).
- `infra/radio/compose.yaml`: `entrypoint` = `supervisa.sh`; `init: true`; puertos `8005-8010`. (Ya superado: hoy es un bloque de 10 puertos por emisora dentro de 8000–8199; ver `RADIO.md`.)
- `apps/radio-api/src/stations.ts`: `harbor_port` por estación; migración (las existentes reciben 8005, 8006…);
  puerto libre al crear; `emisoras.txt` con las emisoras **encendidas**. `index.ts` responde 409 `sin_puerto_libre`.
- `apps/api`: columna `stations.harbor_port` (migración `0027_harbor_port.sql`, aplicada en la base de desarrollo);
  la sincronización guarda el puerto que devuelve la radio-api; el panel (`vistaTransmision`) y el emisor
  (`/emisoras`) usan el puerto de **su** emisora. Se quitó la lectura de `RADIO_HARBOR_PORT`.
- Panel: el texto fijo de Configuración describe hoy los bloques de 10 puertos dentro de 8000–8199 (máximo 20 emisoras).

Verificado en Docker (Colima), 2026-11-25:
- Tres emisoras en el supervisor, cada una con su puerto (principal 8005, musica 8006, salud 8007).
- `principal` al aire mientras se enciende `musica` y se cambia su calidad de 128 a 96 kbps: **hueco máximo 0,16 s
  en 40 s** de audio. `musica` se reinició sola (unos 2 s) y volvió con 96 kbps.
- Apagar `musica`: su proceso se detiene y `principal` sigue con **hueco máximo 0,15 s en 25 s**.
- Un proceso encendido ocupa unos 200–300 MB. Con cuatro procesos a la vez el contenedor llegó al límite de
  1,9 GiB de Colima y el kernel mató uno al arrancar (`oom_kill`). Por eso ahora solo corren las encendidas.

No verificado todavía:
- La página del panel (texto de Configuración) no se revisó en el navegador.
- Crear y borrar desde la app. Probado con la radio-api (`PUT` y `DELETE`): la emisora de prueba aparece con su proceso y puerto 8009, y al borrarla su proceso se detiene. La principal tuvo hueco máximo de 0,18 s al crear y 0,15 s al borrar.
- Locutor en vivo por el puerto de cada emisora (BUTT/OBS).
- La sincronización de la API no se ejecutó: los puertos de la base de datos se copiaron desde `stations.json`
  con SQL (las tres emisoras con transmisión). La próxima sincronización los deja igual.

## Fase 2: que solo reinicie lo que debe reiniciar (HECHA, sin subir a git)

Antes: el peso, el número de audios y el nombre de cada lista iban en `stations.json`. Subir un audio reiniciaba la emisora.
AzuraCast tampoco reinicia por listas en su AutoDJ normal (solo con AutoDJ manual, `StationRequiresRestart.php`).

Cambios:
- `stations.json` guarda solo lo estructural de cada lista: `id` y `shuffle`. Lo demás va en archivos que se leen en caliente:
  - `listas.txt` (nuevo): `slug/id;nombre;pistas`. Lo escribe la radio-api en `guardarPlaylists`.
  - `programas.txt` y `estado.txt`, como antes.
- La rotación ya no usa `rotate(weights=…)` (pesos fijos al arrancar). Usa `request.dynamic`: elige un audio cada vez.
  Cuando la cola de la lista en turno se vacía, carga la siguiente (su `.m3u` se lee en ese momento). Cada lista suena completa, en orden o barajada (`list.shuffle`, en una copia en /tmp).
  - Se probó antes con `source.dynamic` y `playlist.once`: en esta versión de Liquidsoap creaba listas sin parar (2357 en 50 s), porque una lista nueva no está lista hasta cargar.
  - Se probó con contadores `on_track` sobre `switch`: el orden no era fiable.
- Migración al arrancar la radio-api: los nombres y pistas que aún estaban en `stations.json` pasan a `listas.txt`.
- `radio-api`: `siguienteDeRotacion` (Siguiente lista) y `GET /playlists` leen nombre y pistas de `listas.txt`.
- `compose.yaml`: se monta la carpeta `liquidsoap/` completa, no archivos sueltos (un archivo suelto se rompió al editarlo en el host y la emisora cayó con «File is not readable»).

Verificado (2026-11-26):
- Prueba aislada con dos listas (A de 2 audios, B de 1): el orden fue A, A, B, A, A, B. Al cambiar las pistas de A a 1 con la emisora al aire, siguió sin reiniciarse.
- Radio real: al cambiar pistas de una lista en `listas.txt`, la principal tuvo hueco máximo de 0,16 s en 40 s y 0 reinicios.
- La principal sigue sonando su rotación (lista «xD»).

Pendiente de esta fase:
- Cambiar el modo aleatorio de una lista (`shuffle`) y el orden de las listas (arrastrar) todavía reinician la emisora. Son cambios poco frecuentes; si molestan, pasan a `listas.txt`.
- La primera vez que se desplegó, cada emisora se reinició una vez (cambió el formato de `stations.json`).
- El peso (`weight`) ya no afecta la reproducción (la lista entera suena en su turno, igual que antes con pistas). Quitar el campo de la API en una fase posterior.
- No se probó de punta a punta desde el panel (subir audio y ver el cambio en la app).

## Fase 3: comandos en caliente, como AzuraCast (HECHA, sin subir a git)

Cambios:
- Cada emisora atiende comandos en su puerto de control (locutores + 1000: 9005–9010). Ese puerto solo lo ve la red de Docker y no se publica.
  Liquidsoap lo abre con `server.harbor` y registra los comandos con `server.register`, igual que AzuraCast (`azuracast.utilities.add_skip_command`).
- La clave `CONTROL_KEY` (`RADIO_CONTROL_KEY` en `infra/radio/.env`) se revisa solo en la ruta `/telnet`, para no tocar a los locutores.
- Comandos: `<slug>.saltar` y `<slug>.siguiente_lista`.
- La radio-api (`apps/radio-api/src/control.ts`) los envía con `POST /telnet`. Si la emisora no responde (apagada o caída), devuelve 503 `radio_no_responde`.
- Se quitaron los archivos `saltar/` y `saltar-lista/` y los sondeos cada 2 s.

Verificado (2026-11-26):
- Sin clave: 401. Con clave: `Listo`.
- «Saltar» en la principal: la pista cambió al instante.
- «Siguiente lista» en la principal: pasó de «Música general» a «Historias» en unos 12 s (salta audios hasta cambiar de lista).
- Emisora apagada: 503 `radio_no_responde`.
- Sin errores nuevos en el log de Liquidsoap.

Pendiente de esta fase:
- Encender/apagar, AutoDJ y activar listas siguen en `estado.txt`, que se lee cada 2 s. Es estado persistente, así que no se cambia a comandos: un comando se pierde si el proceso se reinicia. Se puede añadir un comando que actualice el estado en memoria y dejar el archivo como respaldo.
- El panel no muestra todavía que el comando no llegó (solo lo ve la respuesta 503).

## Fase 4: seguridad y estabilidad (HECHA, sin subir a git)

Cambios:
- Límite de memoria: Liquidsoap `mem_limit: 1536m` (seis emisoras ≈ 1.1 GB, con margen), radio-api `256m`.
  Medido con tres emisoras encendidas: 523 MiB en total, 170–190 MB por proceso.
  Si un proceso crece de más, el sistema lo mata solo y el supervisor lo vuelve a levantar.
- Estado de cada proceso: `supervisa.sh` escribe `procesos/<slug>.txt` (estado, reinicios, desde, último código de salida).
  La radio-api lo expone en `GET /v1/stations/:slug` (`proceso`). La API lo da en `GET /estaciones/:id/proceso`.
  El panel lo muestra en «Emitiendo» de Resumen: «en marcha · N reinicios» o «reiniciando (último código …)».
- Se quitó `RADIO_HARBOR_PORT` de `apps/api/.env` (ya no se usa).

Verificado (2026-11-26):
- Matar a mano el proceso de la principal: el estado pasó a `reinicios=1`, `ultimo_codigo=137` y volvió a «en marcha» solo.
- Panel en el navegador (superadmin, Resumen de la principal): «Proceso: en marcha · 1 reinicio desde que arrancó».

Pendiente de esta fase:
- Registro de reinicios en Registros (solo superadmin): hoy queda en los logs de Docker y en el contador.
- Healthcheck del contenedor: el supervisor ya reinicia; falta un chequeo que avise si el supervisor mismo se cae.
- Avisos de Liquidsoap: `json.parse` está obsoleto y el ruido «Error while parsing playlist» viene del formato de los .m3u. No afectan la reproducción; se limpian en una fase de mantenimiento.
- Las cuentas de desarrollo y las claves de control viven en `infra/radio/.env` (no se suben a git).

## Fase 5: pruebas de fluidez (HECHA, sin subir a git)

Medido con `gap.py` (hueco máximo entre bytes del mount, durante el cambio):

| Prueba | Resultado |
|---|---|
| Cambiar calidad de musica (128→96) con principal y salud al aire | principal 0,14 s, salud 0,16 s, en 45 s. musica: 1 reinicio propio |
| Subir audio a musica y agregarlo a una lista en caliente | principal 0,14 s, salud 0,14 s. musica: 0 reinicios. Liquidsoap cargó el audio nuevo |
| Locutor en vivo por el puerto de la principal (8005) | entra (cambio a principal_vivo), y al terminar vuelve solo al AutoDJ, unos 34 s después |
| Reinicio completo del contenedor | las tres emisoras al aire en 11 s |
| Crear y borrar una emisora (Fase 1) | principal 0,18 s y 0,15 s |
| Reemplazar archivos de estado en caliente (400 veces, prueba de estrés) | 0 errores no controlados, 0 reinicios |

Error encontrado y corregido en esta fase:
- Al editar `listas.txt` durante la reproducción, un error de lectura (el archivo se reemplazaba en ese instante)
  tumbaba el hilo que lo vigila. La rotación dejaba de actualizarse en silencio.
  Corrección: todas las lecturas de archivos pasan por `leer_archivo` (con `try/catch`), y el vigilante de
  `stations.json` ignora una lectura vacía (no reinicia por error).

Limitaciones de la prueba:
- El audio nuevo se agregó al `.m3u` y a `listas.txt` directamente, no con el `PUT` de playlists de la API.
  El `PUT` reemplaza todas las listas de la emisora y no quise reescribirlas en una prueba. Ese camino
  (panel → API → radio-api) no se probó de punta a punta.
- El locutor se probó con curl, no con BUTT u OBS.
- Todo se revirtió al final: musica y salud apagadas, calidades originales, `listas.txt` y listas sin el audio de prueba.

## Fase 6: un Icecast por emisora, con bloque de puertos (HECHA, sin subir a git)

Decisión del usuario: copiar a AzuraCast también en el Icecast. Cada emisora tiene su propio Icecast.

Bloque de puertos (igual que AzuraCast, `Configuration.php`): cada emisora reserva 10 puertos desde 8000.
- base → oyentes (su Icecast)
- base+4 → control de Liquidsoap (comandos: saltar, siguiente lista)
- base+5 → locutores (harbor / DJ)

Cambios:
- `apps/radio-api/src/stations.ts`: `bloqueLibre` reserva el primer bloque libre; `reservarEstacion` crea la estación apagada (sin proceso).
- `apps/radio-api`: el estado de los mounts se pide a cada Icecast en su puerto (`icecast.ts`). `emisoras.txt` lleva «slug puerto».
- `infra/radio/liquidsoap/Dockerfile` (nuevo): imagen Debian = Liquidsoap + Icecast 2 (`apt`). Se eligió Debian porque Liquidsoap ya lo usa; el Icecast Alpine desapareció del compose.
- `infra/radio/liquidsoap/supervisa.sh`: por cada emisora encendida corren DOS procesos (su Icecast y su Liquidsoap). Cambiar la calidad reinicia solo el Liquidsoap; el Icecast sigue con sus oyentes.
- `infra/radio/liquidsoap/icecast.xml.tpl` (nuevo): configuración de Icecast por emisora.
- `apps/api`: columna `stations.icecast_port` (migración 0028); helper `lib/escucha.ts` con la URL de escucha `PUBLIC_STREAM_HOST:puerto/mount` (panel, emisor y web).
- Al crear una estación, la API llama a `/reservar`: queda con su bloque de puertos y apagada. Al borrarla, se libera el bloque.
- Una emisora de un tercero sigue con una sola estación (ya existía en la API).

Verificado (2026-11-26):
- Imagen Debian con Icecast 2 construye y corre.
- Principal en 8000 y prueba en 8040, cada una con su Icecast (procesos separados), ambos respondiendo.
- Crear emisora y estación desde el panel: la estación reserva 8040/8044/8045 al crearse, sin encender.
- Cambiar la calidad de una emisora: la principal en 8000 tuvo hueco máximo de 0,29 s en 30 s, y el Icecast de la emisora cambiada no se reinició.
- Borrar la estación: su Icecast y su Liquidsoap se detienen y el puerto queda libre.
- El enlace de oyentes en el panel ya muestra el puerto de la estación.

Problemas encontrados y corregidos:
- Publicar 500 puertos (8000–8499) creó ~1000 procesos `docker-proxy` (~1 GB) en la VM de 2 GB; el kernel mató procesos de Liquidsoap. Ahora se publican 200 puertos (8000–8199: 20 emisoras, que es el máximo previsto) y es configurable con `RADIO_PUERTO_MAX`.
- Una carrera entre los dos vigilantes de una emisora (compartían la bandera `parar`): al detener, el Icecast se volvía a levantar. Ahora solo `detener` borra la bandera.
- Un cálculo de espera dentro de `$( )` perdía el contador de fallos. Ahora se calcula en el shell principal.

Pendiente de decisión y de esta fase:
- Plan de producción: Contabo (básico). Con 200 puertos publicados hay 405 procesos docker-proxy (~860 MB libres en la VM de Colima de 2 GB). En Linux se quitan con `userland-proxy: false` en el daemon de Docker (reglas de iptables en vez de proxies); hay que probarlo en el VPS. Cada emisora encendida cuesta ~200 MB de Liquidsoap: revisar la RAM del plan según cuántas emisoras se enciendan.
- Los puertos de locutores de musica (8015) y salud (8025) cambiaron: sus locutores deben usar el nuevo. La principal sigue en 8005.
- Carpeta `infra/radio/icecast/` (Alpine) borrada (2026-11-26).
- Quedaron carpetas de prueba en `infra/radio/data/music` (`prueba-crud-estacion`, `arch-1181e646b4c5`).

## Fase 7: capacidad y limpieza automática (HECHA, sin subir a git)

- Capacidad: 20 bloques de puertos (8000–8199). Cada ESTACIÓN usa un bloque, esté encendida o apagada, desde que se crea hasta que se borra.
- Las EMISORAS no usan puertos: no tienen límite técnico. Pero una emisora de un tercero tiene una sola estación, así que en la práctica el tope de terceros también es 20.
- Los archivos internos de cada emisora (`arch-…`) ya no reservan bloque (antes gastaban uno cada una).
- Al borrar una emisora: se detienen sus procesos (Icecast y Liquidsoap), se libera su puerto y se quitan sus entradas de la radio y de la base. Probado: el puerto 8030 quedó cerrado y la principal no se tocó.
- Textos corregidos en el panel: el cambio de calidad reinicia solo esa estación; el límite de oyentes es por estación.
- Los puertos de locutores ya aparecen en la pestaña Transmisión de cada estación («Datos para el locutor»).

## Fase 8: AutoDJ, reinicios, tareas de fondo, copias, informes y registros (HECHA, sin subir a git)

Comparación con AzuraCast (código en la carpeta de referencia): ver la conversación del 2026-11-26. Hoy ya tenemos:

- **AutoDJ**: prevención de repetidas (`radio.liq`, `rotacion`): cada lista evita las últimas `tamaño − 1` canciones de la emisora. Probado: una lista de 3 suena en vueltas sin repetir dentro de cada vuelta.
- **Reinicios con supervisord** (como AzuraCast): cada emisora es un grupo `<slug>` con `icecast-<slug>` y `liquidsoap-<slug>`. `sincronizar.sh` escribe las confs desde `emisoras.txt`. Probado: matar el Liquidsoap lo levanta solo y cuenta un reinicio; cambiar la calidad reinicia solo el Liquidsoap; el Icecast conserva su PID; crear y borrar una estación aplica y limpia el grupo.
- **Tareas de fondo** (API, `apps/api/src/tareas/programador.ts`): muestreo de oyentes cada 5 min, copia diaria a las 03:00 (La Paz) y limpieza de muestras de más de 180 días. Cada tarea guarda su último resultado y se puede ejecutar a mano desde el panel.
- **Copias de seguridad** (`apps/api/src/tareas/respaldo.ts`): un `.tar.gz` con la base (`pg_dump`, SQL) y la configuración de la radio. Sin audios. Retención de 14 días. Se descargan desde el panel (**Sistema**, solo superadmin), así llegan al PC. La carpeta `apps/api/respaldos/` está en `.gitignore`.
- **Informes** (menú Radio → Informes): oyentes por emisora y día (pico y promedio), promedio por hora del día y por día de la semana (`GET /api/v1/radio/reportes/oyentes`), y el historial de reproducción de cada estación.
- **Historial de reproducción**: Liquidsoap anota cada pista que empieza en `infra/radio/data/config/historial/<slug>.log`. La API lo importa cada 5 min a `historial_reproduccion` (sin duplicar) y lo limpia con el mismo plazo de muestras. Se muestra en Informes y en «Últimas canciones» de Emitiendo.
- **Medios → Revisión**: posibles duplicados (mismo título y artista) y audios sin asignar a ninguna lista (`GET /api/v1/radio/emisoras/:id/revision-pistas`).
- **Sistema** con pestañas «Copias y tareas» y «Registros de la radio». Ajustes de copia (hora, días) y de muestras se cambian desde el panel.
- **Registros**: supervisord escribe en `infra/radio/data/logs` con rotación (5 MB, 3 copias). La radio-api los lee y el panel los muestra por emisora.
- **Imagen Debian**: Liquidsoap + Icecast + supervisord en `infra/radio/liquidsoap/Dockerfile`.

Problemas encontrados y corregidos:
- Liquidsoap lee `stations.json` todo o nada: una entrada sin campos (el archivo interno sin puertos) hacía que la emisora saliera sin error. Los archivos ahora llevan puerto 0.
- En supervisord el nombre del programa es `grupo:programa`; sin eso el estado salía siempre como «reiniciando».
- El informe de oyentes agrupaba con parámetros distintos en SELECT y GROUP BY (500). La zona horaria ahora va literal.

Pendiente:
- **Seguridad de locutores**: hoy cada emisora tiene su contraseña fija de locutor y la contraseña de la fuente de Icecast es común a todas. AzuraCast valida al DJ contra la API en cada conexión. Falta: validar el harbor contra la API y contraseña de fuente por emisora.
- **Copias fuera del servidor**: hecho con rsync hacia un destino configurable en Sistema (probado con carpeta local). Falta probarlo por SSH y definir el destino real.
- **Contraseñas en la copia**: `stations.json` guarda las contraseñas de locutor sin cifrar; la copia las incluye. Por eso solo el superadmin la descarga.
- **Docker en el VPS**: el stack está pensado para Debian + Docker. Hace falta instalarlo en el Contabo y restaurar el `.env` y una copia; no se ha probado allí.

## Riesgos

- El cambio de la Fase 1 requiere reiniciar el contenedor de Liquidsoap una vez; corta la radio unos segundos.
- Quien tenga un locutor configurado con otra emisora que no sea la principal tendrá que usar su nuevo puerto
  (el emisor recibe el puerto desde `/emisoras`; hay que comprobar en la app que se actualiza al volver a iniciar sesión).
- Cada emisora encendida ocupa memoria. Con tres o más encendidas hay que medir antes de producción.

## Fuera de este cambio

- Puerto de locutores único con reenvío (opción descartada).
- Siguiente canción exacta en orden aleatorio (no se puede saber antes de terminar la actual).
