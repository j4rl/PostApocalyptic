<?php
header("Content-Type: application/json");

require __DIR__ . "/db.php";
require __DIR__ . "/schema.php";
ensureTables($mysqli);

$result = $mysqli->query("SELECT name, col_pos, row_pos, health, special_json FROM players ORDER BY updated_at DESC LIMIT 1");
if (!$result) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Läsfel: " . $mysqli->error]);
    exit;
}

if ($result->num_rows === 0) {
    echo json_encode(["ok" => false, "error" => "Ingen sparning hittad."]);
    exit;
}

$row = $result->fetch_assoc();
$player = [
    "name" => $row["name"],
    "col" => (int) $row["col_pos"],
    "row" => (int) $row["row_pos"],
    "health" => (int) $row["health"],
    "special" => json_decode($row["special_json"], true),
];

echo json_encode(["ok" => true, "player" => $player]);
