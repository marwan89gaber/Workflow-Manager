// ==========================================
// js/components.js
// ==========================================

const Components = {
    renderSidebar() {
        const user            = Auth.getUser();
        const isManagerOrAdmin = Auth.isManagerOrAdmin();
        const currentPage     = window.location.pathname.split('/').pop();

        return `
            <div class="sidebar">
                <div class="sidebar-header">
                    <h2>WorkFlow</h2>
                    <p style="font-size:0.875rem;margin:0;color:rgba(255,255,255,0.6);">
                        ${user.first_name} ${user.last_name}
                    </p>
                </div>
                <ul class="sidebar-nav">
                    <li><a href="dashboard.html" class="${currentPage==='dashboard.html'?'active':''}">
                        <span class="icon">📊</span> Dashboard</a></li>
                    <li><a href="projects.html" class="${currentPage==='projects.html'||currentPage==='project-detail.html'?'active':''}">
                        <span class="icon">📁</span> Projects</a></li>

                    ${isManagerOrAdmin ? `
                    <!-- Manager: Task Board entry point (can switch to list inside) -->
                    <li><a href="task-board.html" class="${currentPage==='task-board.html'||currentPage==='tasks.html'?'active':''}">
                        <span class="icon">📋</span> Tasks</a></li>
                    <li><a href="reports.html" class="${currentPage==='reports.html'?'active':''}">
                        <span class="icon">📈</span> Reports</a></li>
                    ` : `
                    <!-- Employee: My Tasks entry point (can switch to board inside) -->
                    <li><a href="tasks.html" class="${currentPage==='tasks.html'?'active':''}">
                        <span class="icon">✓</span> My Tasks</a></li>
                    `}

                    <li><a href="profile.html" class="${currentPage==='profile.html'?'active':''}">
                        <span class="icon">👤</span> Profile</a></li>
                    <li><a href="#" onclick="Auth.logout();return false;">
                        <span class="icon">🚪</span> Logout</a></li>
                </ul>
            </div>
        `;
    },

    async renderNavbar() {
        const user     = Auth.getUser();
        const initials = Utils.getInitials(user.first_name, user.last_name);
        try {
            const [nR, mR] = await Promise.all([
                API.notifications.getUnreadCount(),
                API.messages.getUnreadCount()
            ]);
            const nc = nR.data ?? nR ?? 0;
            const mc = mR.data ?? mR ?? 0;
            return `
                <nav class="navbar">
                    <div class="navbar-left"><h1>WorkFlow Manager</h1></div>
                    <div class="navbar-right">
                        <div class="notification-badge" onclick="window.location.href='notifications.html'" title="Notifications">
                            <span style="font-size:1.5rem;cursor:pointer;">🔔</span>
                            ${nc>0?`<span class="badge">${nc}</span>`:''}
                        </div>
                        <div class="message-badge" onclick="window.location.href='chat.html'" title="Messages">
                            <span style="font-size:1.5rem;cursor:pointer;">💬</span>
                            ${mc>0?`<span class="badge">${mc}</span>`:''}
                        </div>
                        <div class="user-menu">
                            <div class="user-avatar" onclick="Components.toggleUserMenu()">${initials}</div>
                            <div class="dropdown-menu" id="userDropdown">
                                <a href="profile.html">Profile</a>
                                <a href="#" onclick="Auth.logout();return false;">Logout</a>
                            </div>
                        </div>
                    </div>
                </nav>`;
        } catch(e) {
            return `<nav class="navbar"><div class="navbar-left"><h1>WorkFlow Manager</h1></div><div class="navbar-right"></div></nav>`;
        }
    },

    toggleUserMenu() {
        document.getElementById('userDropdown')?.classList.toggle('show');
    },

    renderStatusBadge(status) {
        if (!status) return '<span class="badge">Unknown</span>';
        return `<span class="badge badge-status-${status}">${Utils.snakeToTitle(status)}</span>`;
    },

    renderPriorityBadge(priority) {
        if (!priority) return '<span class="badge">-</span>';
        return `<span class="badge badge-priority-${priority}">${Utils.capitalize(priority)}</span>`;
    },

    renderNotification(n) {
        return `
            <div class="notification-item ${!n.is_read?'unread':''}" data-id="${n.notification_id}"
                 onclick="handleNotificationClick(${n.notification_id},'${n.related_type}',${n.related_id})"
                 style="cursor:pointer;${!n.is_read?'font-weight:600;':''}" title="Click to view">
                <div style="flex:1;">
                    <p style="margin:0 0 0.25rem 0;">${Utils.escapeHtml(n.message)}</p>
                    <small style="color:var(--secondary);">${Utils.formatRelativeTime(n.created_at)}</small>
                </div>
                ${!n.is_read?`<span style="width:8px;height:8px;border-radius:50%;background:var(--primary);display:inline-block;margin-left:0.5rem;flex-shrink:0;"></span>`:''}
            </div>`;
    },

    async initLayout() {
        if (!Auth.requireAuth()) return;
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.innerHTML = `
                ${this.renderSidebar()}
                <div class="main-content">
                    ${await this.renderNavbar()}
                    <div class="content" id="mainContent"></div>
                </div>`;
        }
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                document.getElementById('userDropdown')?.classList.remove('show');
            }
        });
    },

    showEmptyState(msg, elId) {
        const el = document.getElementById(elId);
        if (el) el.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--secondary);"><div style="font-size:4rem;">🔭</div><p>${msg}</p></div>`;
    }
};
