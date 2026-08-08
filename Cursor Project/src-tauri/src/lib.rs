mod commands;
mod sidecar;
mod state;

use sidecar::SidecarManager;
use state::AppState;
use tauri::{Emitter, Manager, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(AppState::new())
        .manage(SidecarManager::new())
        .invoke_handler(tauri::generate_handler![
            commands::get_investigation_snapshot,
            commands::publish_investigation_snapshot,
            commands::get_sidecar_status,
            commands::restart_voice_sidecar,
            commands::stop_voice_sidecar,
        ])
        .setup(|app| {
            if let Some(overlay) = app.get_webview_window("overlay") {
                // Click-through: game retains mouse/keyboard input.
                overlay.set_ignore_cursor_events(true)?;
            }

            // Sidecar is optional — launch failure must not prevent the app from running.
            let handle = app.handle().clone();
            if let Some(manager) = handle.try_state::<SidecarManager>() {
                if let Err(error) = manager.start(&handle) {
                    eprintln!("[sidecar] initial launch failed: {error}");
                    let _ = handle.emit(
                        "sidecar_error",
                        sidecar::SidecarErrorPayload {
                            message: error,
                            recoverable: true,
                        },
                    );
                    let _ = handle.emit(
                        "voice_status",
                        sidecar::VoiceStatusPayload {
                            status: sidecar::VoiceStatus::Error,
                        },
                    );
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            // Overlay is always-on-top and hidden from the taskbar; closing Main
            // must shut down the whole process so Overlay is not left orphaned.
            if window.label() == "main" {
                if let WindowEvent::CloseRequested { .. } = event {
                    let app = window.app_handle();
                    if let Some(manager) = app.try_state::<SidecarManager>() {
                        let _ = manager.stop(&app);
                    }
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
