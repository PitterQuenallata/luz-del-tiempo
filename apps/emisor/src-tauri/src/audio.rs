// Captura del micrófono: convierte lo que entra a estéreo y 44.1 kHz, que es lo que espera la radio.
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::mpsc::{SyncSender, TrySendError};
use std::sync::Arc;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{FromSample, SampleFormat, StreamConfig};
use serde::Serialize;

/// Un dispositivo de audio que se puede usar como fuente.
/// `tipo` = "entrada" (micrófono, interfaz de audio) o "salida" (se captura lo que suena: parlantes, audífonos).
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Dispositivo {
    pub id: String,
    pub nombre: String,
    pub tipo: &'static str,
    pub canales: u16,
    pub predeterminado: bool,
}

/// Dispositivos disponibles: entradas y, en Windows, salidas (captura "lo que suena en la PC" por loopback de WASAPI).
pub fn dispositivos() -> Vec<Dispositivo> {
    let host = cpal::default_host();
    let mut lista = Vec::new();
    let pred_entrada = host.default_input_device().and_then(|d| d.name().ok());
    if let Ok(it) = host.input_devices() {
        for d in it {
            let Ok(nombre) = d.name() else { continue };
            let canales = d.default_input_config().map(|c| c.channels()).unwrap_or(2);
            lista.push(Dispositivo {
                id: format!("entrada:{nombre}"),
                predeterminado: pred_entrada.as_deref() == Some(nombre.as_str()),
                nombre,
                tipo: "entrada",
                canales,
            });
        }
    }
    #[cfg(target_os = "windows")]
    {
        let pred_salida = host.default_output_device().and_then(|d| d.name().ok());
        if let Ok(it) = host.output_devices() {
            for d in it {
                let Ok(nombre) = d.name() else { continue };
                let canales = d.default_output_config().map(|c| c.channels()).unwrap_or(2);
                lista.push(Dispositivo {
                    id: format!("salida:{nombre}"),
                    predeterminado: pred_salida.as_deref() == Some(nombre.as_str()),
                    nombre,
                    tipo: "salida",
                    canales,
                });
            }
        }
    }
    lista
}

/// Qué se eligió en Configuración. Un nombre sin prefijo (ajustes antiguos) es una entrada.
enum Origen<'a> {
    Predeterminado,
    Entrada(&'a str),
    Salida(&'a str),
}

fn interpretar(id: Option<&str>) -> Origen<'_> {
    match id {
        None | Some("") => Origen::Predeterminado,
        Some(s) => {
            if let Some(n) = s.strip_prefix("salida:") {
                Origen::Salida(n)
            } else {
                Origen::Entrada(s.strip_prefix("entrada:").unwrap_or(s))
            }
        }
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

/// Mediciones que la captura comparte con quien dibuja los medidores. Los picos se acumulan con `fetch_max`
/// (en f32 positivos el orden de los bits coincide con el de los números) y el lector los pone a cero al leerlos,
/// así no se pierde ningún pico entre lecturas.
#[derive(Default)]
pub struct Medicion {
    /// Pico de la entrada por lado (0–1), antes del limitador
    pub pico_izq: AtomicU32,
    pub pico_der: AtomicU32,
    /// Mayor reducción del limitador desde la última lectura, en dB positivos
    pub reduccion: AtomicU32,
    /// Veces que la entrada llegó a 0 dBFS (saturó)
    pub recortes: AtomicU32,
}

/// Lectura de los medidores, ya puesta a cero en el origen.
#[derive(Clone, Copy, Default)]
pub struct Lectura {
    pub izq: f32,
    pub der: f32,
    pub reduccion: f32,
    pub recortes: u32,
}

impl Medicion {
    pub fn leer(&self) -> Lectura {
        Lectura {
            izq: f32::from_bits(self.pico_izq.swap(0, Ordering::Relaxed)).clamp(0.0, 1.0),
            der: f32::from_bits(self.pico_der.swap(0, Ordering::Relaxed)).clamp(0.0, 1.0),
            reduccion: f32::from_bits(self.reduccion.swap(0, Ordering::Relaxed)),
            recortes: self.recortes.load(Ordering::Relaxed),
        }
    }
}

/// Muestra a partir de la cual se considera que la entrada saturó (-0.1 dBFS).
const UMBRAL_RECORTE: f32 = 0.989;

/// Limitador de seguridad: nada sale por encima de -1 dBFS. Ataque inmediato y recuperación de ~150 ms;
/// con niveles normales no actúa. No tiene perillas a propósito: solo protege de picos.
pub struct Limitador {
    techo: f32,
    ganancia: f32,
    recuperacion: f32,
}

impl Limitador {
    pub fn new(frecuencia: u32) -> Self {
        let muestras = frecuencia as f32 * 0.150;
        Self { techo: 0.891, ganancia: 1.0, recuperacion: 1.0 - (-1.0 / muestras).exp() }
    }

    /// Procesa en el lugar y devuelve la mayor reducción aplicada en este bloque (dB positivos).
    pub fn procesar(&mut self, cuadros: &mut [[f32; 2]]) -> f32 {
        let mut minima = 1.0f32;
        for c in cuadros.iter_mut() {
            let pico = c[0].abs().max(c[1].abs());
            let objetivo = if pico * self.ganancia > self.techo { self.techo / pico } else { 1.0 };
            if objetivo < self.ganancia {
                self.ganancia = objetivo;
            } else {
                self.ganancia += (objetivo - self.ganancia) * self.recuperacion;
            }
            c[0] *= self.ganancia;
            c[1] *= self.ganancia;
            minima = minima.min(self.ganancia);
        }
        -20.0 * minima.log10()
    }
}

/// Parámetros de la captura, compartidos con el hilo que la sostiene.
pub struct Captura {
    pub silencio: Arc<AtomicBool>,
    pub medicion: Arc<Medicion>,
    /// Limitador de seguridad activo
    pub limitador: bool,
    pub stop: Arc<AtomicBool>,
    /// Frecuencia con la que se transmite (44.1 o 48 kHz)
    pub frecuencia: u32,
    /// Canales del dispositivo que van a izquierda y derecha (0 = canal 1). Iguales = una sola entrada en ambos lados.
    pub canal_izq: usize,
    pub canal_der: usize,
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
    let (device, soportada) = match interpretar(dispositivo) {
        Origen::Predeterminado => {
            let d = host.default_input_device().ok_or("No hay un micrófono disponible.")?;
            let c = d.default_input_config().map_err(|e| format!("El micrófono no responde: {e}"))?;
            (d, c)
        }
        Origen::Entrada(nombre) => {
            let d = host
                .input_devices()
                .map_err(|e| e.to_string())?
                .find(|d| d.name().ok().as_deref() == Some(nombre))
                .ok_or_else(|| format!("No encuentro la entrada \"{nombre}\". Elige otra en Configuración."))?;
            let c = d.default_input_config().map_err(|e| format!("La entrada \"{nombre}\" no responde: {e}"))?;
            (d, c)
        }
        Origen::Salida(nombre) => {
            let d = host
                .output_devices()
                .map_err(|e| e.to_string())?
                .find(|d| d.name().ok().as_deref() == Some(nombre))
                .ok_or_else(|| format!("No encuentro la salida \"{nombre}\". Elige otra en Configuración."))?;
            // En WASAPI, abrir un stream de entrada sobre una salida activa el loopback
            let c = d.default_output_config().map_err(|e| format!("La salida \"{nombre}\" no responde: {e}"))?;
            (d, c)
        }
    };
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
    let medicion = captura.medicion.clone();
    let mut limitador = captura.limitador.then(|| Limitador::new(captura.frecuencia));
    let mut remuestreo = Remuestreador::new(frecuencia, captura.frecuencia);
    let izq = captura.canal_izq.min(canales.saturating_sub(1));
    let der = captura.canal_der.min(canales.saturating_sub(1));
    let mut estereo: Vec<[f32; 2]> = Vec::new();
    let mut remuestreado: Vec<[f32; 2]> = Vec::new();

    device.build_input_stream(
        config,
        move |datos: &[T], _| {
            estereo.clear();
            let (mut pico_l, mut pico_r, mut recortes) = (0f32, 0f32, 0u32);
            for cuadro in datos.chunks_exact(canales) {
                let l: f32 = <f32 as FromSample<T>>::from_sample_(cuadro[izq]);
                let r: f32 = <f32 as FromSample<T>>::from_sample_(cuadro[der]);
                pico_l = pico_l.max(l.abs());
                pico_r = pico_r.max(r.abs());
                estereo.push([l, r]);
            }
            let silenciado = silencio.load(Ordering::Relaxed);
            if silenciado {
                for c in estereo.iter_mut() {
                    *c = [0.0, 0.0];
                }
                // El medidor muestra lo que realmente sale: con silencio, cero
                pico_l = 0.0;
                pico_r = 0.0;
            } else if pico_l.max(pico_r) >= UMBRAL_RECORTE {
                recortes = 1;
            }
            medicion.pico_izq.fetch_max(pico_l.to_bits(), Ordering::Relaxed);
            medicion.pico_der.fetch_max(pico_r.to_bits(), Ordering::Relaxed);
            if recortes > 0 {
                medicion.recortes.fetch_add(recortes, Ordering::Relaxed);
            }

            remuestreado.clear();
            remuestreo.procesar(&estereo, &mut remuestreado);
            if let Some(lim) = limitador.as_mut() {
                let reduccion = lim.procesar(&mut remuestreado);
                medicion.reduccion.fetch_max(reduccion.to_bits(), Ordering::Relaxed);
            }
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
    fn limitador_no_toca_niveles_normales() {
        let mut lim = Limitador::new(44_100);
        let mut cuadros: Vec<[f32; 2]> = (0..4410).map(|i| [(i as f32 * 0.05).sin() * 0.5; 2]).collect();
        let copia = cuadros.clone();
        assert_eq!(lim.procesar(&mut cuadros), 0.0);
        assert_eq!(cuadros, copia);
    }

    #[test]
    fn limitador_no_deja_pasar_picos() {
        let mut lim = Limitador::new(44_100);
        let mut cuadros: Vec<[f32; 2]> = (0..4410).map(|i| [(i as f32 * 0.05).sin() * 1.0; 2]).collect();
        let reduccion = lim.procesar(&mut cuadros);
        assert!(reduccion > 0.9, "reducción {reduccion}");
        assert!(cuadros.iter().all(|c| c[0].abs() <= 0.8911), "pasó un pico");
    }

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
