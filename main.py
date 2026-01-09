import time
from dataclasses import asdict

from constants import RECOGNIZED_KEYWORDS, GameState, ALL_GHOSTS, EvidenceType
from game import get_remaining_ghosts
from sound_player import SoundPlayer
from voice_recognition import VoiceRecognizer
from web_interface import GameServer

# Initialize sound player
sound_player = SoundPlayer()

# Default game state
default_game_state = GameState(evidence_found=[], possible_ghosts=ALL_GHOSTS)
game_state = default_game_state.copy()


# Function to handle triggers
def handle_keyword(keyword):
    global game_state
    print(f"Trigger detected: {keyword}")
    sound_player.play("sounds/beep.wav")

    # Trigger actions
    if keyword == "trigger dark mode":
        game_state.dark_mode = not game_state.dark_mode
    elif keyword == "trigger reset game state":
        dark = game_state.dark_mode
        game_state = default_game_state.copy()
        game_state.dark_mode = dark  # Persist dark mode state
    elif keyword == "trigger narration level one":
        game_state.narration_level = 1
    elif keyword == "trigger narration level two":
        game_state.narration_level = 2
    elif keyword == "trigger narration level three":
        game_state.narration_level = 3

    # Evidence confirms
    elif keyword.split()[0] == "confirm":
        # Handle EMF level 5 (different keyword vs evidence name)
        if keyword == "confirm level five":
            game_state.evidence_found.append(EvidenceType.EMF_5)
        # Handle other evidence types
        else:
            # Parse the evidence name from the keyword
            evidence = "_".join(keyword.split()[1:]).lower()
            game_state.evidence_found.append(EvidenceType(evidence))

        # Update possible ghosts with new evidence
        game_state.possible_ghosts = get_remaining_ghosts(game_state.possible_ghosts, game_state.evidence_found)

# Create and start recognizer
recognizer = VoiceRecognizer(RECOGNIZED_KEYWORDS)
recognizer.start(on_trigger=handle_keyword, background=True)


# Button callbacks for web server
def reset():
    # Reset the game state
    global game_state
    game_state = default_game_state.copy()


def dark_mode():
    # Toggle dark mode
    global game_state
    game_state.dark_mode = not game_state.dark_mode


# Create web server
server = GameServer(initial_state=asdict(game_state))

# Connect UI commands to callbacks
server.register_command("reset", reset)
server.register_command("dark_mode", dark_mode)

# Start the server
server.start(open_browser=False)

print("PhasmoAssistant running. Press Ctrl+C to exit.")
try:
    while True:
        # Push latest game state to server
        server.update_state(asdict(game_state))
        time.sleep(0.1)
except KeyboardInterrupt:
    print("Shutting down...")
