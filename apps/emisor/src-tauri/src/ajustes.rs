// Ajustes del emisor. Los datos no secretos van a un JSON en la carpeta de configuración del usuario.
// La contraseña del locutor va al llavero del sistema (Credential Manager en Windows, Keychain en macOS).
use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const SERVICIO_LLAVERO: &str = "org.laluzdeltiempo.emisor";
const CUENTA_LLAVERO: &str = "contrasena-locutor";
const BITRATES: [u32; 9] = [64, 96, 112, 128, 160, 192, 224, 256, 320];
const FRECUENCIAS: [u32; 2] = [44_100, 48_000];
const CALIDADES: [&str; 3] = ["alta", "normal", "ligera"];

// `default`: un ajustes.json de una versión anterior se completa con los valores por defecto
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase", default)]
pub struct Ajustes {
    pub servidor: String,
    pub puerto: u16,
    pub puerto_oyentes: u16,
    pub mount: String,
    pub bitrate: u32,
    /// "entrada:<nombre>" o "salida:<nombre>"; None = micrófono predeterminado
    pub dispositivo: Option<String>,
    /// Canales del dispositivo que van a izquierda y derecha (0 = canal 1)
    pub canal_izq: u16,
    pub canal_der: u16,
    /// 44100 o 48000
    pub frecuencia: u32,
    pub mono: bool,
    /// alta | normal | ligera (esfuerzo del codificador MP3)
    pub calidad: String,
    pub nombre_emision: String,
    /// Limitador de seguridad en la salida (evita que un pico distorsione)
    pub limitador: bool,
    /// Si hay silencio prolongado, soltar el aire para que entre el AutoDJ (lo decide el operador)
    pub soltar_por_silencio: bool,
    /// Minutos de silencio antes de soltar el aire
    pub minutos_silencio: u32,
    /// Guardar en MP3 lo mismo que sale al aire
    pub grabar: bool,
    /// Al minimizar mientras se transmite, mostrar la ventana mini
    pub mini_al_minimizar: bool,
    /// Abrir el emisor al iniciar Windows (en la bandeja)
    pub iniciar_con_windows: bool,
    /// Si la PC se apagó o reinició en plena transmisión, volver a salir al aire al abrir
    pub retomar_transmision: bool,
    /// Segundos de cuenta regresiva antes de salir al aire (0 = sin cuenta)
    pub cuenta_regresiva: u32,
}

impl Default for Ajustes {
    fn default() -> Self {
        Self {
            servidor: String::new(),
            puerto: 8005,
            puerto_oyentes: 8000,
            mount: String::new(),
            bitrate: 128,
            dispositivo: None,
            canal_izq: 0,
            canal_der: 1,
            frecuencia: 44_100,
            mono: false,
            calidad: "alta".into(),
            nombre_emision: "Radio La Luz del Tiempo".into(),
            limitador: true,
            soltar_por_silencio: false,
            minutos_silencio: 3,
            grabar: false,
            mini_al_minimizar: true,
            iniciar_con_windows: true,
            retomar_transmision: true,
            cuenta_regresiva: 5,
        }
    }
}

/// Lo que ve la interfaz: nunca la contraseña, solo si existe.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AjustesVista {
    #[serde(flatten)]
    pub ajustes: Ajustes,
    pub contrasena_guardada: bool,
    /// Dónde se guardan las grabaciones
    pub carpeta_grabaciones: String,
}

/// Lo que manda la interfaz al guardar. `contrasena` vacía = conservar la actual.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AjustesEntrada {
    pub servidor: String,
    pub puerto: u16,
    pub puerto_oyentes: u16,
    pub mount: String,
    pub bitrate: u32,
    pub dispositivo: Option<String>,
    pub canal_izq: u16,
    pub canal_der: u16,
    pub frecuencia: u32,
    pub mono: bool,
    pub calidad: String,
    pub nombre_emision: String,
    pub limitador: bool,
    pub soltar_por_silencio: bool,
    pub minutos_silencio: u32,
    pub grabar: bool,
    pub mini_al_minimizar: bool,
    pub iniciar_con_windows: bool,
    pub retomar_transmision: bool,
    pub cuenta_regresiva: u32,
    pub contrasena: Option<String>,
}

fn archivo(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("ajustes.json"))
}

/// Documentos\Emisor La Luz del Tiempo\Grabaciones (se crea al usarla)
pub fn carpeta_grabaciones(app: &AppHandle) -> Result<PathBuf, String> {
    let docs = app.path().document_dir().map_err(|e| e.to_string())?;
    Ok(docs.join("Emisor La Luz del Tiempo").join("Grabaciones"))
}

/// Carpeta de datos de la app (historial)
pub fn carpeta_datos(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

pub fn cargar(app: &AppHandle) -> Ajustes {
    archivo(app)
        .ok()
        .and_then(|p| fs::read_to_string(p).ok())
        .and_then(|t| serde_json::from_str(&t).ok())
        .unwrap_or_default()
}

pub fn contrasena() -> Option<String> {
    keyring::Entry::new(SERVICIO_LLAVERO, CUENTA_LLAVERO)
        .ok()?
        .get_password()
        .ok()
        .filter(|p| !p.is_empty())
}

pub fn vista(app: &AppHandle) -> AjustesVista {
    AjustesVista {
        ajustes: cargar(app),
        contrasena_guardada: contrasena().is_some(),
        carpeta_grabaciones: carpeta_grabaciones(app).map(|p| p.display().to_string()).unwrap_or_default(),
    }
}

pub fn guardar(app: &AppHandle, e: AjustesEntrada) -> Result<(), String> {
    let servidor = e.servidor.trim().to_string();
    let mount = e.mount.trim().to_string();
    if servidor.is_empty() {
        return Err("Escribe la dirección del servidor de radio (por ejemplo 192.168.1.11).".into());
    }
    if !mount.starts_with('/') || mount.len() < 2 {
        return Err("El mount debe empezar con / (por ejemplo /principal).".into());
    }
    if e.puerto == 0 || e.puerto_oyentes == 0 {
        return Err("Los puertos deben estar entre 1 y 65535.".into());
    }
    if !BITRATES.contains(&e.bitrate) {
        return Err("El bitrate debe estar entre 64 y 320 kbps.".into());
    }
    if !FRECUENCIAS.contains(&e.frecuencia) {
        return Err("La frecuencia debe ser 44.1 o 48 kHz.".into());
    }
    if !CALIDADES.contains(&e.calidad.as_str()) {
        return Err("Calidad del codificador no válida.".into());
    }
    if !(1..=60).contains(&e.minutos_silencio) {
        return Err("Los minutos de silencio deben estar entre 1 y 60.".into());
    }
    if e.cuenta_regresiva > 10 {
        return Err("La cuenta regresiva es de 0 a 10 segundos.".into());
    }
    if e.canal_izq > 63 || e.canal_der > 63 {
        return Err("Canal de entrada no válido.".into());
    }
    let ajustes = Ajustes {
        servidor,
        puerto: e.puerto,
        puerto_oyentes: e.puerto_oyentes,
        mount,
        bitrate: e.bitrate,
        dispositivo: e.dispositivo.filter(|d| !d.is_empty()),
        canal_izq: e.canal_izq,
        canal_der: e.canal_der,
        frecuencia: e.frecuencia,
        mono: e.mono,
        calidad: e.calidad,
        nombre_emision: e.nombre_emision.trim().to_string(),
        limitador: e.limitador,
        soltar_por_silencio: e.soltar_por_silencio,
        minutos_silencio: e.minutos_silencio,
        grabar: e.grabar,
        mini_al_minimizar: e.mini_al_minimizar,
        iniciar_con_windows: e.iniciar_con_windows,
        retomar_transmision: e.retomar_transmision,
        cuenta_regresiva: e.cuenta_regresiva,
    };
    let json = serde_json::to_string_pretty(&ajustes).map_err(|e| e.to_string())?;
    fs::write(archivo(app)?, json).map_err(|e| e.to_string())?;

    if let Some(nueva) = e.contrasena.filter(|c| !c.is_empty()) {
        if nueva.len() < 8 {
            return Err("La contraseña del locutor tiene al menos 8 caracteres.".into());
        }
        keyring::Entry::new(SERVICIO_LLAVERO, CUENTA_LLAVERO)
            .and_then(|en| en.set_password(&nueva))
            .map_err(|e| format!("No se pudo guardar la contraseña en el llavero del sistema: {e}"))?;
    }
    Ok(())
}
