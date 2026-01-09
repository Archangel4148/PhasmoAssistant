async function update() {
    const resp = await fetch('/status');
    const data = await resp.json();
    document.getElementById('status').innerText = JSON.stringify(data, null, 2);

    // Dark mode toggle
    if (data.dark_mode) {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
}

// Poll every 0.5s
setInterval(update, 500);

async function sendCommand(cmd) {
    await fetch('/command', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({command: cmd})
    });
}
