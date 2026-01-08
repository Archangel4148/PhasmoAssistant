import time

import playsound3 as ps
from pathlib import Path

class SoundPlayer:
    def __init__(self):
        self._active = set()

    # Works as a context manager
    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.stop_all()

    def play(self, path: str | Path, block: bool = False) -> None:
        # Plays the provided sound and saves a reference so it can be stopped
        sound = ps.playsound(str(path), block=block)
        self._active.add(sound)

    def stop_all(self):
        # Stops all currently playing (saved) sounds
        for sound in self._active:
            sound.stop()
        self._active.clear()

    @staticmethod
    def play_once(path: str | Path) -> None:
        # Plays the provided sound once and does not save a reference
        ps.playsound(str(path), block=False)

if __name__ == '__main__':
    # Simple test of overlapping sounds and stop_all
    player = SoundPlayer()
    player.play("sounds/test.wav")
    time.sleep(3)
    player.play_once("sounds/test.wav")
    time.sleep(2)
    player.stop_all()
    time.sleep(3)
