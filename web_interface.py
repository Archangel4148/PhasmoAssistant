import logging
import threading
import time
from dataclasses import asdict, dataclass

from flask import Flask, jsonify, render_template, request


class GameServer:
    def __init__(self, port=5000, initial_state: dict = None):
        self.port = port
        self.app = Flask(__name__)
        self._thread = None
        self.game_state = {}
        self.command_callbacks = {}

        if initial_state:
            self.game_state = initial_state.copy()

        # Hide logs
        log = logging.getLogger('werkzeug')
        log.setLevel(logging.ERROR)

        # Routes
        self.app.add_url_rule("/", "index", self._index)
        self.app.add_url_rule("/status", "status", self._status)
        self.app.add_url_rule("/command", "command", self._command, methods=["POST"])

    def _index(self):
        return render_template("index.html")

    def _status(self):
        return jsonify(self.game_state)

    def _command(self):
        data = request.get_json()
        cmd = data.get("command")
        if cmd and cmd in self.command_callbacks:
            self.command_callbacks[cmd]()
            return "OK", 200
        return "Unknown command", 400

    def register_command(self, command: str, callback):
        """Register a command that can be triggered from the web UI"""
        self.command_callbacks[command] = callback

    def start(self, open_browser=True):
        """Start the Flask server in a background thread"""

        def run():
            self.app.run(port=self.port, debug=False, use_reloader=False)

        self._thread = threading.Thread(target=run, daemon=True)
        self._thread.start()

        if open_browser:
            import webbrowser
            webbrowser.open(f"http://127.0.0.1:{self.port}")

        print(f"Web UI running on http://127.0.0.1:{self.port}")

    def update_state(self, new_state: dict):
        """Update the current game state"""
        self.game_state = new_state.copy()


if __name__ == '__main__':
    @dataclass
    class GameState:
        detected_keywords: list[str]
        ghost_level: int
        spirit_box_active: bool

    game_running = False

    def start_game():
        global game_running
        print("Start game pressed!")
        game_running = True


    def end_game():
        global game_running
        print("End game pressed!")
        game_running = False


    def reset_keywords():
        print("Reset keywords pressed!")
        state.detected_keywords.clear()


    # Start server
    server = GameServer()
    server.register_command("start_game", start_game)
    server.register_command("end_game", end_game)
    server.register_command("reset_keywords", reset_keywords)
    server.start()

    # Example dynamic state
    state = GameState(detected_keywords=[], ghost_level=0, spirit_box_active=False)
    counter = 1

    try:
        while True:
            if not game_running:
                continue
            state.ghost_level = counter % 10
            state.spirit_box_active = (counter % 2 == 0)
            if counter % 3 == 0:
                state.detected_keywords.append(f"keyword_{counter}")
            server.update_state(asdict(state))
            counter += 1
            time.sleep(2)
    except KeyboardInterrupt:
        print("Exiting demo...")
