// ==========================================
// js/tasks.js - Tasks Page Logic
// ==========================================

let allTasks      = [];
let filteredTasks = [];
let currentTask   = null;

async function initTasks() {
    await Components.initLayout();

    const content = document.getElementById('mainContent');
    const isManager = Auth.isManagerOrAdmin();

    content.innerHTML = `
        <div class="page-header" style="margin-bottom:2rem;display:flex;justify-content:space-between;align-items:center;">
            <div>
                <h1>${isManager ? 'All Tasks' : 'My Tasks'}</h1>
                <p class="text-muted">${isManager ? 'Manage all project tasks' : 'Manage your assigned tasks'}</p>
            </div>
            <div class="view-switcher">
                <a href="tasks.html"      class="btn btn-primary">List View</a>
                <a href="task-board.html" class="btn btn-secondary">Board View</a>
            </div>
        </div>

        <div class="card">
            <div class="filters">
                <input type="text" class="form-control" placeholder="Search tasks..."
                    id="searchInput" style="max-width:300px;" oninput="filterTasks()">
                <select class="form-control" id="statusFilter" onchange="filterTasks()" style="max-width:200px;">
                    <option value="">All Statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">${isManager ? 'To Review' : 'In Review'}</option>
                    <option value="done">Done</option>
                </select>
                <select class="form-control" id="priorityFilter" onchange="filterTasks()" style="max-width:200px;">
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
                ${!isManager ? `<button class="btn btn-secondary" onclick="showOverdueTasks()">Show Overdue</button>` : ''}
            </div>
        </div>

        <div class="card">
            <div id="tasksTable">
                <div class="loading-spinner"><div class="spinner"></div></div>
            </div>
        </div>

        <div id="taskDetailModal"></div>
    `;

    await loadTasks();
}

async function loadTasks() {
    try {
        const user = Auth.getUser();
        let tasks;

        if (Auth.isManagerOrAdmin()) {
            const resp = await API.tasks.getAll();
            tasks = resp.data || resp || [];
        } else {
            const resp = await API.tasks.getByUser(user.user_id);
            tasks = Array.isArray(resp) ? resp : (resp.data || []);
        }

        allTasks      = tasks;
        filteredTasks = tasks;
        renderTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        Utils.showToast('Failed to load tasks', 'error');
    }
}

function filterTasks() {
    const searchTerm    = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter  = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;

    filteredTasks = allTasks.filter(task => {
        const matchesSearch   = !searchTerm || task.task_name.toLowerCase().includes(searchTerm) ||
                                (task.description && task.description.toLowerCase().includes(searchTerm));
        const matchesStatus   = !statusFilter   || task.status   === statusFilter;
        const matchesPriority = !priorityFilter || task.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });
    renderTasks();
}

async function showOverdueTasks() {
    try {
        const resp = await API.tasks.getOverdue();
        filteredTasks = resp.data || resp || [];
        renderTasks();
        Utils.showToast(`Found ${filteredTasks.length} overdue tasks`, 'info');
    } catch (error) {
        Utils.showToast('Failed to load overdue tasks', 'error');
    }
}

function renderTasks() {
    const table     = document.getElementById('tasksTable');
    const isManager = Auth.isManagerOrAdmin();

    if (!filteredTasks.length) {
        table.innerHTML = `
            <div class="empty-state" style="text-align:center;padding:3rem;">
                <div style="font-size:4rem;">✓</div>
                <p style="font-size:1.125rem;color:var(--secondary);">No tasks found</p>
            </div>
        `;
        return;
    }

    table.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Task Name</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Project</th>
                    ${isManager ? '<th>Assigned To</th>' : ''}
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredTasks.map(task => {
                    const isOverdue = Utils.isOverdue(task.due_date) && task.status !== 'done';
                    const statusLabel = (isManager && task.status === 'in_review') ? 'To Review' :
                                        Utils.snakeToTitle(task.status);
                    return `
                        <tr class="task-row" onclick="showTaskDetail(${task.task_id})">
                            <td>
                                <strong>${Utils.escapeHtml(task.task_name)}</strong>
                                ${isOverdue ? '<span style="color:var(--danger);margin-left:0.5rem;">⚠️</span>' : ''}
                            </td>
                            <td>${Components.renderStatusBadge(task.status)}</td>
                            <td>${Components.renderPriorityBadge(task.priority)}</td>
                            <td style="color:${isOverdue ? 'var(--danger)' : 'inherit'};">
                                ${Utils.formatDate(task.due_date)}
                            </td>
                            <td>${task.project_id || 'N/A'}</td>
                            ${isManager ? `<td>${task.assigned_to || 'Unassigned'}</td>` : ''}
                            <td>
                                <button class="btn btn-sm" onclick="event.stopPropagation(); updateTaskStatus(${task.task_id})">
                                    Update Status
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

async function showTaskDetail(taskId) {
    try {
        const taskResp     = await API.tasks.getById(taskId);
        const task         = taskResp.data || taskResp;

        const commentsResp = await API.comments.getByTask(taskId);
        const comments     = Array.isArray(commentsResp) ? commentsResp : (commentsResp.data || []);

        const filesResp    = await API.files.getByTask(taskId);
        const files        = Array.isArray(filesResp) ? filesResp : (filesResp.data || []);

        currentTask = task;
        const modal = document.getElementById('taskDetailModal');

        const isManager   = Auth.isManagerOrAdmin();
        const statusLabel = (isManager && task.status === 'in_review') ? 'To Review' : Utils.snakeToTitle(task.status || '');

        modal.innerHTML = `
            <div class="modal show">
                <div class="modal-content" style="max-width:800px;">
                    <div class="modal-header">
                        <h2>${Utils.escapeHtml(task.task_name || '')}</h2>
                        <button class="modal-close" onclick="closeTaskDetail()">×</button>
                    </div>

                    <div style="display:flex;gap:1rem;margin-bottom:1.5rem;">
                        ${Components.renderStatusBadge(task.status)}
                        ${Components.renderPriorityBadge(task.priority)}
                    </div>

                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <p>${Utils.escapeHtml(task.description || 'No description')}</p>
                    </div>

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
                        <div>
                            <label class="form-label">Due Date</label>
                            <p>${Utils.formatDate(task.due_date)}</p>
                        </div>
                        <div>
                            <label class="form-label">Assigned To</label>
                            <p>${task.assigned_to || 'Unassigned'}</p>
                        </div>
                    </div>

                    <!-- Comments -->
                    <div class="form-group">
                        <h3>Comments (${comments.length})</h3>
                        <div id="commentsSection" style="max-height:300px;overflow-y:auto;margin-bottom:1rem;">
                            ${comments.length === 0
                              ? '<p class="text-muted">No comments yet.</p>'
                              : comments.map(c => `
                                    <div style="padding:1rem;background:var(--light);border-radius:var(--radius-md);margin-bottom:0.5rem;">
                                        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
                                            <strong>${c.first_name || ''} ${c.last_name || ''}</strong>
                                            <span style="font-size:0.875rem;color:var(--secondary);">${Utils.formatRelativeTime(c.created_at)}</span>
                                        </div>
                                        <p style="margin:0;">${Utils.escapeHtml(c.comment_text)}</p>
                                    </div>
                                `).join('')
                            }
                        </div>
                        <form onsubmit="addComment(event, ${taskId})">
                            <div style="display:flex;gap:0.5rem;">
                                <input type="text" class="form-control" id="commentInput" placeholder="Add a comment..." required>
                                <button type="submit" class="btn btn-primary">Send</button>
                            </div>
                        </form>
                    </div>

                    <!-- Files -->
                    <div class="form-group">
                        <h3>Attachments (${files.length})</h3>
                        <div style="margin-bottom:1rem;">
                            ${files.length === 0
                              ? '<p class="text-muted">No files attached.</p>'
                              : files.map(f => `
                                    <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;background:var(--light);border-radius:var(--radius-md);margin-bottom:0.5rem;">
                                        <span>${Utils.getFileIcon(f.file_type || '')} ${f.file_name}</span>
                                        <div style="display:flex;gap:0.5rem;">
                                            <a href="${API.files.getDownloadUrl(f.file_id)}" class="btn btn-sm" download>Download</a>
                                            <button class="btn btn-sm btn-danger" onclick="deleteFile(${f.file_id}, ${taskId})">Delete</button>
                                        </div>
                                    </div>
                                `).join('')
                            }
                        </div>
                        <form onsubmit="uploadFile(event, ${taskId})">
                            <div style="display:flex;gap:0.5rem;">
                                <input type="file" class="form-control" id="fileInput" required>
                                <button type="submit" class="btn btn-primary">Upload</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading task details:', error);
        Utils.showToast('Failed to load task details: ' + error.message, 'error');
    }
}

function closeTaskDetail() {
    document.getElementById('taskDetailModal').innerHTML = '';
    currentTask = null;
}

async function updateTaskStatus(taskId) {
    const newStatus = prompt('Enter new status (todo, in_progress, in_review, done):');
    if (!newStatus || !['todo', 'in_progress', 'in_review', 'done'].includes(newStatus)) return;
    try {
        await API.tasks.updateStatus(taskId, newStatus);
        Utils.showToast('Task status updated', 'success');
        await loadTasks();
    } catch (error) {
        Utils.showToast('Failed to update status', 'error');
    }
}

async function addComment(event, taskId) {
    event.preventDefault();
    const input = document.getElementById('commentInput');
    const text  = input.value.trim();
    if (!text) return;
    try {
        await API.comments.create(taskId, text);
        input.value = '';
        await showTaskDetail(taskId);
        Utils.showToast('Comment added', 'success');
    } catch (error) {
        Utils.showToast('Failed to add comment', 'error');
    }
}

async function uploadFile(event, taskId) {
    event.preventDefault();
    const input = document.getElementById('fileInput');
    const file  = input.files[0];
    if (!file || !Utils.isValidFile(file)) return;
    try {
        await API.files.upload(taskId, file);
        await showTaskDetail(taskId);
        Utils.showToast('File uploaded', 'success');
    } catch (error) {
        Utils.showToast('Failed to upload file', 'error');
    }
}

async function deleteFile(fileId, taskId) {
    if (!confirm('Delete this file?')) return;
    try {
        await API.files.delete(fileId);
        await showTaskDetail(taskId);
        Utils.showToast('File deleted', 'success');
    } catch (error) {
        Utils.showToast('Failed to delete file', 'error');
    }
}
