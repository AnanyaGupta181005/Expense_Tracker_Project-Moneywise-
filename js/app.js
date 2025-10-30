/*
================================================================
FINAL - js/app.js (for index.html)
================================================================

This file uses the correct "/moneywise/" paths and
includes all button logic (Logout, Add Tx, Profile, Theme).
*/

document.addEventListener("DOMContentLoaded", () => {
    // --- SELECTORS (from your index.html) ---
    const logoutButton = document.getElementById("menuLogout");
    const btnAddTransaction = document.getElementById("btnAddTransaction");
    const profileButton = document.getElementById("profileBtn");
    const profileMenu = document.getElementById("profileMenu");
    const themeToggleButton = document.getElementById("themeToggle");
    const totalBalanceEl = document.getElementById("totalBalance");
    const totalIncomeEl = document.getElementById("totalIncome");
    const totalExpenseEl = document.getElementById("totalExpense");
    const pieChartCanvas = document.getElementById("pieChart");
    const barChartCanvas = document.getElementById("barChart");
    const recentTransactionsList = document.getElementById("transactionsList");
    const userNameEl = document.getElementById("userName");
    const userEmailEl = document.getElementById("userEmail");
    const userInitialsEl = document.getElementById("userInitials");
    const addTransactionModal = document.getElementById("addTransactionModal");
    const btnCloseModal = document.getElementById("closeModal");
    const btnCancelTransaction = document.getElementById("btnCancelTransaction");
    const transactionForm = document.getElementById("transactionForm");
    const categorySelect = document.getElementById("category");
    const transactionTypeButtons = document.querySelectorAll(".btn-toggle");
    const transactionTypeInput = document.getElementById("transactionType");

    // Chart instances
    let pieChartInstance;
    let barChartInstance;
    let allCategories = [];

    // --- MAIN FUNCTION: LOAD ALL DASHBOARD DATA ---
    async function loadDashboard() {
        try {
            // Uses the correct "/moneywise/" path
            const response = await fetch("/moneywise/api/dashboard-summary.php");
            
            if (response.status === 401) {
                // Uses the correct "/moneywise/" path
                window.location.href = "/moneywise/login.html";
                return;
            }
            if (!response.ok) throw new Error("Network response failed");

            const result = await response.json();

            if (result.status === "success") {
                const data = result.data;
                const user = result.user; 

                // 1. Fill User Info in profile dropdown
                if(userNameEl) userNameEl.textContent = user.name;
                if(userEmailEl) userEmailEl.textContent = user.email;
                if(userInitialsEl && user.name) {
                    const nameParts = user.name.split(' ');
                    const initials = (nameParts[0] ? nameParts[0][0] : '') + (nameParts[1] ? nameParts[1][0] : '');
                    userInitialsEl.textContent = initials.toUpperCase();
                }

                // 2. Fill Summary Cards
                if(totalBalanceEl) totalBalanceEl.textContent = formatCurrency(data.summary.balance);
                if(totalIncomeEl) totalIncomeEl.textContent = formatCurrency(data.summary.total_income);
                if(totalExpenseEl) totalExpenseEl.textContent = formatCurrency(data.summary.total_expense);

                // 3. Fill Recent Transactions list
                renderRecentTransactions(data.recent_transactions);

                // 4. Render Pie Chart
                if(pieChartCanvas) renderPieChart(data.expense_breakdown);
                
                // 5. Render Bar Chart
                if(barChartCanvas) renderBarChart(data.bar_chart_data);

            } else {
                console.error("Error loading data: " + result.message);
                if(recentTransactionsList) recentTransactionsList.innerHTML = "<p class='empty-state'>Error loading dashboard data.</p>";
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            if(recentTransactionsList) recentTransactionsList.innerHTML = "<p class='empty-state'>Could not connect to server.</p>";
        }
    }

    // --- RENDER RECENT TRANSACTIONS ---
    function renderRecentTransactions(transactions) {
        if (!recentTransactionsList) return;
        
        recentTransactionsList.innerHTML = ""; // Clear list
        if (transactions.length === 0) {
            recentTransactionsList.innerHTML = "<p class='empty-state'>No transactions yet. Add one!</p>";
            return;
        }

        transactions.forEach(tx => {
            const txDiv = document.createElement("div");
            txDiv.className = "transaction-item";
            txDiv.dataset.id = tx.id; // Add ID for deletion
            
            const typeClass = tx.type === 'income' ? 'income' : 'expense';
            const sign = tx.type === 'income' ? '+' : '-';
            
            // This HTML matches the style.css file
            txDiv.innerHTML = `
                <div class="tx-details">
                    <p class="tx-category">${escapeHtml(tx.category)}</p>
                    <p class="tx-date">${escapeHtml(tx.date)}</p>
                </div>
                <div class="tx-amount ${typeClass}">
                    ${sign}${formatCurrency(tx.amount)}
                </div>
                <button class="btn-delete-tx" data-id="${tx.id}">
                    <svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            `;
            recentTransactionsList.appendChild(txDiv);
        });
    }

    // --- CHART: PIE ---
    function renderPieChart(breakdown) {
        if (!pieChartCanvas) return; // Exit if canvas not found
        const labels = breakdown.map(item => item.category);
        const data = breakdown.map(item => item.total);
        const pastelColors = ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E0BBE4'];

        if (pieChartInstance) pieChartInstance.destroy(); // Clear old chart

        pieChartInstance = new Chart(pieChartCanvas.getContext("2d"), {
            type: 'doughnut',
            data: {
                labels: labels.length > 0 ? labels : ['No Expenses'],
                datasets: [{
                    data: data.length > 0 ? data : [1],
                    backgroundColor: data.length > 0 ? pastelColors : ['var(--input-bg)'], // Use CSS var for empty state
                    borderColor: 'var(--card-bg)', // Match card bg
                    borderWidth: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { 
                        position: 'bottom', 
                        display: data.length > 0,
                        labels: { color: 'var(--text-secondary)' }
                    },
                    tooltip: {
                        enabled: data.length > 0
                    }
                }
            }
        });
    }

    // --- CHART: BAR ---
    function renderBarChart(data) {
        if (!barChartCanvas) return; // Exit if canvas not found
        const labels = data.map(item => new Date(item.month + '-02').toLocaleString('default', { month: 'short' })); // Add day to avoid timezone issues
        const incomeData = data.map(item => item.income);
        const expenseData = data.map(item => item.expense);

        if (barChartInstance) barChartInstance.destroy(); // Clear old chart

        barChartInstance = new Chart(barChartCanvas.getContext("2d"), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Income', data: incomeData, backgroundColor: 'rgba(186, 255, 201, 0.7)' }, // Use RGBA for transparency
                    { label: 'Expense', data: expenseData, backgroundColor: 'rgba(255, 179, 186, 0.7)' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { 
                        position: 'bottom',
                        labels: { color: 'var(--text-secondary)' }
                    } 
                },
                scales: { 
                    x: { grid: { display: false }, ticks: { color: 'var(--text-secondary)' } }, 
                    y: { grid: { color: 'var(--border)' }, ticks: { color: 'var(--text-secondary)' } } 
                }
            }
        });
    }

    // --- LOAD CATEGORIES FOR MODAL ---
    async function loadCategories() {
        if (!categorySelect) return; // Exit if select element not found
        try {
            // Uses the correct "/moneywise/" path
            const response = await fetch("/moneywise/api/categories.php");
            const result = await response.json();
            if (result.status === 'success') {
                allCategories = result.categories;
                updateCategoryDropdown('expense'); // Set default
            } else {
                categorySelect.innerHTML = '<option value="">Error loading</option>';
            }
        } catch (error) { 
            console.error('Error fetching categories:', error); 
            categorySelect.innerHTML = '<option value="">Network error</option>';
        }
    }
    
    // --- UPDATE CATEGORY DROPDOWN ---
    function updateCategoryDropdown(type) {
        if (!categorySelect) return;
        categorySelect.innerHTML = '<option value="">Select a category</option>';
        const filteredCategories = allCategories.filter(cat => cat.type === type || cat.type === 'both');
        filteredCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = escapeHtml(cat.name); // Sanitize category names
            categorySelect.appendChild(option);
        });
    }

    // --- MODAL: OPEN/CLOSE ---
    function openModal() {
        if (addTransactionModal) addTransactionModal.classList.add('active');
        // Set date to today by default
        const dateInput = document.getElementById('date');
        if(dateInput) dateInput.valueAsDate = new Date(); 
    }
    function closeModal() {
        if (addTransactionModal) addTransactionModal.classList.remove('active');
        if (transactionForm) transactionForm.reset();
        // Reset type toggle to default (expense)
        updateCategoryDropdown('expense');
        const expenseBtn = document.querySelector('.btn-toggle[data-type="expense"]');
        const incomeBtn = document.querySelector('.btn-toggle[data-type="income"]');
        if(expenseBtn) expenseBtn.classList.add('active');
        if(incomeBtn) incomeBtn.classList.remove('active');
        if(transactionTypeInput) transactionTypeInput.value = 'expense';
    }

    // --- MODAL: HANDLE SUBMIT ---
    async function handleTransactionSubmit(e) {
        e.preventDefault();
        const formData = new FormData(transactionForm);
        const data = Object.fromEntries(formData.entries());

        // Basic validation
        if (!data.amount || data.amount <= 0 || !data.category || !data.date) {
            alert("Please fill in Amount, Category, and Date.");
            return;
        }

        try {
            // Uses the correct "/moneywise/" path
            const response = await fetch("/moneywise/api/transactions.php?action=create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.status === 'success') {
                closeModal();
                loadDashboard(); // Refresh all data!
            } else { alert("Error: " + result.message); }
        } catch (error) { 
            console.error("Submit Error:", error);
            alert("An error occurred while saving."); 
        }
    }
    
    // --- HANDLE TRANSACTION DELETE ---
    async function handleDeleteTransaction(e) {
        const deleteButton = e.target.closest('.btn-delete-tx');
        if (!deleteButton) return;
        
        const txId = deleteButton.dataset.id;
        if (!confirm("Are you sure you want to delete this transaction?")) return;

        try {
            // Uses the correct "/moneywise/" path
            const response = await fetch("/moneywise/api/transactions.php?action=delete", {
                method: "POST", // Using POST for delete to allow sending JSON body easily
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: txId })
            });
            const result = await response.json();
            if (result.status === 'success') {
                loadDashboard(); // Refresh all data
            } else { alert("Error: " + result.message); }
        } catch (error) { 
            console.error("Delete Error:", error);
            alert("An error occurred while deleting."); 
        }
    }

    // --- LOGOUT LOGIC ---
    async function handleLogout(e) {
        e.preventDefault(); // Prevent default link behavior
        try {
            // Uses the correct "/moneywise/" path
            await fetch("/moneywise/api/logout.php");
            // Uses the correct "/moneywise/" path
            window.location.href = "/moneywise/login.html"; // Redirect to login
        } catch (error) { console.error("Error logging out:", error); }
    }
    
    // --- PROFILE DROPDOWN LOGIC ---
    function toggleProfileMenu() {
        if(profileMenu) profileMenu.classList.toggle('active');
    }

    // --- THEME TOGGLE LOGIC ---
    function toggleTheme() {
        const body = document.body;
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark-mode' : 'light-mode');
        updateThemeIcons(isDark);
        // Force charts to redraw with new theme colors
        if(pieChartInstance) pieChartInstance.destroy();
        if(barChartInstance) barChartInstance.destroy();
        loadDashboard(); // Reload data which will redraw charts
    }
    
    function updateThemeIcons(isDark) {
         const sunIcon = document.querySelector('.sun-icon');
         const moonIcon = document.querySelector('.moon-icon');
         if (!sunIcon || !moonIcon) return;
         // Ensure correct display property is used
         sunIcon.style.display = isDark ? 'block' : 'none';
         moonIcon.style.display = isDark ? 'none' : 'block';
    }
    
    // --- CHECK FOR SAVED THEME on page load ---
    function applySavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark-mode') {
            document.body.classList.add('dark-mode');
            updateThemeIcons(true);
        } else {
             // Ensure light mode is default if no preference or set to light
             document.body.classList.remove('dark-mode');
            updateThemeIcons(false);
        }
    }

    // --- HELPER: Format Currency ---
    function formatCurrency(num) {
        // Use Intl.NumberFormat for proper currency formatting, but remove the $
        // Handles potential null or undefined values gracefully
        const number = parseFloat(num);
        if (isNaN(number)) {
            return '0.00'; // Or some other placeholder
        }
        return new Intl.NumberFormat('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        }).format(number);
    }

    // --- HELPER: Escape HTML ---
    function escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        return unsafe
             .toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }


    // --- EVENT LISTENERS ---
    if (logoutButton) logoutButton.addEventListener("click", handleLogout);
    if (btnAddTransaction) btnAddTransaction.addEventListener("click", openModal);
    if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
    if (btnCancelTransaction) btnCancelTransaction.addEventListener("click", closeModal);
    // Also close modal if overlay is clicked
    const modalOverlay = document.getElementById('modalOverlay');
    if(modalOverlay) modalOverlay.addEventListener('click', closeModal);

    if (transactionForm) transactionForm.addEventListener("submit", handleTransactionSubmit);
    if (recentTransactionsList) recentTransactionsList.addEventListener('click', handleDeleteTransaction);
    if (profileButton) profileButton.addEventListener("click", toggleProfileMenu);
    if (themeToggleButton) themeToggleButton.addEventListener("click", toggleTheme);
    
    // Close profile menu if clicking outside
    document.addEventListener('click', (e) => {
        if (!profileButton || !profileMenu) return;
        // Check if the click target is outside the profile button AND outside the profile menu
        if (!profileButton.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.classList.remove('active');
        }
    });

    // Toggle for Income/Expense buttons in modal
    if(transactionTypeButtons && transactionTypeInput && categorySelect) {
        transactionTypeButtons.forEach(button => {
            button.addEventListener("click", () => {
                transactionTypeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const type = button.dataset.type;
                transactionTypeInput.value = type;
                updateCategoryDropdown(type); // Filter categories
            });
        });
    }

    // --- INITIAL LOAD ---
    applySavedTheme(); // Apply theme first
    loadDashboard();
    loadCategories(); // Load categories for the modal
});

