# Radio La Luz del Tiempo: AutoDJ con playlists + entrada en vivo por estación.
#
# Orden de prioridad de cada estación (de mayor a menor):
#   1. Locutor en vivo (harbor). Si conecta, manda.
#   2. Playlists "programada" cuando su horario está activo.
#   3. Mezcla de playlists "rotacion" y "secuencial", con el peso de cada una.
#   4. Silencio (si no hay nada que sonar).
#
# Las estaciones y sus playlists salen de /config/stations.json (lo escribe la radio-api).
# Cuando ese archivo cambia, Liquidsoap se reinicia (corte de ~2 s).
# La lista de pistas de cada playlist está en /config/playlists/<estacion>/<id>.m3u
# y Liquidsoap la recarga cada 5 s: subir o reordenar audios no corta la transmisión.

settings.log.stdout := true
settings.log.file := false
settings.log.level := 3

icecast_host = environment.get(default="icecast", "ICECAST_HOST")
icecast_port = int_of_string(environment.get(default="8000", "ICECAST_PORT"))
icecast_password = environment.get("ICECAST_SOURCE_PASSWORD")
harbor_port = int_of_string(environment.get(default="8005", "HARBOR_PORT"))
config_path = environment.get(default="/config/stations.json", "STATIONS_CONFIG")
config_dir = environment.get(default="/config", "CONFIG_DIR")

# Sin tipos explícitos: json.parse toma la forma del valor por defecto.
config = json.parse(
  default = {stations = [{
    slug = "",
    name = "",
    mount = "",
    bitrate = 128,
    live_password = "",
    autodj = false,
    enabled = false,
    playlists = [{
      id = "",
      name = "",
      mode = "",
      weight = 50,
      shuffle = true,
      active = false,
      schedules = [{day = 0, inicio = 0, fin = 0}]
    }]
  }]},
  file.exists(config_path) ? file.contents(config_path) : '{"stations": []}'
)

# Encendida o apagada cada emisora: lo escribe la radio-api en estado.json.
# Se lee cada 2 s y NO reinicia Liquidsoap: solo abre o cierra el mount de esa emisora,
# así que encender o apagar una no corta a las demás.
estado_path = "#{config_dir}/estado.txt"
# Una línea por emisora: "slug 1" (encendida) o "slug 0" (apagada). Texto, no JSON, para no mezclar tipos con la configuración.
def leer_estado_lista() =
  texto = file.exists(estado_path) ? file.contents(estado_path) : ""
  lineas = list.filter(fun (l) -> l != "", string.split(separator="\n", texto))
  list.map(fun (l) -> (list.nth(string.split(separator=" ", l), 0), list.nth(string.split(separator=" ", l), 1) == "1"), lineas)
end
estado_actual = ref(leer_estado_lista())
thread.run.recurrent(delay=2., fun () -> begin
  estado_actual := leer_estado_lista()
  2.
end)

# Claves de estado.txt: "slug" (emisora encendida), "slug.autodj" (AutoDJ activo)
def estado_on(clave) =
  list.exists(fun (e) -> fst(e) == clave and snd(e), estado_actual())
end

def emisora_encendida(slug) = estado_on(slug) end

# Emisión a Icecast con el bitrate elegido (Liquidsoap exige una constante).
# fallible: si la fuente no tiene audio (emisora apagada), el mount se cierra en vez de transmitir silencio.
def emitir(st, src) =
  def salida(enc) =
    output.icecast(
      enc,
      fallible=true,
      id="#{st.slug}_icecast",
      host=icecast_host,
      port=icecast_port,
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

# ¿Estamos dentro de alguna franja (día, inicio, fin) en hora local?
# week_day: 0 = domingo … 6 = sábado (igual que en la API). inicio/fin en minutos.
def en_horario(hs) =
  t = time.local()
  ahora = t.hour * 60 + t.min
  list.exists(fun (h) -> h.day == t.week_day and ahora >= h.inicio and ahora < h.fin, hs)
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
  switch(track_sensitive=false, [((fun () -> estado_on("#{st.slug}/#{p.id}")), pl)])
end

# Mezcla de playlists de rotación/secuencial, según el peso de cada una.
def rotacion(st) =
  ps = list.filter(fun (p) -> (p.mode == "rotacion" or p.mode == "secuencial"), st.playlists)
  if list.length(ps) == 0 then
    []
  else
    [random(
      id="#{st.slug}_rotacion",
      weights=list.map(fun (p) -> p.weight, ps),
      list.map(fun (p) -> fuente_playlist(st, p), ps)
    )]
  end
end

# Playlists programadas: solo suenan en sus horarios.
def programadas(st) =
  ps = list.filter(fun (p) -> p.mode == "programada", st.playlists)
  if list.length(ps) == 0 then
    []
  else
    [switch(
      track_sensitive=false,
      list.map(fun (p) -> ((fun () -> en_horario(p.schedules)), fuente_playlist(st, p)), ps)
    )]
  end
end

def crear_estacion(st) =
  log.important("Estación #{st.slug} -> #{st.mount} (#{st.bitrate} kbps)")

  # Locutor en vivo: BUTT/OBS se conecta a harbor con mount = slug y su contraseña.
  vivo = input.harbor(
    id="#{st.slug}_vivo",
    port=harbor_port,
    password=st.live_password,
    st.slug
  )

  # Sin AutoDJ, la estación solo suena con el locutor o silencio.
  # AutoDJ: se puede encender o apagar sin reiniciar (estado.txt, clave "slug.autodj").
  automatico = list.append(programadas(st), rotacion(st))
  musica = list.length(automatico) == 0 ? blank() : fallback(id="#{st.slug}_musica", track_sensitive=false, automatico)
  musica_gated = switch(track_sensitive=false, [((fun () -> estado_on("#{st.slug}.autodj")), musica)])
  fuentes = [vivo, musica_gated, blank()]

  radio = fallback(id="#{st.slug}", track_sensitive=false, fuentes)
  # Compuerta: la emisora solo suena si está encendida (estado.txt). Apagada, no hay fuente y el mount se cierra.
  compuerta = switch(track_sensitive=false, [((fun () -> emisora_encendida(st.slug)), radio)])
  emitir(st, compuerta)
end

# Todas las emisoras se crean; cuál suena lo decide estado.json (no stations.json).
list.iter(fun (st) -> crear_estacion(st), config.stations)

# Mantiene vivo el proceso aunque no haya estaciones configuradas.
output.dummy(blank())

# Reinicio al cambiar la configuración (Docker lo vuelve a levantar).
# Se revisa el contenido cada 2 s en vez de usar file.watch: la radio-api escribe el archivo
# con un renombrado (archivo nuevo), y el aviso de cambio se perdía con esa escritura.
configuracion_inicial = file.contents(config_path)
thread.run.recurrent(delay=2., fun () -> begin
  if file.contents(config_path) != configuracion_inicial then
    log.important("stations.json cambió: reiniciando para aplicar la configuración")
    shutdown()
  end
  2.
end)
