import json
import queue
import time
from threading import Thread

import sounddevice as sd
from vosk import Model, KaldiRecognizer


class VoiceRecognizer:
    def __init__(self, keywords: list[str], model_lang: str = "en-us", device: int = None, sample_rate: float = None,
                 chunk_size: int = 16000):
        """
        keywords: list of strings to detect
        model_lang: Vosk model language
        device: sounddevice device index (None for default)
        sample_rate: optional sample rate (None to use device default)
        chunk_size: how many bytes to accumulate before feeding Vosk
        """
        self.keywords = [k.lower() for k in keywords]
        self.model_lang = model_lang
        self.device = device
        self.chunk_size = chunk_size

        # Get sample rate
        if sample_rate is None:
            self.sample_rate = int(sd.query_devices(device, "input")["default_samplerate"])
        else:
            self.sample_rate = sample_rate

        # Initialize Vosk model and recognizer
        self.model = Model(lang=self.model_lang)
        self.recognizer = KaldiRecognizer(self.model, self.sample_rate, json.dumps(self.keywords))
        self.recognizer.SetWords(True)
        self.recognizer.SetPartialWords(True)

        # Thread-safe queue for audio data
        self._queue = queue.Queue()
        self._buffer = b""
        self._triggered = set()
        self._running = False

        # Optional callback for when a keyword triggers
        self.on_trigger = None

        self._thread = None

    def _audio_callback(self, indata, frames, time_info, status):
        if status:
            print(status)
        self._queue.put(bytes(indata))

    def _recognition_loop(self):
        with sd.RawInputStream(
                samplerate=self.sample_rate,
                device=self.device,
                dtype="int16",
                channels=1,
                callback=self._audio_callback
        ):
            print("Voice recognizer started...")
            while self._running:
                try:
                    data = self._queue.get(timeout=0.1)  # short timeout to allow clean stop
                except queue.Empty:
                    continue

                self._buffer += data

                while len(self._buffer) >= self.chunk_size:
                    chunk, self._buffer = self._buffer[:self.chunk_size], self._buffer[self.chunk_size:]

                    if self.recognizer.AcceptWaveform(chunk):
                        res = json.loads(self.recognizer.Result())
                        text = res.get("text", "").lower()
                        self._handle_text(text)
                        self._triggered.clear()  # reset debounce after final result
                    else:
                        res = json.loads(self.recognizer.PartialResult())
                        text = res.get("partial", "").lower()
                        self._handle_text(text)

    def _handle_text(self, text):
        for keyword in self.keywords:
            if keyword in text and keyword not in self._triggered:
                if self.on_trigger:
                    self.on_trigger(keyword)
                self._triggered.add(keyword)


    def start(self, on_trigger=None, background=False):
        """
        Start recognition loop.
        on_trigger: optional function(keyword: str) called whenever a keyword is detected
        background: if True, run in a background thread
        """
        self.on_trigger = on_trigger
        self._running = True

        if background:
            self._thread = Thread(target=self._recognition_loop, daemon=True)
            self._thread.start()
        else:
            self._recognition_loop()

        # with sd.RawInputStream(
        #         samplerate=self.sample_rate,
        #         device=self.device,
        #         dtype="int16",
        #         channels=1,
        #         callback=self._audio_callback
        # ):
        #     print("Voice recognizer started...")
        #     while self._running:
        #         data = self._queue.get()
        #         self._buffer += data
        #
        #         while len(self._buffer) >= self.chunk_size:
        #             chunk, self._buffer = self._buffer[:self.chunk_size], self._buffer[self.chunk_size:]
        #
        #             if self.recognizer.AcceptWaveform(chunk):
        #                 res = json.loads(self.recognizer.Result())
        #                 text = res.get("text", "").lower()
        #                 self._handle_text(text)
        #                 self._triggered.clear()  # reset debounce after final result
        #             else:
        #                 res = json.loads(self.recognizer.PartialResult())
        #                 text = res.get("partial", "").lower()
        #                 self._handle_text(text)

    def stop(self):
        """Stop the recognition loop."""
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join()


if __name__ == '__main__':
    from sound_player import SoundPlayer
    from constants import RECOGNIZED_KEYWORDS

    sound_player = SoundPlayer()

    def handle_keyword(keyword):
        print(f"Trigger detected: {keyword}")
        sound_player.play("sounds/beep.wav")


    # Create recognizer
    recognizer = VoiceRecognizer(RECOGNIZED_KEYWORDS)

    # Start the recognizer
    recognizer.start(on_trigger=handle_keyword, background=True)

    # Continue doing important main thread work
    for i in range(10):
        print(i)
        time.sleep(1)

    # Stop recognizer
    recognizer.stop()
    print("RECOGNIZER STOPPED")

    # Recognizer should no longer be running
    for i in range(10, 15):
        print(i)
        time.sleep(1)