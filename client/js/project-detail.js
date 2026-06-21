// ==========================================
// js/project-detail.js
// ==========================================

let projectData = { project: null, tasks: [], members: [], messages: [] };

async function initProjectDetail() {
    await Components.initLayout();

    const params = Utils.getQueryParams();
    const projectId = params.id;
    if (!projectId) { window.location.href = 'projects.html'; return; }

    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div style="margin-bottom:2rem;">
            <a href="projects.html" style="color:var(--primary);text-decoration:none;">← Back to Projects</a>
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
    `;

    await loadProjectData(projectId);
}

async function loadProjectData(projectId) {
    try {
        const [projectResp, tasksResp, membersResp] = await Promise.all([
            API.projects.getById(projectId),
            API.tasks.getByProject(projectId),
            API.projects.getMembers(projectId)
        ]);

        projectData.project = projectResp.data || projectResp;
        projectData.tasks   = (tasksResp.data   || tasksResp)   || [];
        projectData.members = (membersResp.data  || membersResp) || [];

        renderProjectHeader();
        renderOverview();
        renderTasks();
        renderMembers();
        await renderChat(projectId);
    } catch (error) {
        console.error('Error loading project:', error);
        Utils.showToast('Failed to load project details', 'error');
    }
}

function renderProjectHeader() {
    const project = projectData.project;
    document.getElementById('projectHeader').innerHTML = `
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <div style="flex:1;">
                    <h1 style="margin:0 0 0.5rem 0;">${Utils.escapeHtml(project.project_name)}</h1>
                    <p style="color:var(--secondary);margin-bottom:1rem;">${Utils.escapeHtml(project.description || 'No description')}</p>
                    <div style="display:flex;gap:1rem;align-items:center;">
                        ${Components.renderStatusBadge(project.status)}
                        ${Components.renderPriorityBadge(project.priority)}
                        <span style="color:var(--secondary);font-size:0.875rem;">
                            📅 ${Utils.formatDate(project.start_date)} – ${Utils.formatDate(project.end_date)}
                        </span>
                    </div>
                </div>
                ${Auth.isManagerOrAdmin() ? `
                    <div style="display:flex;gap:0.5rem;">
                        <button class="btn btn-sm btn-primary" onclick="showEditProjectModal()">Edit</button>
                        <button class="btn btn-sm btn-danger"  onclick="deleteProject()">Delete</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderOverview() {
    const project = projectData.project;
    const tasks   = projectData.tasks;
    const completedTasks     = tasks.filter(t => t.status === 'done').length;
    const progressPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    document.getElementById('overview').innerHTML = `
        <div class="card">
            <h3>Project Progress</h3>
            <div style="margin-bottom:1rem;">
                <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
                    <span>Completion</span><span><strong>${progressPercentage}%</strong></span>
                </div>
                <div style="width:100%;height:20px;background:var(--light);border-radius:10px;overflow:hidden;">
                    <div style="width:${progressPercentage}%;height:100%;background:var(--success);transition:width 0.3s;"></div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin-top:1.5rem;">
                <div style="text-align:center;padding:1rem;background:var(--light);border-radius:var(--radius-md);">
                    <div style="font-size:2rem;color:var(--primary);">${tasks.length}</div>
                    <div style="color:var(--secondary);">Total Tasks</div>
                </div>
                <div style="text-align:center;padding:1rem;background:var(--light);border-radius:var(--radius-md);">
                    <div style="font-size:2rem;color:var(--success);">${completedTasks}</div>
                    <div style="color:var(--secondary);">Completed</div>
                </div>
                <div style="text-align:center;padding:1rem;background:var(--light);border-radius:var(--radius-md);">
                    <div style="font-size:2rem;color:var(--warning);">${tasks.length - completedTasks}</div>
                    <div style="color:var(--secondary);">In Progress</div>
                </div>
                <div style="text-align:center;padding:1rem;background:var(--light);border-radius:var(--radius-md);">
                    <div style="font-size:2rem;color:var(--primary);">${projectData.members.length}</div>
                    <div style="color:var(--secondary);">Team Members</div>
                </div>
            </div>
        </div>
    `;
}

function renderTasks() {
    const tasks = projectData.tasks;
    document.getElementById('tasks').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>Project Tasks</h3>
                ${Auth.isManagerOrAdmin() ? `<button class="btn btn-sm btn-primary" onclick="window.location.href='tasks.html?project=${projectData.project.project_id}'">+ Add Task</button>` : ''}
            </div>
            ${tasks.length === 0 ? `<p class="text-muted text-center" style="padding:2rem;">No tasks yet.</p>` : `
                <table class="table">
                    <thead><tr><th>Task Name</th><th>Status</th><th>Priority</th><th>Assigned To</th><th>Due Date</th></tr></thead>
                    <tbody>
                        ${tasks.map(task => `
                            <tr style="cursor:pointer;" onclick="window.location.href='tasks.html?id=${task.task_id}'">
                                <td>${Utils.escapeHtml(task.task_name)}</td>
                                <td>${Components.renderStatusBadge(task.status)}</td>
                                <td>${Components.renderPriorityBadge(task.priority)}</td>
                                <td>${task.assigned_to || 'Unassigned'}</td>
                                <td>${Utils.formatDate(task.due_date)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}
        </div>
    `;
}

function renderMembers() {
    const members = projectData.members;
    document.getElementById('members').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>Team Members</h3>
                ${Auth.isManagerOrAdmin() ? `<button class="btn btn-sm btn-primary" onclick="showAddMemberModal()">+ Add Member</button>` : ''}
            </div>
            <div class="member-list">
                ${members.length === 0 ? '<p class="text-muted text-center" style="padding:2rem;">No members yet.</p>' :
                  members.map(member => `
                    <div class="member-item">
                        <div>
                            <strong>${member.first_name} ${member.last_name}</strong>
                            <div style="font-size:0.875rem;color:var(--secondary);">
                                ${member.email} • ${Utils.capitalize(member.role)}
                            </div>
                        </div>
                        ${Auth.isManagerOrAdmin() ? `
                            <button class="btn btn-sm btn-danger" onclick="removeMember('${member.user_id}')">Remove</button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

async function renderChat(projectId) {
    try {
        const resp = await API.messages.getProjectChat(projectId);
        const messages = resp.data || resp || [];
        projectData.messages = messages;

        document.getElementById('chat').innerHTML = `
            <div class="card">
                <div style="height:500px;display:flex;flex-direction:column;">
                    <div style="flex:1;overflow-y:auto;padding:1rem;border:1px solid var(--light);border-radius:var(--radius-md);margin-bottom:1rem;" id="chatMessages">
                        ${messages.length === 0
                          ? '<p class="text-muted text-center">No messages yet.</p>'
                          : messages.map(msg => `
                                <div style="margin-bottom:1rem;">
                                    <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem;">
                                        <strong>${msg.first_name} ${msg.last_name}</strong>
                                        <span style="font-size:0.875rem;color:var(--secondary);">${Utils.formatRelativeTime(msg.sent_at)}</span>
                                    </div>
                                    <p style="margin:0;">${Utils.escapeHtml(msg.message_text)}</p>
                                </div>
                            `).join('')
                        }
                    </div>
                    <form id="sendMessageForm" onsubmit="sendMessage(event, ${projectId})">
                        <div style="display:flex;gap:0.5rem;">
                            <input type="text" class="form-control" id="messageInput" placeholder="Type a message..." required>
                            <button type="submit" class="btn btn-primary">Send</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // scroll to bottom
        const chatBox = document.getElementById('chatMessages');
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
        console.error('Error loading chat:', error);
        document.getElementById('chat').innerHTML = '<div class="card"><p class="text-muted text-center" style="padding:2rem;">Could not load group chat.</p></div>';
    }
}

function switchTab(tabName, event) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    const el = document.getElementById(tabName);
    if (el) el.classList.add('active');
}

async function sendMessage(event, projectId) {
    event.preventDefault();
    const input   = document.getElementById('messageInput');
    const message = input.value.trim();
    if (!message) return;

    try {
        // Find the project group conversation
        const convResp = await API.messages.getProjectChat(projectId);
        // We need the conversation_id – fetch conversations to find the project group one
        const allConvResp = await API.messages.getConversations();
        const allConv = allConvResp.data || allConvResp || [];
        const groupConv = allConv.find(c => c.conversation_type === 'project_group' && c.project_id == projectId);
        if (groupConv) {
            await API.messages.send(groupConv.conversation_id, message);
        }
        input.value = '';
        await renderChat(projectId);
    } catch (error) {
        Utils.showToast('Failed to send message', 'error');
    }
}

async function deleteProject() {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    try {
        await API.projects.delete(projectData.project.project_id);
        Utils.showToast('Project deleted successfully', 'success');
        window.location.href = 'projects.html';
    } catch (error) {
        Utils.showToast('Failed to delete project', 'error');
    }
}

async function removeMember(userId) {
    if (!confirm('Remove this member from the project?')) return;
    try {
        await API.projects.removeMember(projectData.project.project_id, userId);
        Utils.showToast('Member removed', 'success');
        const params = Utils.getQueryParams();
        await loadProjectData(params.id);
    } catch (error) {
        Utils.showToast('Failed to remove member', 'error');
    }
}

function showAddMemberModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'addMemberModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header">
                <h2>Add Member</h2>
                <button class="modal-close" onclick="document.getElementById('addMemberModal').remove()">×</button>
            </div>
            <form id="addMemberForm">
                <div class="form-group">
                    <label class="form-label">User ID</label>
                    <input type="text" class="form-control" id="newMemberId" placeholder="e.g. ebj001" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Role in Project</label>
                    <select class="form-control" id="newMemberRole">
                        <option value="member">Member</option>
                        <option value="lead">Lead</option>
                        <option value="viewer">Viewer</option>
                    </select>
                </div>
                <div style="display:flex;gap:0.5rem;justify-content:flex-end;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('addMemberModal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Member</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('addMemberForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('newMemberId').value.trim();
        const role   = document.getElementById('newMemberRole').value;
        try {
            await API.projects.addMember(projectData.project.project_id, userId, role);
            Utils.showToast('Member added successfully', 'success');
            document.getElementById('addMemberModal').remove();
            const params = Utils.getQueryParams();
            await loadProjectData(params.id);
        } catch (error) {
            Utils.showToast('Failed to add member', 'error');
        }
    });
}

function showEditProjectModal() {
    const project = projectData.project;
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'editProjectModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:600px;">
            <div class="modal-header">
                <h2>Edit Project</h2>
                <button class="modal-close" onclick="document.getElementById('editProjectModal').remove()">×</button>
            </div>
            <form id="editProjectForm">
                <div class="form-group">
                    <label class="form-label">Project Name *</label>
                    <input type="text" class="form-control" id="editProjectName" value="${Utils.escapeHtml(project.project_name)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" id="editProjectDescription" rows="3">${Utils.escapeHtml(project.description || '')}</textarea>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                    <div class="form-group">
                        <label class="form-label">Start Date *</label>
                        <input type="date" class="form-control" id="editStartDate" value="${project.start_date ? project.start_date.split('T')[0] : ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">End Date *</label>
                        <input type="date" class="form-control" id="editEndDate" value="${project.end_date ? project.end_date.split('T')[0] : ''}" required>
                    </div>
                </div>
                <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('editProjectModal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Project</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('editProjectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const projectData2 = {
            project_name: document.getElementById('editProjectName').value.trim(),
            description:  document.getElementById('editProjectDescription').value.trim(),
            start_date:   document.getElementById('editStartDate').value,
            end_date:     document.getElementById('editEndDate').value
        };
        try {
            await API.projects.update(projectData.project.project_id, projectData2);
            Utils.showToast('Project updated successfully', 'success');
            document.getElementById('editProjectModal').remove();
            const params = Utils.getQueryParams();
            await loadProjectData(params.id);
        } catch (error) {
            Utils.showToast('Failed to update project', 'error');
        }
    });
}
