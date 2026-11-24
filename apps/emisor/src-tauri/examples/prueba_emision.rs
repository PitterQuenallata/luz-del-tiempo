// Prueba del motor de emisión sin ventana: mismo código que usa la app.
// Uso: cargo run --example prueba_emision -- <servidor> <puerto> <mount> <clave> <segundos> [silencio_en_seg]
use std::sync::atomic::Ordering;
use std::time::{Duration, Instant};

use emisor_lib::ajustes::Ajustes;
use emisor_lib::emision::{self, Medidores, Notificador};
use emisor_lib::icecast::Sondeo;

#[derive(Clone)]
struct Consola {
    inicio: Instant,
    contador: std::sync::Arc<std::sync::atomic::AtomicU64>,
}

impl Notificador for Consola {
    fn estado(&self, estado: &str, mensaje: String) {
        println!("[{:>5.1}s] ESTADO {estado}: {mensaje}", self.inicio.elapsed().as_secs_f32());
    }
    fn medidores(&self, m: Medidores) {
        // Solo cada ~0.5 s para no saturar la salida
        let n = self.contador.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        if n % 5 == 0 {
            println!("[{:>5.1}s] {:?}", self.inicio.elapsed().as_secs_f32(), m);
        }
    }
    fn anotar(&self, tipo: &str, mensaje: &str) {
        println!("[{:>5.1}s] HISTORIAL {tipo}: {mensaje}", self.inicio.elapsed().as_secs_f32());
    }
    fn oyentes(&self, s: Sondeo) {
        println!("[{:>5.1}s] OYENTES alcanzable={} en_linea={} oyentes={:?}", self.inicio.elapsed().as_secs_f32(), s.alcanzable, s.mount_en_linea, s.oyentes);
    }
}

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.len() < 5 {
        eprintln!("uso: prueba_emision <servidor> <puerto> <mount> <clave> <segundos> [silencio_en_seg]");
        std::process::exit(2);
    }
    let ajustes = Ajustes {
        servidor: args[0].clone(),
        puerto: args[1].parse().expect("puerto"),
        puerto_oyentes: 8000,
        mount: args[2].clone(),
        bitrate: 128,
        dispositivo: None,
        nombre_emision: "Prueba del emisor".into(),
        ..Default::default()
    };
    let clave = args[3].clone();
    let segundos: u64 = args[4].parse().expect("segundos");
    let silencio_en: Option<u64> = args.get(5).and_then(|s| s.parse().ok());

    let consola = Consola { inicio: Instant::now(), contador: Default::default() };
    println!("[{:>5.1}s] iniciando motor", consola.inicio.elapsed().as_secs_f32());
    let emision = match emision::iniciar(ajustes, clave, consola.clone()) {
        Ok(e) => e,
        Err(e) => {
            println!("ERROR AL INICIAR: {e}");
            std::process::exit(1);
        }
    };
    let fin = Instant::now() + Duration::from_secs(segundos);
    let mut silenciado = false;
    while Instant::now() < fin {
        if let Some(t) = silencio_en {
            if !silenciado && consola.inicio.elapsed() >= Duration::from_secs(t) {
                println!("[{:>5.1}s] >>> silencio ON", consola.inicio.elapsed().as_secs_f32());
                emision.silencio.store(true, Ordering::Relaxed);
                silenciado = true;
            }
        }
        std::thread::sleep(Duration::from_millis(100));
    }
    emision.stop.store(true, Ordering::Relaxed);
    std::thread::sleep(Duration::from_millis(800));
    println!("[{:>5.1}s] FIN", consola.inicio.elapsed().as_secs_f32());
}
