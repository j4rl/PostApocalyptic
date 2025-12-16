# Atom Wasteland (HTML/CSS/JS/PHP/MySQLi)

En liten pseudo-isometrisk prototyp i en retro-futuristisk (1950-talets atomålder) postapokalyps. Frontend körs i `index.php` med canvas-renderad hex-grid (nu mer isometrisk projicering), diskreta sprites och SPECIAL-system. PHP + MySQLi hanterar sparning och val-loggning.

## Starta
1. Placera projektet i `xampp/htdocs`.
2. Skapa databasen:
   ```sql
   mysql -u root -p < api/setup.sql
   ```
   (Justera användare/lösen i `api/db.php` om du inte kör root utan lösen.)
3. Surfa till `http://localhost/PostApocalyptic/` i XAMPP.

## Tangenter och UI
- Klicka på en hex-tile i canvas för att auto-navigera dit (A*-sökning på hex-grid, isometrisk projicering med slitet retrofuturistiskt landskap).
- WASD/piltangenter (plus Q/E) för manuell flytt på hexen.
- Panelen visar SPECIAL-balkar, val-knappar och logg.
- `Spara`/`Ladda`: POST/GET mot PHP-backend (failar tyst om DB saknas).
- Val-knappar räknar ut framgång baserat på relevant SPECIAL + tur (Luck) och loggar i DB.

## Filer
- `index.php` – layout + inlänkar.
- `assets/css/style.css` – retro-futuristisk Art Deco-inspirerad look.
- `assets/js/game.js` – canvas-rendering, SPECIAL, hex-grid (isometrisk), auto-pathing, val-logik.
- `api/db.php` + `api/schema.php` – MySQLi-anslutning och tabellskapare.
- `api/save_player.php` / `api/load_player.php` / `api/log_choice.php` – enkla JSON-API:er.
- `api/setup.sql` – kör för att sätta upp DB-struktur.

## Idéer för vidareutveckling
- Lägg till riktiga sprites (renderade 3D-resurser till 2D) istället för placeholders.
- Utöka kartan med moduler (prefabs) och dynamiska uppdrag.
- Bygg ut V.A.T.S.-liknande målval med kroppszoner och AP-kostnader.
- Lägg till quests/konsekvenser i databasen och fler spar-filer per profil.
