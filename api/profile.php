<?php
// api/profile.php
require_once 'config.php';
require_once 'auth-check.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];
    // Detect which optional columns exist in the users table (dob, country, locale)
    $optionalCols = [];
    try {
        $colSql = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('dob','country','locale')";
        $colStmt = $pdo->query($colSql);
        $found = $colStmt->fetchAll(PDO::FETCH_COLUMN);
        if ($found) $optionalCols = $found;
    } catch (Exception $e) {
        // If INFORMATION_SCHEMA query fails, continue with empty optionalCols
        $optionalCols = [];
    }

    if ($method === 'GET') {
        // Return user basic info and profile fields stored on users table
        $sql = "SELECT id, name, email, dob, country, locale FROM users WHERE id = :user_id LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            send_response(['status'=>'success','data'=>$row]);
        }
        send_response(['status'=>'error','message'=>'User not found']);
    }

    if ($method === 'POST') {
        $payload = json_decode(file_get_contents('php://input'), true);
        $name = isset($payload['name']) ? trim($payload['name']) : null;
        $email = isset($payload['email']) ? trim($payload['email']) : null;
        $dob = isset($payload['dob']) ? $payload['dob'] : null;
        $country = isset($payload['country']) ? trim($payload['country']) : null;
        $locale = isset($payload['locale']) ? trim($payload['locale']) : null;

        if (!$name || !$email) {
            send_response(['status'=>'error','message'=>'Name and email are required']);
        }

        // Basic email uniqueness check
        $sql_check = "SELECT id FROM users WHERE email = :email AND id != :user_id LIMIT 1";
        $stmt_check = $pdo->prepare($sql_check);
        $stmt_check->bindParam(':email', $email);
        $stmt_check->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt_check->execute();
        if ($stmt_check->fetch(PDO::FETCH_ASSOC)) {
            send_response(['status'=>'error','message'=>'Email already in use']);
        }

    // Update users table (name/email/dob/country/locale)
    $sql_upd_user = "UPDATE users SET name = :name, email = :email, dob = :dob, country = :country, locale = :locale, updated_at = NOW() WHERE id = :user_id";
    $stmt_upd_user = $pdo->prepare($sql_upd_user);
    $stmt_upd_user->bindParam(':name', $name);
    $stmt_upd_user->bindParam(':email', $email);
    $stmt_upd_user->bindParam(':dob', $dob);
    $stmt_upd_user->bindParam(':country', $country);
    $stmt_upd_user->bindParam(':locale', $locale);
    $stmt_upd_user->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt_upd_user->execute();

    // Return the updated row
    $stmt = $pdo->prepare("SELECT id, name, email, dob, country, locale FROM users WHERE id = :user_id LIMIT 1");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    send_response(['status'=>'success','message'=>'Profile updated','data'=>$row]);
    }

    http_response_code(405);
    send_response(['status'=>'error','message'=>'Method not allowed']);

} catch (PDOException $e) {
    send_response(['status'=>'error','message'=>$e->getMessage()]);
}

unset($pdo);
?>
