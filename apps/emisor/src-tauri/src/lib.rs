// Emisor de La Luz del Tiempo: comandos que llama la interfaz y avisos del motor hacia las ventanas.
pub mod ajustes;
pub mod audio;
pub mod candado;
pub mod cuenta;
pub mod emision;
pub mod historial;
pub mod icecast;
pub mod transmision;
mod ventanas;

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{mpsc, Arc};
use std::time::Duration;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

use crate::ajustes::{AjustesEntrada, AjustesVista};
use crate::candado::Candado;
use crate::emision::{Emision, EstadoEmision, Medidores, Notificador};
use crate::icecast::Sondeo;

/// Estado de la app: la transmisión en curso y un resumen que cualquier ventana puede pedir al abrirse.
#[derive(Default)]
pub struct Estado {
    pub emision: Candado<Option<Emision>>,
    /// Prueba de nivel de Configuración (captura sin transmitir); guarda su señal de parada
    pub prueba: Candado<Option<Arc<AtomicBool>>>,
    pub resumen: Candado<Resumen>,
    /// ¿Al aire, conectando o reconectando? Sin candado: lo consultan la ventana, la bandeja y el menú
    pub transmitiendo: AtomicBool,
    /// Se está saliendo al aire (evita dos inicios a la vez sin tener el candado tomado mientras tanto)
    pub iniciando: AtomicBool,
}
// Reglas para que la app nunca quede "No responde":
// 1. Ningún candado se mantiene tomado mientras se espera algo lento (audio, red) o el hilo de la ventana.
// 2. Los candados esperan como mucho 2 s (candado.rs): en el peor caso se salta una actualización.
// 3. Los comandos corren fuera del hilo de la ventana (async) y la ventana consulta `transmitiendo` sin candado.
// 4. La bandeja y el parpadeo se piden desde un hilo aparte: nadie espera a que la ventana los ejecute.

/// ¿Hay una transmisión en curso? (sin candados: seguro desde cualquier hilo, también el de la ventana)
pub fn esta_transmitiendo(app: &AppHandle) -> bool {
    app.state::<Estado>().transmitiendo.load(Ordering::SeqCst)
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
    /// Programa y conductor que corresponden ahora según la programación del panel
    pub programa: Option<String>,
    pub conductor: Option<String>,
    /// Lo que escribió el operador para mostrar al aire (tiene prioridad sobre la programación)
    pub titulo_programa: Option<String>,
    pub titulo_conductor: Option<String>,
    /// Título que se está mostrando a los oyentes
    pub titulo: Option<String>,
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

/// Lo que ven los oyentes como "canción actual" (web, app, reproductores).
/// Prioridad: lo que escribió el operador; si no, la programación del panel; si no, el nombre de la emisora.
pub fn titulo_deseado(r: &Resumen, nombre_emisora: &str) -> String {
    let manual = r.titulo_programa.is_some() || r.titulo_conductor.is_some();
    let programa = r.titulo_programa.clone().or_else(|| if manual { None } else { r.programa.clone() });
    let conductor = r.titulo_conductor.clone().or_else(|| if manual { None } else { r.conductor.clone() });
    match (programa, conductor) {
        (Some(p), Some(c)) => format!("{p} · {c}"),
        (Some(p), None) => p,
        (None, Some(c)) => format!("En vivo con {c}"),
        (None, None) => format!("En vivo · {nombre_emisora}"),
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
        self.state::<Estado>()
            .transmitiendo
            .store(matches!(estado, "al_aire" | "conectando" | "reconectando"), Ordering::SeqCst);
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
        }
        // Fuera del candado: la bandeja se actualiza en el hilo de la ventana, y si este hilo esperara
        // con el estado tomado mientras la ventana pide ese mismo estado, la app se colgaría.
        ventanas::actualizar_bandeja(self, estado);
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
        // Desde un hilo aparte: quien avisa (audio, red) nunca espera a la ventana
        let app = self.clone();
        std::thread::spawn(move || {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.request_user_attention(Some(tauri::UserAttentionType::Critical));
            }
        });
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
async fn ajustes_cargar(app: AppHandle) -> AjustesVista {
    ajustes::vista(&app)
}

#[tauri::command]
async fn ajustes_guardar(app: AppHandle, datos: AjustesEntrada) -> Result<(), String> {
    ajustes::guardar(&app, datos)?;
    sincronizar_autoinicio(&app);
    Ok(())
}

/// Enumerar el audio de Windows puede tardar: fuera del hilo de la ventana
#[tauri::command]
async fn dispositivos() -> Vec<audio::Dispositivo> {
    tauri::async_runtime::spawn_blocking(audio::dispositivos).await.unwrap_or_default()
}

/// Abre el dispositivo elegido solo para mostrar su nivel (evento "nivel_prueba"), sin transmitir.
#[tauri::command]
async fn prueba_iniciar(app: AppHandle, dispositivo: Option<String>, canal_izq: u16, canal_der: u16) -> Result<(), String> {
    // Abrir el audio puede tardar: fuera del hilo de la ventana
    en_segundo_plano(move || abrir_prueba(app, dispositivo, canal_izq, canal_der)).await
}

fn abrir_prueba(app: AppHandle, dispositivo: Option<String>, canal_izq: u16, canal_der: u16) -> Result<(), String> {
    let estado = app.state::<Estado>();
    if let Some(anterior) = estado.prueba.lock().map_err(|_| "Estado interno bloqueado.")?.take() {
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
        let (stop, app) = (stop.clone(), app.clone());
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
    // Si mientras se abría empezó otra prueba, la anterior se cierra
    if let Some(otra) = estado.prueba.lock().map_err(|_| "Estado interno bloqueado.")?.replace(stop) {
        otra.store(true, Ordering::Relaxed);
    }
    Ok(())
}

#[tauri::command]
async fn prueba_detener(app: AppHandle) {
    if let Ok(mut prueba) = app.state::<Estado>().prueba.lock() {
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

/// Salir al aire abre el audio y la red: nunca en el hilo de la ventana (la dejaría sin responder)
#[tauri::command]
async fn emision_iniciar(app: AppHandle) -> Result<(), String> {
    en_segundo_plano(move || iniciar_emision(&app)).await
}

fn iniciar_emision(app: &AppHandle) -> Result<(), String> {
    let estado = app.state::<Estado>();
    // Una emisión que terminó sola (p. ej. contraseña rechazada) ya no cuenta: se puede volver a salir al aire
    let al_aire = estado
        .emision
        .lock()
        .map_err(|_| "Estado interno bloqueado.")?
        .as_ref()
        .is_some_and(|e| !e.stop.load(Ordering::Relaxed));
    if al_aire {
        return Err("Ya estás al aire.".into());
    }
    if estado.iniciando.swap(true, Ordering::SeqCst) {
        return Err("Ya se está saliendo al aire.".into());
    }
    let resultado = preparar_y_salir(app);
    estado.iniciando.store(false, Ordering::SeqCst);
    resultado
}

fn preparar_y_salir(app: &AppHandle) -> Result<(), String> {
    let estado = app.state::<Estado>();
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
        r.conductor = emisora.as_ref().and_then(|e| e.programa.as_ref().and_then(|p| p.conductor.clone()));
        r.titulo = None;
    }
    let conexion = (ajustes.servidor.clone(), ajustes.puerto, ajustes.mount.clone(), clave.clone());
    let nombre = ajustes.nombre_emision.clone();
    match emision::iniciar(ajustes, clave, app.clone()) {
        Ok(e) => {
            mostrar_titulo(app.clone(), conexion, nombre, e.stop.clone());
            if let Some(em) = emisora {
                avisar_al_panel(app.clone(), em, e.stop.clone());
            }
            *estado.emision.lock().map_err(|_| "Estado interno bloqueado.")? = Some(e);
            Ok(())
        }
        Err(e) => {
            app.anotar("error", &e);
            Err(e)
        }
    }
}

/// Mientras se está al aire, pone el título (programa · conductor) como "canción actual" de la radio:
/// al conectar, al reconectar y cada vez que cambia. Funciona con cuenta del panel o con conexión manual.
fn mostrar_titulo(app: AppHandle, conexion: (String, u16, String, String), nombre: String, stop: Arc<AtomicBool>) {
    std::thread::spawn(move || {
        let (servidor, puerto, mount, clave) = conexion;
        let mut enviado: Option<String> = None;
        while !stop.load(Ordering::Relaxed) {
            let estado = app.state::<Estado>();
            let (deseado, cambio) = {
                let Ok(mut r) = estado.resumen.lock() else {
                    std::thread::sleep(Duration::from_millis(500));
                    continue;
                };
                if r.estado != "al_aire" {
                    enviado = None;
                    (None, false)
                } else {
                    let t = titulo_deseado(&r, &nombre);
                    let cambio = r.titulo.as_deref() != Some(t.as_str());
                    if cambio {
                        r.titulo = Some(t.clone());
                    }
                    (Some(t), cambio)
                }
            };
            // Avisos a las ventanas siempre sin candados tomados
            if let (Some(t), true) = (&deseado, cambio) {
                let _ = app.emit("titulo", t.clone());
            }
            if let Some(t) = deseado {
                if enviado.as_deref() != Some(t.as_str()) {
                    cuenta::enviar_titulo(&servidor, puerto, &mount, &clave, &t);
                    enviado = Some(t);
                }
            }
            std::thread::sleep(Duration::from_millis(500));
        }
    });
}

/// Mientras dura la transmisión: avisa al panel (al empezar, cada 60 s y al terminar) y trae el programa
/// que corresponde según la programación. Si el panel no responde, la transmisión sigue igual.
fn avisar_al_panel(app: AppHandle, emisora: cuenta::Emisora, stop: Arc<AtomicBool>) {
    let Some(avisos) = cuenta::Avisos::nuevo(&app) else { return };
    std::thread::spawn(move || {
        let mut id: Option<String> = None;
        let mut ultimo_aviso: Option<std::time::Instant> = None;
        let resumen = || app.state::<Estado>().resumen.lock().map(|r| r.clone()).unwrap_or_default();
        let actualizar_programa = |p: Option<cuenta::Programa>| {
            let (nombre, conductor) = p.map(|p| (Some(p.nombre), p.conductor)).unwrap_or((None, None));
            let cambio = match app.state::<Estado>().resumen.lock() {
                Ok(mut r) if r.programa != nombre || r.conductor != conductor => {
                    r.programa = nombre.clone();
                    r.conductor = conductor;
                    true
                }
                _ => false,
            };
            if cambio {
                let _ = app.emit("programa", nombre);
            }
        };
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
            // Cada 60 s: el panel da la transmisión por terminada tras 150 s sin aviso
            if ultimo_aviso.is_none_or(|t| t.elapsed() >= Duration::from_secs(60)) {
                ultimo_aviso = Some(std::time::Instant::now());
                let r = resumen();
                // Lo que se informa como programa es lo mismo que ven los oyentes
                let programa_al_aire = r.titulo_programa.clone().or(r.programa.clone());
                match &id {
                    None => {
                        if let Some((nuevo, p)) = avisos.abrir(&emisora.id, programa_al_aire.as_deref()) {
                            id = Some(nuevo);
                            actualizar_programa(p);
                        }
                    }
                    Some(actual) => {
                        let cuerpo = serde_json::json!({
                            "estado": if r.estado == "al_aire" { "al_aire" } else if r.estado == "reconectando" { "reconectando" } else { "conectando" },
                            "kbps": r.kbps,
                            "cortes": r.cortes,
                            "silencios": r.silencios,
                            "saturaciones": r.saturaciones,
                            "programa": programa_al_aire,
                        });
                        if let Some(p) = avisos.avisar(actual, &cuerpo) {
                            actualizar_programa(p);
                        }
                    }
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
async fn emision_detener(app: AppHandle) {
    detener_emision(&app.state::<Estado>());
}

#[tauri::command]
async fn silencio(app: AppHandle, activo: bool) -> Result<(), String> {
    let estado = app.state::<Estado>();
    let actual = estado.emision.lock().map_err(|_| "Estado interno bloqueado.")?;
    let hay = actual.as_ref().map(|e| e.silencio.store(activo, Ordering::Relaxed)).is_some();
    drop(actual);
    if hay {
        if let Ok(mut r) = estado.resumen.lock() {
            r.silencio = activo;
        }
        // Las dos ventanas (grande y mini) muestran el mismo botón
        let _ = app.emit("silencio", activo);
    }
    Ok(())
}

#[tauri::command]
async fn estado_actual(app: AppHandle) -> Resumen {
    app.state::<Estado>().resumen.lock().map(|r| r.clone()).unwrap_or_default()
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
async fn cuenta_estado(app: AppHandle) -> cuenta::CuentaVista {
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
    if esta_transmitiendo(&app) {
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

/// El operador define qué se muestra al aire. Vacío = usar la programación del panel.
#[tauri::command]
async fn titulo_definir(app: AppHandle, programa: String, conductor: String) -> Resumen {
    let limpio = |t: String| Some(t.trim().chars().take(120).collect::<String>()).filter(|t| !t.is_empty());
    let estado = app.state::<Estado>();
    let mut r = estado.resumen.lock().map(|r| r.clone()).unwrap_or_default();
    if let Ok(mut actual) = estado.resumen.lock() {
        actual.titulo_programa = limpio(programa);
        actual.titulo_conductor = limpio(conductor);
        r = actual.clone();
    }
    r
}

// ---------- Actualizaciones ----------

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Actualizacion {
    pub disponible: bool,
    pub actual: String,
    pub version: Option<String>,
    pub notas: Option<String>,
}

fn actualizador(app: &AppHandle) -> Result<tauri_plugin_updater::Updater, String> {
    use tauri_plugin_updater::UpdaterExt;
    // El panel publica las versiones; {{...}} lo completa el actualizador
    let url = format!(
        "{}/api/v1/public/emisor/actualizacion/{{{{target}}}}/{{{{arch}}}}/{{{{current_version}}}}",
        cuenta::url_panel(app)
    );
    let url = url.parse().map_err(|e| format!("Dirección del panel inválida: {e}"))?;
    app.updater_builder()
        .endpoints(vec![url])
        .map_err(|e| e.to_string())?
        .timeout(Duration::from_secs(20))
        .build()
        .map_err(|e| e.to_string())
}

async fn buscar_actualizacion(app: &AppHandle) -> Result<Actualizacion, String> {
    let actual = app.package_info().version.to_string();
    let u = actualizador(app)?
        .check()
        .await
        .map_err(|e| format!("No se pudo consultar las actualizaciones: {e}"))?;
    Ok(match u {
        Some(u) => Actualizacion { disponible: true, actual, version: Some(u.version.clone()), notas: u.body.clone() },
        None => Actualizacion { disponible: false, actual, version: None, notas: None },
    })
}

#[tauri::command]
async fn actualizacion_buscar(app: AppHandle) -> Result<Actualizacion, String> {
    buscar_actualizacion(&app).await
}

/// Descarga, verifica la firma e instala la versión nueva; después reinicia el emisor.
#[tauri::command]
async fn actualizacion_instalar(app: AppHandle) -> Result<(), String> {
    if esta_transmitiendo(&app) {
        return Err("Termina la transmisión antes de actualizar.".into());
    }
    let u = actualizador(&app)?
        .check()
        .await
        .map_err(|e| format!("No se pudo consultar las actualizaciones: {e}"))?
        .ok_or("Ya tienes la última versión.")?;
    app.anotar("inicio", &format!("Actualizando el emisor a la versión {}", u.version));
    u.download_and_install(|_, _| {}, || {}).await.map_err(|e| format!("No se pudo instalar la actualización: {e}"))?;
    app.restart();
}

#[tauri::command]
async fn emisora_elegir(app: AppHandle, id: String) -> Result<cuenta::CuentaVista, String> {
    if esta_transmitiendo(&app) {
        return Err("Termina la transmisión antes de cambiar de emisora.".into());
    }
    cuenta::elegir_emisora(&app, &id)
}

#[tauri::command]
async fn historial_leer(app: AppHandle) -> Vec<historial::Suceso> {
    carpeta_datos(&app).map(|d| historial::leer(&d, 500)).unwrap_or_default()
}

#[tauri::command]
async fn historial_borrar(app: AppHandle) {
    if let Some(d) = carpeta_datos(&app) {
        historial::borrar(&d);
    }
}

/// Abre la carpeta de grabaciones en el explorador de archivos.
#[tauri::command]
async fn abrir_grabaciones(app: AppHandle) -> Result<(), String> {
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
async fn ventana_mini(app: AppHandle, mostrar: bool) {
    if mostrar {
        ventanas::mostrar_mini(&app, true);
    } else {
        ventanas::mostrar_principal(&app);
    }
}

/// Espera sin bloquear el hilo de la ventana
async fn tokio_dormir(d: Duration) {
    let _ = tauri::async_runtime::spawn_blocking(move || std::thread::sleep(d)).await;
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
        // Una sola instancia: abrir el emisor otra vez trae al frente el que ya está abierto
        // (dos emisores pelearían por el audio y por el punto de transmisión)
        .plugin(tauri_plugin_single_instance::init(|app, _argumentos, _carpeta| {
            ventanas::mostrar_principal(app);
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![ARG_AUTOINICIO]),
        ))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(Estado::default())
        .setup(|app| {
            let app = app.handle();
            // Si algo falla por dentro, queda anotado en el historial (además de lo habitual)
            if let Some(dir) = carpeta_datos(app) {
                let previo = std::panic::take_hook();
                std::panic::set_hook(Box::new(move |info| {
                    historial::anotar(&dir, "error", &format!("Falla interna del emisor: {info}"));
                    previo(info);
                }));
            }
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
            // Al rato de abrir, se revisa si hay una versión nueva (sin molestar si no hay conexión)
            {
                let app = app.clone();
                tauri::async_runtime::spawn(async move {
                    tokio_dormir(Duration::from_secs(20)).await;
                    if let Ok(a) = buscar_actualizacion(&app).await {
                        if a.disponible {
                            let _ = app.emit("actualizacion", a);
                        }
                    }
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
            titulo_definir,
            actualizacion_buscar,
            actualizacion_instalar,
            historial_leer,
            historial_borrar,
            abrir_grabaciones,
            ventana_mini
        ])
        .run(tauri::generate_context!())
        .expect("no se pudo iniciar el emisor");
}
