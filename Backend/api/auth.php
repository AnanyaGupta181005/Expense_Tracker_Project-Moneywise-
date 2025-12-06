<?php
// api/auth.php
// VERSION 2: Handles both JSON and Form Data

require_once 'config.php';

$action = $_GET['action'] ?? '';
$name = null;
$email = null;
$password = null;

// Check if data was sent as JSON
if (strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
    $data = json_decode(file_get_contents("php://input"));
    if ($data) {
        $name = $data->name ?? null;
        $email = $data->email ?? null;
        $password = $data->password ?? null;
    }
} else {
    // If not JSON, assume it was sent as standard Form Data (from $_POST)
    $name = $_POST['name'] ?? null;
    $email = $_POST['email'] ?? null;
    $password = $_POST['password'] ?? null;
}

// Route the request to the correct function
switch ($action) {
    case 'signup':
        handle_signup($pdo, $name, $email, $password);
        break;
    case 'login':
        handle_login($pdo, $email, $password);
        break;
    default:
        send_response(['status' => 'error', 'message' => 'Invalid action.']);
}

// --- SIGNUP FUNCTION ---
function handle_signup($pdo, $name, $email, $password) {
    // This is the error you were seeing
    if (empty($name) || empty($email) || empty($password)) {
        send_response(['status' => 'error', 'message' => 'All fields are required.']);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_response(['status' => 'error', 'message' => 'Invalid email format.']);
    }

    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    try {
        // Check if email already exists
        $sql = "SELECT id FROM users WHERE email = :email";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            send_response(['status' => 'error', 'message' => 'This email is already registered.']);
        }

        // Insert new user
        $sql = "INSERT INTO users (name, email, password) VALUES (:name, :email, :password)";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':name', $name, PDO::PARAM_STR);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->bindParam(':password', $hashed_password, PDO::PARAM_STR);

        if ($stmt->execute()) {
            send_response(['status' => 'success', 'message' => 'Registration successful. You can now login.']);
        } else {
            send_response(['status' => 'error', 'message' => 'Something went wrong. Please try again.']);
        }
    } catch (PDOException $e) {
        send_response(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

// --- LOGIN FUNCTION ---
function handle_login($pdo, $email, $password) {
    if (empty($email) || empty($password)) {
        send_response(['status' => 'error', 'message' => 'Email and password are required.']);
    }

    try {
        // Find user by email
        $sql = "SELECT id, name, email, password FROM users WHERE email = :email";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->execute();

        if ($stmt->rowCount() == 1) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (password_verify($password, $user['password'])) {
                // Password is correct, start session
                session_regenerate_id(true);
                $_SESSION['loggedin'] = true;
                $_SESSION['id'] = $user['id'];
                $_SESSION['name'] = $user['name'];
                $_SESSION['email'] = $user['email'];

                send_response([
                    'status' => 'success',
                    'message' => 'Login successful.',
                    'user' => ['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email']]
                ]);
            } else {
                send_response(['status' => 'error', 'message' => 'Invalid email or password.']);
            }
        } else {
            send_response(['status' => 'error', 'message' => 'Invalid email or password.']);
        }
    } catch (PDOException $e) {
        send_response(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

unset($pdo);
?>