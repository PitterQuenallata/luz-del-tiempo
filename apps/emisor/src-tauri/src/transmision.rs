// Envío del audio al harbor de Liquidsoap: PUT con el audio crudo sobre TCP (como hace ffmpeg).
// Se usa un cliente mínimo (no reqwest) porque hace falta leer la respuesta del servidor mientras se envía el audio:
// si la contraseña es incorrecta, el servidor responde 401 al instante y la app debe enterarse sin esperar.
use std::io::{BufRead, BufReader, Write};
use std::net::{TcpStream, ToSocketAddrs};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{self, Receiver, RecvTimeoutError};
use std::time::{Duration, Instant};

use base64::Engine;

use crate::ajustes::Ajustes;
use crate::emision::Notificador;

/// Cuánto tiempo sin rechazo hace falta para decir "estás al aire".
const TIEMPO_PARA_AL_AIRE: Duration = Duration::from_millis(1500);

/// Cómo terminó un intento de transmisión.
pub enum Fin {
    /// El usuario la detuvo.
    Detenida,
    /// El servidor rechazó la conexión con este código HTTP (401/403 = contraseña).
    Rechazada(u16),
    /// Se cortó o no se pudo conectar; se puede reintentar.
    Cortada(String),
}

/// Quita caracteres que no pueden ir en una cabecera HTTP.
fn ascii_seguro(texto: &str) -> String {
    texto.chars().filter(|c| c.is_ascii() && !c.is_control()).collect()
}

/// Envía bloques MP3 de `rx` al punto de transmisión hasta que se detenga o se corte.
pub fn enviar<N: Notificador>(a: &Ajustes, clave: &str, rx: &Receiver<Vec<u8>>, stop: &AtomicBool, n: &N) -> Fin {
    let destino = format!("{}:{}", a.servidor, a.puerto);
    // "localhost" puede resolver primero a IPv6 y el servidor escuchar solo en IPv4: se prueba cada dirección
    let direcciones: Vec<_> = match destino.to_socket_addrs() {
        Ok(it) => it.collect(),
        Err(_) => Vec::new(),
    };
    if direcciones.is_empty() {
        return Fin::Cortada(format!("No encuentro el servidor {}. Revisa la dirección.", a.servidor));
    }
    let sock = direcciones
        .iter()
        .find_map(|d| TcpStream::connect_timeout(d, Duration::from_secs(4)).ok());
    let mut sock = match sock {
        Some(s) => s,
        None => return Fin::Cortada(format!("Sin conexión con {}. Reintentando…", a.servidor)),
    };
    let _ = sock.set_nodelay(true);
    let _ = sock.set_write_timeout(Some(Duration::from_secs(10)));

    let auth = base64::engine::general_purpose::STANDARD.encode(format!("source:{clave}"));
    let cabecera = format!(
        "PUT {mount} HTTP/1.0\r\nHost: {destino}\r\nAuthorization: Basic {auth}\r\nUser-Agent: EmisorLuzDelTiempo/0.1\r\nContent-Type: audio/mpeg\r\nice-name: {nombre}\r\nice-public: 0\r\nice-bitrate: {bitrate}\r\n\r\n",
        mount = a.mount,
        nombre = ascii_seguro(&a.nombre_emision),
        bitrate = a.bitrate,
    );
    if sock.write_all(cabecera.as_bytes()).is_err() {
        return Fin::Cortada("No se pudo enviar la solicitud a la radio. Reintentando…".into());
    }

    // Hilo que espera la línea de estado de la respuesta (sin bloquear el envío del audio)
    let (estado_tx, estado_rx) = mpsc::channel::<u16>();
    if let Ok(lectura) = sock.try_clone() {
        std::thread::spawn(move || {
            let mut lector = BufReader::new(lectura);
            let mut linea = String::new();
            if lector.read_line(&mut linea).is_ok() {
                if let Some(codigo) = linea.split_whitespace().nth(1).and_then(|c| c.parse::<u16>().ok()) {
                    let _ = estado_tx.send(codigo);
                }
            }
        });
    }

    let inicio = Instant::now();
    let mut avisado = false;
    loop {
        if stop.load(Ordering::Relaxed) {
            let _ = sock.shutdown(std::net::Shutdown::Both);
            return Fin::Detenida;
        }
        if let Ok(codigo) = estado_rx.try_recv() {
            if codigo >= 400 {
                let _ = sock.shutdown(std::net::Shutdown::Both);
                return Fin::Rechazada(codigo);
            }
            // 2xx: la radio aceptó la fuente. Se sigue enviando; si se corta, el envío falla y se reintenta.
            if !avisado {
                avisado = true;
                n.estado("al_aire", "Estás al aire".into());
            }
        }
        match rx.recv_timeout(Duration::from_millis(200)) {
            Ok(bloque) => {
                // Audio crudo: sin marcos de tamaño (el harbor lo leería como texto)
                if sock.write_all(&bloque).is_err() {
                    return Fin::Cortada("Se perdió la conexión con la radio. Reintentando…".into());
                }
                if !avisado && inicio.elapsed() >= TIEMPO_PARA_AL_AIRE {
                    avisado = true;
                    n.estado("al_aire", "Estás al aire".into());
                }
            }
            Err(RecvTimeoutError::Timeout) => {
                if !avisado && inicio.elapsed() >= TIEMPO_PARA_AL_AIRE {
                    avisado = true;
                    n.estado("al_aire", "Estás al aire".into());
                }
            }
            Err(RecvTimeoutError::Disconnected) => {
                return Fin::Cortada("El micrófono se detuvo. Reintentando…".into());
            }
        }
    }
}
