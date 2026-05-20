// ==========================================
// js/dashboard.js - Dashboard Logic
// ==========================================

let dashboardData = {
    stats: null,
    tasks: [],
    projects: [],
    news: []
};

async function initDashboard() {
    await Components.initLayout();
    
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="page-header" style="margin-bottom: 2rem;">
            <h1>Dashboard</h1>
            <p class="text-muted">Welcome back, ${Auth.getUser().first_name}!</p>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid" id="statsGrid">
            <div class="loading-spinner"><div class="spinner"></div></div>
        </div>

        <!-- Main Content Grid -->
        <div class="dashboard-grid">
            <!-- Recent Tasks -->
            <div class="card">
                <div class="card-header">
                    <h3>My Recent Tasks</h3>
                    <a href="tasks.html" class="btn btn-sm btn-primary">View All</a>
                </div>
                <div id="recentTasks">
                    <div class="loading-spinner"><div class="spinner"></div></div>
                </div>
            </div>

            <!-- News & Announcements -->
            <div class="card">
                <div class="card-header">
                    <h3>News & Announcements</h3>
                </div>
                <div class="news-list" id="newsList">
                    <div class="loading-spinner"><div class="spinner"></div></div>
                </div>
            </div>
        </div>
    `;

    await loadDashboardData();
}

async function loadDashboardData() {
    try {
        const user = Auth.getUser();
        
        console.log('📍 Loading dashboard for user:', user.user_id);
        
        const [dashboardResponse, tasksResponse, newsResponse] = await Promise.all([
            API.users.getDashboard(user.user_id),
            API.tasks.getByUser(user.user_id),
            API.news.getAll()
        ]);

        console.log('📊 Dashboard response:', dashboardResponse);
        console.log('📋 Tasks response:', tasksResponse);
        console.log('📰 News response:', newsResponse);

        // Handle different response structures
        dashboardData.stats = dashboardResponse.data || dashboardResponse;
        dashboardData.tasks = tasksResponse.data || tasksResponse || [];
        dashboardData.news = newsResponse.data || newsResponse || [];

        // Get only 5 most recent tasks
        dashboardData.tasks = dashboardData.tasks.slice(0, 5);
        dashboardData.news = dashboardData.news.slice(0, 5);

        renderStats();
        renderRecentTasks();
        renderNews();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        Utils.showToast('Failed to load dashboard data', 'error');
        
        // Show empty state instead of infinite loading
        document.getElementById('statsGrid').innerHTML = '<p class="text-muted">Failed to load statistics</p>';
        document.getElementById('recentTasks').innerHTML = '<p class="text-muted">Failed to load tasks</p>';
        document.getElementById('newsList').innerHTML = '<p class="text-muted">Failed to load news</p>';
    }
}


function renderStats() {
    const stats = dashboardData.stats.stats;
    
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
            <div class="stat-icon" style="color: var(--primary);">📋</div>
            <div class="stat-info">
                <h3>${stats.total_tasks || 0}</h3>
                <p>Total Tasks</p>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon" style="color: var(--warning);">🔄</div>
            <div class="stat-info">
                <h3>${stats.in_progress_tasks || 0}</h3>
                <p>In Progress</p>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon" style="color: var(--success);">✅</div>
            <div class="stat-info">
                <h3>${stats.completed_tasks || 0}</h3>
                <p>Completed</p>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon" style="color: var(--info);">📁</div>
            <div class="stat-info">
                <h3>${stats.active_projects || 0}</h3>
                <p>Active Projects</p>
            </div>
        </div>
    `;
}

function renderRecentTasks() {
    const container = document.getElementById('recentTasks');
    const tasks = dashboardData.tasks;

    if (tasks.length === 0) {
        container.innerHTML = '<p class="text-muted text-center" style="padding: 2rem;">No tasks yet</p>';
        return;
    }

    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                </tr>
            </thead>
            <tbody>
                ${tasks.map(task => `
                    <tr style="cursor: pointer;" onclick="window.location.href='tasks.html?id=${task.task_id}'">
                        <td>${Utils.escapeHtml(task.task_name)}</td>
                        <td>${Components.renderStatusBadge(task.status)}</td>
                        <td>${Components.renderPriorityBadge(task.priority)}</td>
                        <td>${Utils.formatDate(task.due_date)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderNews() {
    const container = document.getElementById('newsList');
    const news = dashboardData.news;

    if (news.length === 0) {
        container.innerHTML = '<p class="text-muted text-center" style="padding: 2rem;">No announcements</p>';
        return;
    }

    container.innerHTML = news.map(item => `
        <div style="padding: 1rem; border-bottom: 1px solid var(--light); ${item.is_pinned ? 'background: rgba(255, 193, 7, 0.1);' : ''}">
            ${item.is_pinned ? '<span style="color: var(--warning); font-size: 0.875rem;">📌 Pinned</span>' : ''}
            <h4 style="margin: 0.5rem 0;">${Utils.escapeHtml(item.title)}</h4>
            <p style="margin: 0.5rem 0; color: var(--secondary);">${Utils.truncate(item.content, 100)}</p>
            <small style="color: var(--secondary);">
                ${Utils.formatRelativeTime(item.created_at)}
            </small>
        </div>
    `).join('');
}
