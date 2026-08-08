#!/usr/bin/env python3
"""
Phase 6 Vosk voice sidecar.

Pipeline: microphone → Vosk → wake word "trigger" → utterance emit → Rust/TS domain.
JSON on stdout only. Logs on stderr.

Packaged builds (PyInstaller) receive an absolute --model path from Rust.
Dev runs resolve the model next to this script under sidecar/models/.
"""

from __future__ import annotations

import argparse
import json
import os
import queue
import sys
import time
from pathlib import Path
from typing import Any

WAKE_WORD = "trigger"
ARMED_WINDOW_SECONDS = 4.0

MODEL_DIR_NAME = "vosk-model-small-en-us-0.15"


def is_frozen() -> bool:
    return bool(getattr(sys, "frozen", False))


def app_base_dir() -> Path:
    """Directory containing the script or the frozen executable."""
    if is_frozen():
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent



def emit(payload: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(payload, separators=(",", ":")) + "\n")
    sys.stdout.flush()


def log(message: str) -> None:
    sys.stderr.write(f"[vosk_listener] {message}\n")
    sys.stderr.flush()


def emit_status(status: str) -> None:
    emit({"event": "voice_status", "status": status})


def emit_error(message: str, *, recoverable: bool = True) -> None:
    emit(
        {
            "event": "sidecar_error",
            "message": message,
            "recoverable": recoverable,
        }
    )


def emit_utterance(text: str) -> None:
    emit({"event": "voice_command", "command": "utterance", "value": text})


def default_model_path() -> Path:
    """Fallback when Rust does not pass --model (dev / manual runs)."""
    base = app_base_dir()
    packaged = base.parent / "models" / MODEL_DIR_NAME
    if packaged.is_dir():
        return packaged
    return base / "models" / MODEL_DIR_NAME


def normalize_model_path(path: Path) -> Path:
    """Strip Windows verbatim prefixes that Vosk's native loader cannot open."""
    text = str(path)
    if text.startswith("\\\\?\\UNC\\"):
        text = "\\\\" + text[len("\\\\?\\UNC\\") :]
    elif text.startswith("\\\\?\\"):
        text = text[len("\\\\?\\") :]
    return Path(text)


def missing_model_message(model_path: Path) -> str:
    if is_frozen():
        return (
            f"Vosk model not found at '{model_path}'. "
            "Reinstall Phasmophobia Companion or use Restart Sidecar. "
            "Non-voice features remain available."
        )
    return (
        f"Vosk model not found at '{model_path}'. "
        "Download vosk-model-small-en-us-0.15 from https://alphacephei.com/vosk/models "
        f"and extract it to sidecar/models/{MODEL_DIR_NAME}/ "
        "(or run npm run sidecar:prepare). "
        "Then use Restart Sidecar. Non-voice features remain available."
    )


def missing_deps_message(error: BaseException) -> str:
    if is_frozen():
        return (
            f"Voice runtime failed to load ({error}). "
            "Reinstall Phasmophobia Companion or use Restart Sidecar."
        )
    return (
        "Voice dependencies are not installed "
        f"({error}). Run: pip install -r sidecar/requirements.txt "
        "Then use Restart Sidecar."
    )


def normalize_text(text: str) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() or ch.isspace() else " " for ch in text)
    return " ".join(cleaned.split())


def extract_after_wake(text: str) -> tuple[bool, str]:
    """Return (heard_wake, remainder_after_wake)."""
    normalized = normalize_text(text)
    if not normalized:
        return False, ""
    if normalized == WAKE_WORD:
        return True, ""
    token = f"{WAKE_WORD} "
    if normalized.startswith(token):
        return True, normalized[len(token) :].strip()
    # Wake word may appear mid-utterance.
    parts = normalized.split(token, 1)
    if len(parts) == 2:
        return True, parts[1].strip()
    if WAKE_WORD in normalized.split():
        # e.g. "... trigger" with nothing after
        return True, ""
    return False, normalized


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Vosk Phasmophobia voice sidecar")
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Path to Vosk model directory (Rust passes this in packaged builds)",
    )
    parser.add_argument(
        "--device",
        type=int,
        default=None,
        help="Optional sounddevice input index",
    )
    parser.add_argument(
        "--device-name",
        type=str,
        default=None,
        help="Optional input device name substring (matched via sounddevice)",
    )
    parser.add_argument(
        "--samplerate",
        type=int,
        default=16000,
        help="Microphone sample rate",
    )
    parser.add_argument(
        "--mock",
        action="store_true",
        help="Run without microphone (status only) for environments without audio",
    )
    return parser.parse_args()


def run_mock_idle() -> int:
    emit_status("starting")
    time.sleep(0.2)
    emit_status("listening")
    log("mock idle mode — no microphone capture")
    try:
        while True:
            time.sleep(1.0)
    except KeyboardInterrupt:
        emit_status("offline")
        return 0


def resolve_input_device(
    sd: Any,
    device: int | None,
    device_name: str | None,
) -> int | None:
    """Resolve a sounddevice input index from an explicit index or name substring."""
    if device is not None:
        return device

    if not device_name or not str(device_name).strip():
        return None

    needle = str(device_name).strip().lower()
    devices = sd.query_devices()
    candidates: list[tuple[int, str]] = []
    for index, entry in enumerate(devices):
        if int(entry.get("max_input_channels", 0)) <= 0:
            continue
        name = str(entry.get("name", ""))
        if needle in name.lower() or name.lower() in needle:
            candidates.append((index, name))

    if not candidates:
        raise RuntimeError(
            f"No input device matching '{device_name}'. "
            "Pick another microphone in Settings or use System default."
        )

    # Prefer the shortest name (usually the most specific host API entry).
    candidates.sort(key=lambda item: (len(item[1]), item[0]))
    chosen_index, chosen_name = candidates[0]
    log(f"resolved input device '{device_name}' → [{chosen_index}] {chosen_name}")
    return chosen_index


def run_vosk(
    model_path: Path,
    device: int | None,
    device_name: str | None,
    samplerate: int,
) -> int:
    try:
        import sounddevice as sd  # type: ignore
        from vosk import KaldiRecognizer, Model  # type: ignore
    except Exception as error:  # noqa: BLE001 - report any import failure
        emit_status("starting")
        emit_error(missing_deps_message(error), recoverable=True)
        emit_status("error")
        return 0

    if not model_path.is_dir():
        emit_status("starting")
        emit_error(missing_model_message(model_path), recoverable=True)
        emit_status("error")
        return 0

    emit_status("starting")
    try:
        resolved_device = resolve_input_device(sd, device, device_name)
    except Exception as error:  # noqa: BLE001
        emit_error(str(error), recoverable=True)
        emit_status("error")
        return 0

    log(f"loading model from {model_path}")
    try:
        model = Model(str(model_path))
    except Exception as error:  # noqa: BLE001
        emit_error(f"Failed to load Vosk model: {error}", recoverable=True)
        emit_status("error")
        return 0

    recognizer = KaldiRecognizer(model, samplerate)
    recognizer.SetWords(False)

    audio_queue: queue.Queue[bytes] = queue.Queue()

    def audio_callback(indata, _frames, _time_info, status) -> None:  # noqa: ANN001
        if status:
            log(f"audio status: {status}")
        audio_queue.put(bytes(indata))

    try:
        stream = sd.RawInputStream(
            samplerate=samplerate,
            blocksize=8000,
            device=resolved_device,
            dtype="int16",
            channels=1,
            callback=audio_callback,
        )
    except Exception as error:  # noqa: BLE001
        emit_error(
            f"Microphone unavailable: {error}. Check input devices and Restart Sidecar.",
            recoverable=True,
        )
        emit_status("error")
        return 0

    emit_status("listening")
    if resolved_device is None:
        log("listening on system default input for wake word 'trigger'")
    else:
        log(f"listening on device {resolved_device} for wake word 'trigger'")

    armed_until = 0.0

    try:
        with stream:
            while True:
                data = audio_queue.get()
                if recognizer.AcceptWaveform(data):
                    payload = json.loads(recognizer.Result())
                    text = str(payload.get("text", "")).strip()
                    if not text:
                        continue
                    log(f"final: {text}")
                    heard_wake, remainder = extract_after_wake(text)
                    now = time.monotonic()

                    if heard_wake and remainder:
                        emit_utterance(remainder)
                        armed_until = 0.0
                        continue

                    if heard_wake and not remainder:
                        armed_until = now + ARMED_WINDOW_SECONDS
                        log("wake word armed — waiting for command")
                        continue

                    if now <= armed_until and remainder:
                        emit_utterance(remainder)
                        armed_until = 0.0
                        continue

                    # Ignore unrelated speech when not armed.
                # Partial results intentionally ignored for command commit.
    except KeyboardInterrupt:
        log("interrupted — shutting down")
        emit_status("offline")
        return 0


def main() -> int:
    args = parse_args()
    if args.mock or os.environ.get("PHASMO_VOICE_MOCK") == "1":
        return run_mock_idle()
    model_path = normalize_model_path(
        Path(args.model) if args.model else default_model_path()
    )
    return run_vosk(model_path, args.device, args.device_name, args.samplerate)


if __name__ == "__main__":
    sys.exit(main())
