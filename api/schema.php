<?php
function ensureTables(mysqli $db): void
{
    $db->query("
        CREATE TABLE IF NOT EXISTS players (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(64) UNIQUE NOT NULL,
            col_pos INT NOT NULL DEFAULT 0,
            row_pos INT NOT NULL DEFAULT 0,
            health INT NOT NULL DEFAULT 100,
            special_json TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $db->query("
        CREATE TABLE IF NOT EXISTS choices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            choice_key VARCHAR(64) NOT NULL,
            success TINYINT(1) NOT NULL,
            score DECIMAL(6,2) NOT NULL,
            col_pos INT NOT NULL,
            row_pos INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
}
