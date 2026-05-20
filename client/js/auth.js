// ==========================================
// js/auth.js - Authentication Logic
// ==========================================

const Auth = {
    // Get token from localStorage
    getToken() {
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    },

    // Set token in localStorage
    setToken(token) {
        localStorage.setItem(CONFIG.TOKEN_KEY, token);
    },

    // Remove token from localStorage
    removeToken() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
    },

    // Get user from localStorage
    getUser() {
        const userStr = localStorage.getItem(CONFIG.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    // Set user in localStorage
    setUser(user) {
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    },

    // Remove user from localStorage
    removeUser() {
        localStorage.removeItem(CONFIG.USER_KEY);
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    },

    // Check if user is manager or admin
    isManagerOrAdmin() {
        const user = this.getUser();
        return user && (user.role === 'manager' || user.role === 'admin');
    },

    // Check if user is admin
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    // Require authentication - redirect if not authenticated
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // Redirect if already authenticated
    redirectIfAuthenticated() {
        if (this.isAuthenticated()) {
            window.location.href = 'dashboard.html';
        }
    },

    // Logout
    logout() {
        this.removeToken();
        this.removeUser();
        Utils.showToast('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    }
};

// Listen for unauthorized events (401 responses)
window.addEventListener('unauthorized', () => {
    Auth.logout();
});