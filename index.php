<?php
// Basic front controller; game runs fully in-browser but PHP handles env and API endpoints in /api.
?>
<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Atom Wasteland</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="frame">
        <header class="hud">
            <div class="brand">
                <div class="logo-dot"></div>
                <div>
                    <div class="eyebrow">Vault-Tec Simulation</div>
                    <div class="title">ATOM WASTELAND</div>
                    <div class="subtitle">Retro-Futurist Survival Protocol</div>
                </div>
            </div>
            <div class="statbar">
                <div class="stat-label">S.P.E.C.I.A.L</div>
                <div id="special-bars" class="bars"></div>
            </div>
            <div class="session-actions">
                <button id="btn-save" class="pill">Spara</button>
                <button id="btn-load" class="pill ghost">Ladda</button>
            </div>
        </header>

        <main class="viewport">
            <canvas id="game" width="960" height="640"></canvas>
            <aside class="panel">
                <section>
                    <h2>Uppdrag</h2>
                    <p id="quest">Ta dig ut från Vault 19 och hitta rent vatten.</p>
                </section>
                <section>
                    <h2>Val</h2>
                    <div id="choices" class="choice-list"></div>
                </section>
                <section>
                    <h2>Logg</h2>
                    <div id="log" class="log"></div>
                </section>
            </aside>
        </main>
    </div>

    <template id="choice-template">
        <button class="choice"></button>
    </template>

    <script src="assets/js/game.js"></script>
</body>
</html>
