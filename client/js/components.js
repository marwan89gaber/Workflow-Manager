// ==========================================
// js/components.js - Reusable UI Components
// ==========================================

const Components = {
    renderSidebar() {
        const user = Auth.getUser();
        const isManagerOrAdmin = Auth.isManagerOrAdmin();
        const currentPage = window.location.pathname.split('/').pop();

        return `
            <div class="sidebar">
                <div class="sidebar-header">
                    <h2>WorkFlow</h2>
                    <p class="text-muted" style="font-size: 0.875rem; margin: 0;">
                        ${user.first_name} ${user.last_name}
                    </p>
                </div>
                <ul class="sidebar-nav">
                    <li>
                        <a href="dashboard.html" class="${currentPage === 'dashboard.html' ? 'active' : ''}">
                            <span class="icon">📊</span> Dashboard
                        </a>
                    </li>
                    <li>
                        <a href="projects.html" class="${currentPage === 'projects.html' || currentPage === 'project-detail.html' ? 'active' : ''}">
                            <span class="icon">📁</span> Projects
                        </a>
                    </li>
                    <li>
                        <a href="tasks.html" class="${currentPage === 'tasks.html' ? 'active' : ''}">
                            <span class="icon">✓</span> My Tasks
                        </a>
                    </li>
                    <li>
                        <a href="task-board.html" class="${currentPage === 'task-board.html' ? 'active' : ''}">
                            <span class="icon">📋</span> Task Board
                        </a>
                    </li>
                    ${isManagerOrAdmin ? `
                    <li>
                        <a href="reports.html" class="${currentPage === 'reports.html' ? 'active' : ''}">
                            <span class="icon">📈</span> Reports
                        </a>
                    </li>` : ''}
                    <li>
                        <a href="profile.html" class="${currentPage === 'profile.html' ? 'active' : ''}">
                            <span class="icon">👤</span> Profile
                        </a>
                    </li>
                    <li>
                        <a href="#" onclick="Auth.logout(); return false;">
                            <span class="icon">🚪</span> Logout
                        </a>
                    </li>
                </ul>
            </div>
        `;
    },

    async renderNavbar() {
        const user = Auth.getUser();
        const initials = Utils.getInitials(user.first_name, user.last_name);

        try {
            const [notifResp, msgResp] = await Promise.all([
                API.notifications.getUnreadCount(),
                API.messages.getUnreadCount()
            ]);

            const notifCount = notifResp.data ?? notifResp ?? 0;
            const msgCount   = msgResp.data   ?? msgResp   ?? 0;

            return `
                <nav class="navbar">
                    <div class="navbar-left"><h1>WorkFlow Manager</h1></div>
                    <div class="navbar-right">
                        <div class="notification-badge" onclick="window.location.href='notifications.html'" title="Notifications">
                            <span class="icon" style="font-size:1.5rem;cursor:pointer;">🔔</span>
                            ${notifCount > 0 ? `<span class="badge">${notifCount}</span>` : ''}
                        </div>
                        <div class="message-badge" onclick="window.location.href='chat.html'" title="Messages">
                            <span class="icon" style="font-size:1.5rem;cursor:pointer;">💬</span>
                            ${msgCount > 0 ? `<span class="badge">${msgCount}</span>` : ''}
                        </div>
                        <div class="user-menu">
                            <div class="user-avatar" onclick="Components.toggleUserMenu()">${initials}</div>
                            <div class="dropdown-menu" id="userDropdown">
                                <a href="profile.html">Profile</a>
                                <a href="#" onclick="Auth.logout(); return false;">Logout</a>
                            </div>
                        </div>
                    </div>
                </nav>
            `;
        } catch (error) {
            return `
                <nav class="navbar">
                    <div class="navbar-left"><h1>WorkFlow Manager</h1></div>
                    <div class="navbar-right"></div>
                </nav>
            `;
        }
    },

    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.toggle('show');
    },

    renderStatusBadge(status) {
        if (!status) return '<span class="badge">Unknown</span>';
        const statusText = Utils.snakeToTitle(status);
        return `<span class="badge badge-status-${status}">${statusText}</span>`;
    },

    renderPriorityBadge(priority) {
        if (!priority) return '<span class="badge">-</span>';
        const priorityText = Utils.capitalize(priority);
        return `<span class="badge badge-priority-${priority}">${priorityText}</span>`;
    },

    renderTaskCard(task) {
        const daysUntil = Utils.daysUntilDue(task.due_date);
        const isOverdue  = Utils.isOverdue(task.due_date);
        return `
            <div class="card task-card">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
                    <h3 style="margin:0;font-size:1.125rem;">${Utils.escapeHtml(task.task_name)}</h3>
                    ${this.renderPriorityBadge(task.priority)}
                </div>
                <p style="color:var(--secondary);margin-bottom:1rem;">${Utils.truncate(task.description||'No description',100)}</p>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    ${this.renderStatusBadge(task.status)}
                    <span style="font-size:0.875rem;color:${isOverdue?'var(--danger)':'var(--secondary)'};">
                        ${isOverdue?'⚠️ Overdue':daysUntil!==null?`📅 ${daysUntil} days`:'No due date'}
                    </span>
                </div>
            </div>
        `;
    },

    renderProjectCard(project) {
        return `
            <div class="card project-card" onclick="window.location.href='project-detail.html?id=${project.project_id}'">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
                    <h3 style="margin:0;font-size:1.125rem;">${Utils.escapeHtml(project.project_name)}</h3>
                    ${this.renderStatusBadge(project.status)}
                </div>
                <p style="color:var(--secondary);margin-bottom:1rem;">${Utils.truncate(project.description||'No description',120)}</p>
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.875rem;color:var(--secondary);">
                    <span>📅 ${Utils.formatDate(project.start_date)} – ${Utils.formatDate(project.end_date)}</span>
                    ${this.renderPriorityBadge(project.priority)}
                </div>
            </div>
        `;
    },

    renderNotification(notification) {
        return `
            <div class="notification-item ${!notification.is_read ? 'unread' : ''}" data-id="${notification.notification_id}">
                <div style="flex:1;">
                    <p style="margin:0 0 0.25rem 0;">${Utils.escapeHtml(notification.message)}</p>
                    <small style="color:var(--secondary);">${Utils.formatRelativeTime(notification.created_at)}</small>
                </div>
                <div class="notification-actions">
                    ${!notification.is_read ? `
                        <button class="btn btn-sm" onclick="markNotificationRead(${notification.notification_id})">Mark Read</button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteNotification(${notification.notification_id})">Delete</button>
                </div>
            </div>
        `;
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
                </div>
            `;
        }
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                const dropdown = document.getElementById('userDropdown');
                if (dropdown) dropdown.classList.remove('show');
            }
        });
    },

    showLoading(elementId) { Utils.showLoading(elementId); },

    showEmptyState(message, elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="empty-state" style="text-align:center;padding:3rem;color:var(--secondary);">
                    <div style="font-size:4rem;margin-bottom:1rem;">🔭</div>
                    <p style="font-size:1.125rem;">${message}</p>
                </div>
            `;
        }
    }
};
