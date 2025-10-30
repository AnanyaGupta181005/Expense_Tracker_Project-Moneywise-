<?php
// api/config.php

// Start the session
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Database Configuration
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', ''); // Default XAMPP password is empty
define('DB_NAME', 'moneywise_db');

// Attempt to connect to MySQL database
try {
    $pdo = new PDO("mysql:host=" . DB_SERVER . ";port=3307;dbname=" . DB_NAME, DB_USERNAME, DB_PASSWORD);
    // Set the PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e){
    // Send a generic error message
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
    exit; // Stop script execution
}

// Set content type to JSON
header('Content-Type: application/json');

// Helper function to send JSON responses
function send_response($data) {
    echo json_encode($data);
    exit;
}

?>