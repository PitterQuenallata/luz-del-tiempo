// Historial de las emisiones: una línea JSON por suceso (salió al aire, se cortó, silencio, saturación…).
// Sirve para saber qué pasó en un programa aunque nadie estuviera mirando la pantalla.
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;

use serde::{Deserialize, Serialize};

const ARCHIVO: &str = "historial.jsonl";
const ANTERIOR: &str = "historial.anterior.jsonl";
/// Al pasar este tamaño se archiva y se empieza otro (así nunca crece sin límite)
const TAMANO_MAXIMO: u64 = 1024 * 1024;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Suceso {
    /// Fecha y hora local, ISO 8601
    pub fecha: String,
    /// inicio | al_aire | corte | reconectado | silencio | sonido | saturacion | red | grabacion | error | fin
    pub tipo: String,
    pub mensaje: String,
}

pub fn anotar(carpeta: &Path, tipo: &str, mensaje: &str) {
    let ruta = carpeta.join(ARCHIVO);
    if fs::metadata(&ruta).map(|m| m.len() > TAMANO_MAXIMO).unwrap_or(false) {
        let _ = fs::rename(&ruta, carpeta.join(ANTERIOR));
    }
    let suceso = Suceso {
        fecha: chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string(),
        tipo: tipo.into(),
        mensaje: mensaje.into(),
    };
    let Ok(linea) = serde_json::to_string(&suceso) else { return };
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(&ruta) {
        let _ = writeln!(f, "{linea}");
    }
}

/// Los últimos `limite` sucesos, del más reciente al más antiguo.
pub fn leer(carpeta: &Path, limite: usize) -> Vec<Suceso> {
    let mut sucesos: Vec<Suceso> = Vec::new();
    for nombre in [ANTERIOR, ARCHIVO] {
        if let Ok(texto) = fs::read_to_string(carpeta.join(nombre)) {
            sucesos.extend(texto.lines().filter_map(|l| serde_json::from_str(l).ok()));
        }
    }
    sucesos.reverse();
    sucesos.truncate(limite);
    sucesos
}

pub fn borrar(carpeta: &Path) {
    let _ = fs::remove_file(carpeta.join(ARCHIVO));
    let _ = fs::remove_file(carpeta.join(ANTERIOR));
}

#[cfg(test)]
mod pruebas {
    use super::*;

    #[test]
    fn anota_y_lee_del_mas_reciente_al_mas_antiguo() {
        let dir = std::env::temp_dir().join(format!("emisor-historial-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        borrar(&dir);
        anotar(&dir, "inicio", "uno");
        anotar(&dir, "al_aire", "dos");
        let s = leer(&dir, 10);
        assert_eq!(s.len(), 2);
        assert_eq!(s[0].mensaje, "dos");
        assert_eq!(leer(&dir, 1).len(), 1);
        borrar(&dir);
        let _ = fs::remove_dir(&dir);
    }
}
