// Ventana mini (siempre encima), icono en la bandeja del sistema y qué pasa al minimizar o cerrar.
// Regla principal: cerrar la ventana nunca corta la transmisión; solo "Salir" desde la bandeja la termina.
use std::time::Duration;

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, PhysicalPosition, WebviewUrl, WebviewWindowBuilder, Window, WindowEvent};

use crate::{ajustes, detener_emision, esta_transmitiendo, Estado};

const BANDEJA: &str = "principal";
const MINI_ANCHO: f64 = 500.0;
const MINI_ALTO: f64 = 64.0;

pub fn preparar(app: &AppHandle) -> tauri::Result<()> {
    // Ventana mini: creada oculta para que aparezca al instante cuando haga falta
    let mini = WebviewWindowBuilder::new(app, "mini", WebviewUrl::App("mini.html".into()))
        .title("Emisor · mini")
        .inner_size(MINI_ANCHO, MINI_ALTO)
        .resizable(false)
        .maximizable(false)
        .minimizable(false)
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .shadow(true)
        .visible(false)
        .build()?;
    // Arriba a la derecha de la pantalla principal; el operador la puede arrastrar
    if let Ok(Some(monitor)) = mini.primary_monitor() {
        let escala = monitor.scale_factor();
        let (pos, tam) = (monitor.position(), monitor.size());
        let x = pos.x + tam.width as i32 - ((MINI_ANCHO + 24.0) * escala) as i32;
        let y = pos.y + (24.0 * escala) as i32;
        let _ = mini.set_position(PhysicalPosition::new(x, y));
    }

    let abrir = MenuItem::with_id(app, "abrir", "Abrir el emisor", true, None::<&str>)?;
    let ver_mini = MenuItem::with_id(app, "mini", "Ventana mini", true, None::<&str>)?;
    let separador = PredefinedMenuItem::separator(app)?;
    let salir = MenuItem::with_id(app, "salir", "Salir (termina la transmisión)", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&abrir, &ver_mini, &separador, &salir])?;

    let mut bandeja = TrayIconBuilder::with_id(BANDEJA)
        .tooltip("Emisor La Luz del Tiempo · Fuera del aire")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, evento| match evento.id().as_ref() {
            "abrir" => mostrar_principal(app),
            "mini" => mostrar_mini(app, true),
            "salir" => salir_de_la_app(app),
            _ => {}
        })
        .on_tray_icon_event(|icono, evento| {
            if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = evento {
                mostrar_principal(icono.app_handle());
            }
        });
    if let Some(icono) = app.default_window_icon().cloned() {
        bandeja = bandeja.icon(icono);
    }
    bandeja.build(app)?;
    Ok(())
}

/// Muestra la mini; si `ocultar_principal`, la ventana grande se esconde (queda en la bandeja).
pub fn mostrar_mini(app: &AppHandle, ocultar_principal: bool) {
    if ocultar_principal {
        if let Some(w) = app.get_webview_window("main") {
            let _ = w.hide();
        }
    }
    if let Some(mini) = app.get_webview_window("mini") {
        let _ = mini.show();
    }
}

pub fn mostrar_principal(app: &AppHandle) {
    if let Some(mini) = app.get_webview_window("mini") {
        let _ = mini.hide();
    }
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

fn salir_de_la_app(app: &AppHandle) {
    // El menú de la bandeja corre en el hilo de la ventana: el trabajo, en otro hilo
    let app = app.clone();
    std::thread::spawn(move || {
        detener_emision(&app.state::<Estado>());
        // Un momento para que la grabación se cierre y el servidor reciba el fin
        std::thread::sleep(Duration::from_millis(700));
        app.exit(0);
    });
}

fn transmitiendo(app: &AppHandle) -> bool {
    esta_transmitiendo(app)
}

pub fn evento_ventana(ventana: &Window, evento: &WindowEvent) {
    if ventana.label() != "main" {
        return;
    }
    let app = ventana.app_handle();
    match evento {
        WindowEvent::CloseRequested { api, .. } => {
            if transmitiendo(app) {
                // Cerrar no corta el aire: la ventana se esconde y queda la mini
                api.prevent_close();
                let _ = ventana.hide();
                mostrar_mini(app, false);
            } else {
                app.exit(0);
            }
        }
        WindowEvent::Resized(_) => {
            if ventana.is_minimized().unwrap_or(false) && transmitiendo(app) && ajustes::cargar(app).mini_al_minimizar {
                mostrar_mini(app, false);
            }
        }
        WindowEvent::Focused(true) => {
            if let Some(mini) = app.get_webview_window("mini") {
                let _ = mini.hide();
            }
        }
        _ => {}
    }
}

/// Nunca llamar con un candado tomado: se ejecuta en el hilo de la ventana y espera a que responda.
pub fn actualizar_bandeja(app: &AppHandle, estado: &str) {
    let texto = match estado {
        "al_aire" => "Al aire",
        "conectando" => "Conectando",
        "reconectando" => "Reconectando",
        "error" => "Sin transmitir: error",
        _ => "Fuera del aire",
    };
    // Desde un hilo aparte: quien cambia el estado (audio, red) nunca espera a la ventana
    let app = app.clone();
    std::thread::spawn(move || {
        if let Some(bandeja) = app.tray_by_id(BANDEJA) {
            let _ = bandeja.set_tooltip(Some(format!("Emisor La Luz del Tiempo · {texto}")));
        }
    });
}
