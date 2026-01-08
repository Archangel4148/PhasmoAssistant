import time

from constants import RECOGNIZED_KEYWORDS
from sound_player import SoundPlayer
from voice_recognition import VoiceRecognizer

# Function to handle triggers
def handle_keyword(keyword):
    print(f"Trigger detected: {keyword}")
    sound_player.play("sounds/beep.wav")

# Initialize sound player
sound_player = SoundPlayer()

# Create and start recognizer
recognizer = VoiceRecognizer(RECOGNIZED_KEYWORDS)
recognizer.start(on_trigger=handle_keyword, background=True)

try:
    counter = 0
    while True:
        # Example main-thread "work" (demonstrates non-blocking)
        print(f"Main thread doing work... {counter}")
        counter += 1
        time.sleep(1)  # simulate other processing / UI updates

        # In the future this could update a local webserver or GUI
except KeyboardInterrupt:
    print("Keyboard interrupt received. Shutting down...")
finally:
    recognizer.stop()
    print("Recognizer stopped. Exiting program.")