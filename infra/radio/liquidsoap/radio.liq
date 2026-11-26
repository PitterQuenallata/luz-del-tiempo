# Radio La Luz del Tiempo: AutoDJ con playlists + entrada en vivo por estación.
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
      pistas = 0,
      weight = 50,
      shuffle = true,
      active = false
    }]
  }]},
  file.exists(config_path) ? file.contents(config_path) : '{"stations": []}'
)

# Encendida o apagada cada emisora: lo escribe la radio-api en estado.txt.
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
  texto = file.exists(programas_path) ? file.contents(programas_path) : ""
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
  # Cada pista lleva el nombre de su lista (para «ahora suena» en el panel)
  pl = metadata.map(update=true, fun (_) -> [("luz_lista", p.name)], pl)
  switch(track_sensitive=false, [((fun () -> estado_on("#{st.slug}/#{p.id}")), pl)])
end

# Una lista en la rotación: solo cuando NO está programada.
def fuente_rotacion(st, p) =
  clave = "#{st.slug}/#{p.id}"
  switch(track_sensitive=true, [((fun () -> info_de(clave).modo != "programada"), fuente_playlist(st, p))])
end

# Rotación: las listas van en su turno, de arriba abajo. En su turno suena la lista COMPLETA,
# en su orden, y después pasa la siguiente. El peso de la rotación es la cantidad de audios de cada lista
# (la radio-api lo manda en stations.json; si cambia, Liquidsoap se reinicia una vez).
def rotacion(st) =
  ps = list.filter(fun (p) -> p.pistas > 0, st.playlists)
  if list.length(ps) == 0 then
    []
  else
    [rotate(
      id="#{st.slug}_rotacion",
      weights=list.map(fun (p) -> p.pistas, ps),
      list.map(fun (p) -> fuente_rotacion(st, p), ps)
    )]
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
    port=harbor_port,
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
  # La radio-api lo lee para el panel (ahora/<slug>.txt). Líneas: título, artista, lista, inicio (unix).
  ahora_path = "#{config_dir}/ahora/#{st.slug}.txt"
  radio.on_track(synchronous=false, fun (m) -> begin
    titulo = list.assoc(default="", "title", m)
    artista = list.assoc(default="", "artist", m)
    lista = list.assoc(default="", "luz_lista", m)
    inicio = int_of_float(time())
    file.write(append=false, data="#{titulo}\n#{artista}\n#{lista}\n#{inicio}\n", ahora_path)
  end)

  # Saltar canción: la radio-api escribe un pedido (saltar/<slug>.txt) y aquí se salta una vez por pedido nuevo.
  saltar_path = "#{config_dir}/saltar/#{st.slug}.txt"
  ultimo_salto = ref(file.exists(saltar_path) ? file.contents(saltar_path) : "")
  vigilante_saltar = thread.run.recurrent(delay=2., fun () -> begin
    pedido = file.exists(saltar_path) ? file.contents(saltar_path) : ""
    if pedido != "" and pedido != ultimo_salto() then
      ultimo_salto := pedido
      source.skip(radio)
    end
    2.
  end)
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
