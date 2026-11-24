// Candado que nunca deja la app colgada.
//
// Un Mutex común espera para siempre: si dos partes se esperan entre sí (bloqueo mutuo), la ventana queda
// "No responde". Este espera como mucho LIMITE; si no lo consigue, devuelve Err y quien llamó sigue (salta esa
// actualización o muestra un error). Además no se "envenena": si un hilo falla con el candado tomado,
// los demás siguen usándolo con normalidad.
use std::time::Duration;

use parking_lot::{Mutex, MutexGuard};

const LIMITE: Duration = Duration::from_secs(2);

/// No se pudo tomar el candado a tiempo
#[derive(Debug, Clone, Copy)]
pub struct Ocupado;

impl std::fmt::Display for Ocupado {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("El emisor está ocupado. Intenta de nuevo en un momento.")
    }
}

impl From<Ocupado> for String {
    fn from(o: Ocupado) -> Self {
        o.to_string()
    }
}

#[derive(Default)]
pub struct Candado<T>(Mutex<T>);

impl<T> Candado<T> {
    pub fn new(valor: T) -> Self {
        Self(Mutex::new(valor))
    }

    /// Toma el candado esperando como mucho 2 s.
    pub fn lock(&self) -> Result<MutexGuard<'_, T>, Ocupado> {
        self.0.try_lock_for(LIMITE).ok_or_else(|| {
            eprintln!("[emisor] candado ocupado más de {LIMITE:?}: se omite la operación");
            Ocupado
        })
    }
}

#[cfg(test)]
mod pruebas {
    use super::*;
    use std::sync::Arc;
    use std::time::Instant;

    #[test]
    fn no_espera_para_siempre() {
        let c = Arc::new(Candado::new(0));
        let tomado = c.lock().unwrap();
        let otro = c.clone();
        let inicio = Instant::now();
        let r = std::thread::spawn(move || otro.lock().is_err()).join().unwrap();
        assert!(r, "debió rendirse");
        assert!(inicio.elapsed() < Duration::from_secs(4));
        drop(tomado);
        assert!(c.lock().is_ok());
    }

    #[test]
    fn sigue_funcionando_si_un_hilo_falla() {
        let c = Arc::new(Candado::new(1));
        let otro = c.clone();
        let _ = std::thread::spawn(move || {
            let _g = otro.lock().unwrap();
            panic!("falla con el candado tomado");
        })
        .join();
        assert_eq!(*c.lock().unwrap(), 1);
    }
}
