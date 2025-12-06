# 💰 MoneyWise — Personal Expense Tracking Web Application

MoneyWise is a full-stack web application designed to simplify personal finance management through real-time tracking, visual insights, and secure user authentication. Built using HTML, CSS, JavaScript, PHP, and MySQL, this project demonstrates the integration of client-side interactivity with server-side logic and persistent data storage.

---

## 📌 Introduction
In today’s world of digital transactions and micro-expenses, users often lose track of their financial activities. MoneyWise addresses this challenge by offering a clean, user-friendly platform that replaces traditional spreadsheets with an interactive dashboard, visual analytics, and automated summaries.

This project marks our first comprehensive exposure to full-stack development and showcases the practical application of core web technologies.

---

## 🔍 Problem Statement
Users frequently struggle with:
- Lack of clarity about monthly expenses  
- Difficulty maintaining manual financial logs  
- Absence of secure storage and instant insights  
- Overwhelming complexity in traditional financial tools  

MoneyWise resolves these issues by enabling users to:
- Securely log expenses and income  
- Access real-time summaries of financial activity  
- View visual charts of spending patterns  
- Maintain a centralized and accessible financial history  

---

## 🛠️ Technology Stack

### **Frontend**
- **HTML5** → Structure for login, signup, and dashboard views  
- **CSS3** → Pastel UI theme, responsive layout, dark/light mode  
- **JavaScript (ES6)** → DOM updates, form validation, user events, Fetch API (AJAX)

### **Backend**
- **PHP**  
  - Secure session handling  
  - Authentication (login/signup)  
  - CRUD operations for transactions  
  - JSON-based API responses  

### **Database**
- **MySQL** with three relational tables:  
  - `users` — user credentials (with hashed passwords)  
  - `categories` — income/expense categories  
  - `transactions` — user-specific financial records  

### **Visualization**
- **Chart.js** for dynamic bar and pie charts

### **Development Tools**
- XAMPP (Apache + MySQL)  
- phpMyAdmin  

---

## 🔄 System Workflow

1. User logs in → PHP verifies active session  
2. JavaScript requests dashboard data via fetch()  
3. PHP queries MySQL for totals, recent transactions, and chart breakdown  
4. Data is returned in JSON format  
5. JavaScript dynamically updates the UI:  
   - Income, expenses, and balance overview  
   - Recent transactions  
   - Pie and bar charts  
6. Users can add transactions through modal forms, which update the dashboard instantly without reloading the page  

---

## 🚧 Key Development Challenges & Solutions

### **1. CORS Policy Errors**
Issue: Frontend and backend running on different origins.  
Solution: Moved all files to `/htdocs/moneywise/` and accessed via XAMPP.

### **2. MySQL Port Conflict**
Issue: MySQL default port (3306) already in use.  
Solution: Changed port to 3307 and reconfigured PHP database connection.

### **3. JSON Not Reaching PHP**
Issue: PHP expected form-data instead of raw JSON.  
Solution: Used `php://input` and `json_decode()` to parse JSON bodies.

### **4. JavaScript Not Updating Dashboard**
Causes & Fixes:  
- Browser caching outdated files → Hard Refresh  
- ID mismatches between HTML & JS → Synchronized attributes  
- Incorrect script load order → Loaded Chart.js before app.js  

### **5. API Path Errors**
Issue: Fetch calls using wrong relative paths resulted in 404s.  
Solution: Implemented absolute paths: `/moneywise/api/...`

These challenges strengthened our understanding of debugging, browser tools, server logs, and workflow design.

---

## 📁 Database Schema Overview

**Users Table**  
- id  
- username  
- email  
- password_hash  

**Categories Table**  
- id  
- name  
- type (income/expense)

**Transactions Table**  
- id  
- user_id  
- category_id  
- amount  
- type  
- date  

---

## 📈 Core Features

### ✔ Secure Authentication (Login & Signup)  
### ✔ Add Income and Expense Entries  
### ✔ Real-Time Financial Summary  
### ✔ Dynamic Bar + Pie Charts  
### ✔ Recent Transactions List  
### ✔ Responsive UI with Dark/Light Mode  
### ✔ Smooth, reload-free interactions via AJAX  

---

## 🚀 Future Enhancements

- **Savings Goals Module**  
- **Profile Settings (Update Password)**  
- **Edit Transaction Functionality (Full CRUD)**  
- **Deployment to cloud hosting for public access**  

---

## 👩‍💻 Project Contributors

- **Suhani Lakhera (23BCP273)**  
- **Ananya Gupta (23BCP276)**  

---

## 📎 How to Run the Project Locally

1. Install **XAMPP**  
2. Place the project folder inside:  
   `C:\xampp\htdocs\moneywise\`  
3. Start **Apache** and **MySQL** from XAMPP  
4. Import the SQL schema into phpMyAdmin  
5. Access the application through:  
