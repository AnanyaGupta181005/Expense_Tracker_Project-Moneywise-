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
    // Profile modal selectors
    const profileSettingsModal = document.getElementById('profileSettingsModal');
    const closeProfileModalBtn = document.getElementById('closeProfileModal');
    const btnCancelProfile = document.getElementById('btnCancelProfile');
    const profileForm = document.getElementById('profileForm');
    const profileNameInput = document.getElementById('profileName');
    const profileEmailInput = document.getElementById('profileEmail');
    const profileDobInput = document.getElementById('profileDob');
    const profileCountryInput = document.getElementById('profileCountry');
    const profileLocaleInput = document.getElementById('profileLocale');
    const btnClearLocaleLocal = document.getElementById('btnClearLocale');
    // Budget settings modal selectors
    const budgetSettingsModal = document.getElementById('budgetSettingsModal');
    const closeBudgetModalBtn = document.getElementById('closeBudgetModal');
    const btnCancelBudget = document.getElementById('btnCancelBudget');
    const budgetForm = document.getElementById('budgetForm');
    const monthlyBudgetInput = document.getElementById('monthlyBudget');
    const savingsGoalInput = document.getElementById('savingsGoal');
    const currencyInput = document.getElementById('currency');

    // Chart instances
    let pieChartInstance;
    let barChartInstance;
    let allCategories = [];
    // Current currency (default USD) - will be updated from savings or settings
    let currentCurrency = 'USD';

    // Currency symbols map
    const currencySymbols = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'CAD': 'CA$', 'AUD': 'A$', 'JPY': '¥', 'CNY': '¥', 'SGD': 'S$'
    };

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
                if (data.savings && data.savings.currency) currentCurrency = data.savings.currency;
                if(totalBalanceEl) totalBalanceEl.textContent = formatCurrency(data.summary.balance, currentCurrency);
                if(totalIncomeEl) totalIncomeEl.textContent = formatCurrency(data.summary.total_income, currentCurrency);
                if(totalExpenseEl) totalExpenseEl.textContent = formatCurrency(data.summary.total_expense, currentCurrency);

                // 3. Fill Recent Transactions list
                renderRecentTransactions(data.recent_transactions);

                // 4. Render Pie Chart
                if(pieChartCanvas) renderPieChart(data.expense_breakdown);
                
                // 5. Render Bar Chart
                if(barChartCanvas) renderBarChart(data.bar_chart_data);

                // 6. Render Savings Goal (if returned by API)
                if (data.savings) {
                    const saved = parseFloat(data.savings.saved) || 0;
                    const goal = parseFloat(data.savings.goal) || 0;
                    const currency = data.savings.currency || 'USD';
                    const percent = goal > 0 ? Math.round((saved / goal) * 100) : 0;

                    const savingsAmountEl = document.querySelector('.savings-amount');
                    const progressFillEl = document.querySelector('.progress-fill');
                    const savingsPercentEl = document.querySelector('.savings-percent');

                    if (savingsAmountEl) savingsAmountEl.textContent = `${formatCurrency(saved, currentCurrency)} of ${formatCurrency(goal, currentCurrency)}`;
                    if (progressFillEl) progressFillEl.style.width = Math.min(100, Math.max(0, percent)) + '%';
                    if (savingsPercentEl) savingsPercentEl.textContent = `${Math.min(100, Math.max(0, percent))}% Complete`;
                }

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
                    ${sign}${formatCurrency(tx.amount, currentCurrency)}
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

    // --- NEW ROBUST SOLUTION ---
    // Manually check if the body has the dark-mode class
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Set colors directly instead of reading CSS variables
    const chartTextColor = isDarkMode ? '#F9FAFB' : '#111827'; // Dark text, Light text (black)
    const cardBgColor = isDarkMode ? '#1F2937' : '#FFFFFF';   // Dark card, Light card (white)
    const emptyStateColor = isDarkMode ? '#374151' : '#E5E7EB'; // Dark input, Light gray
    // --- END NEW SOLUTION ---

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
                backgroundColor: data.length > 0 ? pastelColors : [emptyStateColor], // <-- UPDATED
                borderColor: cardBgColor, // <-- UPDATED
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
                    labels: {
                        color: chartTextColor // <-- UPDATED
                    }
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

    // --- NEW ROBUST SOLUTION ---
    // Manually check if the body has the dark-mode class
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Set colors directly
    const chartTextColor = isDarkMode ? '#F9FAFB' : '#111827'; // Dark text, Light text
    const gridColor = isDarkMode ? '#374151' : '#E5E7EB';    // Dark border, Light border
    // --- END NEW SOLUTION ---

    const labels = data.map(item => new Date(item.month + '-02').toLocaleString('default', { month: 'short' }));
    const incomeData = data.map(item => item.income);
    const expenseData = data.map(item => item.expense);

    if (barChartInstance) barChartInstance.destroy(); // Clear old chart

    barChartInstance = new Chart(barChartCanvas.getContext("2d"), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Income', data: incomeData, backgroundColor: 'rgba(186, 255, 201, 0.7)' },
                { label: 'Expense', data: expenseData, backgroundColor: 'rgba(255, 179, 186, 0.7)' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: chartTextColor // <-- UPDATED
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: chartTextColor } // <-- UPDATED
                },
                y: {
                    grid: { color: gridColor }, // <-- UPDATED
                    ticks: { color: chartTextColor } // <-- UPDATED
                }
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

    // --- BUDGET MODAL: OPEN/CLOSE ---
    function openBudgetModal() {
        if (budgetSettingsModal) budgetSettingsModal.classList.add('active');
        // Load current settings
        loadBudgetSettings();
    }
    function closeBudgetModal() {
        if (budgetSettingsModal) budgetSettingsModal.classList.remove('active');
        if (budgetForm) budgetForm.reset();
    }

    // --- PROFILE MODAL: OPEN/CLOSE ---
    function openProfileModal() {
        if (profileSettingsModal) profileSettingsModal.classList.add('active');
        loadProfile();
    }
    function closeProfileModal() {
        if (profileSettingsModal) profileSettingsModal.classList.remove('active');
        if (profileForm) profileForm.reset();
    }

    // Load profile data
    async function loadProfile() {
        try {
            const res = await fetch('/moneywise/api/profile.php');
            if (!res.ok) throw new Error('Network response failed');
            const result = await res.json();
            if (result.status === 'success' && result.data) {
                const d = result.data;
                if (profileNameInput) profileNameInput.value = d.name || '';
                if (profileEmailInput) profileEmailInput.value = d.email || '';
                if (profileDobInput) profileDobInput.value = d.dob || '';
                // Some databases store country as full name or code — try both
                if (profileCountryInput) {
                    // Try to set the select value; if not present, append an option
                    const val = d.country || '';
                    if (val) {
                        let opt = profileCountryInput.querySelector(`option[value="${val}"]`);
                        if (!opt) {
                            // If backend provided full country name instead of code, try to find by text
                            opt = Array.from(profileCountryInput.options).find(o => o.text === val);
                        }
                        if (opt) {
                            profileCountryInput.value = opt.value;
                        } else {
                            // Append a custom option so the value is visible
                            const newOpt = document.createElement('option');
                            newOpt.value = val; newOpt.text = val; newOpt.selected = true;
                            profileCountryInput.appendChild(newOpt);
                            profileCountryInput.value = val;
                        }
                    } else {
                        profileCountryInput.value = '';
                    }
                }
                if (profileLocaleInput) profileLocaleInput.value = d.locale || '';
                // Avatar feature removed; header shows initials only
                const avatarEl = document.querySelector('.avatar');
                if (avatarEl && d.name) {
                    const parts = d.name.split(' ');
                    const initials = (parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '');
                    avatarEl.style.backgroundImage = '';
                    avatarEl.textContent = initials.toUpperCase();
                }
            }
        } catch (err) { console.error('Load profile error', err); }
    }

    // Handle profile submit
    async function handleProfileSubmit(e) {
        e.preventDefault();
        const payload = {
            name: profileNameInput.value,
            email: profileEmailInput.value,
            dob: profileDobInput.value,
            country: profileCountryInput.value,
            locale: profileLocaleInput.value
        };
        try {
            const response = await fetch('/moneywise/api/profile.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.status === 'success') {
                closeProfileModal();
                // Update UI name/email
                if (userNameEl) userNameEl.textContent = payload.name;
                if (userEmailEl) userEmailEl.textContent = payload.email;
            } else {
                alert('Error saving profile: ' + (result.message || 'unknown'));
            }
        } catch (err) { console.error('Save profile error', err); alert('An error occurred while saving.'); }
    }

    // Clear locale button handler (clears the field locally)
    if (btnClearLocaleLocal) {
        btnClearLocaleLocal.addEventListener('click', (e) => {
            e.preventDefault();
            if (profileLocaleInput) profileLocaleInput.value = '';
        });
    }

    // Load current budget settings from API
    async function loadBudgetSettings() {
        try {
            const response = await fetch('/moneywise/api/budget-settings.php');
            if (!response.ok) throw new Error('Network response failed');
            const result = await response.json();
            if (result.status === 'success' && result.data) {
                const d = result.data;
                if (monthlyBudgetInput) monthlyBudgetInput.value = d.monthly_budget ?? '';
                if (savingsGoalInput) savingsGoalInput.value = d.savings_goal ?? '';
                if (currencyInput) currencyInput.value = d.currency ?? 'USD';
            } else {
                console.error('Error loading budget settings', result.message);
            }
        } catch (err) {
            console.error('Fetch budget settings error', err);
        }
    }

    // Handle budget form submission (save)
    async function handleBudgetSubmit(e) {
        e.preventDefault();
        const payload = {
            monthly_budget: parseFloat(monthlyBudgetInput.value || 0),
            savings_goal: parseFloat(savingsGoalInput.value || 0),
            currency: (currencyInput.value || 'USD').toUpperCase().slice(0,3)
        };
        try {
            const response = await fetch('/moneywise/api/budget-settings.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.status === 'success') {
                closeBudgetModal();
                loadDashboard(); // Refresh UI (savings card + alerts)
            } else {
                alert('Error saving budget settings: ' + (result.message || 'unknown'));
            }
        } catch (err) {
            console.error('Save budget error', err);
            alert('An error occurred while saving.');
        }
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
    function formatCurrency(num, currency = 'USD') {
        // Use Intl.NumberFormat for proper currency formatting, but remove the $
        // Handles potential null or undefined values gracefully
        const number = parseFloat(num);
        if (isNaN(number)) {
            return '0.00'; // Or some other placeholder
        }
        const symbol = currencySymbols[currency] || '';
        // Use Intl for grouping/separators
        const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
        return symbol ? `${symbol}${formatted}` : `${formatted} ${currency}`;
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
    // Also close modal if overlay is clicked (select by class used in HTML)
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

    if (transactionForm) transactionForm.addEventListener("submit", handleTransactionSubmit);
    if (budgetForm) budgetForm.addEventListener('submit', handleBudgetSubmit);
    if (recentTransactionsList) recentTransactionsList.addEventListener('click', handleDeleteTransaction);
    if (profileButton) profileButton.addEventListener("click", toggleProfileMenu);
    // Open budget modal from profile menu
    const menuBudget = document.getElementById('menuBudget');
    if (menuBudget) menuBudget.addEventListener('click', (e) => { e.preventDefault(); toggleProfileMenu(); openBudgetModal(); });
    // Open profile modal from profile menu
    const menuProfile = document.getElementById('menuProfile');
    if (menuProfile) menuProfile.addEventListener('click', (e) => { e.preventDefault(); toggleProfileMenu(); openProfileModal(); });
    if (themeToggleButton) themeToggleButton.addEventListener("click", toggleTheme);
    
    // Close profile menu if clicking outside
    document.addEventListener('click', (e) => {
        if (!profileButton || !profileMenu) return;
        // Check if the click target is outside the profile button AND outside the profile menu
        if (!profileButton.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.classList.remove('active');
        }
    });

    // Budget modal close listeners
    if (closeBudgetModalBtn) closeBudgetModalBtn.addEventListener('click', closeBudgetModal);
    if (btnCancelBudget) btnCancelBudget.addEventListener('click', closeBudgetModal);
    // Also close budget modal when its overlay is clicked
    const budgetOverlay = budgetSettingsModal ? budgetSettingsModal.querySelector('.modal-overlay') : null;
    if (budgetOverlay) budgetOverlay.addEventListener('click', closeBudgetModal);

    // Profile modal close listeners
    if (closeProfileModalBtn) closeProfileModalBtn.addEventListener('click', closeProfileModal);
    if (btnCancelProfile) btnCancelProfile.addEventListener('click', closeProfileModal);
    const profileOverlay = profileSettingsModal ? profileSettingsModal.querySelector('.modal-overlay') : null;
    if (profileOverlay) profileOverlay.addEventListener('click', closeProfileModal);

    if (profileForm) profileForm.addEventListener('submit', handleProfileSubmit);

    // Avatar feature removed

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

