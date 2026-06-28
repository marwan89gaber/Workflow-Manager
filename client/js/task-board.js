// ==========================================
// js/task-board.js — with file upload + manager review actions
// ==========================================

let boardTasks      = { todo:[], in_progress:[], in_review:[], done:[] };
let currentBoardTask = null;

async function initTaskBoard() {
    await Components.initLayout();
    const isManager = Auth.isManagerOrAdmin();
    const content   = document.getElementById('mainContent');

    content.innerHTML = `
        <div class="page-header" style="margin-bottom:1.5rem;display:flex;justify-content:space-between;align-items:center;">
            <div><h1>Task Board</h1><p class="text-muted">Drag and drop to update status</p></div>
            <a href="tasks.html" class="btn btn-secondary">List View</a>
        </div>

        <div class="board-container">
            ${[
                { status:'todo',        icon:'📋', label:'To Do' },
                { status:'in_progress', icon:'🔄', label:'In Progress' },
                { status:'in_review',   icon: isManager ? '📥' : '👀', label: isManager ? 'To Review' : 'In Review' },
                { status:'done',        icon:'✅', label:'Done' }
            ].map(col => `
                <div class="board-column" data-status="${col.status}">
                    <div class="board-column-header">
                        <span class="board-column-title">${col.icon} ${col.label}</span>
                        <span class="board-column-count" id="count-${col.status}">0</span>
                    </div>
                    <div id="column-${col.status}" class="column-tasks"></div>
                </div>`).join('')}
        </div>
        <div id="boardTaskDetailModal"></div>`;

    await loadBoardTasks();
    setupDragAndDrop();
}

async function loadBoardTasks() {
    try {
        const user = Auth.getUser();
        let tasks;
        if (Auth.isManagerOrAdmin()) {
            const r = await API.tasks.getAll();
            tasks   = r.data || r || [];
        } else {
            const r = await API.tasks.getByUser(user.user_id);
            tasks   = Array.isArray(r) ? r : (r.data || []);
        }
        const myId = user.user_id;
        boardTasks = {
            todo:        tasks.filter(t => t.status==='todo'),
            in_progress: tasks.filter(t => t.status==='in_progress'),
            in_review:   tasks.filter(t => t.status==='in_review'),
            done:        tasks.filter(t => t.status==='done')
        };
        renderBoard();
    } catch(e) { Utils.showToast('Failed to load tasks','error'); }
}

function renderBoard() {
    const isManager = Auth.isManagerOrAdmin();
    const user      = Auth.getUser();
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
            const isOverdue = Utils.isOverdue(task.due_date) && task.status!=='done';
            const isMyTask  = isManager && task.created_by === user.user_id;
            const borderStyle = isMyTask ? 'border-left:3px solid var(--primary);' : '';
            return `
                <div class="task-card" draggable="true" data-task-id="${task.task_id}" data-status="${task.status}"
                     style="${borderStyle}">
                    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
                        <strong style="flex:1;font-size:0.95rem;">${Utils.escapeHtml(task.task_name)}</strong>
                        ${Components.renderPriorityBadge(task.priority)}
                    </div>
                    <p style="color:var(--secondary);font-size:0.8rem;margin-bottom:0.5rem;">
                        ${Utils.truncate(task.description||'No description',55)}</p>
                    <div style="display:flex;justify-content:space-between;font-size:0.8rem;">
                        <span style="color:${isOverdue?'var(--danger)':'var(--secondary)'};">
                            ${isOverdue?'⚠️ ':''} ${Utils.formatDate(task.due_date)}</span>
                        ${task.assigned_to?`<span style="color:var(--secondary);">👤 ${task.assigned_to}</span>`:''}
                    </div>
                </div>`;
        }).join('');
    });
}

// ---- Board Task Detail (identical to tasks.js, includes file upload + manager review) ----

async function showBoardTaskDetail(taskId) {
    try {
        const taskResp = await API.tasks.getById(taskId);
        const task     = taskResp.data || taskResp;

        const [cResp, fResp] = await Promise.all([
            API.comments.getByTask(taskId),
            API.files.getByTask(taskId)
        ]);
        const comments  = Array.isArray(cResp) ? cResp : (cResp.data || []);
        const files     = Array.isArray(fResp) ? fResp : (fResp.data || []);
        currentBoardTask = task;
        const isManager = Auth.isManagerOrAdmin();
        const modal     = document.getElementById('boardTaskDetailModal');

        modal.innerHTML = `
            <div class="modal show">
                <div class="modal-content" style="max-width:820px;">
                    <div class="modal-header">
                        <h2>${Utils.escapeHtml(task.task_name||'')}</h2>
                        <button class="modal-close" onclick="closeBoardTaskDetail()">×</button>
                    </div>

                    <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem;">
                        ${Components.renderStatusBadge(task.status)}
                        ${Components.renderPriorityBadge(task.priority)}
                        ${task.status==='in_review'&&isManager ? `
                            <button class="btn btn-sm btn-success" onclick="boardApproveTask(${taskId})">✅ Approve</button>
                            <button class="btn btn-sm btn-warning" onclick="boardRequestChanges(${taskId})">↩ Request Changes</button>
                        ` : ''}
                        ${task.status==='todo'&&!isManager?`<button class="btn btn-sm btn-primary" onclick="boardCommitTask(${taskId})">▶ Commit</button>`:''}
                        ${task.status==='in_progress'&&!isManager?`<button class="btn btn-sm" style="background:var(--warning);color:white;" onclick="boardSubmitReview(${taskId})">📤 Submit Review</button>`:''}
                        ${task.status==='in_review'&&!isManager?`<span style="color:var(--secondary);font-size:0.875rem;align-self:center;">⏳ Awaiting manager review…</span>`:''}
                    </div>

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
                        <div><label class="form-label">Description</label>
                            <p>${Utils.escapeHtml(task.description||'No description')}</p></div>
                        <div>
                            <div><label class="form-label">Due Date</label>
                                <p style="color:${Utils.isOverdue(task.due_date)&&task.status!=='done'?'var(--danger)':'inherit'};">
                                    ${Utils.formatDate(task.due_date)}</p></div>
                            <div style="margin-top:0.5rem;"><label class="form-label">Assigned To</label>
                                <p>${task.assigned_to||'Unassigned'}</p></div>
                        </div>
                    </div>

                    <!-- Comments -->
                    <div class="form-group">
                        <h3>Comments (${comments.length})</h3>
                        <div style="max-height:260px;overflow-y:auto;margin-bottom:1rem;">
                            ${comments.length ? comments.map(c=>`
                                <div style="padding:0.75rem;background:var(--light);border-radius:var(--radius-md);margin-bottom:0.5rem;">
                                    <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem;">
                                        <strong>${c.first_name||''} ${c.last_name||''}</strong>
                                        <small style="color:var(--secondary);">${Utils.formatRelativeTime(c.created_at)}</small>
                                    </div>
                                    <p style="margin:0;">${Utils.escapeHtml(c.comment_text)}</p>
                                </div>`).join('')
                            : '<p class="text-muted">No comments yet.</p>'}
                        </div>
                        <form onsubmit="addBoardComment(event,${taskId})">
                            <div style="display:flex;gap:0.5rem;">
                                <input type="text" class="form-control" id="boardCommentInput" placeholder="Add a comment…" required>
                                <button type="submit" class="btn btn-primary">Send</button>
                            </div>
                        </form>
                    </div>

                    <!-- Files -->
                    <div class="form-group">
                        <h3>Attachments (${files.length})</h3>
                        <div style="margin-bottom:1rem;">
                            ${files.length ? files.map(f=>`
                                <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;background:var(--light);border-radius:var(--radius-md);margin-bottom:0.5rem;">
                                    <span>${Utils.getFileIcon(f.file_type||'')} ${f.file_name}</span>
                                    <div style="display:flex;gap:0.5rem;">
                                        <a href="${API.files.getDownloadUrl(f.file_id)}" class="btn btn-sm" download>⬇ Download</a>
                                        <button class="btn btn-sm btn-danger" onclick="deleteBoardFile(${f.file_id},${taskId})">Delete</button>
                                    </div>
                                </div>`).join('')
                            : '<p class="text-muted">No files attached.</p>'}
                        </div>
                        <form onsubmit="uploadBoardFile(event,${taskId})">
                            <div style="display:flex;gap:0.5rem;">
                                <input type="file" class="form-control" id="boardFileInput">
                                <button type="submit" class="btn btn-primary">Upload</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>`;
    } catch(e) { Utils.showToast('Failed to load task: '+e.message,'error'); }
}

function closeBoardTaskDetail() { document.getElementById('boardTaskDetailModal').innerHTML=''; currentBoardTask=null; }

async function boardCommitTask(id)    { await _boardStatus(id,'in_progress','Task committed 💪'); }
async function boardSubmitReview(id)  { await _boardStatus(id,'in_review','Submitted for review 📤'); }
async function boardApproveTask(id)   { if(!confirm('Approve?')) return; await _boardStatus(id,'done','Task approved ✅'); }
async function _boardStatus(id, status, msg) {
    try { await API.tasks.updateStatus(id,status); Utils.showToast(msg,'success'); closeBoardTaskDetail(); await loadBoardTasks(); }
    catch(e) { Utils.showToast('Failed','error'); }
}

async function boardRequestChanges(taskId) {
    const reason = prompt('Reason for requesting changes:');
    try {
        await API.tasks.updateStatus(taskId,'in_progress');
        if (reason?.trim()) await API.comments.create(taskId,`↩ Manager requested changes: ${reason.trim()}`);
        Utils.showToast('Changes requested','info');
        closeBoardTaskDetail(); await loadBoardTasks();
    } catch(e) { Utils.showToast('Failed','error'); }
}

async function addBoardComment(event, taskId) {
    event.preventDefault();
    const input = document.getElementById('boardCommentInput');
    if (!input.value.trim()) return;
    try { await API.comments.create(taskId,input.value.trim()); input.value=''; await showBoardTaskDetail(taskId); Utils.showToast('Comment added','success'); }
    catch(e) { Utils.showToast('Failed','error'); }
}

async function uploadBoardFile(event, taskId) {
    event.preventDefault();
    const input = document.getElementById('boardFileInput');
    const file  = input.files[0];
    if (!file||!Utils.isValidFile(file)) return;
    try { await API.files.upload(taskId,file); await showBoardTaskDetail(taskId); Utils.showToast('Uploaded','success'); }
    catch(e) { Utils.showToast('Failed to upload','error'); }
}

async function deleteBoardFile(fileId, taskId) {
    if (!confirm('Delete this file?')) return;
    try { await API.files.delete(fileId); await showBoardTaskDetail(taskId); Utils.showToast('Deleted','success'); }
    catch(e) { Utils.showToast('Failed','error'); }
}

// ---- Drag and Drop ----
function setupDragAndDrop() {
    let dragTaskId=null, origStatus=null, dragTs=0;

    document.addEventListener('dragstart', e => {
        const c = e.target.closest('.task-card');
        if (!c) return;
        dragTaskId = c.dataset.taskId; origStatus = c.dataset.status;
        dragTs = Date.now(); c.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    document.addEventListener('dragend', e => {
        e.target.closest?.('.task-card')?.classList.remove('dragging');
    });
    document.addEventListener('dragover', e => {
        e.preventDefault();
        const col = e.target.closest('.board-column');
        if (col) { document.querySelectorAll('.board-column').forEach(c=>c.classList.remove('drag-over')); col.classList.add('drag-over'); }
    });
    document.addEventListener('dragleave', e => {
        const col = e.target.closest('.board-column');
        if (col && !col.contains(e.relatedTarget)) col.classList.remove('drag-over');
    });
    document.addEventListener('drop', async e => {
        e.preventDefault();
        const col = e.target.closest('.board-column');
        if (!col) return;
        col.classList.remove('drag-over');
        const newStatus = col.dataset.status;
        if (newStatus !== origStatus && dragTaskId) {
            try { await API.tasks.updateStatus(dragTaskId,newStatus); Utils.showToast('Status updated','success'); await loadBoardTasks(); }
            catch(e) { Utils.showToast('Failed','error'); }
        }
    });

    // Click opens modal (not redirect) — guard against drag being interpreted as click
    document.addEventListener('click', e => {
        if (Date.now() - dragTs < 300) return;
        const card = e.target.closest('.task-card');
        if (card && !e.target.closest('button') && !e.target.closest('a')) {
            showBoardTaskDetail(parseInt(card.dataset.taskId));
        }
    });
}
