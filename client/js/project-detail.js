// ==========================================
// js/project-detail.js — fixed chat send, fast DM, inline task modal
// ==========================================

let projectData = { project:null, tasks:[], members:[], groupConversationId:null };

async function initProjectDetail() {
    await Components.initLayout();
    const params    = Utils.getQueryParams();
    const projectId = params.id;
    if (!projectId) { window.location.href='projects.html'; return; }

    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div style="margin-bottom:2rem;">
            <a href="projects.html" style="color:var(--primary);">← Back to Projects</a>
        </div>
        <div id="projectHeader"><div class="loading-spinner"><div class="spinner"></div></div></div>
        <div class="tabs" id="projectTabs">
            <button class="tab active" onclick="switchTab('overview',event)">Overview</button>
            <button class="tab" onclick="switchTab('tasks',event)">Tasks</button>
            <button class="tab" onclick="switchTab('members',event)">Team Members</button>
            <button class="tab" onclick="switchTab('chat',event)">Group Chat</button>
        </div>
        <div id="overview" class="tab-content active"></div>
        <div id="tasks"    class="tab-content"></div>
        <div id="members"  class="tab-content"></div>
        <div id="chat"     class="tab-content"></div>
        <div id="projectTaskModal"></div>`;

    await loadProjectData(projectId);
}

async function loadProjectData(projectId) {
    try {
        const [projResp, tasksResp, membersResp] = await Promise.all([
            API.projects.getById(projectId),
            API.tasks.getByProject(projectId),
            API.projects.getMembers(projectId)
        ]);
        projectData.project = projResp.data  || projResp;
        projectData.tasks   = tasksResp.data  || tasksResp  || [];
        projectData.members = membersResp.data || membersResp || [];

        renderProjectHeader();
        renderOverview();
        renderTasks();
        renderMembers();
        await renderChat(projectId);
    } catch(e) {
        console.error(e);
        Utils.showToast('Failed to load project details','error');
    }
}

function renderProjectHeader() {
    const p = projectData.project;
    document.getElementById('projectHeader').innerHTML = `
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <div style="flex:1;">
                    <h1 style="margin:0 0 0.5rem 0;">${Utils.escapeHtml(p.project_name)}</h1>
                    <p style="color:var(--secondary);margin-bottom:1rem;">${Utils.escapeHtml(p.description||'No description')}</p>
                    <div style="display:flex;gap:1rem;align-items:center;">
                        ${Components.renderStatusBadge(p.status)}
                        ${Components.renderPriorityBadge(p.priority)}
                        <span style="color:var(--secondary);font-size:0.875rem;">📅 ${Utils.formatDate(p.start_date)} – ${Utils.formatDate(p.end_date)}</span>
                    </div>
                </div>
                ${Auth.isManagerOrAdmin()?`
                    <div style="display:flex;gap:0.5rem;">
                        <button class="btn btn-sm btn-primary" onclick="showEditProjectModal()">Edit</button>
                        <button class="btn btn-sm btn-danger"  onclick="deleteProjectDetail()">Delete</button>
                    </div>`:''}
            </div>
        </div>`;
}

function renderOverview() {
    const tasks    = projectData.tasks;
    const completed = tasks.filter(t=>t.status==='done').length;
    const pct       = tasks.length ? Math.round((completed/tasks.length)*100) : 0;
    document.getElementById('overview').innerHTML = `
        <div class="card">
            <h3>Project Progress</h3>
            <div style="margin-bottom:1rem;">
                <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
                    <span>Completion</span><span><strong>${pct}%</strong></span>
                </div>
                <div style="width:100%;height:16px;background:var(--light);border-radius:8px;overflow:hidden;">
                    <div style="width:${pct}%;height:100%;background:var(--success);transition:width 0.3s;"></div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin-top:1.5rem;">
                ${[
                    {val:tasks.length,            label:'Total Tasks',    color:'var(--primary)'},
                    {val:completed,               label:'Completed',      color:'var(--success)'},
                    {val:tasks.length-completed,  label:'In Progress',    color:'var(--warning)'},
                    {val:projectData.members.length,label:'Team Members', color:'var(--info)'}
                ].map(s=>`
                    <div style="text-align:center;padding:1rem;background:var(--light);border-radius:var(--radius-md);">
                        <div style="font-size:2rem;color:${s.color};">${s.val}</div>
                        <div style="color:var(--secondary);">${s.label}</div>
                    </div>`).join('')}
            </div>
        </div>`;
}

function renderTasks() {
    const tasks = projectData.tasks;
    document.getElementById('tasks').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>Project Tasks</h3>
                ${Auth.isManagerOrAdmin()?`<button class="btn btn-sm btn-primary" onclick="window.location.href='tasks.html'">+ Go to Tasks</button>`:''}
            </div>
            ${!tasks.length ? '<p class="text-muted text-center" style="padding:2rem;">No tasks yet.</p>' : `
            <table class="table">
                <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Assigned To</th><th>Due Date</th></tr></thead>
                <tbody>
                    ${tasks.map(t=>`
                        <tr style="cursor:pointer;" onclick="showProjectTask(${t.task_id})">
                            <td>${Utils.escapeHtml(t.task_name)}</td>
                            <td>${Components.renderStatusBadge(t.status)}</td>
                            <td>${Components.renderPriorityBadge(t.priority)}</td>
                            <td>${t.assigned_to||'Unassigned'}</td>
                            <td>${Utils.formatDate(t.due_date)}</td>
                        </tr>`).join('')}
                </tbody>
            </table>`}
        </div>`;
}

function renderMembers() {
    const members   = projectData.members;
    const currentUser = Auth.getUser();
    document.getElementById('members').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>Team Members</h3>
                ${Auth.isManagerOrAdmin()?`<button class="btn btn-sm btn-primary" onclick="showAddMemberModal()">+ Add Member</button>`:''}
            </div>
            <div class="member-list">
                ${!members.length ? '<p class="text-muted text-center" style="padding:2rem;">No members.</p>' :
                  members.map(m=>`
                    <div class="member-item">
                        <div>
                            <!-- Click name to start DM -->
                            <strong onclick="startDM('${m.user_id}')"
                                    style="cursor:pointer;color:var(--primary);"
                                    title="Click to send a direct message">
                                ${m.first_name} ${m.last_name} 💬
                            </strong>
                            <div style="font-size:0.875rem;color:var(--secondary);">${m.email} · ${Utils.capitalize(m.role)}</div>
                        </div>
                        ${Auth.isManagerOrAdmin()?`<button class="btn btn-sm btn-danger" onclick="removeMember('${m.user_id}')">Remove</button>`:''}
                    </div>`).join('')}
            </div>
        </div>`;
}

// Fast DM: create conversation and navigate to chat
async function startDM(userId) {
    const me = Auth.getUser();
    if (userId === me.user_id) { Utils.showToast("That's you!", 'info'); return; }
    try {
        await API.messages.createConversation({ conversation_type:'direct', receiver_id:userId });
        Utils.showToast('Opening chat…', 'success');
        window.location.href = 'chat.html';
    } catch(e) { Utils.showToast('Failed to start DM', 'error'); }
}

// Inline task detail modal (stays on project-detail page)
async function showProjectTask(taskId) {
    try {
        const taskResp = await API.tasks.getById(taskId);
        const task     = taskResp.data || taskResp;
        const [cR, fR] = await Promise.all([
            API.comments.getByTask(taskId),
            API.files.getByTask(taskId)
        ]);
        const comments  = Array.isArray(cR) ? cR : (cR.data||[]);
        const files     = Array.isArray(fR) ? fR : (fR.data||[]);
        const isManager = Auth.isManagerOrAdmin();
        const modal     = document.getElementById('projectTaskModal');

        modal.innerHTML = `
            <div class="modal show">
                <div class="modal-content" style="max-width:780px;">
                    <div class="modal-header">
                        <h2>${Utils.escapeHtml(task.task_name||'')}</h2>
                        <button class="modal-close" onclick="document.getElementById('projectTaskModal').innerHTML=''">×</button>
                    </div>
                    <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem;">
                        ${Components.renderStatusBadge(task.status)}
                        ${Components.renderPriorityBadge(task.priority)}
                        ${task.status==='in_review'&&isManager?`
                            <button class="btn btn-sm btn-success" onclick="projApproveTask(${taskId})">✅ Approve</button>
                            <button class="btn btn-sm btn-warning" onclick="projRequestChanges(${taskId})">↩ Changes</button>`:''}
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
                            ${comments.map(c=>`
                                <div style="padding:0.75rem;background:var(--light);border-radius:var(--radius-md);margin-bottom:0.5rem;">
                                    <div style="display:flex;justify-content:space-between;">
                                        <strong>${c.first_name||''} ${c.last_name||''}</strong>
                                        <small style="color:var(--secondary);">${Utils.formatRelativeTime(c.created_at)}</small>
                                    </div>
                                    <p style="margin:0;">${Utils.escapeHtml(c.comment_text)}</p>
                                </div>`).join('') || '<p class="text-muted">No comments yet.</p>'}
                        </div>
                        <form onsubmit="addProjComment(event,${taskId})">
                            <div style="display:flex;gap:0.5rem;">
                                <input type="text" class="form-control" id="projCommentInput" placeholder="Add a comment…" required>
                                <button type="submit" class="btn btn-primary">Send</button>
                            </div>
                        </form>
                    </div>
                    <div class="form-group">
                        <h3>Attachments (${files.length})</h3>
                        ${files.map(f=>`
                            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;background:var(--light);border-radius:var(--radius-md);margin-bottom:0.5rem;">
                                <span>${Utils.getFileIcon(f.file_type||'')} ${f.file_name}</span>
                                <a href="${API.files.getDownloadUrl(f.file_id)}" class="btn btn-sm" download>⬇ Download</a>
                            </div>`).join('') || '<p class="text-muted">No files.</p>'}
                    </div>
                    <p><a href="tasks.html?modal=${taskId}" style="color:var(--primary);">Open full task view →</a></p>
                </div>
            </div>`;
    } catch(e) { Utils.showToast('Failed to load task','error'); }
}

async function projApproveTask(taskId) {
    if (!confirm('Approve this task?')) return;
    try { await API.tasks.updateStatus(taskId,'done'); Utils.showToast('Approved ✅','success'); document.getElementById('projectTaskModal').innerHTML=''; await loadProjectData(Utils.getQueryParams().id); }
    catch(e) { Utils.showToast('Failed','error'); }
}

async function projRequestChanges(taskId) {
    const reason = prompt('Reason for requesting changes:');
    try {
        await API.tasks.updateStatus(taskId,'in_progress');
        if (reason?.trim()) await API.comments.create(taskId,`↩ Manager requested changes: ${reason.trim()}`);
        Utils.showToast('Changes requested','info');
        document.getElementById('projectTaskModal').innerHTML='';
        await loadProjectData(Utils.getQueryParams().id);
    } catch(e) { Utils.showToast('Failed','error'); }
}

async function addProjComment(event, taskId) {
    event.preventDefault();
    const input = document.getElementById('projCommentInput');
    if (!input.value.trim()) return;
    try { await API.comments.create(taskId,input.value.trim()); input.value=''; await showProjectTask(taskId); Utils.showToast('Comment added','success'); }
    catch(e) { Utils.showToast('Failed','error'); }
}

// ---- Group Chat ----

async function renderChat(projectId) {
    try {
        // Fetch messages
        const messResp = await API.messages.getProjectChat(projectId);
        const msgs     = messResp.data || messResp || [];

        // Find group conversation ID so we can send messages
        const convsResp = await API.messages.getConversations();
        const convs     = convsResp.data || convsResp || [];
        const groupConv = convs.find(c => c.conversation_type==='project_group' && String(c.project_id)===String(projectId));
        projectData.groupConversationId = groupConv?.conversation_id || null;

        document.getElementById('chat').innerHTML = `
            <div class="card">
                <div style="height:500px;display:flex;flex-direction:column;">
                    ${!projectData.groupConversationId ? `
                        <p class="text-muted text-center" style="padding:2rem;">
                            Group chat not found for this project. Make sure the project was created correctly.
                        </p>` : `
                    <div style="flex:1;overflow-y:auto;padding:1rem;border:1px solid var(--light);border-radius:var(--radius-md);margin-bottom:1rem;" id="chatMessages">
                        ${!msgs.length ? '<p class="text-muted text-center">No messages yet.</p>' :
                          msgs.map(msg=>`
                            <div style="margin-bottom:1rem;">
                                <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem;">
                                    <strong>${msg.first_name} ${msg.last_name}</strong>
                                    <span style="font-size:0.8rem;color:var(--secondary);">${Utils.formatRelativeTime(msg.sent_at)}</span>
                                </div>
                                <p style="margin:0;">${Utils.escapeHtml(msg.message_text)}</p>
                            </div>`).join('')}
                    </div>
                    <form id="chatForm" onsubmit="sendGroupMessage(event,${projectId})">
                        <div style="display:flex;gap:0.5rem;">
                            <input type="text" class="form-control" id="groupMsgInput" placeholder="Type a message…" required>
                            <button type="submit" class="btn btn-primary">Send</button>
                        </div>
                    </form>`}
                </div>
            </div>`;

        const chatBox = document.getElementById('chatMessages');
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    } catch(e) { console.error(e); }
}

async function sendGroupMessage(event, projectId) {
    event.preventDefault();
    const input   = document.getElementById('groupMsgInput');
    const message = input.value.trim();
    if (!message) return;

    if (!projectData.groupConversationId) {
        Utils.showToast('Group chat not available','error');
        return;
    }
    try {
        await API.messages.send(projectData.groupConversationId, message);
        input.value = '';
        await renderChat(projectId);
    } catch(e) { Utils.showToast('Failed to send message','error'); }
}

function switchTab(tabName, event) {
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
    if (event?.target) event.target.classList.add('active');
    document.getElementById(tabName)?.classList.add('active');
}

// ---- Member Management ----

async function removeMember(userId) {
    if (!confirm('Remove this member?')) return;
    try {
        await API.projects.removeMember(projectData.project.project_id, userId);
        Utils.showToast('Member removed','success');
        await loadProjectData(Utils.getQueryParams().id);
    } catch(e) { Utils.showToast('Failed','error'); }
}

function showAddMemberModal() {
    const modal = document.createElement('div');
    modal.className='modal show'; modal.id='addMemModal';
    modal.innerHTML=`
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header"><h2>Add Member</h2>
                <button class="modal-close" onclick="document.getElementById('addMemModal').remove()">×</button></div>
            <div class="form-group"><label class="form-label">User ID</label>
                <input type="text" class="form-control" id="newMemId" placeholder="e.g. ebj001" required></div>
            <div class="form-group"><label class="form-label">Role</label>
                <select class="form-control" id="newMemRole">
                    <option value="member">Member</option><option value="lead">Lead</option><option value="viewer">Viewer</option>
                </select></div>
            <div style="display:flex;gap:0.5rem;justify-content:flex-end;">
                <button class="btn btn-secondary" onclick="document.getElementById('addMemModal').remove()">Cancel</button>
                <button class="btn btn-primary" onclick="addMember()">Add</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
}

async function addMember() {
    const uid  = document.getElementById('newMemId').value.trim();
    const role = document.getElementById('newMemRole').value;
    if (!uid) { Utils.showToast('Enter a user ID','error'); return; }
    try {
        await API.projects.addMember(projectData.project.project_id, uid, role);
        Utils.showToast('Member added','success');
        document.getElementById('addMemModal').remove();
        await loadProjectData(Utils.getQueryParams().id);
    } catch(e) { Utils.showToast('Failed to add member','error'); }
}

async function deleteProjectDetail() {
    if (!confirm('Delete this project?')) return;
    try { await API.projects.delete(projectData.project.project_id); window.location.href='projects.html'; }
    catch(e) { Utils.showToast('Failed','error'); }
}

function showEditProjectModal() {
    const p = projectData.project;
    const modal = document.createElement('div');
    modal.className='modal show'; modal.id='editProjModal';
    modal.innerHTML=`
        <div class="modal-content" style="max-width:580px;">
            <div class="modal-header"><h2>Edit Project</h2>
                <button class="modal-close" onclick="document.getElementById('editProjModal').remove()">×</button></div>
            <div class="form-group"><label class="form-label">Project Name *</label>
                <input type="text" class="form-control" id="epName" value="${Utils.escapeHtml(p.project_name)}" required></div>
            <div class="form-group"><label class="form-label">Description</label>
                <textarea class="form-control" id="epDesc" rows="3">${Utils.escapeHtml(p.description||'')}</textarea></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div class="form-group"><label class="form-label">Start Date</label>
                    <input type="date" class="form-control" id="epStart" value="${p.start_date?p.start_date.split('T')[0]:''}"></div>
                <div class="form-group"><label class="form-label">End Date</label>
                    <input type="date" class="form-control" id="epEnd" value="${p.end_date?p.end_date.split('T')[0]:''}"></div>
            </div>
            <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;">
                <button class="btn btn-secondary" onclick="document.getElementById('editProjModal').remove()">Cancel</button>
                <button class="btn btn-primary" onclick="saveEditProject()">Update</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
}

async function saveEditProject() {
    try {
        await API.projects.update(projectData.project.project_id,{
            project_name: document.getElementById('epName').value.trim(),
            description:  document.getElementById('epDesc').value.trim(),
            start_date:   document.getElementById('epStart').value,
            end_date:     document.getElementById('epEnd').value
        });
        Utils.showToast('Project updated','success');
        document.getElementById('editProjModal').remove();
        await loadProjectData(Utils.getQueryParams().id);
    } catch(e) { Utils.showToast('Failed','error'); }
}
