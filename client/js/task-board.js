// ==========================================
// js/task-board.js - Kanban Board Logic
// ==========================================

let boardTasks = {
    todo: [],
    in_progress: [],
    in_review: [],
    done: []
};

let boardUsers = [];
let boardProjects = [];

async function initTaskBoard() {
    await Components.initLayout();
    const canManageTasks = Auth.isManagerOrAdmin();
    
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="page-header" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1>Task Board</h1>
                <p class="text-muted">Drag and drop tasks to update their status</p>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end;">
                ${canManageTasks ? '<button class="btn btn-secondary" onclick="openCreateTaskModal()">+ New Task</button>' : ''}
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

        <div id="taskModalContainer"></div>
    `;

    await loadBoardTasks();
    setupDragAndDrop();
}

async function loadBoardTasks() {
    try {
        const user = Auth.getUser();
        const tasks = Auth.isManagerOrAdmin()
            ? await API.tasks.getByManager(user.user_id)
            : await API.tasks.getByUser(user.user_id);
        
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
    const canManageTasks = Auth.isManagerOrAdmin();

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
            const showReviewActions = canManageTasks && status === 'in_review';
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
                        ${showReviewActions ? `
                            <div style="display: flex; gap: 0.35rem; margin-left: 0.5rem;">
                                <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); handleTaskReviewAction(${task.task_id}, 'accept')">Accept</button>
                                <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); handleTaskReviewAction(${task.task_id}, 'decline')">Decline</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    });
}

async function openCreateTaskModal() {
    try {
        const [usersResponse, projectsResponse] = await Promise.all([
            API.users.getAll(),
            API.projects.getAll()
        ]);

        boardUsers = usersResponse.data || [];
        boardProjects = projectsResponse.data || [];

        document.getElementById('taskModalContainer').innerHTML = `
            <div class="modal show">
                <div class="modal-content" style="max-width: 720px;">
                    <div class="modal-header">
                        <h2>Create Task</h2>
                        <button class="modal-close" onclick="closeCreateTaskModal()">×</button>
                    </div>

                    <form id="createTaskForm" onsubmit="submitCreateTask(event)">
                        <div class="form-group">
                            <label class="form-label">Project</label>
                            <select class="form-control" id="taskProjectId" required>
                                <option value="">Select a project</option>
                                ${boardProjects.map(project => `<option value="${project.project_id}">${Utils.escapeHtml(project.project_name)}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Task Name</label>
                            <input type="text" class="form-control" id="taskName" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea class="form-control" id="taskDescription" rows="4"></textarea>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem;">
                            <div class="form-group">
                                <label class="form-label">Assignee</label>
                                <select class="form-control" id="taskAssignee">
                                    <option value="">Unassigned</option>
                                    ${boardUsers.map(user => `<option value="${user.user_id}">${Utils.escapeHtml(user.first_name)} ${Utils.escapeHtml(user.last_name)} (${Utils.escapeHtml(user.role)})</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Priority</label>
                                <select class="form-control" id="taskPriority">
                                    <option value="low">Low</option>
                                    <option value="medium" selected>Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem;">
                            <div class="form-group">
                                <label class="form-label">Due Date</label>
                                <input type="date" class="form-control" id="taskDueDate">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select class="form-control" id="taskStatus">
                                    <option value="todo" selected>To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="in_review">In Review</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem;">
                            <button type="button" class="btn btn-secondary" onclick="closeCreateTaskModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Create Task</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error opening create task modal:', error);
        Utils.showToast('Failed to load task form', 'error');
    }
}

function closeCreateTaskModal() {
    const container = document.getElementById('taskModalContainer');
    if (container) {
        container.innerHTML = '';
    }
}

async function submitCreateTask(event) {
    event.preventDefault();

    const project_id = document.getElementById('taskProjectId').value;
    const task_name = document.getElementById('taskName').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const assigned_to = document.getElementById('taskAssignee').value || null;
    const priority = document.getElementById('taskPriority').value;
    const due_date = document.getElementById('taskDueDate').value || null;
    const status = document.getElementById('taskStatus').value;

    try {
        await API.tasks.create({
            project_id,
            task_name,
            description,
            assigned_to,
            status,
            priority,
            due_date
        });

        Utils.showToast('Task created', 'success');
        closeCreateTaskModal();
        await loadBoardTasks();
    } catch (error) {
        console.error('Error creating task:', error);
        Utils.showToast('Failed to create task', 'error');
    }
}

async function handleTaskReviewAction(taskId, action) {
    try {
        if (action === 'accept') {
            await API.tasks.accept(taskId);
            Utils.showToast('Task accepted', 'success');
        } else {
            await API.tasks.decline(taskId);
            Utils.showToast('Task moved back to in progress', 'success');
        }

        await loadBoardTasks();
    } catch (error) {
        console.error('Error handling review action:', error);
        Utils.showToast('Failed to update task', 'error');
    }
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