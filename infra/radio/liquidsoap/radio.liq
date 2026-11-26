# Radio La Luz del Tiempo: AutoDJ con playlists + entrada en vivo por estación.
#
# UN PROCESO POR ESTACIÓN (como AzuraCast): supervisa.sh arranca este archivo con STATION_SLUG=<slug>.
# Este proceso solo crea SU estación: su Icecast (icecast_port), su puerto de locutores (harbor_port) y su control (control_port).
# Si cambia su propia entrada en stations.json, se cierra y supervisa.sh lo vuelve a levantar:
# las demás estaciones no se tocan.
#
# Orden de prioridad de cada estación (de mayor a menor):
#   1. Locutor en vivo (harbor). Si conecta, manda.
#   2. Listas programadas cuando su horario está activo (programas.txt).
#   3. Listas en la rotación, por turnos, en su orden, con el peso de cada una.
#   4. Silencio (si no hay nada que sonar).
#
# Lo que cambia la estructura del motor (estaciones, mounts, pesos, orden aleatorio) sale de
# /config/stations.json y reinicia Liquidsoap. Lo que cambia con frecuencia (encender, modo de cada
# lista, horarios, opciones) sale de estado.txt y programas.txt y se lee cada 2 s, SIN reiniciar.
# La lista de pistas de cada playlist está en /config/playlists/<estacion>/<id>.m3u
# y Liquidsoap la recarga cada 5 s: subir o reordenar audios no corta la transmisión.

settings.log.stdout := true
settings.log.file := false
settings.log.level := 3

# Cada emisora tiene su propio Icecast en el mismo contenedor (como AzuraCast): el puerto es el de la estación.
icecast_host = "127.0.0.1"
icecast_password = environment.get("ICECAST_SOURCE_PASSWORD")
config_path = environment.get(default="/config/stations.json", "STATIONS_CONFIG")
config_dir = environment.get(default="/config", "CONFIG_DIR")

# Lectura segura de un archivo. La radio-api reemplaza los archivos con un renombrado: si se leen justo en
# ese instante, el error NO puede tumbar el hilo que los vigila (antes dejaba de actualizarse la rotación).
def leer_archivo(ruta, por_defecto) =
  try
    file.contents(ruta)
  catch err do
    por_defecto
  end
end

# Qué estación es este proceso (la pone supervisa.sh). Sin ella no hay nada que crear.
station_slug = environment.get(default="", "STATION_SLUG")

# Sin tipos explícitos: json.parse toma la forma del valor por defecto.
config_vacia = {stations = [{
    slug = "",
    name = "",
    mount = "",
    bitrate = 128,
    calidad_baja = 48,
    hls = false,
    live_password = "",
    harbor_port = 8005,
    icecast_port = 8000,
    control_port = 8004,
    autodj = false,
    enabled = false,
    playlists = [{
      id = "",
      shuffle = true
    }]
  }]}
def leer_configuracion() =
  json.parse(default = config_vacia, leer_archivo(config_path, '{"stations": []}'))
end
config = leer_configuracion()

# Solo la estación de este proceso.
mi_estacion = list.filter(fun (s) -> s.slug == station_slug, config.stations)

# Clave de los comandos de control (la misma que usa la radio-api). Sin la clave, /telnet responde 401.
# Solo se revisa la ruta /telnet: las conexiones de los locutores (harbor) no pasan por aquí.
clave_control = environment.get(default="", "CONTROL_KEY")
def control_clave(req, res, next) =
  if req.path == "/telnet" and req.headers["x-liquidsoap-api-key"] != clave_control then
    res.status_code(401)
  else
    next(req, res)
  end
end
harbor.http.middleware.register(control_clave)

# Encendida o apagada cada emisora: lo escribe la radio-api en estado.txt.
# Se lee cada 2 s y NO reinicia Liquidsoap: solo abre o cierra el mount de esa emisora,
# así que encender o apagar una no corta a las demás.
estado_path = "#{config_dir}/estado.txt"
# Una línea por emisora: "slug 1" (encendida) o "slug 0" (apagada). Texto, no JSON, para no mezclar tipos con la configuración.
def leer_estado_lista() =
  texto = leer_archivo(estado_path, "")
  lineas = list.filter(fun (l) -> l != "", string.split(separator="\n", texto))
  list.map(fun (l) -> (list.nth(string.split(separator=" ", l), 0), list.nth(string.split(separator=" ", l), 1) == "1"), lineas)
end
estado_actual = ref(leer_estado_lista())
thread.run.recurrent(delay=2., fun () -> begin
  estado_actual := leer_estado_lista()
  2.
end)

# Claves de estado.txt: "slug" (emisora encendida), "slug.autodj" (AutoDJ activo), "slug/lista" (lista activa)
def estado_on(clave) =
  list.exists(fun (e) -> fst(e) == clave and snd(e), estado_actual())
end

def emisora_encendida(slug) = estado_on(slug) end

# Programas (horarios y opciones de cada lista), leídos cada 2 s.
# Línea: "slug/id;modo;interrumpe;una_sola;dia-inicio-fin,dia-inicio-fin" (o "-" sin horarios).
# modo: "programada" (solo suena en sus horarios) o "rotacion" (suena en la mezcla).
programas_path = "#{config_dir}/programas.txt"
def leer_horarios(texto) =
  partes = list.filter(fun (x) -> x != "" and x != "-", string.split(separator=",", texto))
  list.map(fun (x) -> begin
    v = string.split(separator="-", x)
    {day = int_of_string(list.nth(v, 0)), inicio = int_of_string(list.nth(v, 1)), fin = int_of_string(list.nth(v, 2))}
  end, partes)
end
def leer_programas() =
  texto = leer_archivo(programas_path, "")
  lineas = list.filter(fun (l) -> l != "", string.split(separator="\n", texto))
  list.map(fun (l) -> begin
    c = string.split(separator=";", l)
    (list.nth(c, 0), {modo = list.nth(c, 1), inter = list.nth(c, 2) == "1", una = list.nth(c, 3) == "1", hs = leer_horarios(list.nth(c, 4))})
  end, lineas)
end
programa_vacio = {modo = "rotacion", inter = true, una = false, hs = []}
programas_actuales = ref(leer_programas())
thread.run.recurrent(delay=2., fun () -> begin
  programas_actuales := leer_programas()
  2.
end)
def info_de(clave) = list.assoc(default=programa_vacio, clave, programas_actuales())
end

# Listas (nombre y número de audios), leídas cada 2 s. Van FUERA de stations.json: subir audios
# o cambiar un nombre NO reinicia la emisora. Línea: "slug/id;nombre;pistas".
listas_path = "#{config_dir}/listas.txt"
def leer_listas() =
  texto = leer_archivo(listas_path, "")
  lineas = list.filter(fun (l) -> l != "", string.split(separator="\n", texto))
  list.map(fun (l) -> begin
    c = string.split(separator=";", l)
    (list.nth(c, 0), {nombre = list.nth(c, 1), pistas = int_of_string(list.nth(c, 2))})
  end, lineas)
end
listas_actuales = ref(leer_listas())
thread.run.recurrent(delay=2., fun () -> begin
  listas_actuales := leer_listas()
  2.
end)
def info_lista(clave) = list.assoc(default={nombre = "", pistas = 0}, clave, listas_actuales()) end

# Emisión a Icecast con el bitrate elegido (Liquidsoap exige una constante).
# fallible: si la fuente no tiene audio (emisora apagada), el mount se cierra en vez de transmitir silencio.
def emitir(st, src) =
  def salida(enc) =
    output.icecast(
      enc,
      fallible=true,
      id="#{st.slug}_icecast",
      host=icecast_host,
      port=st.icecast_port,
      password=icecast_password,
      mount=st.mount,
      name="#{st.name}",
      description="#{st.name}",
      genre="Cristiana",
      url="https://laluzdeltiempo.org",
      src
    )
  end
  if st.bitrate <= 64 then salida(%mp3(bitrate=64))
  elsif st.bitrate <= 96 then salida(%mp3(bitrate=96))
  elsif st.bitrate <= 128 then salida(%mp3(bitrate=128))
  elsif st.bitrate <= 192 then salida(%mp3(bitrate=192))
  elsif st.bitrate <= 256 then salida(%mp3(bitrate=256))
  else salida(%mp3(bitrate=320))
  end
end

# Codificador AAC de una calidad (kbps). Liquidsoap exige constantes, por eso una rama por calidad.
def aac_de(kbps) =
  if kbps <= 24 then %ffmpeg(format="mpegts", %audio(codec="aac", channels=2, samplerate=44100, b="24k", profile="aac_low"))
  elsif kbps <= 32 then %ffmpeg(format="mpegts", %audio(codec="aac", channels=2, samplerate=44100, b="32k", profile="aac_low"))
  elsif kbps <= 48 then %ffmpeg(format="mpegts", %audio(codec="aac", channels=2, samplerate=44100, b="48k", profile="aac_low"))
  elsif kbps <= 64 then %ffmpeg(format="mpegts", %audio(codec="aac", channels=2, samplerate=44100, b="64k", profile="aac_low"))
  elsif kbps <= 96 then %ffmpeg(format="mpegts", %audio(codec="aac", channels=2, samplerate=44100, b="96k", profile="aac_low"))
  elsif kbps <= 128 then %ffmpeg(format="mpegts", %audio(codec="aac", channels=2, samplerate=44100, b="128k", profile="aac_low"))
  elsif kbps <= 192 then %ffmpeg(format="mpegts", %audio(codec="aac", channels=2, samplerate=44100, b="192k", profile="aac_low"))
  else %ffmpeg(format="mpegts", %audio(codec="aac", channels=2, samplerate=44100, b="256k", profile="aac_low"))
  end
end

# Codificador AAC para HLS en fMP4 (más liviano que MPEG-TS: ~23 % menos bytes por segmento medido).
def aac_mp4(kbps) =
  if kbps <= 24 then %ffmpeg(format="mp4", movflags="frag_keyframe+empty_moov+default_base_moof", %audio(codec="aac", channels=2, samplerate=44100, b="24k", profile="aac_low"))
  elsif kbps <= 32 then %ffmpeg(format="mp4", movflags="frag_keyframe+empty_moov+default_base_moof", %audio(codec="aac", channels=2, samplerate=44100, b="32k", profile="aac_low"))
  elsif kbps <= 48 then %ffmpeg(format="mp4", movflags="frag_keyframe+empty_moov+default_base_moof", %audio(codec="aac", channels=2, samplerate=44100, b="48k", profile="aac_low"))
  elsif kbps <= 64 then %ffmpeg(format="mp4", movflags="frag_keyframe+empty_moov+default_base_moof", %audio(codec="aac", channels=2, samplerate=44100, b="64k", profile="aac_low"))
  elsif kbps <= 96 then %ffmpeg(format="mp4", movflags="frag_keyframe+empty_moov+default_base_moof", %audio(codec="aac", channels=2, samplerate=44100, b="96k", profile="aac_low"))
  elsif kbps <= 128 then %ffmpeg(format="mp4", movflags="frag_keyframe+empty_moov+default_base_moof", %audio(codec="aac", channels=2, samplerate=44100, b="128k", profile="aac_low"))
  elsif kbps <= 192 then %ffmpeg(format="mp4", movflags="frag_keyframe+empty_moov+default_base_moof", %audio(codec="aac", channels=2, samplerate=44100, b="192k", profile="aac_low"))
  else %ffmpeg(format="mp4", movflags="frag_keyframe+empty_moov+default_base_moof", %audio(codec="aac", channels=2, samplerate=44100, b="256k", profile="aac_low"))
  end
end

# Nombre de cada segmento HLS: sirve para que el reproductor pida el siguiente sin caché.
def hls_nombre_segmento(seg) =
  "#{seg.stream_name}_#{int_of_float(time())}_#{seg.position}.#{seg.extname}"
end

hls_dir = environment.get(default="/hls", "HLS_DIR")
# Emisoras que usan HLS en fMP4: una por línea en config/hls_fmp4.txt (si no existe, ninguna).
hls_fmp4_slugs = list.filter(fun (x) -> x != "", list.map(fun (x) -> string.trim(x), string.split(separator="\n", leer_archivo("#{config_dir}/hls_fmp4.txt", ""))))

# ¿Estamos dentro de la franja (día, inicio, fin) en hora local?
# week_day: 0 = domingo … 6 = sábado (igual que en la API). inicio/fin en minutos.
def dentro_de(h) =
  t = time.local()
  ahora = t.hour * 60 + t.min
  h.day == t.week_day and ahora >= h.inicio and ahora < h.fin
end

# Clave de la franja en la que estamos (vacía si no estamos en ninguna).
def franja_actual(hs) =
  activas = list.filter(dentro_de, hs)
  if list.length(activas) == 0 then "" else
    h = list.nth(activas, 0)
    "#{h.day}-#{h.inicio}-#{h.fin}"
  end
end

# La lista está programada y en su horario ahora.
def programada_ahora(clave) =
  i = info_de(clave)
  i.modo == "programada" and list.length(list.filter(dentro_de, i.hs)) > 0
end

# La lista programada entra a la hora y se le pide interrumpir lo que suena.
def interrumpe_ahora(clave) =
  i = info_de(clave)
  programada_ahora(clave) and i.inter
end

# Fuente de una playlist: su .m3u, en orden o aleatoria.
# Cada playlist se puede activar o pausar sin reiniciar: su clave en estado.txt es "slug/playlist".
def fuente_playlist(st, p) =
  pl = playlist(
    id="#{st.slug}_#{p.id}",
    mode=(p.shuffle ? "randomize" : "normal"),
    # Se recarga cada 5 s: la radio-api reemplaza el .m3u con un renombrado, que "watch" no sigue
    reload_mode="seconds",
    reload=5,
    "#{config_dir}/playlists/#{st.slug}/#{p.id}.m3u"
  )
  # Cada pista lleva el nombre de su lista (para «ahora suena» en el panel). Se lee en vivo de listas.txt.
  pl = metadata.map(update=true, fun (_) -> [("luz_lista", info_lista("#{st.slug}/#{p.id}").nombre)], pl)
  switch(track_sensitive=false, [((fun () -> estado_on("#{st.slug}/#{p.id}")), pl)])
end

# Rotación por turnos: cada lista suena COMPLETA (una pasada, en su orden o aleatoria) y después pasa la siguiente.
# Antes era rotate(weights=…) con el número de audios fijado al arrancar, así que subir audios reiniciaba
# la emisora. Ahora request.dynamic pide UN audio cada vez: cuando la cola del turno se vacía, carga la siguiente
# lista (su .m3u se lee en ese momento). Subir audios o cambiar pistas en listas.txt no reinicia nada.
# Una lista puede sonar si está activa, tiene audios y no está programada en ese momento.
def rotacion(st) =
  ps = st.playlists
  n = list.length(ps)
  turno = ref(-1)        # posición en st.playlists de la lista en turno
  cola = ref([])         # audios que faltan en el turno actual
  nombre_turno = ref("")
  total_turno = ref(0)   # cuántos audios tiene el turno en curso (para la ventana de repetidas)
  def clave_de(i) = "#{st.slug}/#{list.nth(ps, i).id}" end
  def puede_sonar(i) =
    c = clave_de(i)
    info_lista(c).pistas > 0 and estado_on(c) and info_de(c).modo != "programada"
  end
  # Elige la lista siguiente a la última que sonó (dando la vuelta) y carga sus audios
  def cargar_turno() =
    base = turno() + 1
    orden = list.map(fun (k) -> (if base + k >= n then base + k - n else base + k end), list.init(n, fun (k) -> k))
    libres = list.filter(puede_sonar, orden)
    if list.length(libres) > 0 then
      i = list.nth(libres, 0)
      p = list.nth(ps, i)
      origen = "#{config_dir}/playlists/#{st.slug}/#{p.id}.m3u"
      audios = list.filter(fun (l) -> string.match(pattern="^/", l), string.split(separator="\n", leer_archivo(origen, "")))
      turno := i
      cola := (p.shuffle ? list.shuffle(audios) : audios)
      total_turno := list.length(audios)
      nombre_turno := info_lista(clave_de(i)).nombre
    end
  end
  # Un audio por vez. Si ninguna lista puede sonar, no devuelve nada y Liquidsoap vuelve a preguntar (retry_delay).
  # Historial de los últimos audios de ESTA emisora. Antes de elegir, se prefiere un audio que no haya sonado
  # hace poco (como AzuraCast con DuplicatePrevention): así una lista corta o barajada no repite seguido.
  historial = ref([])
  HISTORIAL_MAX = 10
  # Ventana: cuántas de las últimas canciones evitar. Es el número de audios del turno menos uno,
  # así una lista de 3 suena 1-2-3, 1-2-3… sin repetir seguido (con topes de HISTORIAL_MAX).
  def recientes() =
    v = total_turno() - 1
    v = if v > HISTORIAL_MAX then HISTORIAL_MAX else v end
    v = if v < 0 then 0 else v end
    v = if v > list.length(historial()) then list.length(historial()) else v end
    list.init(v, fun (i) -> list.nth(historial(), i))
  end
  def ya_sono(x) = list.exists(fun (h) -> h == x, recientes()) end
  def siguiente_audio() =
    if list.is_empty(cola()) then cargar_turno() end
    if list.is_empty(cola()) then
      null()
    else
      nuevos = list.filter(fun (x) -> not ya_sono(x), cola())
      a = if list.is_empty(nuevos) then list.hd(cola()) else list.hd(nuevos) end
      cola := list.filter(fun (x) -> x != a, cola())
      h = list.append([a], historial())
      historial := if list.length(h) > HISTORIAL_MAX then list.init(HISTORIAL_MAX, fun (i) -> list.nth(h, i)) else h end
      request.create(a)
    end
  end
  if n == 0 then [] else
    [metadata.map(update=true, fun (_) -> [("luz_lista", nombre_turno())],
      request.dynamic(retry_delay=2., siguiente_audio))]
  end
end

# Lista programada: solo suena en sus horarios. Con «solo una pista», suena una por horario:
# espera a que termine la que suena y no vuelve a entrar en esa franja.
def fuente_programada(st, p) =
  clave = "#{st.slug}/#{p.id}"
  pl = fuente_playlist(st, p)
  sonada = ref(false)
  ultima_franja = ref("")
  pl.on_track(synchronous=false, fun (_) -> sonada := true)
  switch(track_sensitive=true, [((fun () -> begin
    i = info_de(clave)
    franja = i.modo == "programada" ? franja_actual(i.hs) : ""
    if franja != ultima_franja() then
      ultima_franja := franja
      sonada := false
    end
    franja != "" and not (i.una and sonada())
  end), pl)])
end

def crear_estacion(st) =
  log.important("Estación #{st.slug} -> #{st.mount} (#{st.bitrate} kbps)")

  # Locutor en vivo: BUTT/OBS se conecta a harbor con mount = slug y su contraseña.
  vivo = input.harbor(
    id="#{st.slug}_vivo",
    port=st.harbor_port,
    password=st.live_password,
    st.slug
  )

  # Sin AutoDJ, la estación solo suena con el locutor o silencio.
  # AutoDJ: se puede encender o apagar sin reiniciar (estado.txt, clave "slug.autodj").
  programadas = list.map(fun (p) -> fuente_programada(st, p), st.playlists)
  automatico = list.append(programadas, rotacion(st))
  musica = list.length(automatico) == 0 ? blank() : fallback(id="#{st.slug}_musica", track_sensitive=true, automatico)
  musica_gated = switch(track_sensitive=false, [((fun () -> estado_on("#{st.slug}.autodj")), musica)])
  fuentes = [vivo, musica_gated, blank()]

  radio = fallback(id="#{st.slug}", track_sensitive=false, fuentes)

  # Interrumpir: al entrar a la hora de una lista con «interrumpe», se salta la pista que suena
  # para que la lista entre de inmediato (el fallback cambia en el siguiente corte).
  interrumpiendo = ref(false)
  vigilante_horario = thread.run.recurrent(delay=1., fun () -> begin
    ahora_interrumpe = list.exists(fun (p) -> interrumpe_ahora("#{st.slug}/#{p.id}"), st.playlists)
    if ahora_interrumpe and not interrumpiendo() then
      source.skip(radio)
    end
    interrumpiendo := ahora_interrumpe
    1.
  end)

  # Ahora suena: al cambiar de pista se escribe título, artista, lista y hora de inicio.
  # La radio-api lo lee para el panel (ahora/<slug>.txt). Líneas: título, artista, lista, inicio (unix), archivo.
  # El título de la base de datos se completa en la API cuando el archivo no trae etiquetas.
  ahora_path = "#{config_dir}/ahora/#{st.slug}.txt"
  historial_path = "#{config_dir}/historial/#{st.slug}.log"
  lista_actual = ref("")
  radio.on_track(synchronous=false, fun (m) -> begin
    titulo = list.assoc(default="", "title", m)
    artista = list.assoc(default="", "artist", m)
    lista = list.assoc(default="", "luz_lista", m)
    lista_actual := lista
    archivo = list.assoc(default="", "filename", m)
    inicio = int_of_float(time())
    try
      file.write(append=false, data="#{titulo}\n#{artista}\n#{lista}\n#{inicio}\n#{archivo}\n", ahora_path)
    catch err do
      log.important("No se pudo escribir ahora/#{st.slug}.txt: #{err}")
    end
    # Historial de reproducción: una línea por pista que empieza (la radio-api la importa a la base)
    try
      file.write(append=true, data="#{inicio}\t#{titulo}\t#{artista}\t#{lista}\t#{archivo}\n", historial_path)
    catch err do
      log.important("No se pudo anotar el historial de #{st.slug}: #{err}")
    end
  end)

  # Comandos en caliente (como AzuraCast): la radio-api manda «saltar» y «siguiente lista» al puerto de
  # control de esta emisora (POST /telnet con la clave). Antes eran archivos que se leían cada 2 s.
  server.register(namespace=st.slug, usage="saltar", description="Saltar la pista que suena", "saltar", fun (_) -> begin
    source.skip(radio)
    "Listo"
  end)
  # Siguiente lista: salta audios hasta que cambie la lista que suena (con tope de seguridad).
  lista_a_saltar = ref("")
  saltos_lista = ref(0)
  server.register(namespace=st.slug, usage="siguiente_lista", description="Pasar a la siguiente lista", "siguiente_lista", fun (_) -> begin
    lista_a_saltar := lista_actual()
    saltos_lista := 0
    "Listo"
  end)
  vigilante_saltar_lista = thread.run.recurrent(delay=1., fun () -> begin
    if lista_a_saltar() != "" then
      if lista_actual() == lista_a_saltar() and saltos_lista() < 60 then
        saltos_lista := saltos_lista() + 1
        source.skip(radio)
      else
        lista_a_saltar := ""
      end
    end
    1.
  end)
  # Puerto de control de esta emisora: interno (no se publica). Liquidsoap atiende solo /telnet, con clave.
  server.harbor(port=st.control_port)
  # Compuerta: la emisora solo suena si está encendida (estado.txt). Apagada, no hay fuente y el mount se cierra.
  compuerta = switch(track_sensitive=false, [((fun () -> emisora_encendida(st.slug)), radio)])
  fmp4 = list.mem(st.slug, hls_fmp4_slugs)
  # HLS adaptable: dos calidades AAC (la de la estación y la baja para señal lenta).
  # El reproductor elige la que puede sostener; las listas maestras son live.m3u8 y las variantes alta.m3u8 y baja.m3u8.
  # Formato del HLS: fMP4 (.m4s) solo para las emisoras listadas en hls_fmp4.txt; el resto sigue en MPEG-TS.
  if st.hls and fmp4 then
    output.file.hls(fallible=true, playlist="live.m3u8", segment_duration=4., segments=5, segments_overhead=2,
      segment_name=hls_nombre_segmento, "#{hls_dir}/#{st.slug}",
      [("alta", aac_mp4(st.bitrate)), ("baja", aac_mp4(st.calidad_baja))], compuerta)
  elsif st.hls then
    output.file.hls(fallible=true, playlist="live.m3u8", segment_duration=4., segments=5, segments_overhead=2,
      segment_name=hls_nombre_segmento, "#{hls_dir}/#{st.slug}",
      [("alta", aac_de(st.bitrate)), ("baja", aac_de(st.calidad_baja))], compuerta)
  end
  emitir(st, compuerta)
end

if list.length(mi_estacion) == 0 then
  log.important("No hay estación «#{station_slug}» en stations.json: este proceso termina")
  shutdown()
else
  list.iter(fun (st) -> crear_estacion(st), mi_estacion)
end

# Mantiene vivo el proceso (la estación puede estar apagada: no hay fuente y el mount se cierra).
output.dummy(blank())

# Reinicio solo de ESTA estación: se compara su propia entrada de stations.json (no el archivo entero).
# Si cambia (calidad, mount, contraseña, playlists…), este proceso se cierra y supervisa.sh lo vuelve a
# levantar. Las demás estaciones siguen sonando sin cortes.
# Se revisa cada 2 s en vez de usar file.watch: la radio-api escribe el archivo con un renombrado.
# Una lectura vacía o fallida NO cuenta como cambio (podría ser un reemplazo en curso).
def entrada_de_esta_estacion() =
  texto = leer_archivo(config_path, "")
  if texto == "" then "" else
    json.stringify(list.filter(fun (s) -> s.slug == station_slug, json.parse(default=config_vacia, texto).stations))
  end
end
entrada_inicial = json.stringify(mi_estacion)
thread.run.recurrent(delay=2., fun () -> begin
  actual = entrada_de_esta_estacion()
  if actual != "" and actual != entrada_inicial then
    log.important("La configuración de «#{station_slug}» cambió: se reinicia solo esta estación")
    shutdown()
  end
  2.
end)
