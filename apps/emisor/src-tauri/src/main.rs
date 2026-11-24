// Punto de entrada. En Windows, sin ventana de consola.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    emisor_lib::run()
}
