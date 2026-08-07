use crate::state::{AppState, InvestigationSnapshot};
use tauri::{AppHandle, Emitter, State};

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
