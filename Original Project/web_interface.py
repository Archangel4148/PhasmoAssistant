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
