use crate::sidecar::{SidecarManager, SidecarRuntimeStatus};
use crate::state::{AppState, InvestigationSnapshot};
use tauri::{AppHandle, Emitter, Manager, State};

#[tauri::command]
pub fn get_investigation_snapshot(
    state: State<'_, AppState>,
) -> Result<InvestigationSnapshot, String> {
    state
        .investigation
        .lock()
        .map(|guard| guard.clone())
        .map_err(|_| "Failed to lock investigation state".to_string())
}

#[tauri::command]
pub fn publish_investigation_snapshot(
    app: AppHandle,
    state: State<'_, AppState>,
    snapshot: InvestigationSnapshot,
) -> Result<(), String> {
    {
        let mut guard = state
            .investigation
            .lock()
            .map_err(|_| "Failed to lock investigation state".to_string())?;
        *guard = snapshot.clone();
    }

    app.emit("state_changed", snapshot)
        .map_err(|error| format!("Failed to emit state_changed: {error}"))?;

    Ok(())
}

#[tauri::command]
pub fn get_sidecar_status(sidecar: State<'_, SidecarManager>) -> SidecarRuntimeStatus {
    sidecar.status()
}

#[tauri::command]
pub fn restart_voice_sidecar(
    app: AppHandle,
    sidecar: State<'_, SidecarManager>,
    device_name: Option<String>,
) -> Result<SidecarRuntimeStatus, String> {
    // Always accept the latest preferred mic from the UI (null/empty → system default).
    sidecar.set_preferred_device_name(device_name)?;
    sidecar.restart(&app)?;
    Ok(sidecar.status())
}

#[tauri::command]
pub fn stop_voice_sidecar(
    app: AppHandle,
    sidecar: State<'_, SidecarManager>,
) -> Result<SidecarRuntimeStatus, String> {
    sidecar.stop(&app)?;
    Ok(sidecar.status())
}

#[tauri::command]
pub fn set_overlay_interactive(app: AppHandle, interactive: bool) -> Result<(), String> {
    let overlay = app
        .get_webview_window("overlay")
        .ok_or_else(|| "Overlay window not found".to_string())?;

    // Borderless overlay stays click-through in play mode. Edit mode must be
    // focusable/resizable and not maximized so drag + edge resize work.
    if interactive {
        let was_maximized = overlay.is_maximized().unwrap_or(false);
        let _ = overlay.unmaximize();

        // First-time edit after a maximized start often leaves a full-monitor
        // restore rect — shrink so move/resize is obvious.
        if was_maximized {
            let _ = overlay.set_size(tauri::LogicalSize::new(960.0, 640.0));
            if let Ok(Some(monitor)) = overlay.current_monitor() {
                let scale = monitor.scale_factor();
                let monitor_pos = monitor.position();
                let monitor_size = monitor.size();
                let x = (monitor_pos.x as f64 / scale)
                    + ((monitor_size.width as f64 / scale) - 960.0) / 2.0;
                let y = (monitor_pos.y as f64 / scale)
                    + ((monitor_size.height as f64 / scale) - 640.0) / 2.0;
                let _ = overlay.set_position(tauri::LogicalPosition::new(x, y));
            }
        }
    }

    overlay
        .set_focusable(interactive)
        .map_err(|error| format!("Failed to set overlay focusable: {error}"))?;
    overlay
        .set_ignore_cursor_events(!interactive)
        .map_err(|error| format!("Failed to set overlay click-through: {error}"))?;
    overlay
        .set_resizable(interactive)
        .map_err(|error| format!("Failed to set overlay resizable: {error}"))?;

    if interactive {
        let _ = overlay.set_focus();
    }

    Ok(())
}
