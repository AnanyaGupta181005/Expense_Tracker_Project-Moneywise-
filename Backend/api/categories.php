<?php
// api/categories.php

require_once 'config.php';
require_once 'auth-check.php'; // Ensures user is logged in

try {
    // Get all default categories AND categories specific to this user
    $sql = "
        SELECT name, type
        FROM categories 
        WHERE is_default = TRUE OR user_id = :user_id
        ORDER BY name ASC
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    send_response(['status' => 'success', 'categories' => $categories]);

} catch (PDOException $e) {
    send_response(['status' => 'error', 'message' => $e->getMessage()]);
}

unset($pdo);
?>