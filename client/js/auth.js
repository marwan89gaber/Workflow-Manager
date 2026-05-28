// ==========================================
// js/auth.js - Authentication Logic
// ==========================================

const Auth = {
    getUser() {
        const userStr = localStorage.getItem(CONFIG.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    setUser(user) {
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    },

    removeUser() {
        localStorage.removeItem(CONFIG.USER_KEY);
    },

    isAuthenticated() {
        return !!this.getUser();
    },

    isManagerOrAdmin() {
        const user = this.getUser();
        return user && (user.role === 'manager' || user.role === 'admin');
    },

    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    redirectIfAuthenticated() {
        if (this.isAuthenticated()) {
            window.location.href = 'dashboard.html';
        }
    },

    async logout() {
        try {
            await fetch(`${CONFIG.API_BASE_URL}/users/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (e) {
            console.error('Logout error:', e);
        }
        this.removeUser();
        window.location.href = '../pages/login.html';
    }
};

window.addEventListener('unauthorized', () => {
    Auth.removeUser();
    window.location.href = 'login.html';
});