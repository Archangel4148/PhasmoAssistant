import time
from dataclasses import asdict

from constants import RECOGNIZED_KEYWORDS
from game import GameState
from sound_player import SoundPlayer
from voice_recognition import VoiceRecognizer
from web_interface import GameServer

# Initialize sound player
sound_player = SoundPlayer()

# Initialize game state
game_state = GameState()


# Function to handle triggers
def handle_keyword(keyword):
    global game_state
    print(f"Trigger detected: {keyword}")
    sound_player.play("sounds/beep.wav")

    # Handling for keywords
    if keyword == "trigger dark mode":
        game_state.dark_mode = not game_state.dark_mode
    elif keyword == "trigger narration level one":
        game_state.narration_level = 1
    elif keyword == "trigger narration level two":
        game_state.narration_level = 2
    elif keyword == "trigger narration level three":
        game_state.narration_level = 3


# Create and start recognizer
recognizer = VoiceRecognizer(RECOGNIZED_KEYWORDS)
recognizer.start(on_trigger=handle_keyword, background=True)


# Button callbacks for web server
def start_game():
    pass


def end_game():
    pass


def reset_keywords():
    pass


# Create and start web server
server = GameServer(initial_state=asdict(game_state))
server.register_command("start_game", start_game)
server.register_command("end_game", end_game)
server.register_command("reset_keywords", reset_keywords)
server.start(open_browser=False)

print("PhasmoAssistant running. Press Ctrl+C to exit.")
try:
    while True:
        # Push latest game state to server
        server.update_state(asdict(game_state))
        time.sleep(0.1)
except KeyboardInterrupt:
    print("Shutting down...")