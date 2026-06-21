// ==========================================
// js/task-board.js - Kanban Board Logic
// ==========================================

let boardTasks = { todo: [], in_progress: [], in_review: [], done: [] };
let currentBoardTask = null;

async function initTaskBoard() {
    await Components.initLayout();

    const isManager = Auth.isManagerOrAdmin();
    const content   = document.getElementById('mainContent');

    content.innerHTML = `
        <div class="page-header" style="margin-bottom:1.5rem;display:flex;justify-content:space-between;align-items:center;">
            <div>
                <h1>Task Board</h1>
                <p class="text-muted">Drag and drop tasks to update their status</p>
            </div>
            <div style="display:flex;gap:0.5rem;">
                <a href="tasks.html"      class="btn btn-secondary">List View</a>
                <a href="task-board.html" class="btn btn-primary">Board View</a>
            </div>
        </div>

        <div class="board-container">
            <div class="board-column" data-status="todo">
                <div class="board-column-header">
                    <span class="board-column-title">📋 To Do</span>
                    <span class="board-column-count" id="count-todo">0</span>
                </div>
                <div id="column-todo" class="column-tasks"></div>
            </div>
            <div class="board-column" data-status="in_progress">
                <div class="board-column-header">
                    <span class="board-column-title">🔄 In Progress</span>
                    <span class="board-column-count" id="count-in_progress">0</span>
                </div>
                <div id="column-in_progress" class="column-tasks"></div>
            </div>
            <div class="board-column" data-status="in_review">
                <div class="board-column-header">
                    <span class="board-column-title">${isManager ? '📥 To Review' : '👀 In Review'}</span>
                    <span class="board-column-count" id="count-in_review">0</span>
                </div>
                <div id="column-in_review" class="column-tasks"></div>
            </div>
            <div class="board-column" data-status="done">
                <div class="board-column-header">
                    <span class="board-column-title">✅ Done</span>
                    <span class="board-column-count" id="count-done">0</span>
                </div>
                <div id="column-done" class="column-tasks"></div>
            </div>
        </div>

        <!-- Task Detail Modal -->
        <div id="boardTaskDetailModal"></div>
    `;

    await loadBoardTasks();
    setupDragAndDrop();
}

async function loadBoardTasks() {
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

        boardTasks = {
            todo:        tasks.filter(t => t.status === 'todo'),
            in_progress: tasks.filter(t => t.status === 'in_progress'),
            in_review:   tasks.filter(t => t.status === 'in_review'),
            done:        tasks.filter(t => t.status === 'done')
        };

        renderBoard();
    } catch (error) {
        console.error('Error loading tasks:', error);
        Utils.showToast('Failed to load tasks', 'error');
    }
}

function renderBoard() {
    Object.keys(boardTasks).forEach(status => {
        const column = document.getElementById(`column-${status}`);
        const count  = document.getElementById(`count-${status}`);
        const tasks  = boardTasks[status];

        count.textContent = tasks.length;

        if (!tasks.length) {
            column.innerHTML = '<p class="text-muted" style="text-align:center;padding:2rem;">No tasks</p>';
            return;
        }

        column.innerHTML = tasks.map(task => {
            const isOverdue = Utils.isOverdue(task.due_date) && task.status !== 'done';
            return `
                <div class="task-card" draggable="true" data-task-id="${task.task_id}" data-status="${task.status}">
                    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
                        <strong style="flex:1;">${Utils.escapeHtml(task.task_name)}</strong>
                        ${Components.renderPriorityBadge(task.priority)}
                    </div>
                    <p style="color:var(--secondary);font-size:0.875rem;margin-bottom:0.5rem;">
                        ${Utils.truncate(task.description || 'No description', 60)}
                    </p>
                    <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.875rem;">
                        <span style="color:${isOverdue ? 'var(--danger)' : 'var(--secondary)'};">
                            ${isOverdue ? '⚠️ ' : ''}${Utils.formatDate(task.due_date)}
                        </span>
                        ${task.assigned_to ? `<span style="color:var(--secondary);">👤 ${task.assigned_to}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    });
}

// ---- Task Detail Modal (same as tasks.js) ----

async function showBoardTaskDetail(taskId) {
    try {
        const taskResp     = await API.tasks.getById(taskId);
        const task         = taskResp.data || taskResp;

        const commentsResp = await API.comments.getByTask(taskId);
        const comments     = Array.isArray(commentsResp) ? commentsResp : (commentsResp.data || []);

        const filesResp    = await API.files.getByTask(taskId);
        const files        = Array.isArray(filesResp) ? filesResp : (filesResp.data || []);

        currentBoardTask   = task;
        const modal        = document.getElementById('boardTaskDetailModal');
        const isManager    = Auth.isManagerOrAdmin();

        modal.innerHTML = `
            <div class="modal show">
                <div class="modal-content" style="max-width:800px;">
                    <div class="modal-header">
                        <h2>${Utils.escapeHtml(task.task_name || '')}</h2>
                        <button class="modal-close" onclick="closeBoardTaskDetail()">×</button>
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
                        <div id="boardCommentsSection" style="max-height:300px;overflow-y:auto;margin-bottom:1rem;">
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
                        <form onsubmit="addBoardComment(event, ${taskId})">
                            <div style="display:flex;gap:0.5rem;">
                                <input type="text" class="form-control" id="boardCommentInput" placeholder="Add a comment..." required>
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
                                        <a href="${API.files.getDownloadUrl(f.file_id)}" class="btn btn-sm" download>Download</a>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading task details:', error);
        Utils.showToast('Failed to load task details: ' + error.message, 'error');
    }
}

function closeBoardTaskDetail() {
    document.getElementById('boardTaskDetailModal').innerHTML = '';
    currentBoardTask = null;
}

async function addBoardComment(event, taskId) {
    event.preventDefault();
    const input = document.getElementById('boardCommentInput');
    const text  = input.value.trim();
    if (!text) return;
    try {
        await API.comments.create(taskId, text);
        input.value = '';
        await showBoardTaskDetail(taskId);
        Utils.showToast('Comment added', 'success');
    } catch (error) {
        Utils.showToast('Failed to add comment', 'error');
    }
}

// ---- Drag and Drop ----

function setupDragAndDrop() {
    let draggedTaskId    = null;
    let originalStatus   = null;
    let isDragging       = false;
    let dragStartTime    = 0;

    document.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.task-card');
        if (!card) return;
        draggedTaskId  = card.dataset.taskId;
        originalStatus = card.dataset.status;
        isDragging     = true;
        dragStartTime  = Date.now();
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    document.addEventListener('dragend', (e) => {
        const card = e.target.closest('.task-card');
        if (card) card.classList.remove('dragging');
        setTimeout(() => { isDragging = false; }, 100);
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        const col = e.target.closest('.board-column');
        if (col) {
            document.querySelectorAll('.board-column').forEach(c => c.classList.remove('drag-over'));
            col.classList.add('drag-over');
            e.dataTransfer.dropEffect = 'move';
        }
    });

    document.addEventListener('dragleave', (e) => {
        const col = e.target.closest('.board-column');
        if (col && !col.contains(e.relatedTarget)) col.classList.remove('drag-over');
    });

    document.addEventListener('drop', async (e) => {
        e.preventDefault();
        const col = e.target.closest('.board-column');
        if (!col) return;
        col.classList.remove('drag-over');
        const newStatus = col.dataset.status;
        if (newStatus !== originalStatus && draggedTaskId) {
            try {
                await API.tasks.updateStatus(draggedTaskId, newStatus);
                Utils.showToast('Task status updated', 'success');
                await loadBoardTasks();
            } catch (error) {
                Utils.showToast('Failed to update task status', 'error');
            }
        }
        isDragging = false;
    });

    // Click to open task detail modal
    document.addEventListener('click', (e) => {
        // Ignore if we just finished dragging
        if (isDragging || (Date.now() - dragStartTime < 200)) return;

        const taskCard = e.target.closest('.task-card');
        if (taskCard && !e.target.closest('button') && !e.target.closest('a')) {
            const taskId = taskCard.dataset.taskId;
            showBoardTaskDetail(parseInt(taskId));
        }
    });
}
