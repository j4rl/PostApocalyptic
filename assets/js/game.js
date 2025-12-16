const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tileW = 96;
const tileH = 48;
const originY = 80;

const grid = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 2, 1, 0, 0, 1],
    [1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 2, 2, 0, 0, 0, 0, 0, 3, 0, 1],
    [1, 0, 2, 1, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 2, 2, 2, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const palette = {
    floor: "#162032",
    highlight: "#263350",
    hazard: "#2c2131",
    wall: "#1b1f2b",
    glow: "#ffb347",
    console: "#1f2a3f",
};

const pointsOfInterest = [
    { id: "vault-console", col: 4, row: 3, label: "Vault-konsol" },
    { id: "abandoned-pod", col: 9, row: 5, label: "Övergiven sovkapsel" },
    { id: "old-gate", col: 7, row: 1, label: "Stängd port" },
];

const player = {
    col: 2,
    row: 2,
    frame: 0,
    frameTime: 0,
    health: 100,
    special: {
        strength: 5,
        perception: 6,
        endurance: 5,
        charisma: 4,
        intelligence: 7,
        agility: 6,
        luck: 5,
    },
    actionPoints: 0,
};

const choices = [
    {
        id: "hack-console",
        label: "Hacka Vault-konsolen (INT + LCK)",
        description: "Återställ kraft till gamla system.",
        stat: "intelligence",
        difficulty: 10,
        onSuccess: () => addLog("System", "Konsolen glimmar till; portarna blir mjuka att öppna."),
    },
    {
        id: "convince-dweller",
        label: "Övertala Vault-dweller (CHA + LCK)",
        description: "Få information om vägen till reningsverket.",
        stat: "charisma",
        difficulty: 8,
        onSuccess: () => addLog("Diplomati", "Du vinner förtroende och får koordinater till vattenledningar."),
    },
    {
        id: "vats-shot",
        label: "V.A.T.S.-skott mot sensor (PER + AGI)",
        description: "Disarmera ett torn utan att slösa ammo.",
        stat: "perception",
        difficulty: 9,
        onSuccess: () => addLog("V.A.T.S.", "Precisionsträff! Tornet stängs ner."),
    },
    {
        id: "salvage",
        label: "Skrota gammalt vrak (STR + END)",
        description: "Få fram reservdelar till rustningen.",
        stat: "strength",
        difficulty: 7,
        onSuccess: () => addLog("Skrot", "Du hittar koppartråd och ren titan."),
    },
];

let lastStep = 0;
let messageLog = [];

function isoToScreen(col, row) {
    const x = (col - row) * (tileW / 2) + canvas.width / 2;
    const y = (col + row) * (tileH / 2) + originY;
    return { x, y };
}

function isWalkable(col, row) {
    const tile = grid[row]?.[col];
    return tile !== undefined && tile !== 1;
}

function drawTile(col, row) {
    const tile = grid[row][col];
    const { x, y } = isoToScreen(col, row);

    const topColor =
        tile === 1
            ? palette.wall
            : tile === 2
            ? palette.hazard
            : tile === 3
            ? palette.console
            : palette.floor;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + tileW / 2, y + tileH / 2);
    ctx.lineTo(x, y + tileH);
    ctx.lineTo(x - tileW / 2, y + tileH / 2);
    ctx.closePath();
    ctx.fillStyle = topColor;
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();

    if (tile === 1) {
        const h = 26;
        ctx.beginPath();
        ctx.moveTo(x - tileW / 2, y + tileH / 2);
        ctx.lineTo(x - tileW / 2, y + tileH / 2 - h);
        ctx.lineTo(x, y + tileH - h);
        ctx.lineTo(x, y + tileH);
        ctx.closePath();
        ctx.fillStyle = "#111520";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + tileW / 2, y + tileH / 2);
        ctx.lineTo(x + tileW / 2, y + tileH / 2 - h);
        ctx.lineTo(x, y + tileH - h);
        ctx.lineTo(x, y + tileH);
        ctx.closePath();
        ctx.fillStyle = "#0c0f17";
        ctx.fill();
    }

    if (tile === 2) {
        ctx.strokeStyle = palette.glow;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    if (tile === 3) {
        ctx.fillStyle = "rgba(126, 196, 194, 0.08)";
        ctx.fill();
    }
}

function drawPOI() {
    pointsOfInterest.forEach((poi) => {
        const { x, y } = isoToScreen(poi.col, poi.row);
        ctx.beginPath();
        ctx.arc(x, y + tileH / 2 - 10, 10, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 193, 77, 0.7)";
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.stroke();
    });
}

function drawPlayer() {
    const { x, y } = isoToScreen(player.col, player.row);
    const bob = Math.sin(Date.now() / 160) * 3;

    ctx.save();
    ctx.translate(x, y + tileH / 2 - 18 + bob);

    const suit = ctx.createLinearGradient(-12, -32, 12, 8);
    suit.addColorStop(0, "#2d364e");
    suit.addColorStop(1, "#1b2236");
    ctx.fillStyle = suit;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.stroke();

    ctx.fillStyle = "#f7c14d";
    ctx.beginPath();
    ctx.arc(0, -12, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0f1118";
    ctx.beginPath();
    ctx.arc(-3, -12, 3, 0, Math.PI * 2);
    ctx.arc(3, -12, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = palette.glow;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(0, -32);
    ctx.moveTo(0, -32);
    ctx.lineTo(4, -36);
    ctx.stroke();

    ctx.restore();
}

function drawHighlights() {
    pointsOfInterest.forEach((poi) => {
        const distance = Math.abs(player.col - poi.col) + Math.abs(player.row - poi.row);
        if (distance <= 2 + Math.floor(player.special.perception / 3)) {
            const { x, y } = isoToScreen(poi.col, poi.row);
            ctx.beginPath();
            ctx.arc(x, y + tileH / 2 - 10, 20, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 193, 77, 0.35)";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            drawTile(col, row);
        }
    }

    drawHighlights();
    drawPOI();
    drawPlayer();
}

function move(dx, dy) {
    const now = Date.now();
    if (now - lastStep < 140 - player.special.agility * 4) return;
    const targetCol = player.col + dx;
    const targetRow = player.row + dy;
    if (!isWalkable(targetCol, targetRow)) {
        addLog("Rörelse", "Blockerad väg i ruinerna.");
        lastStep = now;
        return;
    }
    player.col = targetCol;
    player.row = targetRow;
    lastStep = now;
    handleTileEffects();
}

function handleTileEffects() {
    const tile = grid[player.row][player.col];
    if (tile === 2) {
        const resist = 2 + Math.floor(player.special.endurance / 2);
        const dmg = Math.max(2, 8 - resist);
        player.health = Math.max(0, player.health - dmg);
        addLog("Strålning", `Du tar ${dmg} skada. HP: ${player.health}`);
    }
    if (tile === 3) {
        addLog("Teknik", "Du står vid en gammal terminal. Försök interagera i panelen.");
    }
}

function addLog(source, text) {
    const line = { source, text, time: new Date().toISOString() };
    messageLog = [line, ...messageLog].slice(0, 30);
    const log = document.getElementById("log");
    log.innerHTML = messageLog
        .map((entry) => `<div class="log-entry"><strong>${entry.source}</strong>: ${entry.text}</div>`)
        .join("");
}

function updateSpecialBars() {
    const container = document.getElementById("special-bars");
    container.innerHTML = "";
    const labels = ["Strength", "Perception", "Endurance", "Charisma", "Intelligence", "Agility", "Luck"];
    labels.forEach((label) => {
        const key = label.toLowerCase();
        const value = player.special[key];
        const bar = document.createElement("div");
        bar.className = "bar";
        const fill = document.createElement("div");
        fill.className = "bar-fill";
        fill.style.width = `${(value / 10) * 100}%`;
        const text = document.createElement("div");
        text.className = "bar-label";
        text.textContent = `${label.substring(0, 3).toUpperCase()} ${value}`;
        bar.appendChild(fill);
        bar.appendChild(text);
        container.appendChild(bar);
    });
    player.actionPoints = 4 + Math.floor(player.special.agility / 2);
}

function renderChoices() {
    const host = document.getElementById("choices");
    host.innerHTML = "";
    const tpl = document.getElementById("choice-template");
    choices.forEach((choice) => {
        const node = tpl.content.firstElementChild.cloneNode(true);
        node.textContent = `${choice.label} — ${choice.description}`;
        node.addEventListener("click", () => resolveChoice(choice));
        host.appendChild(node);
    });
}

function resolveChoice(choice) {
    const mainStat = player.special[choice.stat] ?? 0;
    const luck = player.special.luck ?? 0;
    const roll = Math.random() * 10 + luck * 0.5;
    const score = mainStat + roll;
    const success = score >= choice.difficulty;

    if (success) {
        addLog("Val", `${choice.label} lyckas (resultat ${score.toFixed(1)}).`);
        choice.onSuccess?.();
    } else {
        addLog("Val", `${choice.label} misslyckas (resultat ${score.toFixed(1)}).`);
    }
    sendChoice(choice.id, success, score);
}

async function sendChoice(id, success, score) {
    try {
        await fetch("api/log_choice.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                choice: id,
                success,
                score,
                col: player.col,
                row: player.row,
            }),
        });
    } catch (err) {
        addLog("Server", "Misslyckades logga valet (ingen backend?).");
    }
}

async function savePlayer() {
    try {
        const res = await fetch("api/save_player.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "VaultDweller",
                col: player.col,
                row: player.row,
                health: player.health,
                special: player.special,
            }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Okänt fel");
        addLog("Server", "Status sparad i databasen.");
    } catch (err) {
        addLog("Server", "Kunde inte spara (databas saknas?).");
    }
}

async function loadPlayer() {
    try {
        const res = await fetch("api/load_player.php");
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Okänt fel");
        Object.assign(player.special, data.player.special);
        player.col = data.player.col;
        player.row = data.player.row;
        player.health = data.player.health;
        updateSpecialBars();
        addLog("Server", "Laddade senaste sparningen.");
    } catch (err) {
        addLog("Server", "Ingen sparning hittades.");
    }
}

function setupUI() {
    updateSpecialBars();
    renderChoices();
    addLog("System", "Välkommen till Atom Wasteland. Utforska och ta beslut.");

    document.addEventListener("keydown", (e) => {
        if (["ArrowUp", "KeyW"].includes(e.code)) move(0, -1);
        if (["ArrowDown", "KeyS"].includes(e.code)) move(0, 1);
        if (["ArrowLeft", "KeyA"].includes(e.code)) move(-1, 0);
        if (["ArrowRight", "KeyD"].includes(e.code)) move(1, 0);
    });

    document.getElementById("btn-save").addEventListener("click", savePlayer);
    document.getElementById("btn-load").addEventListener("click", loadPlayer);
}

function loop() {
    render();
    requestAnimationFrame(loop);
}

setupUI();
loop();
