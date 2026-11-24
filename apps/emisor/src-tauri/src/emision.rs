// Motor de la transmisión: micrófono → MP3 (LAME) → PUT al harbor de Liquidsoap.
// Cuatro hilos: captura, codificación, conexión (con reconexión) y medidores (nivel y oyentes).

use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::mpsc::{self, Receiver, RecvTimeoutError, SyncSender};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use mp3lame_encoder::{Bitrate, Builder, Encoder, FlushNoGap, InterleavedPcm, Quality};
use serde::Serialize;
use tauri::{AppHandle, Emitter};

use crate::ajustes::Ajustes;
use crate::audio::{self, Captura};
use crate::icecast::{self, Sondeo};
use crate::transmision;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EstadoEmision {
    /// desconectado | conectando | al_aire | reconectando | error | detenido
    pub estado: String,
    pub mensaje: String,
}

/// Control de una transmisión en curso.
pub struct Emision {
    pub stop: Arc<AtomicBool>,
    pub silencio: Arc<AtomicBool>,
}

/// Canal hacia la conexión activa. None cuando no hay conexión (el audio se descarta, sin acumular retraso).
type Salida = Arc<Mutex<Option<SyncSender<Vec<u8>>>>>;

/// Por dónde salen los avisos del motor: la ventana (Tauri) o, en pruebas, la consola.
pub trait Notificador: Clone + Send + Sync + 'static {
    fn estado(&self, estado: &str, mensaje: String);
    fn nivel(&self, nivel: f32);
    fn oyentes(&self, sondeo: Sondeo);
}

impl Notificador for AppHandle {
    fn estado(&self, estado: &str, mensaje: String) {
        let _ = self.emit("estado", EstadoEmision { estado: estado.into(), mensaje });
    }
    fn nivel(&self, nivel: f32) {
        let _ = self.emit("nivel", nivel);
    }
    fn oyentes(&self, sondeo: Sondeo) {
        let _ = self.emit("oyentes", sondeo);
    }
}

pub fn iniciar<N: Notificador>(ajustes: Ajustes, clave: String, notificador: N) -> Result<Emision, String> {
    if ajustes.servidor.is_empty() || ajustes.mount.is_empty() {
        return Err("Completa la configuración antes de salir al aire.".into());
    }

    let stop = Arc::new(AtomicBool::new(false));
    let silencio = Arc::new(AtomicBool::new(false));
    let nivel = Arc::new(AtomicU32::new(0));

    // 1. Micrófono (informa si no pudo abrirse, antes de seguir)
    let (pcm_tx, pcm_rx) = mpsc::sync_channel::<Vec<i16>>(64);
    let (informe_tx, informe_rx) = mpsc::sync_channel::<Result<(), String>>(1);
    let captura = Captura { silencio: silencio.clone(), nivel: nivel.clone(), stop: stop.clone() };
    let dispositivo = ajustes.dispositivo.clone();
    std::thread::spawn(move || audio::correr_captura(dispositivo, captura, pcm_tx, informe_tx));
    informe_rx
        .recv()
        .map_err(|_| "El micrófono no respondió.".to_string())??;

    // 2. Codificación MP3
    let salida: Salida = Arc::new(Mutex::new(None));
    {
        let (salida, stop, bitrate) = (salida.clone(), stop.clone(), ajustes.bitrate);
        std::thread::spawn(move || codificar(bitrate, pcm_rx, salida, stop));
    }

    // 3. Conexión con la radio (reintenta si se corta)
    {
        let (salida, stop, n) = (salida.clone(), stop.clone(), notificador.clone());
        let ajustes = ajustes.clone();
        std::thread::spawn(move || mantener_conexion(ajustes, clave, salida, stop, n));
    }

    // 4. Nivel del micrófono y oyentes
    {
        let (stop, n) = (stop.clone(), notificador.clone());
        std::thread::spawn(move || medidores(nivel, stop, n, ajustes));
    }

    notificador.estado("conectando", "Preparando la transmisión…".into());
    Ok(Emision { stop, silencio })
}

fn crear_encoder(kbps: u32) -> Result<Encoder, String> {
    let mut b = Builder::new().ok_or("No se pudo iniciar el codificador MP3.")?;
    b.set_num_channels(2).map_err(|e| format!("{e:?}"))?;
    b.set_sample_rate(audio::FRECUENCIA_SALIDA).map_err(|e| format!("{e:?}"))?;
    let tasa = match kbps {
        64 => Bitrate::Kbps64,
        96 => Bitrate::Kbps96,
        192 => Bitrate::Kbps192,
        _ => Bitrate::Kbps128,
    };
    b.set_brate(tasa).map_err(|e| format!("{e:?}"))?;
    b.set_quality(Quality::Good).map_err(|e| format!("{e:?}"))?;
    b.build().map_err(|e| format!("{e:?}"))
}

fn codificar(bitrate: u32, rx: Receiver<Vec<i16>>, salida: Salida, stop: Arc<AtomicBool>) {
    let Ok(mut encoder) = crear_encoder(bitrate) else { return };
    let mut buf: Vec<u8> = Vec::new();
    loop {
        if stop.load(Ordering::Relaxed) {
            break;
        }
        match rx.recv_timeout(Duration::from_millis(200)) {
            Ok(pcm) => {
                buf.clear();
                // LAME escribe en la capacidad libre del Vec: hay que reservarla antes (si no, falla la memoria)
                buf.reserve(mp3lame_encoder::max_required_buffer_size(pcm.len() / 2));
                if encoder.encode_to_vec(InterleavedPcm(&pcm), &mut buf).is_err() {
                    continue;
                }
                if !buf.is_empty() {
                    if let Ok(canal) = salida.lock() {
                        if let Some(tx) = canal.as_ref() {
                            let _ = tx.try_send(std::mem::take(&mut buf));
                        }
                    }
                }
            }
            Err(RecvTimeoutError::Timeout) => continue,
            Err(RecvTimeoutError::Disconnected) => break,
        }
    }
    // Cierra el MP3 limpiamente si queda algo por escribir
    let mut final_: Vec<u8> = Vec::with_capacity(mp3lame_encoder::max_required_buffer_size(0));
    if encoder.flush_to_vec::<FlushNoGap>(&mut final_).is_ok() && !final_.is_empty() {
        if let Ok(canal) = salida.lock() {
            if let Some(tx) = canal.as_ref() {
                let _ = tx.try_send(final_);
            }
        }
    }
}

/// Mantiene la transmisión: envía, y si se corta vuelve a intentarlo con espera creciente.
fn mantener_conexion<N: Notificador>(a: Ajustes, clave: String, salida: Salida, stop: Arc<AtomicBool>, n: N) {
    let mut espera: u64 = 2;
    while !stop.load(Ordering::Relaxed) {
        n.estado("conectando", format!("Conectando con {}…", a.servidor));
        let (tx, rx) = mpsc::sync_channel::<Vec<u8>>(128);
        if let Ok(mut canal) = salida.lock() {
            *canal = Some(tx);
        }
        let fin = transmision::enviar(&a, &clave, &rx, &stop, &n);
        if let Ok(mut canal) = salida.lock() {
            *canal = None;
        }
        match fin {
            transmision::Fin::Detenida => break,
            transmision::Fin::Rechazada(401) | transmision::Fin::Rechazada(403) => {
                stop.store(true, Ordering::Relaxed);
                n.estado(
                    "error",
                    "Contraseña incorrecta o sin permiso para este punto de transmisión. Revisa Configuración.".into(),
                );
                return;
            }
            transmision::Fin::Rechazada(codigo) => {
                n.estado("reconectando", format!("El servidor respondió {codigo}. Reintentando…"));
            }
            transmision::Fin::Cortada(mensaje) => n.estado("reconectando", mensaje),
        }
        if stop.load(Ordering::Relaxed) {
            break;
        }
        // Espera creciente (2 s, 4 s, … 15 s), revisando si el usuario detuvo la emisión
        for _ in 0..(espera * 5) {
            if stop.load(Ordering::Relaxed) {
                break;
            }
            std::thread::sleep(Duration::from_millis(200));
        }
        espera = (espera * 2).min(15);
    }
    n.estado("detenido", "Fuera del aire".into());
}

fn medidores<N: Notificador>(nivel: Arc<AtomicU32>, stop: Arc<AtomicBool>, n: N, a: Ajustes) {
    let mut ultimo_oyentes = Instant::now() - Duration::from_secs(60);
    while !stop.load(Ordering::Relaxed) {
        let pico = f32::from_bits(nivel.load(Ordering::Relaxed));
        n.nivel(pico.clamp(0.0, 1.0));
        if ultimo_oyentes.elapsed() >= Duration::from_secs(10) {
            ultimo_oyentes = Instant::now();
            n.oyentes(icecast::sondear(&a.servidor, a.puerto_oyentes, &a.mount));
        }
        std::thread::sleep(Duration::from_millis(100));
    }
}
