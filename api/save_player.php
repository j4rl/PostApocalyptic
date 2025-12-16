<?php
header("Content-Type: application/json");

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "Kunde inte tolka JSON-body."]);
    exit;
}

require __DIR__ . "/db.php";
require __DIR__ . "/schema.php";
ensureTables($mysqli);

$name = substr(trim($input["name"] ?? "VaultDweller"), 0, 60);
$col = (int) ($input["col"] ?? 0);
$row = (int) ($input["row"] ?? 0);
$health = (int) ($input["health"] ?? 100);
$special = $input["special"] ?? [];

$specialJson = json_encode($special, JSON_UNESCAPED_UNICODE);

$stmt = $mysqli->prepare("
    INSERT INTO players (name, col_pos, row_pos, health, special_json)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE col_pos = VALUES(col_pos), row_pos = VALUES(row_pos), health = VALUES(health), special_json = VALUES(special_json)
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Statement-fel: " . $mysqli->error]);
    exit;
}

$stmt->bind_param("siiis", $name, $col, $row, $health, $specialJson);
$ok = $stmt->execute();

if (!$ok) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Skrivfel: " . $stmt->error]);
    exit;
}

echo json_encode(["ok" => true]);
