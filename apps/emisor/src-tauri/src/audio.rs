// Captura del micrófono: convierte lo que entra a estéreo y 44.1 kHz, que es lo que espera la radio.
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::mpsc::{SyncSender, TrySendError};
use std::sync::Arc;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{FromSample, SampleFormat, StreamConfig};

/// Frecuencia con la que se transmite (la de Liquidsoap y de los oyentes).
pub const FRECUENCIA_SALIDA: u32 = 44_100;

/// Nombres de los micrófonos disponibles.
pub fn dispositivos() -> Vec<String> {
    let host = cpal::default_host();
    match host.input_devices() {
        Ok(lista) => lista.filter_map(|d| d.name().ok()).collect(),
        Err(_) => Vec::new(),
    }
}

/// Remuestreo lineal en bloques. Guarda el último cuadro para unir bloques sin clics.
pub struct Remuestreador {
    paso: f64,
    pos: f64,
    ultimo: [f32; 2],
    directo: bool,
}

impl Remuestreador {
    pub fn new(entrada: u32, salida: u32) -> Self {
        Self { paso: entrada as f64 / salida as f64, pos: 0.0, ultimo: [0.0; 2], directo: entrada == salida }
    }

    pub fn procesar(&mut self, entrada: &[[f32; 2]], out: &mut Vec<[f32; 2]>) {
        if self.directo {
            out.extend_from_slice(entrada);
            return;
        }
        let mut buf = Vec::with_capacity(entrada.len() + 1);
        buf.push(self.ultimo);
        buf.extend_from_slice(entrada);
        let limite = (buf.len() - 1) as f64;
        while self.pos < limite {
            let i = self.pos as usize;
            let f = (self.pos - i as f64) as f32;
            let a = buf[i];
            let b = buf[i + 1];
            out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
            self.pos += self.paso;
        }
        self.pos -= limite;
        self.ultimo = buf[buf.len() - 1];
    }
}

/// Parámetros de la captura, compartidos con el hilo que la sostiene.
pub struct Captura {
    pub silencio: Arc<AtomicBool>,
    pub nivel: Arc<AtomicU32>,
    pub stop: Arc<AtomicBool>,
}

/// Hilo dedicado: crea el stream (cpal no permite moverlo entre hilos) y lo mantiene vivo hasta `stop`.
/// Informa por `informe` si pudo abrir el micrófono.
pub fn correr_captura(
    dispositivo: Option<String>,
    captura: Captura,
    salida: SyncSender<Vec<i16>>,
    informe: SyncSender<Result<(), String>>,
) {
    let stream = match abrir_stream(dispositivo.as_deref(), &captura, salida) {
        Ok(s) => s,
        Err(e) => {
            let _ = informe.send(Err(e));
            return;
        }
    };
    if let Err(e) = stream.play() {
        let _ = informe.send(Err(format!("No se pudo iniciar el micrófono: {e}")));
        return;
    }
    let _ = informe.send(Ok(()));
    while !captura.stop.load(Ordering::Relaxed) {
        std::thread::sleep(std::time::Duration::from_millis(100));
    }
    drop(stream);
}

fn abrir_stream(dispositivo: Option<&str>, captura: &Captura, salida: SyncSender<Vec<i16>>) -> Result<cpal::Stream, String> {
    let host = cpal::default_host();
    let device = match dispositivo {
        Some(nombre) if !nombre.is_empty() => host
            .input_devices()
            .map_err(|e| e.to_string())?
            .find(|d| d.name().ok().as_deref() == Some(nombre))
            .ok_or_else(|| format!("No encuentro el micrófono \"{nombre}\". Elige otro en Configuración."))?,
        _ => host.default_input_device().ok_or("No hay un micrófono disponible.")?,
    };
    let soportada = device.default_input_config().map_err(|e| format!("El micrófono no responde: {e}"))?;
    let formato = soportada.sample_format();
    let config: StreamConfig = soportada.config();
    let canales = config.channels as usize;
    let frecuencia = config.sample_rate.0;

    let err_fn = |e| eprintln!("[emisor] error del micrófono: {e}");
    let stream = match formato {
        SampleFormat::F32 => construir::<f32>(&device, &config, canales, frecuencia, captura, salida, err_fn),
        SampleFormat::I16 => construir::<i16>(&device, &config, canales, frecuencia, captura, salida, err_fn),
        SampleFormat::U16 => construir::<u16>(&device, &config, canales, frecuencia, captura, salida, err_fn),
        otro => return Err(format!("Formato de audio no soportado: {otro:?}")),
    };
    stream.map_err(|e| format!("No se pudo abrir el micrófono: {e}"))
}

fn construir<T>(
    device: &cpal::Device,
    config: &StreamConfig,
    canales: usize,
    frecuencia: u32,
    captura: &Captura,
    salida: SyncSender<Vec<i16>>,
    err_fn: impl FnMut(cpal::StreamError) + Send + 'static,
) -> Result<cpal::Stream, cpal::BuildStreamError>
where
    T: cpal::SizedSample,
    f32: FromSample<T>,
{
    let silencio = captura.silencio.clone();
    let nivel = captura.nivel.clone();
    let mut remuestreo = Remuestreador::new(frecuencia, FRECUENCIA_SALIDA);
    let mut estereo: Vec<[f32; 2]> = Vec::new();
    let mut remuestreado: Vec<[f32; 2]> = Vec::new();
    let mut pico: f32 = 0.0;

    device.build_input_stream(
        config,
        move |datos: &[T], _| {
            estereo.clear();
            for cuadro in datos.chunks(canales) {
                let l: f32 = <f32 as FromSample<T>>::from_sample_(cuadro[0]);
                let r: f32 = if canales > 1 { <f32 as FromSample<T>>::from_sample_(cuadro[1]) } else { l };
                pico = pico.max(l.abs()).max(r.abs());
                estereo.push([l, r]);
            }
            if silencio.load(Ordering::Relaxed) {
                for c in estereo.iter_mut() {
                    *c = [0.0, 0.0];
                }
            }
            // El medidor muestra lo que realmente sale: con silencio, cero
            let silenciado = silencio.load(Ordering::Relaxed);
            nivel.store(if silenciado { 0f32.to_bits() } else { pico.to_bits() }, Ordering::Relaxed);
            pico = 0.0;

            remuestreado.clear();
            remuestreo.procesar(&estereo, &mut remuestreado);
            let bloque: Vec<i16> = remuestreado
                .iter()
                .flat_map(|c| [(c[0].clamp(-1.0, 1.0) * 32767.0) as i16, (c[1].clamp(-1.0, 1.0) * 32767.0) as i16])
                .collect();
            if !bloque.is_empty() {
                // Si la transmisión va atrasada, se descarta el audio nuevo: nunca se acumula retraso.
                match salida.try_send(bloque) {
                    Ok(()) | Err(TrySendError::Full(_)) => {}
                    Err(TrySendError::Disconnected(_)) => {}
                }
            }
        },
        err_fn,
        None,
    )
}

#[cfg(test)]
mod pruebas {
    use super::*;

    #[test]
    fn remuestreo_misma_frecuencia_pasa_igual() {
        let mut r = Remuestreador::new(44_100, 44_100);
        let mut out = Vec::new();
        r.procesar(&[[0.1, 0.2], [0.3, 0.4]], &mut out);
        assert_eq!(out, vec![[0.1, 0.2], [0.3, 0.4]]);
    }

    #[test]
    fn remuestreo_48k_a_44k_produce_la_proporcion_correcta() {
        let mut r = Remuestreador::new(48_000, 44_100);
        let entrada: Vec<[f32; 2]> = (0..4800).map(|i| [i as f32, i as f32]).collect();
        let mut out = Vec::new();
        r.procesar(&entrada[..2400], &mut out);
        r.procesar(&entrada[2400..], &mut out);
        // 4800 cuadros a 48 kHz = 0.1 s → unos 4410 a 44.1 kHz
        assert!((out.len() as i64 - 4410).abs() <= 2, "salieron {} cuadros", out.len());
    }

    #[test]
    fn remuestreo_une_bloques_sin_saltos() {
        let mut un_bloque = Remuestreador::new(48_000, 44_100);
        let mut dos_bloques = Remuestreador::new(48_000, 44_100);
        let entrada: Vec<[f32; 2]> = (0..960).map(|i| [(i as f32 * 0.01).sin(), 0.0]).collect();
        let mut a = Vec::new();
        un_bloque.procesar(&entrada, &mut a);
        let mut b = Vec::new();
        dos_bloques.procesar(&entrada[..480], &mut b);
        dos_bloques.procesar(&entrada[480..], &mut b);
        assert_eq!(a.len(), b.len());
        for (x, y) in a.iter().zip(b.iter()) {
            assert!((x[0] - y[0]).abs() < 1e-6, "salto en la unión de bloques");
        }
    }
}
