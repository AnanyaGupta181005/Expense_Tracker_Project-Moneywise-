<?php
// api/dashboard-summary.php (VERSION 2)

require_once 'config.php';
require_once 'auth-check.php'; // Ensures user is logged in

try {
    // 1. Get Summary Cards
    $sql_summary = "
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
        FROM transactions 
        WHERE user_id = :user_id
    ";
    $stmt_summary = $pdo->prepare($sql_summary);
    $stmt_summary->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt_summary->execute();
    $summary = $stmt_summary->fetch(PDO::FETCH_ASSOC);
    $summary['balance'] = $summary['total_income'] - $summary['total_expense'];

    // 2. Get Expense Pie Chart
    $sql_pie = "
        SELECT category, COALESCE(SUM(amount), 0) AS total
        FROM transactions
        WHERE user_id = :user_id AND type = 'expense'
        GROUP BY category
        ORDER BY total DESC
    ";
    $stmt_pie = $pdo->prepare($sql_pie);
    $stmt_pie->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt_pie->execute();
    $expense_breakdown = $stmt_pie->fetchAll(PDO::FETCH_ASSOC);
    
    // 3. Get Recent Transactions (Last 5)
    $sql_recent = "
        SELECT * FROM transactions 
        WHERE user_id = :user_id 
        ORDER BY date DESC, created_at DESC 
        LIMIT 5
    ";
    $stmt_recent = $pdo->prepare($sql_recent);
    $stmt_recent->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt_recent->execute();
    $recent_transactions = $stmt_recent->fetchAll(PDO::FETCH_ASSOC);

    // 4. (NEW) Get Bar Chart Data (Income vs Expense for last 6 months)
    $sql_bar = "
        SELECT 
            DATE_FORMAT(date, '%Y-%m') AS month,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
        FROM transactions
        WHERE user_id = :user_id AND date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY month
        ORDER BY month ASC
    ";
    $stmt_bar = $pdo->prepare($sql_bar);
    $stmt_bar->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt_bar->execute();
    $bar_chart_data = $stmt_bar->fetchAll(PDO::FETCH_ASSOC);

    // Combine all data into one response
    $dashboard_data = [
        'summary' => $summary,
        'expense_breakdown' => $expense_breakdown,
        'recent_transactions' => $recent_transactions,
        'bar_chart_data' => $bar_chart_data
    ];
    
    // Get user info from auth-check.php
    $user_info = [
        'id' => $user_id,
        'name' => $user_name,
        'email' => $user_email
    ];

    send_response(['status' => 'success', 'data' => $dashboard_data, 'user' => $user_info]);

} catch (PDOException $e) {
    send_response(['status' => 'error', 'message' => $e->getMessage()]);
}

unset($pdo);
?>