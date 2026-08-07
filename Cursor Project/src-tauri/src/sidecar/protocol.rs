//! JSON stdout protocol shared with the Python sidecar.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum VoiceStatus {
    Offline,
    Starting,
    Listening,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "event", rename_all = "snake_case")]
pub enum SidecarStdoutEvent {
    VoiceStatus {
        status: VoiceStatus,
    },
    VoiceCommand {
        command: String,
        #[serde(default)]
        value: Option<String>,
    },
    SidecarError {
        message: String,
        #[serde(default = "default_recoverable")]
        recoverable: bool,
    },
}

fn default_recoverable() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceStatusPayload {
    pub status: VoiceStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceCommandPayload {
    pub command: String,
    pub value: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SidecarErrorPayload {
    pub message: String,
    pub recoverable: bool,
}

pub fn parse_sidecar_line(line: &str) -> Result<SidecarStdoutEvent, String> {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return Err("empty sidecar line".to_string());
    }

    serde_json::from_str::<SidecarStdoutEvent>(trimmed)
        .map_err(|error| format!("invalid sidecar JSON: {error}; line={trimmed}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_voice_status() {
        let event = parse_sidecar_line(r#"{"event":"voice_status","status":"listening"}"#)
            .expect("parse");
        assert_eq!(
            event,
            SidecarStdoutEvent::VoiceStatus {
                status: VoiceStatus::Listening
            }
        );
    }

    #[test]
    fn parses_voice_command_with_value() {
        let event = parse_sidecar_line(
            r#"{"event":"voice_command","command":"set_evidence","value":"emf5"}"#,
        )
        .expect("parse");
        assert_eq!(
            event,
            SidecarStdoutEvent::VoiceCommand {
                command: "set_evidence".to_string(),
                value: Some("emf5".to_string()),
            }
        );
    }

    #[test]
    fn parses_sidecar_error() {
        let event = parse_sidecar_line(
            r#"{"event":"sidecar_error","message":"boom","recoverable":true}"#,
        )
        .expect("parse");
        assert_eq!(
            event,
            SidecarStdoutEvent::SidecarError {
                message: "boom".to_string(),
                recoverable: true,
            }
        );
    }
}
