// Consultas al servidor de oyentes (Icecast): si responde, si el mount está en línea y cuántos oyentes hay.
use std::time::Duration;

use serde::Serialize;
use serde_json::Value;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Sondeo {
    /// El servidor de oyentes responde
    pub alcanzable: bool,
    /// Hay una fuente conectada en el mount (la radio está al aire)
    pub mount_en_linea: bool,
    pub oyentes: Option<u32>,
}

fn cliente() -> Result<reqwest::blocking::Client, String> {
    reqwest::blocking::Client::builder()
        .connect_timeout(Duration::from_secs(4))
        .timeout(Duration::from_secs(6))
        .build()
        .map_err(|e| e.to_string())
}

/// Lee /status-json.xsl y busca el mount.
pub fn sondear(servidor: &str, puerto_oyentes: u16, mount: &str) -> Sondeo {
    let sin = Sondeo { alcanzable: false, mount_en_linea: false, oyentes: None };
    let Ok(cli) = cliente() else { return sin };
    let url = format!("http://{servidor}:{puerto_oyentes}/status-json.xsl");
    let Ok(resp) = cli.get(&url).send() else { return sin };
    let Ok(json) = resp.json::<Value>() else { return Sondeo { alcanzable: true, ..sin } };

    let fuentes = match &json["icestats"]["source"] {
        Value::Array(v) => v.clone(),
        Value::Object(_) => vec![json["icestats"]["source"].clone()],
        _ => Vec::new(),
    };
    let fuente = fuentes.iter().find(|f| {
        f["listenurl"].as_str().map(|u| u.ends_with(mount)).unwrap_or(false)
    });
    match fuente {
        Some(f) => Sondeo {
            alcanzable: true,
            mount_en_linea: true,
            oyentes: f["listeners"].as_u64().map(|n| n as u32),
        },
        None => Sondeo { alcanzable: true, mount_en_linea: false, oyentes: None },
    }
}
