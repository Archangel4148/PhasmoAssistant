mod commands;
mod state;

use state::AppState;
use tauri::{Manager, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::get_investigation_snapshot,
            commands::publish_investigation_snapshot,
        ])
        .setup(|app| {
            if let Some(overlay) = app.get_webview_window("overlay") {
                // Click-through: game retains mouse/keyboard input.
                overlay.set_ignore_cursor_events(true)?;
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            // Overlay is always-on-top and hidden from the taskbar; closing Main
            // must shut down the whole process so Overlay is not left orphaned.
            if window.label() == "main" {
                if let WindowEvent::CloseRequested { .. } = event {
                    let app = window.app_handle();
                    if let Some(overlay) = app.get_webview_window("overlay") {
                        let _ = overlay.destroy();
                    }
                    app.exit(0);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
