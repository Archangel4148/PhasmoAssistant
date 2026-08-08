//! Exactly one Python voice sidecar process.

mod protocol;

pub use protocol::{
    parse_sidecar_line, SidecarErrorPayload, SidecarStdoutEvent, VoiceCommandPayload,
    VoiceStatus, VoiceStatusPayload,
};

use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager};

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SidecarConnectionStatus {
    Connected,
    Disconnected,
    Error,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SidecarRuntimeStatus {
    pub connection: SidecarConnectionStatus,
    pub voice_status: VoiceStatus,
    pub last_error: Option<String>,
    pub using_mock: bool,
}

impl Default for SidecarRuntimeStatus {
    fn default() -> Self {
        Self {
            connection: SidecarConnectionStatus::Disconnected,
            voice_status: VoiceStatus::Offline,
            last_error: None,
            using_mock: true,
        }
    }
}

struct SidecarProcess {
    child: Child,
}

pub struct SidecarManager {
    inner: Mutex<SidecarInner>,
}

struct SidecarInner {
    process: Option<SidecarProcess>,
    status: SidecarRuntimeStatus,
    /// Monotonic generation so stale reader threads ignore late output.
    generation: u64,
    /// Preferred microphone label (matched in Python via sounddevice name).
    preferred_device_name: Option<String>,
}

impl SidecarManager {
    pub fn new() -> Self {
        Self {
            inner: Mutex::new(SidecarInner {
                process: None,
                status: SidecarRuntimeStatus::default(),
                generation: 0,
                preferred_device_name: None,
            }),
        }
    }

    pub fn status(&self) -> SidecarRuntimeStatus {
        self.inner
            .lock()
            .map(|guard| guard.status.clone())
            .unwrap_or_default()
    }

    pub fn set_preferred_device_name(&self, device_name: Option<String>) -> Result<(), String> {
        let mut guard = self
            .inner
            .lock()
            .map_err(|_| "sidecar manager lock poisoned".to_string())?;
        guard.preferred_device_name = device_name.and_then(|name| {
            let trimmed = name.trim().to_string();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed)
            }
        });
        Ok(())
    }

    pub fn preferred_device_name(&self) -> Option<String> {
        self.inner
            .lock()
            .ok()
            .and_then(|guard| guard.preferred_device_name.clone())
    }

    pub fn stop(&self, app: &AppHandle) -> Result<(), String> {
        let mut guard = self
            .inner
            .lock()
            .map_err(|_| "sidecar manager lock poisoned".to_string())?;

        guard.generation = guard.generation.wrapping_add(1);
        if let Some(mut process) = guard.process.take() {
            let _ = process.child.kill();
            let _ = process.child.wait();
        }

        guard.status.connection = SidecarConnectionStatus::Disconnected;
        guard.status.voice_status = VoiceStatus::Offline;
        drop(guard);

        let _ = app.emit(
            "voice_status",
            VoiceStatusPayload {
                status: VoiceStatus::Offline,
            },
        );

        Ok(())
    }

    pub fn start(&self, app: &AppHandle) -> Result<(), String> {
        self.stop(app)?;

        let (script, using_mock) = resolve_sidecar_script(app)?;
        let device_name = self.preferred_device_name();
        let mut command = build_python_command(&script, using_mock, device_name.as_deref())?;

        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x0800_0000;
            command.creation_flags(CREATE_NO_WINDOW);
        }

        command
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .env("PYTHONUNBUFFERED", "1");

        let mut child = command.spawn().map_err(|error| {
            format!(
                "Failed to launch Python sidecar ({}): {error}. Install Python 3 and ensure `py` or `python` is on PATH.",
                script.display()
            )
        })?;

        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "sidecar stdout pipe missing".to_string())?;
        let stderr = child
            .stderr
            .take()
            .ok_or_else(|| "sidecar stderr pipe missing".to_string())?;

        let generation = {
            let mut guard = self
                .inner
                .lock()
                .map_err(|_| "sidecar manager lock poisoned".to_string())?;
            guard.generation = guard.generation.wrapping_add(1);
            let generation = guard.generation;
            guard.process = Some(SidecarProcess { child });
            guard.status.connection = SidecarConnectionStatus::Connected;
            guard.status.voice_status = VoiceStatus::Starting;
            guard.status.last_error = None;
            guard.status.using_mock = using_mock;
            generation
        };

        let _ = app.emit(
            "voice_status",
            VoiceStatusPayload {
                status: VoiceStatus::Starting,
            },
        );

        spawn_stdout_reader(app.clone(), stdout, generation);
        spawn_stderr_reader(stderr);
        spawn_exit_watcher(app.clone(), generation);

        Ok(())
    }

    pub fn restart(&self, app: &AppHandle) -> Result<(), String> {
        self.start(app)
    }

    fn apply_event(&self, app: &AppHandle, generation: u64, event: SidecarStdoutEvent) {
        let Ok(mut guard) = self.inner.lock() else {
            return;
        };
        if guard.generation != generation {
            return;
        }

        match event {
            SidecarStdoutEvent::VoiceStatus { status } => {
                guard.status.voice_status = status.clone();
                if matches!(status, VoiceStatus::Error) {
                    guard.status.connection = SidecarConnectionStatus::Error;
                } else if matches!(status, VoiceStatus::Offline) {
                    guard.status.connection = SidecarConnectionStatus::Disconnected;
                } else {
                    guard.status.connection = SidecarConnectionStatus::Connected;
                }
                drop(guard);
                let _ = app.emit("voice_status", VoiceStatusPayload { status });
            }
            SidecarStdoutEvent::VoiceCommand { command, value } => {
                drop(guard);
                let _ = app.emit(
                    "voice_command",
                    VoiceCommandPayload { command, value },
                );
            }
            SidecarStdoutEvent::SidecarError {
                message,
                recoverable,
            } => {
                guard.status.last_error = Some(message.clone());
                guard.status.connection = SidecarConnectionStatus::Error;
                drop(guard);
                let _ = app.emit(
                    "sidecar_error",
                    SidecarErrorPayload {
                        message,
                        recoverable,
                    },
                );
            }
        }
    }

    fn mark_exited(&self, app: &AppHandle, generation: u64, code: Option<i32>) {
        let Ok(mut guard) = self.inner.lock() else {
            return;
        };
        if guard.generation != generation {
            return;
        }

        guard.process = None;
        let code_label = code
            .map(|value| value.to_string())
            .unwrap_or_else(|| "unknown".to_string());
        let message = format!("Voice sidecar exited unexpectedly (code {code_label})");
        guard.status.connection = SidecarConnectionStatus::Error;
        guard.status.voice_status = VoiceStatus::Error;
        guard.status.last_error = Some(message.clone());
        drop(guard);

        let _ = app.emit(
            "sidecar_error",
            SidecarErrorPayload {
                message,
                recoverable: true,
            },
        );
        let _ = app.emit(
            "voice_status",
            VoiceStatusPayload {
                status: VoiceStatus::Error,
            },
        );
    }
}

impl Default for SidecarManager {
    fn default() -> Self {
        Self::new()
    }
}

fn resolve_sidecar_script(app: &AppHandle) -> Result<(PathBuf, bool), String> {
    let force_mock = std::env::var("PHASMO_VOICE_MOCK")
        .map(|value| value == "1" || value.eq_ignore_ascii_case("true"))
        .unwrap_or(false);

    let vosk = candidate_scripts(app, "vosk_listener.py");
    let mock = candidate_scripts(app, "mock_listener.py");

    if force_mock {
        let path = mock.into_iter().find(|path| path.is_file()).ok_or_else(|| {
            "mock_listener.py not found (PHASMO_VOICE_MOCK=1)".to_string()
        })?;
        return Ok((path, true));
    }

    if let Some(path) = vosk.into_iter().find(|path| path.is_file()) {
        return Ok((path, false));
    }

    let path = mock.into_iter().find(|path| path.is_file()).ok_or_else(|| {
        "No sidecar script found. Expected sidecar/vosk_listener.py".to_string()
    })?;
    Ok((path, true))
}

fn candidate_scripts(app: &AppHandle, file_name: &str) -> Vec<PathBuf> {
    let mut candidates: Vec<PathBuf> = Vec::new();

    let mut from_manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    from_manifest.pop();
    from_manifest.push("sidecar");
    from_manifest.push(file_name);
    candidates.push(from_manifest);

    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(cwd.join("sidecar").join(file_name));
        candidates.push(cwd.join("..").join("sidecar").join(file_name));
    }

    if let Ok(resource) = app.path().resource_dir() {
        candidates.push(resource.join("sidecar").join(file_name));
    }

    candidates
}

fn build_python_command(
    script: &Path,
    using_mock_script: bool,
    device_name: Option<&str>,
) -> Result<Command, String> {
    let script_str = script
        .to_str()
        .ok_or_else(|| "sidecar script path is not valid UTF-8".to_string())?;

    let launchers: &[(&str, &[&str])] = if cfg!(windows) {
        &[("py", &["-3"]), ("python", &[]), ("python3", &[])]
    } else {
        &[("python3", &[]), ("python", &[])]
    };

    for (program, prefix_args) in launchers {
        if command_exists(program) {
            let mut command = Command::new(program);
            for arg in *prefix_args {
                command.arg(arg);
            }
            command.arg(script_str);
            if using_mock_script {
                // Legacy mock listener demo cadence for Diagnostics without a mic.
                command.arg("--demo-interval");
                command.arg("15");
            } else if let Some(name) = device_name {
                command.arg("--device-name");
                command.arg(name);
            }
            return Ok(command);
        }
    }

    Err(
        "No Python interpreter found (tried py -3, python, python3). Install Python 3 to run the voice sidecar."
            .to_string(),
    )
}

fn command_exists(program: &str) -> bool {
    Command::new(program)
        .arg("--version")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map(|status| status.success())
        .unwrap_or(false)
}

fn spawn_stdout_reader<R>(app: AppHandle, stdout: R, generation: u64)
where
    R: std::io::Read + Send + 'static,
{
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            let Ok(line) = line else {
                break;
            };
            match parse_sidecar_line(&line) {
                Ok(event) => {
                    if let Some(manager) = app.try_state::<SidecarManager>() {
                        manager.apply_event(&app, generation, event);
                    }
                }
                Err(error) => {
                    eprintln!("[sidecar] {error}");
                    let _ = app.emit(
                        "sidecar_error",
                        SidecarErrorPayload {
                            message: error,
                            recoverable: true,
                        },
                    );
                }
            }
        }
    });
}

fn spawn_stderr_reader<R>(stderr: R)
where
    R: std::io::Read + Send + 'static,
{
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines().flatten() {
            if !line.trim().is_empty() {
                eprintln!("{line}");
            }
        }
    });
}

fn spawn_exit_watcher(app: AppHandle, generation: u64) {
    thread::spawn(move || {
        loop {
            thread::sleep(Duration::from_millis(250));
            let Some(manager) = app.try_state::<SidecarManager>() else {
                return;
            };

            let exit_code = {
                let Ok(mut guard) = manager.inner.lock() else {
                    return;
                };
                if guard.generation != generation {
                    return;
                }
                let Some(process) = guard.process.as_mut() else {
                    return;
                };
                match process.child.try_wait() {
                    Ok(Some(status)) => {
                        guard.process = None;
                        Some(status.code())
                    }
                    Ok(None) => None,
                    Err(_) => {
                        guard.process = None;
                        Some(None)
                    }
                }
            };

            if let Some(code) = exit_code {
                if code == Some(0) {
                    // Graceful exit (e.g. missing model already reported via sidecar_error).
                    if let Ok(mut guard) = manager.inner.lock() {
                        if guard.generation == generation {
                            guard.process = None;
                            if !matches!(
                                guard.status.voice_status,
                                VoiceStatus::Error | VoiceStatus::Offline
                            ) {
                                guard.status.connection =
                                    SidecarConnectionStatus::Disconnected;
                                guard.status.voice_status = VoiceStatus::Offline;
                            }
                        }
                    }
                } else {
                    manager.mark_exited(&app, generation, code);
                }
                return;
            }
        }
    });
}
