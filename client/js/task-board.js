// ==========================================
// js/task-board.js - Kanban Board Logic
// ==========================================

let boardTasks = {
    todo: [],
    in_progress: [],
    in_review: [],
    done: []
};

async function initTaskBoard() {
    await Components.initLayout();
    
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="page-header" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1>Task Board</h1>
                <p class="text-muted">Drag and drop tasks to update their status</p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <a href="tasks.html" class="btn btn-secondary">List View</a>
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
                    <span class="board-column-title">👀 In Review</span>
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
    `;

    await loadBoardTasks();
    setupDragAndDrop();
}

async function loadBoardTasks() {
    try {
        const user = Auth.getUser();
        const tasks = await API.tasks.getByUser(user.user_id);
        
        // Group tasks by status
        boardTasks = {
            todo: tasks.filter(t => t.status === 'todo'),
            in_progress: tasks.filter(t => t.status === 'in_progress'),
            in_review: tasks.filter(t => t.status === 'in_review'),
            done: tasks.filter(t => t.status === 'done')
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
        const count = document.getElementById(`count-${status}`);
        const tasks = boardTasks[status];
        
        count.textContent = tasks.length;
        
        if (tasks.length === 0) {
            column.innerHTML = '<p class="text-muted" style="text-align: center; padding: 2rem;">No tasks</p>';
            return;
        }

        column.innerHTML = tasks.map(task => {
            const isOverdue = Utils.isOverdue(task.due_date) && task.status !== 'done';
            return `
                <div class="task-card" draggable="true" data-task-id="${task.task_id}" data-status="${task.status}">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <strong style="flex: 1;">${Utils.escapeHtml(task.task_name)}</strong>
                        ${Components.renderPriorityBadge(task.priority)}
                    </div>
                    <p style="color: var(--secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                        ${Utils.truncate(task.description || 'No description', 60)}
                    </p>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem;">
                        <span style="color: ${isOverdue ? 'var(--danger)' : 'var(--secondary)'};">
                            ${isOverdue ? '⚠️ ' : ''}${Utils.formatDate(task.due_date)}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    });
}

function setupDragAndDrop() {
    let draggedElement = null;
    let draggedTaskId = null;
    let originalStatus = null;
    let wasDragging = false;

    // Handle drag start
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('task-card')) {
            draggedElement = e.target;
            draggedTaskId = e.target.dataset.taskId;
            originalStatus = e.target.dataset.status;
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    // Handle drag end
    document.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('task-card')) {
            e.target.classList.remove('dragging');
        }

        wasDragging = true;
        setTimeout(() => {
            wasDragging = false;
        }, 50);
    });

    // Handle drag over columns
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        const column = e.target.closest('.board-column');
        if (column) {
            column.classList.add('drag-over');
            e.dataTransfer.dropEffect = 'move';
        }
    });

    // Handle drag leave
    document.addEventListener('dragleave', (e) => {
        const column = e.target.closest('.board-column');
        if (column && !column.contains(e.relatedTarget)) {
            column.classList.remove('drag-over');
        }
    });

    // Handle drop
    document.addEventListener('drop', async (e) => {
        e.preventDefault();
        
        const column = e.target.closest('.board-column');
        if (!column) return;

        column.classList.remove('drag-over');
        
        const newStatus = column.dataset.status;
        
        if (newStatus !== originalStatus) {
            try {
                await API.tasks.updateStatus(draggedTaskId, newStatus);
                Utils.showToast('Task status updated', 'success');
                await loadBoardTasks();
            } catch (error) {
                Utils.showToast('Failed to update task status', 'error');
                console.error(error);
            }
        }
    });

    // Click to view details
    document.addEventListener('click', (e) => {
        if (wasDragging) return;

        const taskCard = e.target.closest('.task-card');
        if (taskCard && !e.target.closest('button')) {
            const taskId = taskCard.dataset.taskId;
            window.location.href = `tasks.html?id=${taskId}`;
        }
    });
}