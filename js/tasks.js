// ==========================================
// js/tasks.js - Tasks Page Logic
// ==========================================

let allTasks = [];
let filteredTasks = [];
let currentTask = null;

async function initTasks() {
    await Components.initLayout();
    
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="page-header" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1>My Tasks</h1>
                <p class="text-muted">Manage your assigned tasks</p>
            </div>
            <div class="view-switcher">
                <a href="tasks.html" class="btn btn-primary">List View</a>
                <a href="task-board.html" class="btn btn-secondary">Board View</a>
            </div>
        </div>

        <!-- Filters -->
        <div class="card">
            <div class="filters">
                <input 
                    type="text" 
                    class="form-control" 
                    placeholder="Search tasks..." 
                    id="searchInput"
                    style="max-width: 300px;"
                    oninput="filterTasks()"
                >
                <select class="form-control" id="statusFilter" onchange="filterTasks()" style="max-width: 200px;">
                    <option value="">All Statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                </select>
                <select class="form-control" id="priorityFilter" onchange="filterTasks()" style="max-width: 200px;">
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
                <button class="btn btn-secondary" onclick="showOverdueTasks()">Show Overdue</button>
            </div>
        </div>

        <!-- Tasks Table -->
        <div class="card">
            <div id="tasksTable">
                <div class="loading-spinner"><div class="spinner"></div></div>
            </div>
        </div>

        <!-- Task Detail Modal -->
        <div id="taskDetailModal"></div>
    `;

    await loadTasks();
}

async function loadTasks() {
    try {
        const user = Auth.getUser();
        const tasks = await API.tasks.getByUser(user.user_id);
        //console.log('📋 Loaded tasks for user:', user.user_id, 'Count:', tasks.length);
        allTasks = tasks;
        filteredTasks = tasks;
        renderTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        Utils.showToast('Failed to load tasks', 'error');
    }
}

function filterTasks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;

    filteredTasks = allTasks.filter(task => {
        const matchesSearch = !searchTerm || 
            task.task_name.toLowerCase().includes(searchTerm) ||
            (task.description && task.description.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || task.status === statusFilter;
        const matchesPriority = !priorityFilter || task.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    renderTasks();
}

async function showOverdueTasks() {
    try {
        const overdueTasks = await API.tasks.getOverdue();
        filteredTasks = overdueTasks;
        renderTasks();
        Utils.showToast(`Found ${overdueTasks.length} overdue tasks`, 'info');
    } catch (error) {
        Utils.showToast('Failed to load overdue tasks', 'error');
    }
}

function renderTasks() {
    const table = document.getElementById('tasksTable');
    
    if (filteredTasks.length === 0) {
        table.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 3rem;">
                <div style="font-size: 4rem;">✓</div>
                <p style="font-size: 1.125rem; color: var(--secondary);">No tasks found</p>
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
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredTasks.map(task => {
                    const isOverdue = Utils.isOverdue(task.due_date) && task.status !== 'done';
                    return `
                        <tr class="task-row" onclick="showTaskDetail(${task.task_id})">
                            <td>
                                <strong>${Utils.escapeHtml(task.task_name)}</strong>
                                ${isOverdue ? '<span style="color: var(--danger); margin-left: 0.5rem;">⚠️</span>' : ''}
                            </td>
                            <td>${Components.renderStatusBadge(task.status)}</td>
                            <td>${Components.renderPriorityBadge(task.priority)}</td>
                            <td style="color: ${isOverdue ? 'var(--danger)' : 'inherit'};">
                                ${Utils.formatDate(task.due_date)}
                            </td>
                            <td>${task.project_id || 'N/A'}</td>
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
        console.log('🔍 Loading task details for ID:', taskId);
        
        // Load task
        const task = await API.tasks.getById(taskId);
        console.log('✅ Task loaded:', task);
        
        // Load comments
        const comments = await API.comments.getByTask(taskId);
        console.log('✅ Comments loaded:', comments);
        console.log('🔍 Comments is array?', Array.isArray(comments));
        console.log('🔍 Comments length:', comments?.length);
        
        // Load files
        const files = await API.files.getByTask(taskId);
        console.log('✅ Files loaded:', files);
        console.log('🔍 Files is array?', Array.isArray(files));
        console.log('🔍 Files length:', files?.length);
        
        currentTask = task;

        const modal = document.getElementById('taskDetailModal');
        
        // Ensure arrays are valid
        const safeComments = Array.isArray(comments) ? comments : [];
        const safeFiles = Array.isArray(files) ? files : [];
        
        console.log('✅ Safe comments:', safeComments.length);
        console.log('✅ Safe files:', safeFiles.length);
        
        modal.innerHTML = `
            <div class="modal show">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h2>${Utils.escapeHtml(task.task_name)}</h2>
                        <button class="modal-close" onclick="closeTaskDetail()">×</button>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                        ${Components.renderStatusBadge(task.status)}
                        ${Components.renderPriorityBadge(task.priority)}
                    </div>

                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <p>${Utils.escapeHtml(task.description || 'No description')}</p>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                        <div>
                            <label class="form-label">Due Date</label>
                            <p>${Utils.formatDate(task.due_date)}</p>
                        </div>
                        <div>
                            <label class="form-label">Assigned To</label>
                            <p>${task.assigned_to || 'Unassigned'}</p>
                        </div>
                    </div>

                    <!-- Comments Section -->
                    <div class="form-group">
                        <h3>Comments (${safeComments.length})</h3>
                        <div id="commentsSection" style="max-height: 300px; overflow-y: auto; margin-bottom: 1rem;">
                            ${safeComments.length === 0 ? '<p class="text-muted">No comments yet.</p>' :
                                safeComments.map(comment => `
                                    <div style="padding: 1rem; background: var(--light); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                            <strong>${comment.first_name || 'Unknown'} ${comment.last_name || ''}</strong>
                                            <span style="font-size: 0.875rem; color: var(--secondary);">
                                                ${Utils.formatRelativeTime(comment.created_at)}
                                            </span>
                                        </div>
                                        <p style="margin: 0;">${Utils.escapeHtml(comment.comment_text)}</p>
                                    </div>
                                `).join('')
                            }
                        </div>
                        <form onsubmit="addComment(event, ${taskId})">
                            <div style="display: flex; gap: 0.5rem;">
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    id="commentInput"
                                    placeholder="Add a comment..."
                                    required
                                >
                                <button type="submit" class="btn btn-primary">Send</button>
                            </div>
                        </form>
                    </div>

                    <!-- Files Section -->
                    <div class="form-group">
                        <h3>Attachments (${safeFiles.length})</h3>
                        <div style="margin-bottom: 1rem;">
                            ${safeFiles.length === 0 ? '<p class="text-muted">No files attached.</p>' :
                                safeFiles.map(file => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--light); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
                                        <span>${Utils.getFileIcon(file.file_type)} ${file.file_name}</span>
                                        <div style="display: flex; gap: 0.5rem;">
                                            <a href="${API.files.getDownloadUrl(file.file_id)}" class="btn btn-sm" download>Download</a>
                                            <button class="btn btn-sm btn-danger" onclick="deleteFile(${file.file_id}, ${taskId})">Delete</button>
                                        </div>
                                    </div>
                                `).join('')
                            }
                        </div>
                        <form onsubmit="uploadFile(event, ${taskId})">
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="file" class="form-control" id="fileInput" required>
                                <button type="submit" class="btn btn-primary">Upload</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        console.log('✅ Modal rendered successfully');
        
    } catch (error) {
        console.error('❌ Error loading task details:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        Utils.showToast('Failed to load task details: ' + error.message, 'error');
    }
}

function closeTaskDetail() {
    document.getElementById('taskDetailModal').innerHTML = '';
    currentTask = null;
}

async function updateTaskStatus(taskId) {
    const newStatus = prompt('Enter new status (todo, in_progress, in_review, done):');
    if (!newStatus || !['todo', 'in_progress', 'in_review', 'done'].includes(newStatus)) {
        return;
    }

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
    const text = input.value.trim();

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
    const file = input.files[0];

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