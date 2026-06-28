// ==========================================
// js/projects.js  — default to "My Projects"
// ==========================================

let allProjects      = [];
let myProjects       = [];
let filteredProjects = [];
let showOnlyMyProjects = true;   // DEFAULT: My Projects

async function initProjects() {
    await Components.initLayout();
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="page-header" style="margin-bottom:2rem;display:flex;justify-content:space-between;align-items:center;">
            <div><h1>Projects</h1><p class="text-muted">Manage your projects</p></div>
            ${Auth.isManagerOrAdmin()?`<button class="btn btn-primary" onclick="showCreateProjectModal()">+ New Project</button>`:''}
        </div>
        <div class="card">
            <div class="filters">
                <input type="text" class="form-control" placeholder="Search projects..."
                    id="searchInput" style="max-width:280px;" oninput="filterProjects()">
                <select class="form-control" id="statusFilter" onchange="filterProjects()" style="max-width:180px;">
                    <option value="">All Statuses</option>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <select class="form-control" id="priorityFilter" onchange="filterProjects()" style="max-width:180px;">
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
                <button class="btn ${showOnlyMyProjects?'btn-primary':'btn-secondary'}" id="myProjectsBtn" onclick="toggleMyProjects()">
                    ${showOnlyMyProjects?'👤 My Projects':'🌐 All Projects'}
                </button>
            </div>
        </div>
        <div id="projectsGrid"><div class="loading-spinner"><div class="spinner"></div></div></div>`;
    await loadProjects();
}

async function loadProjects() {
    try {
        const user = Auth.getUser();
        const [allR, myR] = await Promise.all([
            API.projects.getAll(),
            API.projects.getUserProjects(user.user_id)
        ]);
        allProjects = allR.data || allR || [];
        myProjects  = myR.data  || myR  || [];
        const myIds = new Set(myProjects.map(p => p.project_id));
        allProjects.forEach(p => { p.isMember = myIds.has(p.project_id); });
        filterProjects();
    } catch(e) {
        console.error(e);
        document.getElementById('projectsGrid').innerHTML = '<div class="card"><p class="text-muted text-center" style="padding:2rem;">Failed to load projects</p></div>';
    }
}

function toggleMyProjects() {
    showOnlyMyProjects = !showOnlyMyProjects;
    const btn = document.getElementById('myProjectsBtn');
    btn.textContent  = showOnlyMyProjects ? '👤 My Projects' : '🌐 All Projects';
    btn.className    = `btn ${showOnlyMyProjects?'btn-primary':'btn-secondary'}`;
    filterProjects();
}

function filterProjects() {
    const search   = document.getElementById('searchInput').value.toLowerCase();
    const status   = document.getElementById('statusFilter').value;
    const priority = document.getElementById('priorityFilter').value;
    let pool = showOnlyMyProjects ? myProjects : allProjects;
    filteredProjects = pool.filter(p => {
        const ms = !search || p.project_name.toLowerCase().includes(search) || (p.description||'').toLowerCase().includes(search);
        const ss = !status   || p.status   === status;
        const ps = !priority || p.priority === priority;
        return ms && ss && ps;
    });
    renderProjects();
}

function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!filteredProjects.length) {
        grid.innerHTML = `<div class="card"><div style="text-align:center;padding:3rem;">
            <div style="font-size:4rem;">📁</div>
            <p style="color:var(--secondary);">${showOnlyMyProjects?'You are not assigned to any projects yet':'No projects found'}</p>
            ${Auth.isManagerOrAdmin()&&!showOnlyMyProjects?`<button class="btn btn-primary" onclick="showCreateProjectModal()" style="margin-top:1rem;">Create First Project</button>`:''}
        </div></div>`;
        return;
    }
    grid.innerHTML = `<div class="projects-grid">${filteredProjects.map(project => {
        const isMember = project.isMember || showOnlyMyProjects;
        const isLocked = !isMember && !Auth.isManagerOrAdmin();
        return `
            <div class="card project-card ${isLocked?'locked-project':''}"
                 onclick="${isLocked?'showAccessDenied()':(`viewProject(${project.project_id})`)}"
                 style="${isLocked?'opacity:0.9;cursor:not-allowed;':''}">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem;">
                    <div style="flex:1;display:flex;align-items:center;gap:0.5rem;">
                        ${isLocked?'<span style="font-size:1.25rem;">🔒</span>':''}
                        <h3 style="margin:0;font-size:1.125rem;">${Utils.escapeHtml(project.project_name)}</h3>
                    </div>
                    ${Components.renderStatusBadge(project.status)}
                </div>
                <p style="color:var(--secondary);margin-bottom:1rem;min-height:2.5rem;">${Utils.truncate(project.description||'No description',120)}</p>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                    ${Components.renderPriorityBadge(project.priority)}
                    <span style="font-size:0.875rem;color:var(--secondary);">📅 ${Utils.formatDate(project.start_date)} – ${Utils.formatDate(project.end_date)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding-top:1rem;border-top:1px solid var(--light);">
                    <div style="font-size:0.875rem;color:var(--secondary);">
                        ${isMember?'<span style="color:var(--success);">● Member</span>':'<span>Not a member</span>'}
                    </div>
                    ${Auth.isManagerOrAdmin()&&!isLocked?`
                        <div onclick="event.stopPropagation();">
                            <button class="btn btn-sm" onclick="editProject(${project.project_id})">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteProject(${project.project_id})">Delete</button>
                        </div>`:''
                    }
                </div>
            </div>`;
    }).join('')}</div>`;
}

function viewProject(id) {
    const p = allProjects.find(x => x.project_id === id);
    if (!p?.isMember && !Auth.isManagerOrAdmin()) { showAccessDenied(); return; }
    window.location.href = `project-detail.html?id=${id}`;
}

function showAccessDenied() { Utils.showToast('You are not a member of this project', 'warning'); }

function showCreateProjectModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show'; modal.id = 'createProjectModal';
    modal.innerHTML = `<div class="modal-content" style="max-width:600px;">
        <div class="modal-header"><h2>Create New Project</h2><button class="modal-close" onclick="closeModal('createProjectModal')">×</button></div>
        <form id="createProjectForm" onsubmit="createProject(event)">
            <div class="form-group"><label class="form-label">Project Name *</label><input type="text" class="form-control" id="projectName" required></div>
            <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="projectDescription" rows="3"></textarea></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div class="form-group"><label class="form-label">Start Date *</label><input type="date" class="form-control" id="startDate" required></div>
                <div class="form-group"><label class="form-label">End Date *</label><input type="date" class="form-control" id="endDate" required></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div class="form-group"><label class="form-label">Status</label>
                    <select class="form-control" id="projectStatus">
                        <option value="planning">Planning</option><option value="active">Active</option>
                        <option value="on_hold">On Hold</option><option value="completed">Completed</option>
                    </select>
                </div>
                <div class="form-group"><label class="form-label">Priority</label>
                    <select class="form-control" id="projectPriority">
                        <option value="low">Low</option><option value="medium" selected>Medium</option>
                        <option value="high">High</option><option value="critical">Critical</option>
                    </select>
                </div>
            </div>
            <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;">
                <button type="button" class="btn btn-secondary" onclick="closeModal('createProjectModal')">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Project</button>
            </div>
        </form></div>`;
    document.body.appendChild(modal);
}

async function createProject(e) {
    e.preventDefault();
    try {
        await API.projects.create({
            project_name: document.getElementById('projectName').value.trim(),
            description:  document.getElementById('projectDescription').value.trim(),
            start_date:   document.getElementById('startDate').value,
            end_date:     document.getElementById('endDate').value,
            status:       document.getElementById('projectStatus').value,
            priority:     document.getElementById('projectPriority').value
        });
        Utils.showToast('Project created!', 'success');
        closeModal('createProjectModal');
        await loadProjects();
    } catch(e) { Utils.showToast('Failed to create project', 'error'); }
}

function editProject(id) {
    const p = allProjects.find(x => x.project_id === id);
    if (!p) return;
    const modal = document.createElement('div');
    modal.className = 'modal show'; modal.id = 'editProjectModal';
    modal.innerHTML = `<div class="modal-content" style="max-width:600px;">
        <div class="modal-header"><h2>Edit Project</h2><button class="modal-close" onclick="closeModal('editProjectModal')">×</button></div>
        <form id="editProjectForm" onsubmit="updateProject(event,${id})">
            <div class="form-group"><label class="form-label">Project Name *</label><input type="text" class="form-control" id="editProjectName" value="${Utils.escapeHtml(p.project_name)}" required></div>
            <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="editProjectDescription" rows="3">${Utils.escapeHtml(p.description||'')}</textarea></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div class="form-group"><label class="form-label">Start Date *</label><input type="date" class="form-control" id="editStartDate" value="${p.start_date?p.start_date.split('T')[0]:''}" required></div>
                <div class="form-group"><label class="form-label">End Date *</label><input type="date" class="form-control" id="editEndDate" value="${p.end_date?p.end_date.split('T')[0]:''}" required></div>
            </div>
            <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;">
                <button type="button" class="btn btn-secondary" onclick="closeModal('editProjectModal')">Cancel</button>
                <button type="submit" class="btn btn-primary">Update</button>
            </div>
        </form></div>`;
    document.body.appendChild(modal);
}

async function updateProject(e, id) {
    e.preventDefault();
    try {
        await API.projects.update(id, {
            project_name: document.getElementById('editProjectName').value.trim(),
            description:  document.getElementById('editProjectDescription').value.trim(),
            start_date:   document.getElementById('editStartDate').value,
            end_date:     document.getElementById('editEndDate').value
        });
        Utils.showToast('Updated!', 'success');
        closeModal('editProjectModal');
        await loadProjects();
    } catch(e) { Utils.showToast('Failed', 'error'); }
}

async function deleteProject(id) {
    if (!confirm('Delete this project and all its tasks?')) return;
    try { await API.projects.delete(id); Utils.showToast('Deleted', 'success'); await loadProjects(); }
    catch(e) { Utils.showToast('Failed', 'error'); }
}

function closeModal(id) { document.getElementById(id)?.remove(); }
