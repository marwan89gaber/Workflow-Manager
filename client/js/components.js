// ==========================================
// js/components.js - Reusable UI Components
// ==========================================

const Components = {
    // Render Sidebar Navigation
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
                            <span class="icon">📊</span>
                            Dashboard
                        </a>
                    </li>
                    <li>
                        <a href="projects.html" class="${currentPage === 'projects.html' || currentPage === 'project-detail.html' ? 'active' : ''}">
                            <span class="icon">📁</span>
                            Projects
                        </a>
                    </li>
                    ${!isManagerOrAdmin ? `
                    <li>
                        <a href="tasks.html" class="${currentPage === 'tasks.html' ? 'active' : ''}">
                            <span class="icon">✓</span>
                            My Tasks
                        </a>
                    </li>
                    ` : ''}
                    <li>
                        <a href="task-board.html" class="${currentPage === 'task-board.html' ? 'active' : ''}">
                            <span class="icon">📋</span>
                            Task Board
                        </a>
                    </li>
                    <li>
                        <a href="chat.html" class="${currentPage === 'chat.html' ? 'active' : ''}">
                            <span class="icon">💬</span>
                            Messages
                        </a>
                    </li>
                    <li>
                        <a href="notifications.html" class="${currentPage === 'notifications.html' ? 'active' : ''}">
                            <span class="icon">🔔</span>
                            Notifications
                        </a>
                    </li>
                    ${isManagerOrAdmin ? `
                    <li>
                        <a href="reports.html" class="${currentPage === 'reports.html' ? 'active' : ''}">
                            <span class="icon">📈</span>
                            Reports
                        </a>
                    </li>
                    ` : ''}
                    ${Auth.isAdmin() ? `
                    <li>
                        <a href="admin.html" class="${currentPage === 'admin.html' ? 'active' : ''}">
                            <span class="icon">🛠️</span>
                            Admin
                        </a>
                    </li>
                    ` : ''}
                    <li>
                        <a href="profile.html" class="${currentPage === 'profile.html' ? 'active' : ''}">
                            <span class="icon">👤</span>
                            Profile
                        </a>
                    </li>
                    <li>
                        <a href="#" onclick="Auth.logout(); return false;">
                            <span class="icon">🚪</span>
                            Logout
                        </a>
                    </li>
                </ul>
            </div>
        `;
    },

    // Render Top Navbar
    async renderNavbar() {
        const user = Auth.getUser();
        const initials = Utils.getInitials(user.first_name, user.last_name);
        
        try {
            const [notifCount, msgCount] = await Promise.all([
                API.notifications.getUnreadCount(),
                API.messages.getUnreadCount()
            ]);

            return `
                <nav class="navbar">
                    <div class="navbar-left">
                        <h1>WorkFlow Manager</h1>
                    </div>
                    <div class="navbar-right">
                        <div class="notification-badge" onclick="window.location.href='notifications.html'">
                            <span class="icon" style="font-size: 1.5rem; cursor: pointer;">🔔</span>
                            ${notifCount > 0 ? `<span class="badge">${notifCount}</span>` : ''}
                        </div>
                        <div class="message-badge" onclick="window.location.href='chat.html'">
                            <span class="icon" style="font-size: 1.5rem; cursor: pointer;">💬</span>
                            ${msgCount > 0 ? `<span class="badge">${msgCount}</span>` : ''}
                        </div>
                        <div class="user-menu">
                            <div class="user-avatar" onclick="Components.toggleUserMenu()">
                                ${initials}
                            </div>
                            <div class="dropdown-menu" id="userDropdown">
                                <a href="profile.html">Profile</a>
                                <a href="#" onclick="Auth.logout(); return false;">Logout</a>
                            </div>
                        </div>
                    </div>
                </nav>
            `;
        } catch (error) {
            console.error('Error loading navbar:', error);
            return `
                <nav class="navbar">
                    <div class="navbar-left"><h1>WorkFlow Manager</h1></div>
                    <div class="navbar-right"></div>
                </nav>
            `;
        }
    },

    // Toggle user menu dropdown
    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.toggle('show');
    },

    // Render status badge
    renderStatusBadge(status) {
        const statusText = Utils.snakeToTitle(status);
        return `<span class="badge badge-status-${status}">${statusText}</span>`;
    },

    // Render priority badge
    renderPriorityBadge(priority) {
        const priorityText = Utils.capitalize(priority);
        return `<span class="badge badge-priority-${priority}">${priorityText}</span>`;
    },

    // Render task card
    renderTaskCard(task) {
        const daysUntil = Utils.daysUntilDue(task.due_date);
        const isOverdue = Utils.isOverdue(task.due_date);
        
        return `
            <div class="card task-card" onclick="window.location.href='task-detail.html?id=${task.task_id}'">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <h3 style="margin: 0; font-size: 1.125rem;">${Utils.escapeHtml(task.task_name)}</h3>
                    ${this.renderPriorityBadge(task.priority)}
                </div>
                <p style="color: var(--secondary); margin-bottom: 1rem;">
                    ${Utils.truncate(task.description || 'No description', 100)}
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    ${this.renderStatusBadge(task.status)}
                    <span style="font-size: 0.875rem; color: ${isOverdue ? 'var(--danger)' : 'var(--secondary)'};">
                        ${isOverdue ? '⚠️ Overdue' : daysUntil !== null ? `📅 ${daysUntil} days` : 'No due date'}
                    </span>
                </div>
            </div>
        `;
    },

    // Render project card
    renderProjectCard(project) {
        return `
            <div class="card project-card" onclick="window.location.href='project-detail.html?id=${project.project_id}'">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <h3 style="margin: 0; font-size: 1.125rem;">${Utils.escapeHtml(project.project_name)}</h3>
                    ${this.renderStatusBadge(project.status)}
                </div>
                <p style="color: var(--secondary); margin-bottom: 1rem;">
                    ${Utils.truncate(project.description || 'No description', 120)}
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; color: var(--secondary);">
                    <span>📅 ${Utils.formatDate(project.start_date)} - ${Utils.formatDate(project.end_date)}</span>
                    ${this.renderPriorityBadge(project.priority)}
                </div>
            </div>
        `;
    },

    // Render comment
    renderComment(comment, canEdit = false) {
        const user = Auth.getUser();
        const isOwner = comment.user_id === user.user_id;
        
        return `
            <div class="comment" data-comment-id="${comment.comment_id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <strong>${comment.first_name} ${comment.last_name}</strong>
                        <span class="comment-time">${Utils.formatRelativeTime(comment.created_at)}</span>
                    </div>
                    ${isOwner && canEdit ? `
                        <div class="comment-actions">
                            <button class="btn btn-sm" onclick="Components.editComment(${comment.comment_id})">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="Components.deleteComment(${comment.comment_id})">Delete</button>
                        </div>
                    ` : ''}
                </div>
                <div class="comment-body">
                    <p>${Utils.escapeHtml(comment.comment_text)}</p>
                </div>
                <button class="btn btn-sm" onclick="Components.showReplyForm(${comment.comment_id})">Reply</button>
                <div id="replies-${comment.comment_id}" class="comment-replies"></div>
                <div id="reply-form-${comment.comment_id}" class="reply-form" style="display: none;"></div>
            </div>
        `;
    },

    /*// Render news item
    renderNewsItem(news) {
        return `
            <div class="card news-item ${news.is_pinned ? 'pinned' : ''}">
                ${news.is_pinned ? '<div class="pin-indicator">📌 Pinned</div>' : ''}
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 0.5rem 0;">${Utils.escapeHtml(news.title)}</h3>
                        <p style="color: var(--secondary); margin-bottom: 1rem;">
                            ${Utils.escapeHtml(news.content)}
                        </p>
                        <div style="font-size: 0.875rem; color: var(--secondary);">
                            Posted by <strong>${news.first_name} ${news.last_name}</strong>
                            • ${Utils.formatRelativeTime(news.created_at)}
                        </div>
                    </div>
                    ${Auth.isManagerOrAdmin() ? `
                        <div class="news-actions">
                            <button class="btn btn-sm" onclick="editNews(${news.news_id})">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteNews(${news.news_id})">Delete</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },*/

    // Render notification
    renderNotification(notification) {
        return `
            <div class="notification-item ${!notification.is_read ? 'unread' : ''}" data-id="${notification.notification_id}">
                <div style="flex: 1;">
                    <p style="margin: 0 0 0.25rem 0;">${Utils.escapeHtml(notification.message)}</p>
                    <small style="color: var(--secondary);">${Utils.formatRelativeTime(notification.created_at)}</small>
                </div>
                <div class="notification-actions">
                    ${!notification.is_read ? `
                        <button class="btn btn-sm" onclick="markNotificationRead(${notification.notification_id})">
                            Mark Read
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteNotification(${notification.notification_id})">
                        Delete
                    </button>
                </div>
            </div>
        `;
    },

    // Initialize page layout
    async initLayout() {
        // Check auth
        if (!Auth.requireAuth()) return;

        // Inject sidebar and navbar
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.innerHTML = `
                ${this.renderSidebar()}
                <div class="main-content">
                    ${await this.renderNavbar()}
                    <div class="content" id="mainContent">
                        <!-- Page content will be inserted here -->
                    </div>
                </div>
            `;
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                const dropdown = document.getElementById('userDropdown');
                if (dropdown) dropdown.classList.remove('show');
            }
        });
    },

    // Show/Hide loading
    showLoading(elementId) {
        Utils.showLoading(elementId);
    },

    // Show empty state
    showEmptyState(message, elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem; color: var(--secondary);">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🔭</div>
                    <p style="font-size: 1.125rem;">${message}</p>
                </div>
            `;
        }
    }
};