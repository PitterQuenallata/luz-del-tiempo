// Cuenta del panel: el locutor inicia sesión con su usuario y el emisor recibe las emisoras en las que puede
// transmitir, con los datos de conexión. Así nadie escribe IP, puertos ni contraseñas de la radio.
//
// Qué se guarda y dónde:
// - Token de la sesión y contraseña de cada emisora: llavero del sistema (Credential Manager / Keychain).
// - Lista de emisoras (sin contraseñas): cuenta.json en la carpeta de datos. Si la API no responde,
//   se usa esta copia y se puede salir al aire igual: la API nunca impide una transmisión.
use std::fs;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::AppHandle;

use crate::ajustes;

const SERVICIO_LLAVERO: &str = "org.laluzdeltiempo.emisor";
const CUENTA_TOKEN: &str = "sesion-panel";
const ARCHIVO: &str = "cuenta.json";

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Programa {
    pub nombre: String,
    pub conductor: Option<String>,
}

/// Una emisora en la que el usuario puede transmitir (la contraseña va aparte, en el llavero).
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Emisora {
    pub id: String,
    pub slug: String,
    pub nombre: String,
    pub principal: bool,
    pub servidor: String,
    pub puerto: u16,
    pub mount: String,
    pub puerto_oyentes: u16,
    pub mount_oyentes: Option<String>,
    pub programa: Option<Programa>,
}

/// Lo que se guarda en cuenta.json
#[derive(Serialize, Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct Cuenta {
    /// Dirección del panel, p. ej. https://api.laluzdeltiempo.org o http://192.168.1.11:4000
    pub api_url: String,
    pub nombre: String,
    pub email: String,
    pub emisoras: Vec<Emisora>,
    /// Emisora elegida para salir al aire
    pub emisora_id: Option<String>,
    /// Cuándo se actualizó la lista por última vez (ISO 8601)
    pub actualizada: Option<String>,
}

/// Lo que ve la interfaz
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CuentaVista {
    pub sesion: bool,
    #[serde(flatten)]
    pub cuenta: Cuenta,
    /// La última consulta a la API falló: se muestra la copia guardada
    pub sin_conexion: bool,
}

fn llavero(cuenta: &str) -> Option<keyring::Entry> {
    keyring::Entry::new(SERVICIO_LLAVERO, cuenta).ok()
}

fn token() -> Option<String> {
    llavero(CUENTA_TOKEN)?.get_password().ok().filter(|t| !t.is_empty())
}

pub fn contrasena_emisora(id: &str) -> Option<String> {
    llavero(&format!("emisora:{id}"))?.get_password().ok().filter(|t| !t.is_empty())
}

pub fn cargar(app: &AppHandle) -> Cuenta {
    ajustes::carpeta_datos(app)
        .ok()
        .and_then(|d| fs::read_to_string(d.join(ARCHIVO)).ok())
        .and_then(|t| serde_json::from_str(&t).ok())
        .unwrap_or_default()
}

fn guardar(app: &AppHandle, c: &Cuenta) -> Result<(), String> {
    let dir = ajustes::carpeta_datos(app)?;
    let json = serde_json::to_string_pretty(c).map_err(|e| e.to_string())?;
    fs::write(dir.join(ARCHIVO), json).map_err(|e| e.to_string())
}

/// Hay sesión iniciada (token guardado)
pub fn con_sesion() -> bool {
    token().is_some()
}

/// Emisora elegida (si hay sesión): la que se usa al salir al aire
pub fn emisora_elegida(app: &AppHandle) -> Option<Emisora> {
    if !con_sesion() {
        return None;
    }
    let c = cargar(app);
    let id = c.emisora_id.clone()?;
    c.emisoras.into_iter().find(|e| e.id == id)
}

pub fn vista(app: &AppHandle, sin_conexion: bool) -> CuentaVista {
    CuentaVista { sesion: con_sesion(), cuenta: cargar(app), sin_conexion }
}

fn cliente() -> Result<reqwest::blocking::Client, String> {
    reqwest::blocking::Client::builder()
        .connect_timeout(Duration::from_secs(5))
        .timeout(Duration::from_secs(10))
        .user_agent(format!("EmisorLuzDelTiempo/{}", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| e.to_string())
}

/// "192.168.1.11:4000" → "http://192.168.1.11:4000"; sin barra final
pub fn normalizar_url(url: &str) -> String {
    let u = url.trim().trim_end_matches('/');
    if u.starts_with("http://") || u.starts_with("https://") {
        u.to_string()
    } else {
        format!("http://{u}")
    }
}

/// Mensaje de error de la API (campo "message") o uno según el código
fn mensaje_error(r: reqwest::blocking::Response) -> String {
    let codigo = r.status().as_u16();
    let cuerpo: Option<Value> = r.json().ok();
    if let Some(m) = cuerpo.as_ref().and_then(|v| v["message"].as_str()) {
        return m.to_string();
    }
    match codigo {
        401 => "La sesión terminó. Vuelve a iniciar sesión.".into(),
        403 => "Tu usuario no tiene permiso para transmitir.".into(),
        _ => format!("El panel respondió {codigo}."),
    }
}

fn sin_red(api: &str, e: reqwest::Error) -> String {
    if e.is_timeout() || e.is_connect() {
        format!("No hay conexión con el panel en {api}. Revisa la dirección y la red.")
    } else {
        format!("No se pudo hablar con el panel: {e}")
    }
}

/// Inicia sesión con un usuario del panel y trae sus emisoras.
pub fn iniciar_sesion(app: &AppHandle, api_url: &str, email: &str, contrasena: &str) -> Result<CuentaVista, String> {
    let api = normalizar_url(api_url);
    let cli = cliente()?;
    let r = cli
        .post(format!("{api}/api/auth/sign-in/email"))
        .json(&serde_json::json!({ "email": email.trim(), "password": contrasena }))
        .send()
        .map_err(|e| sin_red(&api, e))?;
    if r.status().as_u16() == 401 || r.status().as_u16() == 400 {
        return Err("Correo o contraseña incorrectos.".into());
    }
    if !r.status().is_success() {
        return Err(mensaje_error(r));
    }
    let token = r
        .headers()
        .get("set-auth-token")
        .and_then(|v| v.to_str().ok())
        .map(str::to_string)
        .ok_or("El panel no entregó la sesión. Actualiza la API del panel (falta el complemento bearer).")?;

    // Quién es y si puede transmitir
    let yo = cli.get(format!("{api}/api/v1/emisor/yo")).bearer_auth(&token).send().map_err(|e| sin_red(&api, e))?;
    if !yo.status().is_success() {
        return Err(mensaje_error(yo));
    }
    let yo: Value = yo.json().map_err(|e| e.to_string())?;

    llavero(CUENTA_TOKEN)
        .ok_or("No se pudo abrir el llavero del sistema.")?
        .set_password(&token)
        .map_err(|e| format!("No se pudo guardar la sesión en el llavero: {e}"))?;
    let anterior = cargar(app);
    let cuenta = Cuenta {
        api_url: api,
        nombre: yo["nombre"].as_str().unwrap_or_default().to_string(),
        email: yo["email"].as_str().unwrap_or_default().to_string(),
        emisora_id: anterior.emisora_id,
        ..Default::default()
    };
    guardar(app, &cuenta)?;
    actualizar_emisoras(app)
}

/// Pide a la API las emisoras del usuario. Sin conexión, devuelve la copia guardada (sin_conexion = true).
pub fn actualizar_emisoras(app: &AppHandle) -> Result<CuentaVista, String> {
    let Some(tok) = token() else { return Ok(vista(app, false)) };
    let mut cuenta = cargar(app);
    let r = cliente()?.get(format!("{}/api/v1/emisor/emisoras", cuenta.api_url)).bearer_auth(&tok).send();
    let r = match r {
        Ok(r) => r,
        Err(_) => return Ok(vista(app, true)),
    };
    if r.status().as_u16() == 401 {
        cerrar_sesion(app);
        return Err("La sesión terminó. Vuelve a iniciar sesión.".into());
    }
    if !r.status().is_success() {
        return Err(mensaje_error(r));
    }
    let datos: Value = r.json().map_err(|e| e.to_string())?;
    let mut emisoras = Vec::new();
    for e in datos["emisoras"].as_array().cloned().unwrap_or_default() {
        let Some(id) = e["id"].as_str() else { continue };
        if let (Some(clave), Some(entrada)) = (e["contrasena"].as_str(), llavero(&format!("emisora:{id}"))) {
            let _ = entrada.set_password(clave);
        }
        // Sin la contraseña en el objeto, el resto se deserializa como Emisora
        if let Ok(em) = serde_json::from_value::<Emisora>(e.clone()) {
            emisoras.push(em);
        }
    }
    // Si la elegida ya no está (le quitaron el permiso), se elige la principal
    if !cuenta.emisora_id.as_ref().is_some_and(|id| emisoras.iter().any(|e| &e.id == id)) {
        cuenta.emisora_id = emisoras.first().map(|e| e.id.clone());
    }
    // Contraseñas de emisoras que ya no corresponden: fuera del llavero
    for vieja in cuenta.emisoras.iter().filter(|v| !emisoras.iter().any(|e| e.id == v.id)) {
        if let Some(entrada) = llavero(&format!("emisora:{}", vieja.id)) {
            let _ = entrada.delete_credential();
        }
    }
    cuenta.emisoras = emisoras;
    cuenta.actualizada = Some(chrono::Local::now().to_rfc3339());
    guardar(app, &cuenta)?;
    Ok(vista(app, false))
}

pub fn elegir_emisora(app: &AppHandle, id: &str) -> Result<CuentaVista, String> {
    let mut cuenta = cargar(app);
    if !cuenta.emisoras.iter().any(|e| e.id == id) {
        return Err("Esa emisora no está en tu lista.".into());
    }
    cuenta.emisora_id = Some(id.to_string());
    guardar(app, &cuenta)?;
    Ok(vista(app, false))
}

/// Cierra la sesión: avisa a la API (si responde) y borra token, emisoras y sus contraseñas.
pub fn cerrar_sesion(app: &AppHandle) {
    let cuenta = cargar(app);
    if let (Some(tok), Ok(cli)) = (token(), cliente()) {
        let _ = cli.post(format!("{}/api/auth/sign-out", cuenta.api_url)).bearer_auth(tok).json(&serde_json::json!({})).send();
    }
    if let Some(e) = llavero(CUENTA_TOKEN) {
        let _ = e.delete_credential();
    }
    for em in &cuenta.emisoras {
        if let Some(e) = llavero(&format!("emisora:{}", em.id)) {
            let _ = e.delete_credential();
        }
    }
    // Se conserva la dirección del panel para el próximo inicio de sesión
    let _ = guardar(app, &Cuenta { api_url: cuenta.api_url, ..Default::default() });
}

// ---------- Avisos de transmisión a la API ----------

/// Cliente para los avisos de una transmisión. Todos los errores se ignoran: la API no puede cortar el aire.
pub struct Avisos {
    api: String,
    token: String,
    cli: reqwest::blocking::Client,
}

impl Avisos {
    pub fn nuevo(app: &AppHandle) -> Option<Self> {
        let token = token()?;
        let api = cargar(app).api_url;
        if api.is_empty() {
            return None;
        }
        Some(Self { api, token, cli: cliente().ok()? })
    }

    /// Abre la transmisión en la API; devuelve su id y el programa del momento
    pub fn abrir(&self, emisora_id: &str, programa: Option<&str>) -> Option<(String, Option<Programa>)> {
        let cuerpo = serde_json::json!({
            "emisoraId": emisora_id,
            "equipo": nombre_equipo(),
            "version": env!("CARGO_PKG_VERSION"),
            "sistema": std::env::consts::OS,
            "programa": programa,
        });
        let r = self.cli.post(format!("{}/api/v1/emisor/transmisiones", self.api)).bearer_auth(&self.token).json(&cuerpo).send().ok()?;
        if !r.status().is_success() {
            return None;
        }
        let v: Value = r.json().ok()?;
        let id = v["id"].as_str()?.to_string();
        Some((id, serde_json::from_value(v["programa"].clone()).ok()))
    }

    /// Aviso periódico; devuelve el programa que corresponde ahora (None si la API no respondió)
    pub fn avisar(&self, id: &str, cuerpo: &Value) -> Option<Option<Programa>> {
        let r = self.cli.put(format!("{}/api/v1/emisor/transmisiones/{id}", self.api)).bearer_auth(&self.token).json(cuerpo).send().ok()?;
        if !r.status().is_success() {
            return None;
        }
        let v: Value = r.json().ok()?;
        Some(serde_json::from_value(v["programa"].clone()).ok())
    }

    pub fn cerrar(&self, id: &str, motivo: &str) {
        let _ = self
            .cli
            .post(format!("{}/api/v1/emisor/transmisiones/{id}/fin", self.api))
            .bearer_auth(&self.token)
            .json(&serde_json::json!({ "motivo": motivo }))
            .send();
    }
}

/// Nombre de la PC (para saber desde dónde se transmite)
pub fn nombre_equipo() -> String {
    std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "PC sin nombre".into())
}

/// Pone el nombre del programa como "canción actual" de la radio (lo muestran la web y la app).
/// Es la actualización de metadatos estándar de Icecast, que acepta el harbor de Liquidsoap.
pub fn enviar_titulo(servidor: &str, puerto: u16, mount: &str, clave: &str, titulo: &str) {
    let Ok(cli) = cliente() else { return };
    let _ = cli
        .get(format!("http://{servidor}:{puerto}/admin/metadata"))
        .basic_auth("source", Some(clave))
        .query(&[("mode", "updinfo"), ("mount", mount), ("song", titulo)])
        .send();
}
