//! Authoritative application state will live here in later phases.

pub struct AppState;

impl AppState {
    pub fn new() -> Self {
        Self
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
