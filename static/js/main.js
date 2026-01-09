async function update() {
    const resp = await fetch('/status');
    const data = await resp.json();
    // Debug to display full data
    // document.getElementById('status').innerText = JSON.stringify(data, null, 2);

    // Dark mode toggle
    if (data.dark_mode) {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }

    // Ghost cards
    renderGhosts(data.possible_ghosts || []);
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

// Render a card for each ghost in the possible ghost list
function renderGhosts(ghosts) {
    const container = document.getElementById("ghost-list");
    container.innerHTML = "";

    ghosts.forEach(ghost => {
        const card = document.createElement("div");
        card.className = "ghost-card";

        const name = document.createElement("div");
        name.className = "ghost-name";
        name.innerText = ghost.name;

        const evidenceList = document.createElement("div");
        evidenceList.className = "evidence-list";

        ghost.evidence_required.forEach(ev => {
            const pill = document.createElement("span");
            pill.className = "evidence-pill";
            pill.innerText = ev.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
            evidenceList.appendChild(pill);
        });

        card.appendChild(name);
        card.appendChild(evidenceList);
        container.appendChild(card);
    });
}