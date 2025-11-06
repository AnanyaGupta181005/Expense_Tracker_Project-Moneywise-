-- MoneyWise Database Schema

CREATE DATABASE IF NOT EXISTS moneywise_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE moneywise_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    dob DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('income', 'expense') NOT NULL DEFAULT 'expense',
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_date (date),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Budget Settings Table
CREATE TABLE IF NOT EXISTS budget_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    monthly_budget DECIMAL(10, 2) DEFAULT 3000.00,
    savings_goal DECIMAL(10, 2) DEFAULT 10000.00,
    currency VARCHAR(3) DEFAULT 'USD',
    language VARCHAR(10) DEFAULT 'en',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profile Settings Table
CREATE TABLE IF NOT EXISTS profile_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    country VARCHAR(100) DEFAULT NULL,
    address_line1 VARCHAR(255) DEFAULT NULL,
    address_line2 VARCHAR(255) DEFAULT NULL,
    city VARCHAR(100) DEFAULT NULL,
    state VARCHAR(100) DEFAULT NULL,
    postal_code VARCHAR(20) DEFAULT NULL,
    locale VARCHAR(20) DEFAULT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    phone VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories Table (for custom categories)
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense', 'both') DEFAULT 'both',
    icon VARCHAR(50) DEFAULT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Categories
INSERT INTO categories (name, type, icon, is_default) VALUES
('Food', 'expense', 'utensils', TRUE),
('Travel', 'expense', 'plane', TRUE),
('Shopping', 'expense', 'shopping-bag', TRUE),
('Bills', 'expense', 'file-text', TRUE),
('Savings', 'both', 'piggy-bank', TRUE),
('Salary', 'income', 'briefcase', TRUE),
('Freelance', 'income', 'laptop', TRUE),
('Other', 'both', 'more-horizontal', TRUE);

-- Sample Data (for testing) - Remove in production
-- INSERT INTO users (name, email, password) VALUES
-- ('John Doe', 'john@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
-- Note: Password is 'password' - DO NOT use in production
