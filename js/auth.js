/*
================================================================
FINAL - js/auth.js (for login.html and signup.html)
================================================================

This file handles login and signup.
It uses the correct "/moneywise/" paths.
*/
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Helper function to show messages on the forms ---
    const showMessage = (form, message, type = "error") => {
        let messageEl = form.querySelector(".form-message");
        if (!messageEl) {
            messageEl = document.createElement("div");
            messageEl.className = "form-message";
            form.prepend(messageEl); 
        }
        messageEl.textContent = message;
        messageEl.className = `form-message ${type}`;
    };

    // --- SIGNUP LOGIC ---
    const signupForm = document.getElementById("signup-form");
    if (signupForm) {
        
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Stop the form from reloading
            
            const oldMessage = signupForm.querySelector(".form-message");
            if(oldMessage) oldMessage.remove();

            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            try {
                // Uses the correct "/moneywise/" path
                const response = await fetch("/moneywise/api/auth.php?action=signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password }),
                });

                const result = await response.json();

                if (result.status === "success") {
                    showMessage(signupForm, result.message, "success");
                    // Wait 2 seconds, then redirect to login page
                    setTimeout(() => {
                        // Uses the correct "/moneywise/" path
                        window.location.href = "/moneywise/login.html";
                    }, 2000);
                } else {
                    showMessage(signupForm, result.message, "error");
                }
            } catch (error) {
                console.error("Signup Fetch Error:", error);
                showMessage(signupForm, "A network error occurred. Please try again.", "error");
            }
        });
    }

    // --- LOGIN LOGIC ---
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Stop the form from reloading

            const oldMessage = loginForm.querySelector(".form-message");
            if(oldMessage) oldMessage.remove();

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            try {
                // Uses the correct "/moneywise/" path
                const response = await fetch("/moneywise/api/auth.php?action=login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });

                const result = await response.json();

                if (result.status === "success") {
                    // Uses the correct "/moneywise/" path
                    window.location.href = "/moneywise/index.html";
                } else {
                    showMessage(loginForm, result.message, "error");
                }
            } catch (error) {
                console.error("Login Fetch Error:", error);
                showMessage(loginForm, "A network error occurred. Please try again.", "error");
            }
        });
    }
});

