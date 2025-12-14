// ==========================================
// js/project-detail.js
// ==========================================

let projectData = {
    project: null,
    tasks: [],
    members: [],
    messages: []
};

async function initProjectDetail() {
    await Components.initLayout();
    
    const params = Utils.getQueryParams();
    const projectId = params.id;

    if (!projectId) {
        window.location.href = 'projects.html';
        return;
    }

    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <a href="projects.html" style="color: var(--primary); text-decoration: none;">← Back to Projects</a>
        </div>

        <div id="projectHeader"><div class="loading-spinner"><div class="spinner"></div></div></div>

        <div class="tabs" id="projectTabs">
            <button class="tab active" onclick="switchTab('overview')">Overview</button>
            <button class="tab" onclick="switchTab('tasks')">Tasks</button>
            <button class="tab" onclick="switchTab('members')">Team Members</button>
            <button class="tab" onclick="switchTab('chat')">Group Chat</button>
        </div>

        <div id="overview" class="tab-content active"></div>
        <div id="tasks" class="tab-content"></div>
        <div id="members" class="tab-content"></div>
        <div id="chat" class="tab-content"></div>
    `;

    await loadProjectData(projectId);
}

async function loadProjectData(projectId) {
    try {
        const [project, tasks, members] = await Promise.all([
            API.projects.getById(projectId),
            API.tasks.getByProject(projectId),
            API.projects.getMembers(projectId)
        ]);

        projectData.project = project;
        projectData.tasks = tasks;
        projectData.members = members;

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
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h1 style="margin: 0 0 0.5rem 0;">${Utils.escapeHtml(project.project_name)}</h1>
                    <p style="color: var(--secondary); margin-bottom: 1rem;">${Utils.escapeHtml(project.description || 'No description')}</p>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        ${Components.renderStatusBadge(project.status)}
                        ${Components.renderPriorityBadge(project.priority)}
                        <span style="color: var(--secondary); font-size: 0.875rem;">📅 ${Utils.formatDate(project.start_date)} - ${Utils.formatDate(project.end_date)}</span>
                    </div>
                </div>
                ${Auth.isManagerOrAdmin() ? `
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm btn-primary" onclick="showEditProjectModal()">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProject()">Delete</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderOverview() {
    const project = projectData.project;
    const tasks = projectData.tasks;
    
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const progressPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    document.getElementById('overview').innerHTML = `
        <div class="card">
            <h3>Project Progress</h3>
            <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>Completion</span>
                    <span><strong>${progressPercentage}%</strong></span>
                </div>
                <div style="width: 100%; height: 20px; background: var(--light); border-radius: 10px; overflow: hidden;">
                    <div style="width: ${progressPercentage}%; height: 100%; background: var(--success); transition: width 0.3s;"></div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
                <div style="text-align: center; padding: 1rem; background: var(--light); border-radius: var(--radius-md);">
                    <div style="font-size: 2rem; color: var(--primary);">${tasks.length}</div>
                    <div style="color: var(--secondary);">Total Tasks</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--light); border-radius: var(--radius-md);">
                    <div style="font-size: 2rem; color: var(--success);">${completedTasks}</div>
                    <div style="color: var(--secondary);">Completed</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--light); border-radius: var(--radius-md);">
                    <div style="font-size: 2rem; color: var(--warning);">${tasks.length - completedTasks}</div>
                    <div style="color: var(--secondary);">In Progress</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--light); border-radius: var(--radius-md);">
                    <div style="font-size: 2rem; color: var(--primary);">${projectData.members.length}</div>
                    <div style="color: var(--secondary);">Team Members</div>
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
            ${tasks.length === 0 ? `<p class="text-muted text-center" style="padding: 2rem;">No tasks yet.</p>` : `
                <table class="table">
                    <thead>
                        <tr>
                            <th>Task Name</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Assigned To</th>
                            <th>Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tasks.map(task => `
                            <tr style="cursor: pointer;" onclick="window.location.href='tasks.html?id=${task.task_id}'">
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
                ${members.map(member => `
                    <div class="member-item">
                        <div>
                            <strong>${member.first_name} ${member.last_name}</strong>
                            <div style="font-size: 0.875rem; color: var(--secondary);">
                                ${member.email} • ${Utils.capitalize(member.role)}
                            </div>
                        </div>
                        ${Auth.isManagerOrAdmin() ? `<button class="btn btn-sm btn-danger" onclick="removeMember('${member.user_id}')">Remove</button>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

async function renderChat(projectId) {
    try {
        const messages = await API.messages.getProjectChat(projectId);
        projectData.messages = messages;

        document.getElementById('chat').innerHTML = `
            <div class="card">
                <div style="height: 500px; display: flex; flex-direction: column;">
                    <div style="flex: 1; overflow-y: auto; padding: 1rem; border: 1px solid var(--light); border-radius: var(--radius-md); margin-bottom: 1rem;" id="chatMessages">
                        ${messages.length === 0 ? '<p class="text-muted text-center">No messages yet.</p>' : 
                            messages.map(msg => `
                                <div style="margin-bottom: 1rem;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                        <strong>${msg.first_name} ${msg.last_name}</strong>
                                        <span style="font-size: 0.875rem; color: var(--secondary);">${Utils.formatRelativeTime(msg.sent_at)}</span>
                                    </div>
                                    <p style="margin: 0;">${Utils.escapeHtml(msg.message_text)}</p>
                                </div>
                            `).join('')
                        }
                    </div>
                    <form id="sendMessageForm" onsubmit="sendMessage(event, ${projectId})">
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="text" class="form-control" id="messageInput" placeholder="Type a message..." required>
                            <button type="submit" class="btn btn-primary">Send</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading chat:', error);
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

async function sendMessage(event, projectId) {
    event.preventDefault();
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;

    try {
        Utils.showToast('Message sent', 'success');
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