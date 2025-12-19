import json
import queue
import sys
import sounddevice as sd

from vosk import Model, KaldiRecognizer

from constants import RECOGNIZED_KEYWORDS

q = queue.Queue()

def callback(indata, frames, time, status):
    """This is called (from a separate thread) for each audio block."""
    if status:
        print(status, file=sys.stderr)
    q.put(bytes(indata))

# print(sd.query_devices())

# None for system default
device = None

# Use device default sample rate
device_info = sd.query_devices(device, "input")
sample_rate = int(device_info["default_samplerate"])

model = Model(lang="en-us")

with sd.RawInputStream(samplerate=sample_rate, blocksize=8000, device=device,
                       dtype="int16", channels=1, callback=callback):
    print("Starting recognition loop...")
    grammar = json.dumps(RECOGNIZED_KEYWORDS)
    rec = KaldiRecognizer(model, sample_rate, grammar)
    rec.SetWords(True)
    rec.SetPartialWords(True)

    triggered = set()
    while True:
        data = q.get()
        if rec.AcceptWaveform(data):  # Final phrase detected
            res = rec.Result()
            res_dict = json.loads(res)
            text = res_dict.get("text", "").lower()
            triggered.clear()  # Reset debounce for next phrase

        # Always check partial for live detection
        partial = rec.PartialResult()
        res_dict = json.loads(partial)
        text = res_dict.get("partial", "").lower()
        # print(text)

        for keyword in RECOGNIZED_KEYWORDS:
            key = keyword.lower()
            if key in text and key not in triggered:
                print(f"Trigger detected: {keyword}")
                triggered.add(key)
