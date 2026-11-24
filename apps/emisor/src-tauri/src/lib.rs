// Emisor de La Luz del Tiempo: comandos que llama la interfaz y avisos del motor hacia las ventanas.
pub mod ajustes;
pub mod audio;
pub mod cuenta;
pub mod emision;
pub mod historial;
pub mod icecast;
pub mod transmision;
mod ventanas;

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{mpsc, Arc, Mutex};
use std::time::Duration;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};

use crate::ajustes::{AjustesEntrada, AjustesVista};
use crate::emision::{Emision, EstadoEmision, Medidores, Notificador};
use crate::icecast::Sondeo;

/// Estado de la app: la transmisión en curso y un resumen que cualquier ventana puede pedir al abrirse.
#[derive(Default)]
pub struct Estado {
    pub emision: Mutex<Option<Emision>>,
    /// Prueba de nivel de Configuración (captura sin transmitir); guarda su señal de parada
    pub prueba: Mutex<Option<Arc<AtomicBool>>>,
    pub resumen: Mutex<Resumen>,
}

/// Foto del momento: lo que necesita una ventana recién abierta (la mini, por ejemplo) para dibujarse.
#[derive(Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Resumen {
    pub estado: String,
    pub mensaje: String,
    /// Cuándo salió al aire esta emisión (milisegundos desde 1970), para el reloj
    pub desde: Option<i64>,
    pub silencio: bool,
    pub oyentes: Option<u32>,
    /// MP3 que se está grabando
    pub grabacion: Option<String>,
    /// Contadores de esta emisión (se informan al panel)
    pub cortes: u32,
    pub silencios: u32,
    pub saturaciones: u32,
    pub kbps: u32,
    /// Programa que corresponde ahora según la programación del panel
    pub programa: Option<String>,
    #[serde(skip)]
    en_corte: bool,
    #[serde(skip)]
    estuvo_al_aire: bool,
}

impl Resumen {
    pub fn transmitiendo(&self) -> bool {
        matches!(self.estado.as_str(), "al_aire" | "conectando" | "reconectando")
    }
}

fn duracion(ms: i64) -> String {
    let s = ms.max(0) / 1000;
    format!("{:02}:{:02}:{:02}", s / 3600, (s % 3600) / 60, s % 60)
}

fn carpeta_datos(app: &AppHandle) -> Option<PathBuf> {
    ajustes::carpeta_datos(app).ok()
}

/// Marca en disco "el emisor está al aire". Si la app se cierra de golpe (apagón, reinicio de Windows)
/// la marca queda, y al volver a abrir se retoma la transmisión. Terminar o fallar la borra.
const MARCA_AL_AIRE: &str = "al-aire.marca";

fn marcar_al_aire(app: &AppHandle, al_aire: bool) {
    let Some(dir) = carpeta_datos(app) else { return };
    let ruta = dir.join(MARCA_AL_AIRE);
    if al_aire {
        let _ = std::fs::write(ruta, chrono::Local::now().to_rfc3339());
    } else {
        let _ = std::fs::remove_file(ruta);
    }
}

fn estaba_al_aire(app: &AppHandle) -> bool {
    carpeta_datos(app).is_some_and(|d| d.join(MARCA_AL_AIRE).exists())
}

/// Activa o quita el inicio automático con Windows según el ajuste.
fn sincronizar_autoinicio(app: &AppHandle) {
    use tauri_plugin_autostart::ManagerExt;
    let quiere = ajustes::cargar(app).iniciar_con_windows;
    let lanzador = app.autolaunch();
    if lanzador.is_enabled().unwrap_or(false) != quiere {
        let _ = if quiere { lanzador.enable() } else { lanzador.disable() };
    }
}

impl Notificador for AppHandle {
    fn estado(&self, estado: &str, mensaje: String) {
        let ahora = chrono::Local::now().timestamp_millis();
        // Qué anotar en el historial según el cambio de estado
        let mut anotacion: Option<(&str, String)> = None;
        if let Ok(mut r) = self.state::<Estado>().resumen.lock() {
            match estado {
                "al_aire" => {
                    marcar_al_aire(self, true);
                    if r.en_corte && r.estuvo_al_aire {
                        anotacion = Some(("reconectado", "Se recuperó la conexión con la radio".into()));
                    } else if !r.estuvo_al_aire {
                        anotacion = Some(("al_aire", "Al aire".into()));
                    }
                    r.en_corte = false;
                    r.estuvo_al_aire = true;
                    r.desde.get_or_insert(ahora);
                }
                "reconectando" => {
                    if !r.en_corte {
                        anotacion = Some(("corte", mensaje.clone()));
                    }
                    r.en_corte = true;
                }
                "error" => {
                    marcar_al_aire(self, false);
                    anotacion = Some(("error", mensaje.clone()));
                    r.desde = None;
                }
                "detenido" => {
                    marcar_al_aire(self, false);
                    let tiempo = r.desde.map(|d| format!(". Duración {}", duracion(ahora - d))).unwrap_or_default();
                    anotacion = Some(("fin", format!("{mensaje}{tiempo}")));
                    r.desde = None;
                    r.silencio = false;
                    r.en_corte = false;
                    r.estuvo_al_aire = false;
                }
                _ => {}
            }
            r.estado = estado.into();
            r.mensaje = mensaje.clone();
            ventanas::actualizar_bandeja(self, &r);
        }
        if let Some((tipo, texto)) = anotacion {
            self.anotar(tipo, &texto);
        }
        if estado == "error" {
            self.atencion();
        }
        let _ = self.emit("estado", EstadoEmision { estado: estado.into(), mensaje });
    }
    fn medidores(&self, m: Medidores) {
        if let Ok(mut r) = self.state::<Estado>().resumen.lock() {
            r.kbps = m.kbps;
        }
        let _ = self.emit("medidores", m);
    }
    fn oyentes(&self, sondeo: Sondeo) {
        if let Ok(mut r) = self.state::<Estado>().resumen.lock() {
            r.oyentes = sondeo.oyentes;
        }
        let _ = self.emit("oyentes", sondeo);
    }
    fn anotar(&self, tipo: &str, mensaje: &str) {
        if let Some(dir) = carpeta_datos(self) {
            historial::anotar(&dir, tipo, mensaje);
        }
        if let Ok(mut r) = self.state::<Estado>().resumen.lock() {
            match tipo {
                "corte" => r.cortes += 1,
                "silencio" => r.silencios += 1,
                "saturacion" => r.saturaciones += 1,
                _ => {}
            }
        }
        let _ = self.emit("historial", ());
    }
    fn atencion(&self) {
        if let Some(w) = self.get_webview_window("main") {
            let _ = w.request_user_attention(Some(tauri::UserAttentionType::Critical));
        }
    }
    fn carpeta_grabaciones(&self) -> Option<PathBuf> {
        ajustes::carpeta_grabaciones(self).ok()
    }
    fn grabacion(&self, ruta: Option<String>) {
        if let Ok(mut r) = self.state::<Estado>().resumen.lock() {
            r.grabacion = ruta.clone();
        }
        let _ = self.emit("grabacion", ruta);
    }
}

#[tauri::command]
fn ajustes_cargar(app: AppHandle) -> AjustesVista {
    ajustes::vista(&app)
}

#[tauri::command]
fn ajustes_guardar(app: AppHandle, datos: AjustesEntrada) -> Result<(), String> {
    ajustes::guardar(&app, datos)?;
    sincronizar_autoinicio(&app);
    Ok(())
}

#[tauri::command]
fn dispositivos() -> Vec<audio::Dispositivo> {
    audio::dispositivos()
}

/// Abre el dispositivo elegido solo para mostrar su nivel (evento "nivel_prueba"), sin transmitir.
#[tauri::command]
fn prueba_iniciar(
    app: AppHandle,
    estado: State<'_, Estado>,
    dispositivo: Option<String>,
    canal_izq: u16,
    canal_der: u16,
) -> Result<(), String> {
    let mut prueba = estado.prueba.lock().map_err(|_| "Estado interno bloqueado.")?;
    if let Some(anterior) = prueba.take() {
        anterior.store(true, Ordering::Relaxed);
    }
    let stop = Arc::new(AtomicBool::new(false));
    let medicion = Arc::new(audio::Medicion::default());
    let captura = audio::Captura {
        silencio: Arc::new(AtomicBool::new(false)),
        medicion: medicion.clone(),
        limitador: false,
        stop: stop.clone(),
        frecuencia: 44_100,
        canal_izq: canal_izq as usize,
        canal_der: canal_der as usize,
    };
    // El audio no va a ningún lado: el receptor se descarta y la captura ignora el canal cerrado
    let (pcm_tx, _) = mpsc::sync_channel::<Vec<i16>>(1);
    let (informe_tx, informe_rx) = mpsc::sync_channel(1);
    std::thread::spawn(move || audio::correr_captura(dispositivo.filter(|d| !d.is_empty()), captura, pcm_tx, informe_tx));
    informe_rx.recv().map_err(|_| "El dispositivo no respondió.".to_string())??;
    {
        let stop = stop.clone();
        std::thread::spawn(move || {
            while !stop.load(Ordering::Relaxed) {
                let l = medicion.leer();
                let _ = app.emit(
                    "nivel_prueba",
                    Medidores { izq: l.izq, der: l.der, recortes: l.recortes, ..Default::default() },
                );
                std::thread::sleep(Duration::from_millis(80));
            }
            let _ = app.emit("nivel_prueba", Medidores::default());
        });
    }
    *prueba = Some(stop);
    Ok(())
}

#[tauri::command]
fn prueba_detener(estado: State<'_, Estado>) {
    if let Ok(mut prueba) = estado.prueba.lock() {
        if let Some(stop) = prueba.take() {
            stop.store(true, Ordering::Relaxed);
        }
    }
}

/// Ajustes con los que se sale al aire y la contraseña del locutor.
/// Con sesión del panel, la conexión es la de la emisora elegida; sin sesión, la configurada a mano.
fn ajustes_efectivos(app: &AppHandle) -> Result<(ajustes::Ajustes, String, Option<cuenta::Emisora>), String> {
    let mut a = ajustes::cargar(app);
    if cuenta::con_sesion() {
        let em = cuenta::emisora_elegida(app).ok_or("Elige una emisora en la pantalla de Transmisión.")?;
        let clave = cuenta::contrasena_emisora(&em.id)
            .ok_or("Falta la contraseña de esta emisora. Pulsa «Actualizar emisoras» con conexión al panel.")?;
        a.servidor = em.servidor.clone();
        a.puerto = em.puerto;
        a.mount = em.mount.clone();
        a.puerto_oyentes = em.puerto_oyentes;
        a.mount_oyentes = em.mount_oyentes.clone();
        a.nombre_emision = em.nombre.clone();
        return Ok((a, clave, Some(em)));
    }
    if a.servidor.is_empty() || a.mount.is_empty() {
        return Err("Inicia sesión o completa la conexión manual en Configuración.".into());
    }
    let clave = ajustes::contrasena().ok_or("Falta la contraseña del locutor. Guárdala en Configuración.")?;
    Ok((a, clave, None))
}

#[tauri::command]
fn emision_iniciar(app: AppHandle) -> Result<(), String> {
    iniciar_emision(&app)
}

fn iniciar_emision(app: &AppHandle) -> Result<(), String> {
    let estado = app.state::<Estado>();
    let mut actual = estado.emision.lock().map_err(|_| "Estado interno bloqueado.")?;
    // Una emisión que terminó sola (p. ej. contraseña rechazada) ya no cuenta: se puede volver a salir al aire
    if actual.as_ref().is_some_and(|e| !e.stop.load(Ordering::Relaxed)) {
        return Err("Ya estás al aire.".into());
    }
    let (ajustes, clave, emisora) = ajustes_efectivos(app)?;
    // Si la prueba de nivel sigue abierta, se cierra antes de salir al aire
    if let Ok(mut prueba) = estado.prueba.lock() {
        if let Some(stop) = prueba.take() {
            stop.store(true, Ordering::Relaxed);
        }
    }
    let fuente = ajustes
        .dispositivo
        .as_deref()
        .map(|d| d.trim_start_matches("entrada:").trim_start_matches("salida:").to_string())
        .unwrap_or_else(|| "micrófono predeterminado".into());
    app.anotar(
        "inicio",
        &format!("Salida al aire hacia {}{} a {} kbps desde {fuente}", ajustes.servidor, ajustes.mount, ajustes.bitrate),
    );
    if let Ok(mut r) = estado.resumen.lock() {
        r.silencio = false;
        r.cortes = 0;
        r.silencios = 0;
        r.saturaciones = 0;
        r.kbps = 0;
        r.programa = emisora.as_ref().and_then(|e| e.programa.as_ref().map(|p| p.nombre.clone()));
    }
    let conexion = (ajustes.servidor.clone(), ajustes.puerto, ajustes.mount.clone(), clave.clone());
    match emision::iniciar(ajustes, clave, app.clone()) {
        Ok(e) => {
            if let Some(em) = emisora {
                avisar_al_panel(app.clone(), em, conexion, e.stop.clone());
            }
            *actual = Some(e);
            Ok(())
        }
        Err(e) => {
            app.anotar("error", &e);
            Err(e)
        }
    }
}

/// Mientras dura la transmisión: avisa al panel (al empezar, cada 30 s y al terminar) y pone el nombre
/// del programa como título de la radio. Si el panel no responde, la transmisión sigue igual.
fn avisar_al_panel(app: AppHandle, emisora: cuenta::Emisora, conexion: (String, u16, String, String), stop: Arc<AtomicBool>) {
    let Some(avisos) = cuenta::Avisos::nuevo(&app) else { return };
    std::thread::spawn(move || {
        let (servidor, puerto, mount, clave) = conexion;
        let mut id: Option<String> = None;
        let mut programa: Option<String> = emisora.programa.as_ref().map(|p| p.nombre.clone());
        let mut titulo_enviado: Option<String> = None;
        let mut ultimo_aviso: Option<std::time::Instant> = None;
        let resumen = || app.state::<Estado>().resumen.lock().map(|r| r.clone()).unwrap_or_default();
        loop {
            if stop.load(Ordering::Relaxed) {
                // Se espera el mensaje final (p. ej. "Se soltó el aire al AutoDJ…") para el cierre
                for _ in 0..10 {
                    if !resumen().transmitiendo() {
                        break;
                    }
                    std::thread::sleep(Duration::from_millis(200));
                }
                if let Some(id) = &id {
                    avisos.cerrar(id, &resumen().mensaje);
                }
                break;
            }
            if ultimo_aviso.is_none_or(|t| t.elapsed() >= Duration::from_secs(30)) {
                ultimo_aviso = Some(std::time::Instant::now());
                match &id {
                    None => {
                        if let Some((nuevo, p)) = avisos.abrir(&emisora.id, programa.as_deref()) {
                            id = Some(nuevo);
                            if let Some(p) = p {
                                programa = Some(p.nombre);
                            }
                        }
                    }
                    Some(actual) => {
                        let r = resumen();
                        let cuerpo = serde_json::json!({
                            "estado": if r.estado == "al_aire" { "al_aire" } else if r.estado == "reconectando" { "reconectando" } else { "conectando" },
                            "kbps": r.kbps,
                            "cortes": r.cortes,
                            "silencios": r.silencios,
                            "saturaciones": r.saturaciones,
                        });
                        if let Some(p) = avisos.avisar(actual, &cuerpo) {
                            programa = p.map(|p| p.nombre);
                        }
                    }
                }
                if let Ok(mut r) = app.state::<Estado>().resumen.lock() {
                    if r.programa != programa {
                        r.programa = programa.clone();
                        let _ = app.emit("programa", programa.clone());
                    }
                }
            }
            // Título de la radio: al quedar al aire y cada vez que cambia el programa (o tras reconectar)
            let al_aire = resumen().estado == "al_aire";
            if !al_aire {
                titulo_enviado = None;
            } else {
                let deseado = programa.clone().unwrap_or_else(|| format!("En vivo · {}", emisora.nombre));
                if titulo_enviado.as_deref() != Some(&deseado) {
                    cuenta::enviar_titulo(&servidor, puerto, &mount, &clave, &deseado);
                    titulo_enviado = Some(deseado);
                }
            }
            std::thread::sleep(Duration::from_millis(500));
        }
    });
}

fn detener_emision(estado: &Estado) {
    if let Ok(mut actual) = estado.emision.lock() {
        if let Some(e) = actual.take() {
            e.stop.store(true, Ordering::Relaxed);
        }
    }
}

#[tauri::command]
fn emision_detener(estado: State<'_, Estado>) {
    detener_emision(&estado);
}

#[tauri::command]
fn silencio(app: AppHandle, activo: bool, estado: State<'_, Estado>) -> Result<(), String> {
    let actual = estado.emision.lock().map_err(|_| "Estado interno bloqueado.")?;
    if let Some(e) = actual.as_ref() {
        e.silencio.store(activo, Ordering::Relaxed);
        if let Ok(mut r) = estado.resumen.lock() {
            r.silencio = activo;
        }
        // Las dos ventanas (grande y mini) muestran el mismo botón
        let _ = app.emit("silencio", activo);
    }
    Ok(())
}

#[tauri::command]
fn estado_actual(estado: State<'_, Estado>) -> Resumen {
    estado.resumen.lock().map(|r| r.clone()).unwrap_or_default()
}

#[tauri::command]
async fn probar_servidor(app: AppHandle) -> Sondeo {
    tauri::async_runtime::spawn_blocking(move || {
        let a = match ajustes_efectivos(&app) {
            Ok((a, _, _)) => a,
            Err(_) => ajustes::cargar(&app),
        };
        if a.servidor.is_empty() {
            return Sondeo { alcanzable: false, mount_en_linea: false, oyentes: None };
        }
        icecast::sondear(&a.servidor, a.puerto_oyentes, a.mount_oyentes.as_deref().unwrap_or(&a.mount))
    })
    .await
    .unwrap_or(Sondeo { alcanzable: false, mount_en_linea: false, oyentes: None })
}

// ---------- Cuenta del panel ----------

/// Las llamadas a la red no deben congelar la ventana: se hacen en un hilo aparte
async fn en_segundo_plano<T: Send + 'static>(f: impl FnOnce() -> Result<T, String> + Send + 'static) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(f).await.map_err(|e| e.to_string())?
}

#[tauri::command]
fn cuenta_estado(app: AppHandle) -> cuenta::CuentaVista {
    cuenta::vista(&app, false)
}

#[tauri::command]
async fn cuenta_iniciar(app: AppHandle, api_url: String, email: String, contrasena: String) -> Result<cuenta::CuentaVista, String> {
    en_segundo_plano(move || {
        let v = cuenta::iniciar_sesion(&app, &api_url, &email, &contrasena)?;
        app.anotar("inicio", &format!("Sesión iniciada en el panel como {}", v.cuenta.email));
        Ok(v)
    })
    .await
}

#[tauri::command]
async fn cuenta_cerrar(app: AppHandle) -> Result<(), String> {
    if app.state::<Estado>().resumen.lock().map(|r| r.transmitiendo()).unwrap_or(false) {
        return Err("Termina la transmisión antes de cerrar la sesión.".into());
    }
    en_segundo_plano(move || {
        cuenta::cerrar_sesion(&app);
        Ok(())
    })
    .await
}

#[tauri::command]
async fn emisoras_actualizar(app: AppHandle) -> Result<cuenta::CuentaVista, String> {
    en_segundo_plano(move || cuenta::actualizar_emisoras(&app)).await
}

#[tauri::command]
fn emisora_elegir(app: AppHandle, id: String) -> Result<cuenta::CuentaVista, String> {
    if app.state::<Estado>().resumen.lock().map(|r| r.transmitiendo()).unwrap_or(false) {
        return Err("Termina la transmisión antes de cambiar de emisora.".into());
    }
    cuenta::elegir_emisora(&app, &id)
}

#[tauri::command]
fn historial_leer(app: AppHandle) -> Vec<historial::Suceso> {
    carpeta_datos(&app).map(|d| historial::leer(&d, 500)).unwrap_or_default()
}

#[tauri::command]
fn historial_borrar(app: AppHandle) {
    if let Some(d) = carpeta_datos(&app) {
        historial::borrar(&d);
    }
}

/// Abre la carpeta de grabaciones en el explorador de archivos.
#[tauri::command]
fn abrir_grabaciones(app: AppHandle) -> Result<(), String> {
    let carpeta = ajustes::carpeta_grabaciones(&app)?;
    std::fs::create_dir_all(&carpeta).map_err(|e| e.to_string())?;
    #[cfg(target_os = "windows")]
    let programa = "explorer";
    #[cfg(target_os = "macos")]
    let programa = "open";
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    let programa = "xdg-open";
    std::process::Command::new(programa).arg(&carpeta).spawn().map_err(|e| e.to_string())?;
    Ok(())
}

/// Cambia entre la ventana grande y la mini.
#[tauri::command]
fn ventana_mini(app: AppHandle, mostrar: bool) {
    if mostrar {
        ventanas::mostrar_mini(&app, true);
    } else {
        ventanas::mostrar_principal(&app);
    }
}

/// Argumento con el que Windows abre el emisor al iniciar sesión
const ARG_AUTOINICIO: &str = "--autoinicio";

/// La app se cerró de golpe estando al aire: se vuelve a salir al aire sola, con la ventana mini visible.
fn retomar_transmision(app: AppHandle) {
    std::thread::spawn(move || {
        // Unos segundos para que Windows termine de levantar la red y el audio
        std::thread::sleep(Duration::from_secs(5));
        app.anotar("inicio", "Retomando la transmisión: el emisor se cerró mientras estaba al aire");
        ventanas::mostrar_mini(&app, false);
        if let Err(e) = iniciar_emision(&app) {
            marcar_al_aire(&app, false);
            ventanas::mostrar_principal(&app);
            app.atencion();
            app.estado("error", format!("No se pudo retomar la transmisión: {e}"));
        }
    });
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![ARG_AUTOINICIO]),
        ))
        .manage(Estado::default())
        .setup(|app| {
            let app = app.handle();
            ventanas::preparar(app)?;
            sincronizar_autoinicio(app);
            let con_windows = std::env::args().any(|a| a == ARG_AUTOINICIO);
            let retomar = estaba_al_aire(app) && ajustes::cargar(app).retomar_transmision;
            if con_windows || retomar {
                // Abierta por Windows o para retomar: no estorbar con la ventana grande
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.hide();
                }
            }
            if cuenta::con_sesion() {
                let app = app.clone();
                std::thread::spawn(move || {
                    let _ = cuenta::actualizar_emisoras(&app);
                    let _ = app.emit("cuenta", ());
                });
            }
            if retomar {
                retomar_transmision(app.clone());
            } else {
                marcar_al_aire(app, false);
            }
            Ok(())
        })
        .on_window_event(ventanas::evento_ventana)
        .invoke_handler(tauri::generate_handler![
            ajustes_cargar,
            ajustes_guardar,
            dispositivos,
            prueba_iniciar,
            prueba_detener,
            emision_iniciar,
            emision_detener,
            silencio,
            estado_actual,
            probar_servidor,
            cuenta_estado,
            cuenta_iniciar,
            cuenta_cerrar,
            emisoras_actualizar,
            emisora_elegir,
            historial_leer,
            historial_borrar,
            abrir_grabaciones,
            ventana_mini
        ])
        .run(tauri::generate_context!())
        .expect("no se pudo iniciar el emisor");
}
