import { describe, expect, it } from "vitest";
import {
  createIdleTimer,
  getElapsedSeconds,
  getTimerPhase,
  isTimerActive,
  resetTimer,
  setTimerDuration,
  startTimer,
  toggleTimer,
} from "./timerState";

describe("timerState", () => {
  const now = 1_000_000;

  it("starts idle with configured threshold", () => {
    const timer = createIdleTimer(90);
    expect(getTimerPhase(timer, now)).toBe("idle");
    expect(getElapsedSeconds(timer, now)).toBeNull();
    expect(isTimerActive(timer)).toBe(false);
  });

  it("counts up from an absolute start without drifting", () => {
    const started = startTimer(createIdleTimer(90), now);
    expect(started.startedAtMs).toBe(now);
    expect(getTimerPhase(started, now)).toBe("running");
    expect(getElapsedSeconds(started, now)).toBe(0);

    // Jump ahead 30.2s — elapsed derives from clock, not tick count.
    expect(getElapsedSeconds(started, now + 30_200)).toBe(30);
    expect(getTimerPhase(started, now + 30_200)).toBe("running");
  });

  it("switches to expired after the threshold while still counting", () => {
    const started = startTimer(createIdleTimer(25), now, 25);
    expect(getTimerPhase(started, now + 24_999)).toBe("running");
    expect(getElapsedSeconds(started, now + 24_999)).toBe(24);

    expect(getTimerPhase(started, now + 25_000)).toBe("expired");
    expect(getElapsedSeconds(started, now + 25_000)).toBe(25);
    expect(getElapsedSeconds(started, now + 40_000)).toBe(40);
    expect(isTimerActive(started)).toBe(true);
  });

  it("toggle starts when idle and stops/resets when active", () => {
    const idle = createIdleTimer(90);
    const running = toggleTimer(idle, now);
    expect(running.startedAtMs).toBe(now);

    const stopped = toggleTimer(running, now + 5_000);
    expect(stopped.startedAtMs).toBeNull();
    expect(stopped.durationSeconds).toBe(90);
    expect(getTimerPhase(stopped, now + 5_000)).toBe("idle");
  });

  it("toggle also stops a timer that is past the threshold", () => {
    const started = startTimer(createIdleTimer(10), now);
    const past = toggleTimer(started, now + 15_000);
    expect(past.startedAtMs).toBeNull();
  });

  it("reset returns to idle while keeping threshold config", () => {
    const started = startTimer(createIdleTimer(180), now);
    const reset = resetTimer(started);
    expect(getTimerPhase(reset, now + 5_000)).toBe("idle");
    expect(reset.durationSeconds).toBe(180);
    expect(reset.startedAtMs).toBeNull();
  });

  it("threshold changes apply without clearing a running stopwatch", () => {
    const started = startTimer(createIdleTimer(90), now);
    const updated = setTimerDuration(started, 60);
    expect(updated.durationSeconds).toBe(60);
    expect(updated.startedAtMs).toBe(started.startedAtMs);
    expect(getElapsedSeconds(updated, now + 10_000)).toBe(10);
  });
});
