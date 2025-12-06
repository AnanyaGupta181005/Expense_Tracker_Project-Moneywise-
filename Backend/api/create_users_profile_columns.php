<?php
// api/create_users_profile_columns.php
// DEV helper: create dob/country/locale columns on users if missing.
// NOTE: Intended for local development only. Requires logged-in user.

require_once 'config.php';
require_once 'auth-check.php';

header('Content-Type: application/json');

try {
    $db = $pdo; // from config.php

    $columns = [
        'dob' => "ALTER TABLE users ADD COLUMN dob DATE DEFAULT NULL",
        'country' => "ALTER TABLE users ADD COLUMN country VARCHAR(100) DEFAULT NULL",
        'locale' => "ALTER TABLE users ADD COLUMN locale VARCHAR(20) DEFAULT NULL",
    ];

    $results = [];
    foreach ($columns as $col => $sql) {
        $check = $db->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = :col");
        $check->bindParam(':col', $col);
        $check->execute();
        $exists = (int) $check->fetchColumn();
        if ($exists) {
            $results[$col] = 'exists';
            continue;
        }
        try {
            $db->exec($sql);
            $results[$col] = 'created';
        } catch (PDOException $e) {
            $results[$col] = 'error: ' . $e->getMessage();
        }
    }

    echo json_encode(['status' => 'ok', 'results' => $results]);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    exit;
}

?>
