// Diagnóstico: prueba por separado el codificador MP3 y la captura del micrófono.
use std::sync::atomic::{AtomicBool, AtomicU32};
use std::sync::{mpsc, Arc};
use std::time::Duration;

use emisor_lib::audio::{self, Captura};
use mp3lame_encoder::{Bitrate, Builder, InterleavedPcm, Quality};

fn main() {
    let parte = std::env::args().nth(1).unwrap_or_default();
    if parte == "codec" {
        eprintln!("[codec] creando builder");
        let mut b = Builder::new().expect("builder");
        b.set_num_channels(2).unwrap();
        b.set_sample_rate(44100).unwrap();
        b.set_brate(Bitrate::Kbps128).unwrap();
        b.set_quality(Quality::Good).unwrap();
        eprintln!("[codec] build()");
        let mut enc = b.build().expect("build");
        let pcm: Vec<i16> = (0..44100 * 2).map(|i| ((i as f32 * 0.05).sin() * 8000.0) as i16).collect();
        let mut out = Vec::new();
        eprintln!("[codec] encode 1 s");
        for trozo in pcm.chunks(2048) {
            out.reserve(mp3lame_encoder::max_required_buffer_size(trozo.len() / 2));
            enc.encode_to_vec(InterleavedPcm(trozo), &mut out).expect("encode");
        }
        eprintln!("[codec] bytes={}", out.len());
    } else if parte == "captura" {
        let silencio = Arc::new(AtomicBool::new(false));
        let nivel = Arc::new(AtomicU32::new(0));
        let stop = Arc::new(AtomicBool::new(false));
        let (pcm_tx, pcm_rx) = mpsc::sync_channel::<Vec<i16>>(64);
        let (informe_tx, informe_rx) = mpsc::sync_channel::<Result<(), String>>(1);
        let cap = Captura { silencio, nivel: nivel.clone(), stop: stop.clone() };
        eprintln!("[captura] lanzando hilo");
        std::thread::spawn(move || audio::correr_captura(None, cap, pcm_tx, informe_tx));
        eprintln!("[captura] informe: {:?}", informe_rx.recv());
        let mut total = 0usize;
        let t0 = std::time::Instant::now();
        while t0.elapsed() < Duration::from_secs(2) {
            if let Ok(b) = pcm_rx.recv_timeout(Duration::from_millis(200)) {
                total += b.len();
            }
        }
        eprintln!("[captura] muestras en 2 s: {total} (esperado ~176400) pico={}", f32::from_bits(nivel.load(std::sync::atomic::Ordering::Relaxed)));
        stop.store(true, std::sync::atomic::Ordering::Relaxed);
        std::thread::sleep(Duration::from_millis(300));
    }
    eprintln!("[{parte}] fin ok");
}
