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
pub struct InvestigationSnapshot {
    /// Evidence map keyed by evidence id (JSON object). Filtering stays in TypeScript domain.
    pub evidence: serde_json::Value,
    pub eliminated_ghost_ids: Vec<String>,
    pub timing_mode: bool,
    pub smudge_remaining_seconds: Option<u32>,
    pub hunt_remaining_seconds: Option<u32>,
    pub current_ghost_speed_mps: Option<f64>,
    pub toasts: Vec<OverlayToast>,
    #[serde(default)]
    pub overlay_appearance: OverlayAppearance,
}

impl Default for InvestigationSnapshot {
    fn default() -> Self {
        Self {
            evidence: serde_json::json!({}),
            eliminated_ghost_ids: Vec::new(),
            timing_mode: false,
            smudge_remaining_seconds: None,
            hunt_remaining_seconds: None,
            current_ghost_speed_mps: None,
            toasts: Vec::new(),
            overlay_appearance: OverlayAppearance::default(),
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
