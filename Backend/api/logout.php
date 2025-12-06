<?php
// api/logout.php

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Unset all session variables
$_SESSION = array();

// Destroy the session
session_destroy();

// Send success response
header('Content-Type: application/json');
echo json_encode(['status' => 'success', 'message' => 'Logged out successfully.']);
exit;
?>