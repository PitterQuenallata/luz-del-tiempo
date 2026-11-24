// Emisor de La Luz del Tiempo: comandos que llama la interfaz.
pub mod ajustes;
pub mod audio;
pub mod emision;
pub mod icecast;
pub mod transmision;

use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, State};

use crate::ajustes::{AjustesEntrada, AjustesVista};
use crate::emision::Emision;

/// Estado de la transmisión en curso (None si no está al aire).
#[derive(Default)]
pub struct Estado {
    pub emision: Mutex<Option<Emision>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EstadoActual {
    pub al_aire: bool,
    pub silencio: bool,
}

#[tauri::command]
fn ajustes_cargar(app: AppHandle) -> AjustesVista {
    ajustes::vista(&app)
}

#[tauri::command]
fn ajustes_guardar(app: AppHandle, datos: AjustesEntrada) -> Result<(), String> {
    ajustes::guardar(&app, datos)
}

#[tauri::command]
fn dispositivos() -> Vec<String> {
    audio::dispositivos()
}

#[tauri::command]
fn emision_iniciar(app: AppHandle, estado: State<'_, Estado>) -> Result<(), String> {
    let mut actual = estado.emision.lock().map_err(|_| "Estado interno bloqueado.")?;
    if actual.is_some() {
        return Err("Ya estás al aire.".into());
    }
    let ajustes = ajustes::cargar(&app);
    if ajustes.servidor.is_empty() || ajustes.mount.is_empty() {
        return Err("Completa la configuración antes de salir al aire.".into());
    }
    let clave = ajustes::contrasena().ok_or("Falta la contraseña del locutor. Guárdala en Configuración.")?;
    *actual = Some(emision::iniciar(ajustes, clave, app)?);
    Ok(())
}

#[tauri::command]
fn emision_detener(estado: State<'_, Estado>) -> Result<(), String> {
    let mut actual = estado.emision.lock().map_err(|_| "Estado interno bloqueado.")?;
    if let Some(e) = actual.take() {
        e.stop.store(true, std::sync::atomic::Ordering::Relaxed);
    }
    Ok(())
}

#[tauri::command]
fn silencio(activo: bool, estado: State<'_, Estado>) -> Result<(), String> {
    let actual = estado.emision.lock().map_err(|_| "Estado interno bloqueado.")?;
    if let Some(e) = actual.as_ref() {
        e.silencio.store(activo, std::sync::atomic::Ordering::Relaxed);
    }
    Ok(())
}

#[tauri::command]
fn estado_actual(estado: State<'_, Estado>) -> EstadoActual {
    let actual = estado.emision.lock().ok();
    match actual.as_ref().and_then(|g| g.as_ref()) {
        Some(e) => EstadoActual {
            al_aire: !e.stop.load(std::sync::atomic::Ordering::Relaxed),
            silencio: e.silencio.load(std::sync::atomic::Ordering::Relaxed),
        },
        None => EstadoActual { al_aire: false, silencio: false },
    }
}

#[tauri::command]
fn probar_servidor(app: AppHandle) -> icecast::Sondeo {
    let a = ajustes::cargar(&app);
    if a.servidor.is_empty() {
        return icecast::Sondeo { alcanzable: false, mount_en_linea: false, oyentes: None };
    }
    icecast::sondear(&a.servidor, a.puerto_oyentes, &a.mount)
}

pub fn run() {
    tauri::Builder::default()
        .manage(Estado::default())
        .invoke_handler(tauri::generate_handler![
            ajustes_cargar,
            ajustes_guardar,
            dispositivos,
            emision_iniciar,
            emision_detener,
            silencio,
            estado_actual,
            probar_servidor
        ])
        .run(tauri::generate_context!())
        .expect("no se pudo iniciar el emisor");
}
