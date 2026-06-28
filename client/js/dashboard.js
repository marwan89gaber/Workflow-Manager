// ==========================================
// js/dashboard.js — tasks open inline modal
// ==========================================

let dashboardData = { stats:null, tasks:[], news:[] };

async function initDashboard() {
    await Components.initLayout();
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="page-header" style="margin-bottom:2rem;">
            <h1>Dashboard</h1>
            <p class="text-muted">Welcome back, ${Auth.getUser().first_name}!</p>
        </div>
        <div class="stats-grid" id="statsGrid">
            <div class="loading-spinner"><div class="spinner"></div></div>
        </div>
        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header">
                    <h3>My Recent Tasks</h3>
                    <a href="tasks.html" class="btn btn-sm btn-primary">View All</a>
                </div>
                <div id="recentTasks"><div class="loading-spinner"><div class="spinner"></div></div></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>News & Announcements</h3></div>
                <div class="news-list" id="newsList"><div class="loading-spinner"><div class="spinner"></div></div></div>
            </div>
        </div>
        <div id="dashboardTaskModal"></div>`;

    await loadDashboardData();
}

async function loadDashboardData() {
    try {
        const user = Auth.getUser();
        const [dbResp, tasksResp, newsResp] = await Promise.all([
            API.users.getDashboard(user.user_id),
            API.tasks.getByUser(user.user_id),
            API.news.getAll()
        ]);
        dashboardData.stats = dbResp.data || dbResp;
        dashboardData.tasks = (Array.isArray(tasksResp) ? tasksResp : (tasksResp.data||[])).slice(0,5);
        dashboardData.news  = (newsResp.data || newsResp || []).slice(0,5);
        renderStats(); renderRecentTasks(); renderNews();
    } catch(e) {
        console.error(e);
        Utils.showToast('Failed to load dashboard','error');
        ['statsGrid','recentTasks','newsList'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<p class="text-muted" style="padding:1rem;">Failed to load</p>';
        });
    }
}

function renderStats() {
    const stats = dashboardData.stats?.stats || {};
    document.getElementById('statsGrid').innerHTML = `
        ${[
            {icon:'📋',val:stats.total_tasks||0,    label:'Total Tasks',    color:'var(--primary)'},
            {icon:'🔄',val:stats.in_progress_tasks||0,label:'In Progress', color:'var(--warning)'},
            {icon:'✅',val:stats.completed_tasks||0, label:'Completed',     color:'var(--success)'},
            {icon:'📁',val:stats.active_projects||0, label:'Active Projects',color:'var(--info)'}
        ].map(s=>`
            <div class="stat-card">
                <div class="stat-icon" style="color:${s.color};">${s.icon}</div>
                <div class="stat-info"><h3>${s.val}</h3><p>${s.label}</p></div>
            </div>`).join('')}`;
}

function renderRecentTasks() {
    const container = document.getElementById('recentTasks');
    if (!dashboardData.tasks.length) {
        container.innerHTML = '<p class="text-muted text-center" style="padding:2rem;">No tasks yet</p>';
        return;
    }
    container.innerHTML = `
        <table class="table">
            <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Due Date</th></tr></thead>
            <tbody>
                ${dashboardData.tasks.map(task => `
                    <tr style="cursor:pointer;" onclick="showDashboardTask(${task.task_id})">
                        <td>${Utils.escapeHtml(task.task_name)}</td>
                        <td>${Components.renderStatusBadge(task.status)}</td>
                        <td>${Components.renderPriorityBadge(task.priority)}</td>
                        <td>${Utils.formatDate(task.due_date)}</td>
                    </tr>`).join('')}
            </tbody>
        </table>`;
}

function renderNews() {
    const container = document.getElementById('newsList');
    if (!dashboardData.news.length) {
        container.innerHTML = '<p class="text-muted text-center" style="padding:2rem;">No announcements</p>';
        return;
    }
    container.innerHTML = dashboardData.news.map(item => `
        <div style="padding:1rem;border-bottom:1px solid var(--light);${item.is_pinned?'background:rgba(255,193,7,0.07);':''}">
            ${item.is_pinned?'<span style="color:var(--warning);font-size:0.8rem;">📌 Pinned</span>':''}
            <h4 style="margin:0.4rem 0;">${Utils.escapeHtml(item.title)}</h4>
            <p style="margin:0.25rem 0;color:var(--secondary);">${Utils.truncate(item.content,100)}</p>
            <small style="color:var(--secondary);">${Utils.formatRelativeTime(item.created_at)}</small>
        </div>`).join('');
}

// Inline task detail modal from dashboard (no redirect to tasks page)
async function showDashboardTask(taskId) {
    try {
        const taskResp = await API.tasks.getById(taskId);
        const task     = taskResp.data || taskResp;
        const [cR, fR] = await Promise.all([
            API.comments.getByTask(taskId),
            API.files.getByTask(taskId)
        ]);
        const comments = Array.isArray(cR) ? cR : (cR.data||[]);
        const files    = Array.isArray(fR) ? fR : (fR.data||[]);
        const isManager = Auth.isManagerOrAdmin();
        const modal    = document.getElementById('dashboardTaskModal');

        modal.innerHTML = `
            <div class="modal show">
                <div class="modal-content" style="max-width:780px;">
                    <div class="modal-header">
                        <h2>${Utils.escapeHtml(task.task_name||'')}</h2>
                        <button class="modal-close" onclick="closeDashboardTask()">×</button>
                    </div>
                    <div style="display:flex;gap:1rem;margin-bottom:1.5rem;">
                        ${Components.renderStatusBadge(task.status)}
                        ${Components.renderPriorityBadge(task.priority)}
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
                        <div><label class="form-label">Description</label>
                            <p>${Utils.escapeHtml(task.description||'No description')}</p></div>
                        <div>
                            <label class="form-label">Due Date</label>
                            <p>${Utils.formatDate(task.due_date)}</p>
                            <label class="form-label" style="margin-top:0.5rem;">Assigned To</label>
                            <p>${task.assigned_to||'Unassigned'}</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <h3>Comments (${comments.length})</h3>
                        <div style="max-height:240px;overflow-y:auto;margin-bottom:1rem;">
                            ${comments.length ? comments.map(c=>`
                                <div style="padding:0.75rem;background:var(--light);border-radius:var(--radius-md);margin-bottom:0.5rem;">
                                    <div style="display:flex;justify-content:space-between;">
                                        <strong>${c.first_name||''} ${c.last_name||''}</strong>
                                        <small style="color:var(--secondary);">${Utils.formatRelativeTime(c.created_at)}</small>
                                    </div>
                                    <p style="margin:0;">${Utils.escapeHtml(c.comment_text)}</p>
                                </div>`).join('')
                            : '<p class="text-muted">No comments yet.</p>'}
                        </div>
                        <form onsubmit="addDashComment(event,${taskId})">
                            <div style="display:flex;gap:0.5rem;">
                                <input type="text" class="form-control" id="dashCommentInput" placeholder="Add a comment…" required>
                                <button type="submit" class="btn btn-primary">Send</button>
                            </div>
                        </form>
                    </div>
                    <p style="margin-top:1rem;"><a href="tasks.html?modal=${taskId}" style="color:var(--primary);">Open full task view →</a></p>
                </div>
            </div>`;
    } catch(e) { Utils.showToast('Failed to load task','error'); }
}

function closeDashboardTask() { document.getElementById('dashboardTaskModal').innerHTML=''; }

async function addDashComment(event, taskId) {
    event.preventDefault();
    const input = document.getElementById('dashCommentInput');
    if (!input.value.trim()) return;
    try {
        await API.comments.create(taskId, input.value.trim());
        input.value = '';
        await showDashboardTask(taskId);
        Utils.showToast('Comment added','success');
    } catch(e) { Utils.showToast('Failed','error'); }
}
