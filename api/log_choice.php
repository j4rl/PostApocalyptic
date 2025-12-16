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

$choice = substr(trim($input["choice"] ?? "unknown"), 0, 60);
$success = !empty($input["success"]) ? 1 : 0;
$score = (float) ($input["score"] ?? 0);
$col = (int) ($input["col"] ?? 0);
$row = (int) ($input["row"] ?? 0);

$stmt = $mysqli->prepare("INSERT INTO choices (choice_key, success, score, col_pos, row_pos) VALUES (?, ?, ?, ?, ?)");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Statement-fel: " . $mysqli->error]);
    exit;
}

$stmt->bind_param("siddi", $choice, $success, $score, $col, $row);
$ok = $stmt->execute();

if (!$ok) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "Skrivfel: " . $stmt->error]);
    exit;
}

echo json_encode(["ok" => true]);
