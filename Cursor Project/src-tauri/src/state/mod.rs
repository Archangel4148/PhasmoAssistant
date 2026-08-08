//! Shared investigation snapshot mirrored to all windows via Tauri events.

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OverlayToast {
    pub id: String,
    pub message: String,
    pub created_at_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OverlayAppearance {
    pub ghost_text_color: String,
    pub ticker_speed_px_per_sec: f64,
}

impl Default for OverlayAppearance {
    fn default() -> Self {
        Self {
            ghost_text_color: "#9aa7b8".to_string(),
            ticker_speed_px_per_sec: 26.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvestigationTimer {
    pub duration_seconds: u32,
    pub started_at_ms: Option<u64>,
}

fn default_smudge_timer() -> InvestigationTimer {
    InvestigationTimer {
        duration_seconds: 90,
        started_at_ms: None,
    }
}

fn default_hunt_timer() -> InvestigationTimer {
    InvestigationTimer {
        duration_seconds: 25,
        started_at_ms: None,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvestigationSettings {
    pub ghost_speed_multiplier: f64,
    pub timing_result_hide_after_seconds: u32,
}

fn default_investigation_settings() -> InvestigationSettings {
    InvestigationSettings {
        ghost_speed_multiplier: 1.0,
        timing_result_hide_after_seconds: 7,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvestigationSnapshot {
    /// Evidence map keyed by evidence id (JSON object). Filtering stays in TypeScript domain.
    pub evidence: serde_json::Value,
    pub eliminated_ghost_ids: Vec<String>,
    pub timing_mode: bool,
    #[serde(default)]
    pub timing_timestamps_ms: Vec<u64>,
    #[serde(default)]
    pub timing_result_completed_at_ms: Option<u64>,
    #[serde(default = "default_smudge_timer")]
    pub smudge_timer: InvestigationTimer,
    #[serde(default = "default_hunt_timer")]
    pub hunt_timer: InvestigationTimer,
    pub toasts: Vec<OverlayToast>,
    #[serde(default)]
    pub overlay_appearance: OverlayAppearance,
    #[serde(default = "default_investigation_settings")]
    pub settings: InvestigationSettings,
}

impl Default for InvestigationSnapshot {
    fn default() -> Self {
        Self {
            evidence: serde_json::json!({}),
            eliminated_ghost_ids: Vec::new(),
            timing_mode: false,
            timing_timestamps_ms: Vec::new(),
            timing_result_completed_at_ms: None,
            smudge_timer: default_smudge_timer(),
            hunt_timer: default_hunt_timer(),
            toasts: Vec::new(),
            overlay_appearance: OverlayAppearance::default(),
            settings: default_investigation_settings(),
        }
    }
}

pub struct AppState {
    pub investigation: Mutex<InvestigationSnapshot>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            investigation: Mutex::new(InvestigationSnapshot::default()),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
