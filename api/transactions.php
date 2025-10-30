<?php
// api/transactions.php

require_once 'config.php';
require_once 'auth-check.php'; // Ensures user is logged in

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents("php://input"));

try {
    switch ($action) {
        case 'create':
            // Add a new transaction
            if (empty($data->type) || empty($data->amount) || empty($data->category) || empty($data->date)) {
                 send_response(['status' => 'error', 'message' => 'Type, Amount, Category, and Date are required.']);
            }
            
            $sql = "INSERT INTO transactions (user_id, type, amount, category, date, notes) 
                    VALUES (:user_id, :type, :amount, :category, :date, :notes)";
            $stmt = $pdo->prepare($sql);
            
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->bindParam(':type', $data->type, PDO::PARAM_STR);
            $stmt->bindParam(':amount', $data->amount, PDO::PARAM_STR);
            $stmt->bindParam(':category', $data->category, PDO::PARAM_STR);
            $stmt->bindParam(':date', $data->date, PDO::PARAM_STR);
            $stmt->bindParam(':notes', $data->notes, PDO::PARAM_STR);
            
            $stmt->execute();
            
            send_response(['status' => 'success', 'message' => 'Transaction added successfully.']);
            break;

        case 'get_all':
            // Get all transactions for the logged-in user
            $sql = "SELECT * FROM transactions WHERE user_id = :user_id ORDER BY date DESC, created_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();
            $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            send_response(['status' => 'success', 'transactions' => $transactions]);
            break;

        case 'delete':
            // Delete a transaction
            if (empty($data->id)) {
                 send_response(['status' => 'error', 'message' => 'Transaction ID is required.']);
            }
            
            $sql = "DELETE FROM transactions WHERE id = :id AND user_id = :user_id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                send_response(['status' => 'success', 'message' => 'Transaction deleted.']);
            } else {
                send_response(['status' => 'error', 'message' => 'Transaction not found or you do not have permission.']);
            }
            break;

        default:
            send_response(['status' => 'error', 'message' => 'Invalid action.']);
            break;
    }
} catch (PDOException $e) {
    send_response(['status' => 'error', 'message' => $e->getMessage()]);
}

unset($pdo);
?>