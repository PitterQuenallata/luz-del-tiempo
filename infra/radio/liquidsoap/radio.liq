# Radio La Luz del Tiempo: AutoDJ + entrada en vivo por estación.
#
# Las estaciones salen de /config/stations.json, que escribe la radio-api.
# Cuando ese archivo cambia, Liquidsoap se apaga y Docker lo vuelve a levantar
# con la configuración nueva (corte de ~2 s, solo al cambiar la configuración).

settings.log.stdout := true
settings.log.file := false
settings.log.level := 3

icecast_host = environment.get(default="icecast", "ICECAST_HOST")
icecast_port = int_of_string(environment.get(default="8000", "ICECAST_PORT"))
icecast_password = environment.get("ICECAST_SOURCE_PASSWORD")
harbor_port = int_of_string(environment.get(default="8005", "HARBOR_PORT"))
config_path = environment.get(default="/config/stations.json", "STATIONS_CONFIG")
music_dir = environment.get(default="/music", "MUSIC_DIR")

let json.parse (config : {
  stations: [{
    slug: string,
    name: string,
    mount: string,
    bitrate: int,
    live_password: string,
    autodj: bool,
    enabled: bool
  }]
}) = file.exists(config_path) ? file.contents(config_path) : '{"stations": []}'

def emitir(st, src) =
  # Liquidsoap exige el bitrate como constante: se elige entre los permitidos.
  def salida(enc) =
    output.icecast(
      enc,
      id="#{st.slug}_icecast",
      host=icecast_host,
      port=icecast_port,
      password=icecast_password,
      mount=st.mount,
      name=st.name,
      description=st.name,
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

def crear_estacion(st) =
  log.important("Estación #{st.slug} -> #{st.mount} (#{st.bitrate} kbps, autodj=#{st.autodj})")

  # Locutor en vivo: BUTT/OBS se conecta a harbor con mount = slug y su contraseña.
  vivo = input.harbor(
    id="#{st.slug}_vivo",
    port=harbor_port,
    password=st.live_password,
    st.slug
  )

  autodj = playlist(
    id="#{st.slug}_autodj",
    mode="randomize",
    reload_mode="watch",
    "#{music_dir}/#{st.slug}"
  )

  fuentes = st.autodj ? [vivo, autodj, blank()] : [vivo, blank()]
  radio = fallback(id="#{st.slug}", track_sensitive=false, fuentes)
  emitir(st, mksafe(radio))
end

list.iter(fun (st) -> if st.enabled then crear_estacion(st) end, config.stations)

# Mantiene vivo el proceso aunque no haya estaciones configuradas.
output.dummy(blank())

# Reinicio al cambiar la configuración (Docker lo vuelve a levantar).
file.watch(config_path, fun () -> begin
  log.important("stations.json cambió: reiniciando para aplicar la configuración")
  shutdown()
end)
