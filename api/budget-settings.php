<?php
// api/budget-settings.php
require_once 'config.php';
require_once 'auth-check.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $sql = "SELECT monthly_budget, savings_goal, currency FROM budget_settings WHERE user_id = :user_id LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            send_response(['status' => 'success', 'data' => $row]);
        } else {
            // Return defaults if not set
            send_response(['status' => 'success', 'data' => ['monthly_budget' => 3000.00, 'savings_goal' => 10000.00, 'currency' => 'USD']]);
        }
    }

    if ($method === 'POST') {
        // Read JSON body
        $payload = json_decode(file_get_contents('php://input'), true);
        $monthly_budget = isset($payload['monthly_budget']) ? floatval($payload['monthly_budget']) : null;
        $savings_goal = isset($payload['savings_goal']) ? floatval($payload['savings_goal']) : null;
        $currency = isset($payload['currency']) ? substr($payload['currency'],0,3) : 'USD';

        if ($monthly_budget === null || $savings_goal === null) {
            send_response(['status' => 'error', 'message' => 'Missing required fields.']);
        }

        // Upsert: if row exists update, else insert
        $sql_check = "SELECT id FROM budget_settings WHERE user_id = :user_id LIMIT 1";
        $stmt_check = $pdo->prepare($sql_check);
        $stmt_check->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt_check->execute();
        $exists = $stmt_check->fetch(PDO::FETCH_ASSOC);

        if ($exists) {
            $sql_upd = "UPDATE budget_settings SET monthly_budget = :monthly_budget, savings_goal = :savings_goal, currency = :currency, updated_at = NOW() WHERE user_id = :user_id";
            $stmt_upd = $pdo->prepare($sql_upd);
            $stmt_upd->bindParam(':monthly_budget', $monthly_budget);
            $stmt_upd->bindParam(':savings_goal', $savings_goal);
            $stmt_upd->bindParam(':currency', $currency);
            $stmt_upd->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt_upd->execute();
        } else {
            $sql_ins = "INSERT INTO budget_settings (user_id, monthly_budget, savings_goal, currency) VALUES (:user_id, :monthly_budget, :savings_goal, :currency)";
            $stmt_ins = $pdo->prepare($sql_ins);
            $stmt_ins->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt_ins->bindParam(':monthly_budget', $monthly_budget);
            $stmt_ins->bindParam(':savings_goal', $savings_goal);
            $stmt_ins->bindParam(':currency', $currency);
            $stmt_ins->execute();
        }

        send_response(['status' => 'success', 'message' => 'Budget settings saved']);
    }

    // Method not allowed
    http_response_code(405);
    send_response(['status' => 'error', 'message' => 'Method not allowed']);

} catch (PDOException $e) {
    send_response(['status' => 'error', 'message' => $e->getMessage()]);
}

unset($pdo);

?>
