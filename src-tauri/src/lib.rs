use std::{fs, path::Path};
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
fn existe_ruta(ruta: String) -> bool {
    Path::new(&ruta).exists()
}

/// Escribe la Salida. Si Excel la tiene abierta, Windows niega el acceso
/// (ERROR_SHARING_VIOLATION = 32, ERROR_LOCK_VIOLATION = 33) y se avisa con "EN_USO".
#[tauri::command]
fn escribir_archivo(ruta: String, datos: Vec<u8>) -> Result<(), String> {
    fs::write(&ruta, datos).map_err(|e| match e.raw_os_error() {
        Some(32) | Some(33) => "EN_USO".to_string(),
        _ => e.to_string(),
    })
}

#[tauri::command]
fn abrir_ruta(app: tauri::AppHandle, ruta: String) -> Result<(), String> {
    app.opener()
        .open_path(ruta, None::<&str>)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn mostrar_en_carpeta(app: tauri::AppHandle, ruta: String) -> Result<(), String> {
    app.opener()
        .reveal_item_in_dir(ruta)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            existe_ruta,
            escribir_archivo,
            abrir_ruta,
            mostrar_en_carpeta
        ])
        .run(tauri::generate_context!())
        .expect("no se pudo iniciar List Generator");
}
