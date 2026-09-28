// Sin consola negra detrás de la ventana en Windows.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    list_generator_lib::run()
}
