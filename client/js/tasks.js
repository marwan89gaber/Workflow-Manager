// ==========================================
// js/tasks.js — full rewrite with all fixes
// ==========================================

let allTasks        = [];
let filteredTasks   = [];
let currentTask     = null;
let showOnlyMyTasks = false; // manager toggle: false=all, true=only mine

async function initTasks() {
    await Components.initLayout();
    const isManager = Auth.isManagerOrAdmin();
    const user      = Auth.getUser();
    const content   = document.getElementById('mainContent');

    content.innerHTML = `
        <div class="page-header" style="margin-bottom:2rem;display:flex;justify-content:space-between;align-items:center;">
            <div>
                <h1 id="taskPageTitle">${isManager ? 'All Tasks' : 'My Tasks'}</h1>
                <p class="text-muted">${isManager ? 'Manage and review all project tasks' : 'Your assigned tasks'}</p>
            </div>
            <div style="display:flex;gap:0.5rem;">
                ${!isManager ? `<a href="task-board.html" class="btn btn-secondary">Board View</a>` : `<a href="task-board.html" class="btn btn-secondary">Board View</a>`}
            </div>
        </div>

        <div class="card">
            <div class="filters">
                <input type="text" class="form-control" placeholder="Search tasks…"
                       id="searchInput" style="max-width:260px;" oninput="filterTasks()">
                <select class="form-control" id="statusFilter" onchange="filterTasks()" style="max-width:180px;">
                    <option value="">All Statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">${isManager ? 'To Review' : 'In Review'}</option>
                    <option value="done">Done</option>
                </select>
                <select class="form-control" id="priorityFilter" onchange="filterTasks()" style="max-width:160px;">
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
                ${!isManager ? `<button class="btn btn-secondary" onclick="showOverdueTasks()">⚠️ Show Overdue</button>` : ''}
                ${isManager ? `
                    <button class="btn ${showOnlyMyTasks ? 'btn-primary' : 'btn-secondary'}" id="myTasksToggle" onclick="toggleMyTasks()">
                        ${showOnlyMyTasks ? '👤 My Tasks' : '🌐 All Tasks'}
                    </button>` : ''}
            </div>
        </div>

        <div class="card">
            <div id="tasksTable"><div class="loading-spinner"><div class="spinner"></div></div></div>
        </div>
        <div id="taskDetailModal"></div>`;

    await loadTasks();

    // Auto-open modal if ?modal=X is in URL (from notification / dashboard click)
    const params = Utils.getQueryParams();
    if (params.modal) await showTaskDetail(parseInt(params.modal));
}

async function loadTasks() {
    try {
        const user = Auth.getUser();
        let tasks;
        if (Auth.isManagerOrAdmin()) {
            if (showOnlyMyTasks) {
                const r = await API.tasks.getByUser(user.user_id);
                tasks   = Array.isArray(r) ? r : (r.data || []);
            } else {
                const r = await API.tasks.getAll();
                tasks   = r.data || r || [];
            }
        } else {
            const r = await API.tasks.getByUser(user.user_id);
            tasks   = Array.isArray(r) ? r : (r.data || []);
        }
        allTasks = filteredTasks = tasks;
        renderTasks();
    } catch(e) {
        console.error(e);
        Utils.showToast('Failed to load tasks', 'error');
    }
}

function toggleMyTasks() {
    showOnlyMyTasks = !showOnlyMyTasks;
    const btn = document.getElementById('myTasksToggle');
    if (btn) {
        btn.textContent = showOnlyMyTasks ? '👤 My Tasks' : '🌐 All Tasks';
        btn.className   = `btn ${showOnlyMyTasks ? 'btn-primary' : 'btn-secondary'}`;
    }
    const title = document.getElementById('taskPageTitle');
    if (title) title.textContent = showOnlyMyTasks ? 'My Tasks' : 'All Tasks';
    loadTasks();
}

function filterTasks() {
    const s  = document.getElementById('searchInput').value.toLowerCase();
    const st = document.getElementById('statusFilter').value;
    const pr = document.getElementById('priorityFilter').value;
    filteredTasks = allTasks.filter(t =>
        (!s  || t.task_name.toLowerCase().includes(s) || (t.description||'').toLowerCase().includes(s)) &&
        (!st || t.status   === st) &&
        (!pr || t.priority === pr)
    );
    renderTasks();
}

async function showOverdueTasks() {
    // Employee: filter from their own loaded tasks. Manager: fetch all overdue.
    if (Auth.isManagerOrAdmin()) {
        const r   = await API.tasks.getOverdue();
        filteredTasks = r.data || r || [];
    } else {
        filteredTasks = allTasks.filter(t => Utils.isOverdue(t.due_date) && t.status !== 'done');
    }
    renderTasks();
    Utils.showToast(`${filteredTasks.length} overdue task(s)`, 'info');
}

function renderTasks() {
    const table     = document.getElementById('tasksTable');
    const isManager = Auth.isManagerOrAdmin();
    const user      = Auth.getUser();

    if (!filteredTasks.length) {
        table.innerHTML = `<div style="text-align:center;padding:3rem;"><div style="font-size:4rem;">✓</div>
            <p style="color:var(--secondary);">No tasks found</p></div>`;
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
                    ${isManager ? '<th>Assigned To</th><th>Created By</th>' : ''}
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${filteredTasks.map(task => {
                    const isOverdue  = Utils.isOverdue(task.due_date) && task.status !== 'done';
                    const isMyTask   = isManager && task.created_by === user.user_id;
                    const rowStyle   = isManager
                        ? (isMyTask
                            ? 'border-left:3px solid var(--primary);'
                            : 'opacity:0.75;')
                        : '';

                    return `
                        <tr class="task-row" style="${rowStyle}cursor:pointer;" onclick="showTaskDetail(${task.task_id})">
                            <td>
                                <strong>${Utils.escapeHtml(task.task_name)}</strong>
                                ${isOverdue ? '<span style="color:var(--danger);margin-left:0.5rem;">⚠️</span>' : ''}
                                ${isMyTask  ? '<span class="badge" style="background:var(--primary);color:white;margin-left:0.5rem;font-size:0.7rem;">Mine</span>' : ''}
                            </td>
                            <td>${Components.renderStatusBadge(task.status)}</td>
                            <td>${Components.renderPriorityBadge(task.priority)}</td>
                            <td style="color:${isOverdue?'var(--danger)':'inherit'};">${Utils.formatDate(task.due_date)}</td>
                            <td>${task.project_id || 'N/A'}</td>
                            ${isManager ? `<td>${task.assigned_to||'Unassigned'}</td><td>${task.created_by||'—'}</td>` : ''}
                            <td onclick="event.stopPropagation();">${renderActionButton(task, isManager)}</td>
                        </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

// Returns contextual action button per task status
function renderActionButton(task, isManager) {
    if (isManager) {
        if (task.status === 'in_review') {
            return `<button class="btn btn-sm btn-success" onclick="approveTask(${task.task_id})">✅ Approve</button>
                    <button class="btn btn-sm btn-warning" onclick="requestChanges(${task.task_id})" style="margin-left:4px;">↩ Changes</button>`;
        }
        return ''; // managers don't need other action buttons in row
    }
    // Employee contextual buttons
    switch (task.status) {
        case 'todo':
            return `<button class="btn btn-sm btn-primary" onclick="commitTask(${task.task_id})">▶ Commit</button>`;
        case 'in_progress':
            return `<button class="btn btn-sm" style="background:var(--warning);color:white;" onclick="submitForReview(${task.task_id})">📤 Submit Review</button>`;
        case 'in_review':
            return `<button class="btn btn-sm btn-secondary" disabled>⏳ Awaiting Review</button>`;
        case 'done':
            return `<span style="color:var(--success);font-weight:600;">✅ Completed</span>`;
        default:
            return '';
    }
}

async function commitTask(taskId) {
    try {
        await API.tasks.updateStatus(taskId, 'in_progress');
        Utils.showToast('Task committed — good luck! 💪', 'success');
        await loadTasks();
    } catch(e) { Utils.showToast('Failed', 'error'); }
}

async function submitForReview(taskId) {
    try {
        await API.tasks.updateStatus(taskId, 'in_review');
        Utils.showToast('Submitted for manager review 📤', 'success');
        await loadTasks();
    } catch(e) { Utils.showToast('Failed', 'error'); }
}

async function approveTask(taskId) {
    if (!confirm('Approve this task and mark it as done?')) return;
    try {
        await API.tasks.updateStatus(taskId, 'done');
        Utils.showToast('Task approved ✅', 'success');
        await loadTasks();
    } catch(e) { Utils.showToast('Failed', 'error'); }
}

async function requestChanges(taskId) {
    const reason = prompt('Reason for requesting changes (optional, will be posted as a comment):');
    try {
        await API.tasks.updateStatus(taskId, 'in_progress');
        if (reason && reason.trim()) {
            await API.comments.create(taskId, `↩ Manager requested changes: ${reason.trim()}`);
        }
        Utils.showToast('Changes requested — task returned to employee', 'info');
        await loadTasks();
    } catch(e) { Utils.showToast('Failed', 'error'); }
}

// ---- Task Detail Modal ----

async function showTaskDetail(taskId) {
    try {
        const taskResp = await API.tasks.getById(taskId);
        const task     = taskResp.data || taskResp;

        const [cResp, fResp] = await Promise.all([
            API.comments.getByTask(taskId),
            API.files.getByTask(taskId)
        ]);
        const comments = Array.isArray(cResp) ? cResp : (cResp.data || []);
        const files    = Array.isArray(fResp) ? fResp : (fResp.data || []);

        currentTask    = task;
        const isManager = Auth.isManagerOrAdmin();
        const modal    = document.getElementById('taskDetailModal');

        modal.innerHTML = `
            <div class="modal show">
                <div class="modal-content" style="max-width:820px;">
                    <div class="modal-header">
                        <h2>${Utils.escapeHtml(task.task_name || '')}</h2>
                        <button class="modal-close" onclick="closeTaskDetail()">×</button>
                    </div>

                    <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem;">
                        ${Components.renderStatusBadge(task.status)}
                        ${Components.renderPriorityBadge(task.priority)}
                        ${task.status==='in_review'&&isManager ? `
                            <button class="btn btn-sm btn-success" onclick="approveTask(${taskId});closeTaskDetail();">✅ Approve</button>
                            <button class="btn btn-sm btn-warning" onclick="requestChangesModal(${taskId})">↩ Request Changes</button>
                        ` : ''}
                        ${task.status==='todo'    && !isManager ? `<button class="btn btn-sm btn-primary" onclick="commitTask(${taskId});closeTaskDetail();">▶ Commit</button>` : ''}
                        ${task.status==='in_progress'&&!isManager?`<button class="btn btn-sm" style="background:var(--warning);color:white;" onclick="submitForReview(${taskId});closeTaskDetail();">📤 Submit for Review</button>`:''}
                        ${task.status==='in_review'&&!isManager?`<span style="color:var(--secondary);font-size:0.875rem;align-self:center;">⏳ Awaiting manager review…</span>`:''}
                    </div>

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
                        <div><label class="form-label">Description</label>
                            <p>${Utils.escapeHtml(task.description || 'No description')}</p></div>
                        <div>
                            <div><label class="form-label">Due Date</label><p style="color:${Utils.isOverdue(task.due_date)&&task.status!=='done'?'var(--danger)':'inherit'};">${Utils.formatDate(task.due_date)}</p></div>
                            <div style="margin-top:0.5rem;"><label class="form-label">Assigned To</label><p>${task.assigned_to||'Unassigned'}</p></div>
                            <div style="margin-top:0.5rem;"><label class="form-label">Created By</label><p>${task.created_by||'—'}</p></div>
                        </div>
                    </div>

                    <!-- Comments -->
                    <div class="form-group">
                        <h3>Comments (${comments.length})</h3>
                        <div style="max-height:280px;overflow-y:auto;margin-bottom:1rem;">
                            ${comments.length ? comments.map(c => `
                                <div style="padding:0.75rem;background:var(--light);border-radius:var(--radius-md);margin-bottom:0.5rem;">
                                    <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem;">
                                        <strong>${c.first_name||''} ${c.last_name||''}</strong>
                                        <small style="color:var(--secondary);">${Utils.formatRelativeTime(c.created_at)}</small>
                                    </div>
                                    <p style="margin:0;">${Utils.escapeHtml(c.comment_text)}</p>
                                </div>`).join('')
                            : '<p class="text-muted">No comments yet.</p>'}
                        </div>
                        <form onsubmit="addComment(event,${taskId})">
                            <div style="display:flex;gap:0.5rem;">
                                <input type="text" class="form-control" id="commentInput" placeholder="Add a comment…" required>
                                <button type="submit" class="btn btn-primary">Send</button>
                            </div>
                        </form>
                    </div>

                    <!-- Files -->
                    <div class="form-group">
                        <h3>Attachments (${files.length})</h3>
                        <div style="margin-bottom:1rem;">
                            ${files.length ? files.map(f => `
                                <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;background:var(--light);border-radius:var(--radius-md);margin-bottom:0.5rem;">
                                    <span>${Utils.getFileIcon(f.file_type||'')} ${f.file_name}</span>
                                    <div style="display:flex;gap:0.5rem;">
                                        <a href="${API.files.getDownloadUrl(f.file_id)}" class="btn btn-sm" download>⬇ Download</a>
                                        <button class="btn btn-sm btn-danger" onclick="deleteFile(${f.file_id},${taskId})">Delete</button>
                                    </div>
                                </div>`).join('')
                            : '<p class="text-muted">No files attached.</p>'}
                        </div>
                        <form onsubmit="uploadFile(event,${taskId})">
                            <div style="display:flex;gap:0.5rem;">
                                <input type="file" class="form-control" id="fileInput">
                                <button type="submit" class="btn btn-primary">Upload</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>`;
    } catch(e) {
        console.error(e);
        Utils.showToast('Failed to load task details: ' + e.message, 'error');
    }
}

async function requestChangesModal(taskId) {
    const reason = prompt('Reason for requesting changes (will be posted as a comment):');
    try {
        await API.tasks.updateStatus(taskId, 'in_progress');
        if (reason?.trim()) await API.comments.create(taskId, `↩ Manager requested changes: ${reason.trim()}`);
        Utils.showToast('Changes requested', 'info');
        closeTaskDetail();
        await loadTasks();
    } catch(e) { Utils.showToast('Failed', 'error'); }
}

function closeTaskDetail() { document.getElementById('taskDetailModal').innerHTML = ''; currentTask = null; }

async function addComment(event, taskId) {
    event.preventDefault();
    const input = document.getElementById('commentInput');
    if (!input.value.trim()) return;
    try {
        await API.comments.create(taskId, input.value.trim());
        input.value = '';
        await showTaskDetail(taskId);
        Utils.showToast('Comment added', 'success');
    } catch(e) { Utils.showToast('Failed', 'error'); }
}

async function uploadFile(event, taskId) {
    event.preventDefault();
    const input = document.getElementById('fileInput');
    const file  = input.files[0];
    if (!file || !Utils.isValidFile(file)) return;
    try { await API.files.upload(taskId, file); await showTaskDetail(taskId); Utils.showToast('Uploaded', 'success'); }
    catch(e) { Utils.showToast('Failed to upload', 'error'); }
}

async function deleteFile(fileId, taskId) {
    if (!confirm('Delete this file?')) return;
    try { await API.files.delete(fileId); await showTaskDetail(taskId); Utils.showToast('Deleted', 'success'); }
    catch(e) { Utils.showToast('Failed', 'error'); }
}
