<?php
// Centraliserad MySQLi-anslutning. Uppdatera värdena så de matchar din XAMPP-installation.
$DB_HOST = getenv("DB_HOST") ?: "127.0.0.1";
$DB_USER = getenv("DB_USER") ?: "root";
$DB_PASS = getenv("DB_PASS") ?: "";
$DB_NAME = getenv("DB_NAME") ?: "atom_wasteland";

$mysqli = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "DB-anslutning misslyckades: " . $mysqli->connect_error]);
    exit;
}

$mysqli->set_charset("utf8mb4");
