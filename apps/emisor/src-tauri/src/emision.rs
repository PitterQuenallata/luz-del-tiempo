// Motor de la transmisión: fuente de audio → limitador → MP3 (LAME) → PUT al harbor de Liquidsoap.
// Hilos: captura, codificación (y grabación local), conexión (con reconexión) y medidores (niveles, red, silencio, oyentes).

use std::fs::File;
use std::io::{BufWriter, Write};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU32, AtomicU64, Ordering};
use std::sync::mpsc::{self, Receiver, RecvTimeoutError, SyncSender};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use mp3lame_encoder::{Bitrate, Builder, Encoder, FlushNoGap, InterleavedPcm, MonoPcm, Quality};
use serde::Serialize;

use crate::ajustes::Ajustes;
use crate::audio::{self, Captura, Medicion};
use crate::icecast::{self, Sondeo};
use crate::transmision;

/// Bajo este pico (-55 dBFS) se considera que no hay sonido.
pub const UMBRAL_SONIDO: f32 = 0.0018;

/// Segundos de silencio a partir de los cuales se avisa y se anota en el historial.
pub const AVISO_SILENCIO: u32 = 10;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EstadoEmision {
    /// desconectado | conectando | al_aire | reconectando | error | detenido
    pub estado: String,
    pub mensaje: String,
}

/// Lo que dibujan los medidores, unas diez veces por segundo.
#[derive(Serialize, Clone, Copy, Default, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Medidores {
    /// Pico por lado (0–1) de lo que entra, antes del limitador
    pub izq: f32,
    pub der: f32,
    /// Reducción del limitador en dB (0 = no actúa)
    pub reduccion: f32,
    /// Veces que la entrada saturó en esta emisión
    pub recortes: u32,
    /// Segundos seguidos sin sonido
    pub silencio_seg: u32,
    /// Kilobits por segundo que realmente salen hacia la radio
    pub kbps: u32,
    /// La red no alcanza: se está descartando audio
    pub red_lenta: bool,
}

/// Control de una transmisión en curso.
pub struct Emision {
    pub stop: Arc<AtomicBool>,
    pub silencio: Arc<AtomicBool>,
}

/// Contadores de la conexión, compartidos entre hilos.
#[derive(Default)]
pub struct Estadisticas {
    pub bytes: AtomicU64,
    pub descartados: AtomicU32,
}

/// Canal hacia la conexión activa. None cuando no hay conexión (el audio se descarta, sin acumular retraso).
type Salida = Arc<Mutex<Option<SyncSender<Vec<u8>>>>>;

/// Por dónde salen los avisos del motor: la ventana (Tauri) o, en pruebas, la consola.
pub trait Notificador: Clone + Send + Sync + 'static {
    fn estado(&self, estado: &str, mensaje: String);
    fn medidores(&self, m: Medidores);
    fn oyentes(&self, sondeo: Sondeo);
    /// Agrega una línea al historial de la emisión
    fn anotar(&self, _tipo: &str, _mensaje: &str) {}
    /// Pide la atención del operador (parpadeo en la barra de tareas)
    fn atencion(&self) {}
    /// Carpeta donde guardar las grabaciones; None = no se puede grabar
    fn carpeta_grabaciones(&self) -> Option<PathBuf> {
        None
    }
    /// Archivo que se está grabando (None = no se graba)
    fn grabacion(&self, _ruta: Option<String>) {}
}

pub fn iniciar<N: Notificador>(ajustes: Ajustes, clave: String, notificador: N) -> Result<Emision, String> {
    if ajustes.servidor.is_empty() || ajustes.mount.is_empty() {
        return Err("Completa la configuración antes de salir al aire.".into());
    }

    let stop = Arc::new(AtomicBool::new(false));
    let silencio = Arc::new(AtomicBool::new(false));
    let medicion = Arc::new(Medicion::default());
    let estadisticas = Arc::new(Estadisticas::default());
    // Por qué terminó la emisión cuando no fue el operador (p. ej. silencio prolongado)
    let motivo: Arc<Mutex<Option<String>>> = Arc::new(Mutex::new(None));

    // 1. Fuente de audio (informa si no pudo abrirse, antes de seguir)
    let (pcm_tx, pcm_rx) = mpsc::sync_channel::<Vec<i16>>(64);
    let (informe_tx, informe_rx) = mpsc::sync_channel::<Result<(), String>>(1);
    let captura = Captura {
        silencio: silencio.clone(),
        medicion: medicion.clone(),
        limitador: ajustes.limitador,
        stop: stop.clone(),
        frecuencia: ajustes.frecuencia,
        canal_izq: ajustes.canal_izq as usize,
        canal_der: ajustes.canal_der as usize,
    };
    let dispositivo = ajustes.dispositivo.clone();
    std::thread::spawn(move || audio::correr_captura(dispositivo, captura, pcm_tx, informe_tx));
    informe_rx
        .recv()
        .map_err(|_| "La fuente de audio no respondió.".to_string())??;

    // 2. Grabación local (si falla, se transmite igual y queda anotado)
    let grabacion = if ajustes.grabar { abrir_grabacion(&ajustes, &notificador) } else { None };
    if grabacion.is_none() {
        notificador.grabacion(None);
    }

    // 3. Codificación MP3
    let salida: Salida = Arc::new(Mutex::new(None));
    {
        let (salida, stop, est) = (salida.clone(), stop.clone(), estadisticas.clone());
        let formato = Formato::de(&ajustes);
        std::thread::spawn(move || codificar(formato, pcm_rx, salida, grabacion, est, stop));
    }

    // 4. Conexión con la radio (reintenta si se corta)
    {
        let (salida, stop, n) = (salida.clone(), stop.clone(), notificador.clone());
        let (est, motivo) = (estadisticas.clone(), motivo.clone());
        let ajustes = ajustes.clone();
        std::thread::spawn(move || mantener_conexion(ajustes, clave, salida, est, motivo, stop, n));
    }

    // 5. Medidores, silencio y oyentes
    {
        let (stop, n) = (stop.clone(), notificador.clone());
        std::thread::spawn(move || medidores(medicion, estadisticas, motivo, stop, n, ajustes));
    }

    notificador.estado("conectando", "Preparando la transmisión…".into());
    Ok(Emision { stop, silencio })
}

/// Crea el MP3 de respaldo: "2026-11-24 19.30.05.mp3" en la carpeta de grabaciones.
fn abrir_grabacion<N: Notificador>(a: &Ajustes, n: &N) -> Option<BufWriter<File>> {
    let carpeta = n.carpeta_grabaciones()?;
    let nombre = format!("{}.mp3", chrono::Local::now().format("%Y-%m-%d %H.%M.%S"));
    let ruta = carpeta.join(nombre);
    match std::fs::create_dir_all(&carpeta).and_then(|_| File::create(&ruta)) {
        Ok(f) => {
            let texto = ruta.display().to_string();
            n.anotar("grabacion", &format!("Grabando en {texto} ({} kbps)", a.bitrate));
            n.grabacion(Some(texto));
            Some(BufWriter::with_capacity(256 * 1024, f))
        }
        Err(e) => {
            n.anotar("error", &format!("No se pudo crear la grabación en {}: {e}", carpeta.display()));
            None
        }
    }
}

/// Formato del MP3 que se envía.
#[derive(Clone, Copy)]
struct Formato {
    kbps: u32,
    frecuencia: u32,
    mono: bool,
    calidad: Quality,
}

impl Formato {
    fn de(a: &Ajustes) -> Self {
        let calidad = match a.calidad.as_str() {
            "ligera" => Quality::Decent,
            "normal" => Quality::Good,
            _ => Quality::NearBest,
        };
        Self { kbps: a.bitrate, frecuencia: a.frecuencia, mono: a.mono, calidad }
    }
}

fn crear_encoder(f: Formato) -> Result<Encoder, String> {
    let mut b = Builder::new().ok_or("No se pudo iniciar el codificador MP3.")?;
    b.set_num_channels(if f.mono { 1 } else { 2 }).map_err(|e| format!("{e:?}"))?;
    b.set_sample_rate(f.frecuencia).map_err(|e| format!("{e:?}"))?;
    let tasa = match f.kbps {
        64 => Bitrate::Kbps64,
        96 => Bitrate::Kbps96,
        112 => Bitrate::Kbps112,
        160 => Bitrate::Kbps160,
        192 => Bitrate::Kbps192,
        224 => Bitrate::Kbps224,
        256 => Bitrate::Kbps256,
        320 => Bitrate::Kbps320,
        _ => Bitrate::Kbps128,
    };
    b.set_brate(tasa).map_err(|e| format!("{e:?}"))?;
    b.set_quality(f.calidad).map_err(|e| format!("{e:?}"))?;
    b.build().map_err(|e| format!("{e:?}"))
}

/// Cuánto puede faltar audio antes de rellenar con silencio. La captura de una salida (loopback) no entrega
/// nada mientras la PC no suena; sin relleno, la radio daría por caída la transmisión.
const HUECO_MAXIMO: Duration = Duration::from_millis(250);

fn codificar(
    formato: Formato,
    rx: Receiver<Vec<i16>>,
    salida: Salida,
    mut grabacion: Option<BufWriter<File>>,
    est: Arc<Estadisticas>,
    stop: Arc<AtomicBool>,
) {
    let Ok(mut encoder) = crear_encoder(formato) else { return };
    let mut buf: Vec<u8> = Vec::new();
    let mut mono: Vec<i16> = Vec::new();
    let mut ultimo_audio = Instant::now();
    let mut ultimo_volcado = Instant::now();
    let enviar = |buf: &mut Vec<u8>, grabacion: &mut Option<BufWriter<File>>| {
        if buf.is_empty() {
            return;
        }
        // La grabación sigue aunque la conexión esté caída: es el respaldo
        if let Some(g) = grabacion.as_mut() {
            if g.write_all(buf).is_err() {
                *grabacion = None;
            }
        }
        if let Ok(canal) = salida.lock() {
            if let Some(tx) = canal.as_ref() {
                if tx.try_send(std::mem::take(buf)).is_err() {
                    // La red no alcanza: se descarta antes que acumular retraso
                    est.descartados.fetch_add(1, Ordering::Relaxed);
                }
            }
        }
        buf.clear();
    };
    loop {
        if stop.load(Ordering::Relaxed) {
            break;
        }
        let pcm = match rx.recv_timeout(Duration::from_millis(50)) {
            Ok(pcm) => {
                ultimo_audio = Instant::now();
                pcm
            }
            Err(RecvTimeoutError::Timeout) => {
                let hueco = ultimo_audio.elapsed();
                if hueco < HUECO_MAXIMO {
                    continue;
                }
                // Silencio equivalente al tiempo sin audio
                ultimo_audio = Instant::now();
                let cuadros = (formato.frecuencia as u128 * hueco.as_millis() / 1000) as usize;
                vec![0i16; cuadros * 2]
            }
            Err(RecvTimeoutError::Disconnected) => break,
        };
        buf.clear();
        let resultado = if formato.mono {
            // La captura entrega estéreo intercalado: se promedian los dos lados
            mono.clear();
            mono.extend(pcm.chunks_exact(2).map(|c| ((c[0] as i32 + c[1] as i32) / 2) as i16));
            buf.reserve(mp3lame_encoder::max_required_buffer_size(mono.len()));
            encoder.encode_to_vec(MonoPcm(&mono), &mut buf)
        } else {
            // LAME escribe en la capacidad libre del Vec: hay que reservarla antes (si no, falla la memoria)
            buf.reserve(mp3lame_encoder::max_required_buffer_size(pcm.len() / 2));
            encoder.encode_to_vec(InterleavedPcm(&pcm), &mut buf)
        };
        if resultado.is_ok() {
            enviar(&mut buf, &mut grabacion);
        }
        if ultimo_volcado.elapsed() >= Duration::from_secs(5) {
            ultimo_volcado = Instant::now();
            if let Some(g) = grabacion.as_mut() {
                let _ = g.flush();
            }
        }
    }
    // Cierra el MP3 limpiamente si queda algo por escribir
    let mut final_: Vec<u8> = Vec::with_capacity(mp3lame_encoder::max_required_buffer_size(0));
    if encoder.flush_to_vec::<FlushNoGap>(&mut final_).is_ok() {
        enviar(&mut final_, &mut grabacion);
    }
    if let Some(mut g) = grabacion {
        let _ = g.flush();
    }
}

/// Si nunca se logró salir al aire, cuánto se insiste antes de rendirse (servidor apagado, dirección mal escrita…).
pub const LIMITE_AL_INICIAR: Duration = Duration::from_secs(60);
/// Si la conexión se cae en pleno programa, cuánto se insiste. Mientras tanto la radio sigue con el AutoDJ.
pub const LIMITE_EN_CORTE: Duration = Duration::from_secs(15 * 60);
/// Espera entre intentos: crece de 2 s hasta este tope.
const ESPERA_MAXIMA: u64 = 30;

fn mm_ss(d: Duration) -> String {
    let s = d.as_secs();
    format!("{}:{:02}", s / 60, s % 60)
}

/// Mantiene la transmisión: envía, y si se corta vuelve a intentarlo con espera creciente,
/// hasta un límite: 1 min si nunca se salió al aire, 15 min si se cayó durante el programa.
fn mantener_conexion<N: Notificador>(
    a: Ajustes,
    clave: String,
    salida: Salida,
    est: Arc<Estadisticas>,
    motivo: Arc<Mutex<Option<String>>>,
    stop: Arc<AtomicBool>,
    n: N,
) {
    let mut espera: u64 = 2;
    let mut intento: u32 = 0;
    let mut estuvo_al_aire = false;
    // Desde cuándo no hay conexión (el inicio de la emisión cuenta como el primer "corte")
    let mut sin_conexion_desde = Instant::now();
    while !stop.load(Ordering::Relaxed) {
        intento += 1;
        n.estado("conectando", format!("Conectando con {}…", a.servidor));
        let (tx, rx) = mpsc::sync_channel::<Vec<u8>>(128);
        if let Ok(mut canal) = salida.lock() {
            *canal = Some(tx);
        }
        let en_aire = AtomicBool::new(false);
        let fin = transmision::enviar(&a, &clave, &rx, &stop, &est.bytes, &en_aire, &n);
        if let Ok(mut canal) = salida.lock() {
            *canal = None;
        }
        if en_aire.load(Ordering::Relaxed) {
            // Hubo conexión: el próximo corte empieza a contar de cero
            estuvo_al_aire = true;
            sin_conexion_desde = Instant::now();
            espera = 2;
            intento = 1;
        }
        let causa = match fin {
            transmision::Fin::Detenida => break,
            transmision::Fin::Rechazada(401) | transmision::Fin::Rechazada(403) => {
                stop.store(true, Ordering::Relaxed);
                n.estado(
                    "error",
                    "Contraseña incorrecta o sin permiso para este punto de transmisión. Revisa Configuración.".into(),
                );
                return;
            }
            transmision::Fin::Rechazada(codigo) => format!("El servidor respondió {codigo}."),
            transmision::Fin::Cortada(mensaje) => mensaje.trim_end_matches(" Reintentando…").to_string(),
        };
        if stop.load(Ordering::Relaxed) {
            break;
        }
        let limite = if estuvo_al_aire { LIMITE_EN_CORTE } else { LIMITE_AL_INICIAR };
        let transcurrido = sin_conexion_desde.elapsed();
        if transcurrido >= limite {
            stop.store(true, Ordering::Relaxed);
            let texto = if estuvo_al_aire {
                format!(
                    "Se perdió la conexión con la radio durante {} min y la transmisión se detuvo. La radio sigue con el AutoDJ.",
                    limite.as_secs() / 60
                )
            } else {
                format!("La radio no responde ({causa}) Revisa que el servidor esté encendido y la dirección en Configuración.")
            };
            n.atencion();
            n.estado("error", texto);
            return;
        }
        n.estado(
            "reconectando",
            format!("{causa} Intento {intento}; se detiene en {}.", mm_ss(limite - transcurrido)),
        );
        // Espera creciente (2 s, 4 s, … 30 s), revisando si el operador detuvo la emisión
        for _ in 0..(espera * 5) {
            if stop.load(Ordering::Relaxed) {
                break;
            }
            std::thread::sleep(Duration::from_millis(200));
        }
        espera = (espera * 2).min(ESPERA_MAXIMA);
    }
    let texto = motivo.lock().ok().and_then(|m| m.clone()).unwrap_or_else(|| "Fuera del aire".into());
    n.estado("detenido", texto);
}

fn medidores<N: Notificador>(
    medicion: Arc<Medicion>,
    est: Arc<Estadisticas>,
    motivo: Arc<Mutex<Option<String>>>,
    stop: Arc<AtomicBool>,
    n: N,
    a: Ajustes,
) {
    let mut ultimo_oyentes = Instant::now() - Duration::from_secs(60);
    let mut ultimo_sonido = Instant::now();
    let mut silencio_avisado = false;
    let (mut bytes_antes, mut medida_kbps, mut kbps) = (0u64, Instant::now(), 0u32);
    let (mut descartados_antes, mut ultimo_descarte) = (0u32, None::<Instant>);
    let (mut recortes_antes, mut ultimo_aviso_recorte) = (0u32, None::<Instant>);
    let limite_silencio = a.minutos_silencio.max(1) * 60;

    while !stop.load(Ordering::Relaxed) {
        let l = medicion.leer();

        // Silencio (aire muerto)
        if l.izq.max(l.der) > UMBRAL_SONIDO {
            if silencio_avisado {
                n.anotar("sonido", &format!("Volvió el sonido tras {} s de silencio", ultimo_sonido.elapsed().as_secs()));
                silencio_avisado = false;
            }
            ultimo_sonido = Instant::now();
        }
        let silencio_seg = ultimo_sonido.elapsed().as_secs() as u32;
        if silencio_seg >= AVISO_SILENCIO && !silencio_avisado {
            silencio_avisado = true;
            n.anotar("silencio", "No llega sonido de la fuente");
            n.atencion();
        }
        if a.soltar_por_silencio && silencio_seg >= limite_silencio {
            let texto = format!("Se soltó el aire al AutoDJ tras {} min de silencio", a.minutos_silencio);
            if let Ok(mut m) = motivo.lock() {
                *m = Some(texto);
            }
            n.atencion();
            stop.store(true, Ordering::Relaxed);
            break;
        }

        // Saturación: se anota como mucho una vez por minuto
        if l.recortes > recortes_antes {
            recortes_antes = l.recortes;
            if ultimo_aviso_recorte.map_or(true, |t| t.elapsed() >= Duration::from_secs(60)) {
                ultimo_aviso_recorte = Some(Instant::now());
                n.anotar("saturacion", "La entrada saturó (llegó a 0 dB). Baja el nivel en la consola.");
            }
        }

        // Red: kbps reales y audio descartado en los últimos 5 s
        if medida_kbps.elapsed() >= Duration::from_secs(1) {
            let bytes = est.bytes.load(Ordering::Relaxed);
            kbps = ((bytes - bytes_antes) as f64 * 8.0 / 1000.0 / medida_kbps.elapsed().as_secs_f64()).round() as u32;
            bytes_antes = bytes;
            medida_kbps = Instant::now();
        }
        let descartados = est.descartados.load(Ordering::Relaxed);
        if descartados > descartados_antes {
            if ultimo_descarte.is_none_or(|t| t.elapsed() >= Duration::from_secs(60)) {
                n.anotar("red", "La conexión no alcanza para el bitrate elegido: se pierde audio");
            }
            descartados_antes = descartados;
            ultimo_descarte = Some(Instant::now());
        }
        let red_lenta = ultimo_descarte.is_some_and(|t| t.elapsed() < Duration::from_secs(5));

        n.medidores(Medidores {
            izq: l.izq,
            der: l.der,
            reduccion: l.reduccion,
            recortes: l.recortes,
            silencio_seg,
            kbps,
            red_lenta,
        });

        if ultimo_oyentes.elapsed() >= Duration::from_secs(10) {
            ultimo_oyentes = Instant::now();
            n.oyentes(icecast::sondear(&a.servidor, a.puerto_oyentes, &a.mount));
        }
        std::thread::sleep(Duration::from_millis(100));
    }
    n.medidores(Medidores::default());
}

#[cfg(test)]
mod pruebas {
    use super::*;

    #[test]
    fn codifica_todas_las_combinaciones() {
        for kbps in [64, 96, 112, 128, 160, 192, 224, 256, 320] {
            for frecuencia in [44_100, 48_000] {
                for mono in [false, true] {
                    let f = Formato { kbps, frecuencia, mono, calidad: Quality::NearBest };
                    let mut enc = crear_encoder(f).unwrap_or_else(|e| panic!("{kbps} {frecuencia} {mono}: {e}"));
                    // 1 s de tono estéreo
                    let pcm: Vec<i16> = (0..frecuencia as usize * 2).map(|i| ((i as f32 * 0.03).sin() * 8000.0) as i16).collect();
                    let mut out = Vec::new();
                    for trozo in pcm.chunks(4096) {
                        if mono {
                            let m: Vec<i16> = trozo.chunks_exact(2).map(|c| c[0]).collect();
                            out.reserve(mp3lame_encoder::max_required_buffer_size(m.len()));
                            enc.encode_to_vec(MonoPcm(&m), &mut out).unwrap();
                        } else {
                            out.reserve(mp3lame_encoder::max_required_buffer_size(trozo.len() / 2));
                            enc.encode_to_vec(InterleavedPcm(trozo), &mut out).unwrap();
                        }
                    }
                    // CBR: ~kbps/8 KB por segundo (con margen por el retardo del codificador)
                    let esperado = kbps as usize * 1000 / 8;
                    assert!(out.len() > esperado * 7 / 10 && out.len() < esperado * 13 / 10, "{kbps} {frecuencia} {mono}: {} bytes", out.len());
                }
            }
        }
    }
}
