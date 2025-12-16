const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Hex-konfiguration (flat-top) med isometrisk projektion.
const hexSize = 46; // radie på hex-toppen
const originX = canvas.width / 2;
const originY = 140;
const isoScaleX = 0.95; // sprider ut X för iso
const isoScaleY = 0.55; // komprimerar Y-led för iso
const isoSquash = 0.7;  // komprimerar hexans höjd för iso-look

const palette = {
    floor: "#171b24",
    highlight: "#2c3a52",
    hazard: "#3a2723",
    wall: "#1d202b",
    glow: "#f7c14d",
    console: "#1f2a3f",
    metal: "#2e3848",
    rust: "#a35c39",
    patina: "#4fa5a2",
    oxide: "#7e6a4f",
};

const groundPattern = createGroundPattern();

// 0 = golv, 1 = vägg, 2 = hazard, 3 = konsol/teknik
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

const pointsOfInterest = [
    { id: "vault-console", col: 4, row: 3, label: "Vault-konsol" },
    { id: "abandoned-pod", col: 9, row: 5, label: "Övergiven sovkapsel" },
    { id: "old-gate", col: 7, row: 1, label: "Stängd port" },
];

const objects = [
    { type: "terminal", col: 4, row: 3 },
    { type: "door", col: 7, row: 1 },
    { type: "wreck", col: 9, row: 5 },
    { type: "gate", col: 7, row: 7 },
    { type: "shack", col: 3, row: 8 },
    { type: "resource", col: 2, row: 5 },
];

const player = {
    col: 2,
    row: 2,
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
let pathQueue = [];

function createGroundPattern() {
    const off = document.createElement("canvas");
    off.width = 220;
    off.height = 220;
    const c = off.getContext("2d");

    const grad = c.createRadialGradient(110, 110, 8, 110, 110, 150);
    grad.addColorStop(0, "#141822");
    grad.addColorStop(1, "#0c0f17");
    c.fillStyle = grad;
    c.fillRect(0, 0, off.width, off.height);

    // Damm/askar
    for (let i = 0; i < 380; i++) {
        const x = Math.random() * off.width;
        const y = Math.random() * off.height;
        const alpha = 0.04 + Math.random() * 0.08;
        const size = 1 + Math.random() * 2.5;
        c.fillStyle = `rgba(255, 214, 170, ${alpha})`;
        c.fillRect(x, y, size, size);
    }
    for (let i = 0; i < 360; i++) {
        const x = Math.random() * off.width;
        const y = Math.random() * off.height;
        const alpha = 0.03 + Math.random() * 0.05;
        const size = 1 + Math.random() * 2.5;
        c.fillStyle = `rgba(80, 140, 150, ${alpha})`;
        c.fillRect(x, y, size, size);
    }

    // Spruckna linjer
    c.strokeStyle = "rgba(255,255,255,0.04)";
    c.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
        const startX = Math.random() * off.width;
        const startY = Math.random() * off.height;
        const len = 30 + Math.random() * 60;
        c.beginPath();
        c.moveTo(startX, startY);
        c.lineTo(startX + (Math.random() - 0.5) * len, startY + (Math.random() - 0.5) * len);
        c.stroke();
    }

    return c.createPattern(off, "repeat");
}

function drawShadow(x, y, rx, ry, alpha = 0.35) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawChips(x, y, w, h, color, count = 6) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
        const rx = -w / 2 + Math.random() * w;
        const ry = -h / 2 + Math.random() * h;
        const rw = 2 + Math.random() * 4;
        const rh = 1 + Math.random() * 3;
        ctx.fillRect(rx, ry, rw, rh);
    }
    ctx.restore();
}

function offsetToAxial(col, row) {
    const q = col;
    const r = row - (col - (col & 1)) / 2;
    return { q, r };
}

function axialDistance(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

function offsetToPixel(col, row) {
    const axial = offsetToAxial(col, row);
    const isoX = (axial.q - axial.r) * hexSize * isoScaleX;
    const isoY = (axial.q + axial.r) * hexSize * isoScaleY;
    return { x: originX + isoX, y: originY + isoY };
}

function isWalkable(col, row) {
    const tile = grid[row]?.[col];
    return tile !== undefined && tile !== 1;
}

function drawHexTop(x, y, size, color, stroke = false) {
    const h = (Math.sqrt(3) / 2) * size * isoSquash;
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x - size / 2, y - h);
    ctx.lineTo(x + size / 2, y - h);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x + size / 2, y + h);
    ctx.lineTo(x - size / 2, y + h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (stroke) {
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.stroke();
    }
}

function drawTile(col, row) {
    const tile = grid[row][col];
    const { x, y } = offsetToPixel(col, row);
    if (tile === 0) return; // golv är endast textur

    if (tile === 2) {
        ctx.save();
        ctx.globalAlpha = 0.78;
        drawHexTop(x, y, hexSize, palette.hazard, false);
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = palette.glow;
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        drawHexTop(x, y, hexSize - 4, "rgba(0,0,0,0)", true);
        ctx.restore();
    } else if (tile === 3) {
        ctx.save();
        ctx.globalAlpha = 0.75;
        drawHexTop(x, y, hexSize, palette.console, false);
        ctx.restore();
    } else if (tile === 1) {
        drawHexTop(x, y, hexSize, palette.wall, false);
        // Sidor för murar, lätt iso-skuggning
        ctx.save();
        const h = (Math.sqrt(3) / 2) * hexSize * isoSquash;
        ctx.fillStyle = "rgba(12,14,22,0.9)";
        ctx.beginPath();
        ctx.moveTo(x - hexSize, y);
        ctx.lineTo(x - hexSize / 2, y + h);
        ctx.lineTo(x - hexSize / 2, y + h + 18);
        ctx.lineTo(x - hexSize, y + 18);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "rgba(5,6,12,0.9)";
        ctx.beginPath();
        ctx.moveTo(x + hexSize, y);
        ctx.lineTo(x + hexSize / 2, y + h);
        ctx.lineTo(x + hexSize / 2, y + h + 18);
        ctx.lineTo(x + hexSize, y + 18);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

function drawPOI() {
    pointsOfInterest.forEach((poi) => {
        const { x, y } = offsetToPixel(poi.col, poi.row);
        ctx.beginPath();
        ctx.arc(x, y - 6, 10, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 193, 77, 0.7)";
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.stroke();
    });
}

function drawObject(obj) {
    const { x, y } = offsetToPixel(obj.col, obj.row);
    ctx.save();
    ctx.translate(x, y - 6);

    switch (obj.type) {
        case "terminal": {
            drawShadow(0, 16, 18, 8, 0.45);
            const body = ctx.createLinearGradient(-16, -34, 16, 16);
            body.addColorStop(0, "#2a3751");
            body.addColorStop(1, "#0e141f");
            ctx.fillStyle = body;
            ctx.roundRect(-16, -34, 32, 52, 6);
            ctx.fill();

            ctx.fillStyle = palette.glow;
            ctx.roundRect(-12, -24, 24, 14, 3);
            ctx.fill();

            ctx.fillStyle = "#0f1118";
            ctx.roundRect(-12, -6, 24, 6, 2);
            ctx.fill();

            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.fillRect(-6, -2, 12, 2);

            drawChips(0, -4, 30, 28, "rgba(255,255,255,0.08)", 8);
            drawChips(0, -4, 30, 28, "rgba(0,0,0,0.2)", 6);
            break;
        }
        case "door": {
            drawShadow(0, 18, 14, 6, 0.38);
            const frame = ctx.createLinearGradient(-12, -42, 12, 18);
            frame.addColorStop(0, "#303c4e");
            frame.addColorStop(1, "#0a0e16");
            ctx.fillStyle = frame;
            ctx.roundRect(-12, -42, 24, 60, 6);
            ctx.fill();

            ctx.fillStyle = "#0f141d";
            ctx.roundRect(-8, -32, 16, 42, 3);
            ctx.fill();

            ctx.fillStyle = palette.glow;
            ctx.roundRect(-3, -20, 6, 10, 2);
            ctx.fill();

            drawChips(0, -6, 24, 38, "rgba(255,255,255,0.08)", 8);
            drawChips(0, -6, 24, 38, "rgba(0,0,0,0.2)", 6);
            break;
        }
        case "wreck": {
            drawShadow(0, 12, 30, 10, 0.5);
            const hull = ctx.createLinearGradient(-28, -10, 28, 14);
            hull.addColorStop(0, "#8f563c");
            hull.addColorStop(1, "#4a241b");
            ctx.fillStyle = hull;
            ctx.beginPath();
            ctx.ellipse(0, 0, 30, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.beginPath();
            ctx.ellipse(-6, -2, 10, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(255,200,150,0.25)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-16, -6);
            ctx.lineTo(12, -8);
            ctx.stroke();

            drawChips(0, 0, 32, 16, "rgba(255,255,255,0.08)", 10);
            break;
        }
        case "gate": {
            drawShadow(0, 16, 26, 8, 0.38);
            ctx.strokeStyle = "#5d6c80";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(-26, 14);
            ctx.lineTo(-26, -18);
            ctx.moveTo(26, 14);
            ctx.lineTo(26, -18);
            ctx.stroke();

            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, -18, 26, Math.PI, 0);
            ctx.stroke();

            ctx.strokeStyle = "rgba(247,193,77,0.4)";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(-20, -4);
            ctx.lineTo(20, -4);
            ctx.stroke();
            ctx.setLineDash([]);

            drawChips(0, -4, 40, 20, "rgba(255,255,255,0.08)", 8);
            drawChips(0, -4, 40, 20, "rgba(0,0,0,0.18)", 6);
            break;
        }
        case "shack": {
            drawShadow(0, 16, 30, 10, 0.42);
            ctx.fillStyle = "#1c232f";
            ctx.fillRect(-26, -18, 52, 30);
            const roof = ctx.createLinearGradient(-26, -30, 26, -10);
            roof.addColorStop(0, "#2d3a52");
            roof.addColorStop(1, "#182131");
            ctx.fillStyle = roof;
            ctx.fillRect(-26, -32, 52, 14);
            ctx.fillStyle = palette.glow;
            ctx.fillRect(8, -2, 12, 6);
            ctx.fillStyle = "#0b0f16";
            ctx.fillRect(-6, -6, 12, 18);

            drawChips(0, -8, 50, 30, "rgba(255,255,255,0.07)", 10);
            drawChips(0, -8, 50, 30, "rgba(0,0,0,0.2)", 8);
            break;
        }
        case "resource": {
            drawShadow(0, 12, 18, 6, 0.4);
            const crate = ctx.createLinearGradient(-18, -16, 18, 10);
            crate.addColorStop(0, "#4fa5a2");
            crate.addColorStop(1, "#2c6f6e");
            ctx.fillStyle = crate;
            ctx.roundRect(-18, -16, 36, 24, 4);
            ctx.fill();

            ctx.strokeStyle = "rgba(255,255,255,0.25)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-18, -4);
            ctx.lineTo(18, -4);
            ctx.moveTo(0, -16);
            ctx.lineTo(0, 8);
            ctx.stroke();

            drawChips(0, -2, 32, 18, "rgba(0,0,0,0.15)", 8);
            drawChips(0, -2, 32, 18, "rgba(255,255,255,0.08)", 6);
            break;
        }
        default:
            break;
    }
    ctx.restore();
}

function drawObjects() {
    objects.forEach(drawObject);
}

function drawPlayer() {
    const { x, y } = offsetToPixel(player.col, player.row);
    const bob = Math.sin(Date.now() / 160) * 3;

    ctx.save();
    ctx.translate(x, y - 10 + bob);

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

    drawChips(0, -6, 26, 26, "rgba(0,0,0,0.1)", 5);
    ctx.restore();
}

function drawHighlights() {
    pointsOfInterest.forEach((poi) => {
        const distance = axialDistance(offsetToAxial(player.col, player.row), offsetToAxial(poi.col, poi.row));
        if (distance <= 2 + Math.floor(player.special.perception / 3)) {
            const { x, y } = offsetToPixel(poi.col, poi.row);
            ctx.beginPath();
            ctx.arc(x, y - 6, 22, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 193, 77, 0.35)";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.fillStyle = groundPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            drawTile(col, row);
        }
    }

    drawHighlights();
    drawObjects();
    drawPOI();
    drawPlayer();
}

function neighborCoords(col, row) {
    const evenDeltas = [
        [1, 0],
        [0, -1],
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, 1],
    ];
    const oddDeltas = [
        [1, 0],
        [1, -1],
        [0, -1],
        [-1, 0],
        [0, 1],
        [1, 1],
    ];
    const deltas = row % 2 === 0 ? evenDeltas : oddDeltas;
    return deltas
        .map(([dc, dr]) => ({ col: col + dc, row: row + dr }))
        .filter((p) => grid[p.row]?.[p.col] !== undefined);
}

function findPath(start, goal) {
    if (!isWalkable(goal.col, goal.row)) return [];

    const startKey = `${start.col},${start.row}`;
    const goalKey = `${goal.col},${goal.row}`;

    const open = new Map();
    const cameFrom = new Map();
    const gScore = new Map();

    open.set(startKey, { col: start.col, row: start.row, f: 0 });
    gScore.set(startKey, 0);

    while (open.size > 0) {
        let currentKey = null;
        let currentNode = null;
        for (const [key, node] of open.entries()) {
            if (!currentNode || node.f < currentNode.f) {
                currentNode = node;
                currentKey = key;
            }
        }

        if (currentKey === goalKey) {
            const path = [];
            let ck = currentKey;
            while (ck) {
                const [c, r] = ck.split(",").map(Number);
                path.push({ col: c, row: r });
                ck = cameFrom.get(ck);
            }
            return path.reverse();
        }

        open.delete(currentKey);
        const currentG = gScore.get(currentKey);
        const neighbors = neighborCoords(currentNode.col, currentNode.row).filter((p) => isWalkable(p.col, p.row));

        neighbors.forEach((n) => {
            const nk = `${n.col},${n.row}`;
            const tentativeG = currentG + 1;
            const bestG = gScore.get(nk);
            if (bestG === undefined || tentativeG < bestG) {
                cameFrom.set(nk, currentKey);
                gScore.set(nk, tentativeG);
                const h = axialDistance(offsetToAxial(n.col, n.row), offsetToAxial(goal.col, goal.row));
                const f = tentativeG + h;
                open.set(nk, { col: n.col, row: n.row, f });
            }
        });
    }
    return [];
}

function move(dx, dy) {
    pathQueue = [];
    const now = Date.now();
    const stepDelay = Math.max(80, 200 - player.special.agility * 6);
    if (now - lastStep < stepDelay) return;
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

function followPath() {
    const now = Date.now();
    const stepDelay = Math.max(80, 220 - player.special.agility * 8);
    if (pathQueue.length === 0) return;
    if (now - lastStep < stepDelay) return;
    const next = pathQueue.shift();
    player.col = next.col;
    player.row = next.row;
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

function findClosestTile(mouseX, mouseY) {
    let best = null;
    let bestDist = Infinity;
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            const { x, y } = offsetToPixel(col, row);
            const dx = mouseX - x;
            const dy = mouseY - y;
            const dist2 = dx * dx + dy * dy;
            if (dist2 < bestDist) {
                bestDist = dist2;
                best = { col, row };
            }
        }
    }
    return best;
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
        if (["KeyQ"].includes(e.code)) move(-1, -1);
        if (["KeyE"].includes(e.code)) move(1, -1);
    });

    canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const target = findClosestTile(x, y);
        if (!target) return;
        if (!isWalkable(target.col, target.row)) {
            addLog("Rörelse", "Kan inte gå dit (vägg/hinder).");
            return;
        }
        const path = findPath({ col: player.col, row: player.row }, target);
        if (path.length === 0) {
            addLog("Rörelse", "Ingen väg hittades.");
            return;
        }
        pathQueue = path.slice(1); // hoppa över startposition
    });

    document.getElementById("btn-save").addEventListener("click", savePlayer);
    document.getElementById("btn-load").addEventListener("click", loadPlayer);
}

function loop() {
    followPath();
    render();
    requestAnimationFrame(loop);
}

setupUI();
loop();
