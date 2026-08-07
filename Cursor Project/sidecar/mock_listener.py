#!/usr/bin/env python3
"""
Phase 5 mock voice sidecar.

Emits one JSON object per stdout line. Diagnostics go to stderr only.
Vosk / microphone integration arrives in Phase 6.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from typing import Any


def emit(payload: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(payload, separators=(",", ":")) + "\n")
    sys.stdout.flush()


def log(message: str) -> None:
    sys.stderr.write(f"[mock_listener] {message}\n")
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


def emit_command(command: str, value: str | None = None) -> None:
    payload: dict[str, Any] = {"event": "voice_command", "command": command}
    if value is not None:
        payload["value"] = value
    emit(payload)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Mock Phasmophobia voice sidecar")
    parser.add_argument(
        "--demo-interval",
        type=float,
        default=12.0,
        help="Seconds between demo voice_command emissions (0 disables)",
    )
    parser.add_argument(
        "--crash-after",
        type=float,
        default=0.0,
        help="If > 0, exit non-zero after this many seconds (failure testing)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    log("starting mock listener")
    emit_status("starting")
    time.sleep(0.35)
    emit_status("listening")
    log("listening (mock — no microphone)")

    started = time.monotonic()
    next_demo = started + max(args.demo_interval, 0.0)
    demo_index = 0
    demo_commands = [
        ("set_evidence", "emf5"),
        ("set_evidence", "spiritBox"),
        ("smudge", None),
        ("timer", None),
    ]

    try:
        while True:
            now = time.monotonic()

            if args.crash_after > 0 and (now - started) >= args.crash_after:
                log("simulated crash requested")
                emit_error("Simulated sidecar crash", recoverable=True)
                emit_status("error")
                return 2

            if args.demo_interval > 0 and now >= next_demo:
                command, value = demo_commands[demo_index % len(demo_commands)]
                demo_index += 1
                emit_command(command, value)
                log(f"demo command: {command} {value or ''}".strip())
                next_demo = now + args.demo_interval

            time.sleep(0.2)
    except KeyboardInterrupt:
        log("interrupted — shutting down")
        emit_status("offline")
        return 0


if __name__ == "__main__":
    sys.exit(main())
