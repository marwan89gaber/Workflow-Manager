// ==========================================
// js/projects.js - Projects List Page Logic
// ==========================================

let allProjects = [];
let myProjects = [];
let filteredProjects = [];
let showOnlyMyProjects = false;

const toDateInput = (d) => d ? d.split('T')[0] : '';

async function initProjects() {
    await Components.initLayout();
    
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="page-header" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1>Projects</h1>
                <p class="text-muted">Manage your projects</p>
            </div>
            ${Auth.isManagerOrAdmin() ? `
                <button class="btn btn-primary" onclick="showCreateProjectModal()">
                    + New Project
                </button>
            ` : ''}
        </div>

        <!-- Filters -->
        <div class="card">
            <div class="filters">
                <input 
                    type="text" 
                    class="form-control" 
                    placeholder="Search projects..." 
                    id="searchInput"
                    style="max-width: 300px;"
                    oninput="filterProjects()"
                >
                <select class="form-control" id="statusFilter" onchange="filterProjects()" style="max-width: 200px;">
                    <option value="">All Statuses</option>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <select class="form-control" id="priorityFilter" onchange="filterProjects()" style="max-width: 200px;">
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
                <button class="btn ${showOnlyMyProjects ? 'btn-primary' : 'btn-secondary'}" id="myProjectsBtn" onclick="toggleMyProjects()">
                    ${showOnlyMyProjects ? '👤 My Projects' : '🌐 All Projects'}
                </button>
            </div>
        </div>

        <!-- Projects Grid -->
        <div id="projectsGrid">
            <div class="loading-spinner"><div class="spinner"></div></div>
        </div>
    `;

    await loadProjects();
}

async function loadProjects() {
    try {
        const user = Auth.getUser();
        
        // Load all projects and user's projects in parallel
        const [allProjectsResponse, myProjectsResponse] = await Promise.all([
            API.projects.getAll(),
            API.projects.getUserProjects(user.user_id)
        ]);
        
        allProjects = allProjectsResponse.data || allProjectsResponse;
        myProjects = myProjectsResponse.data || myProjectsResponse;
        
        // Create a Set of project IDs the user is a member of for quick lookup
        const myProjectIds = new Set(myProjects.map(p => p.project_id));
        
        // Mark each project with whether user is a member
        allProjects.forEach(project => {
            project.isMember = myProjectIds.has(project.project_id);
        });
        
        //console.log('📁 Loaded all projects:', allProjects.length);
        //console.log('👤 User is member of:', myProjects.length, 'projects');
        
        filterProjects();
    } catch (error) {
        console.error('Error loading projects:', error);
        Utils.showToast('Failed to load projects', 'error');
        document.getElementById('projectsGrid').innerHTML = 
            '<div class="card"><p class="text-muted text-center" style="padding: 2rem;">Failed to load projects</p></div>';
    }
}

function toggleMyProjects() {
    showOnlyMyProjects = !showOnlyMyProjects;
    
    // Update button
    const btn = document.getElementById('myProjectsBtn');
    btn.textContent = showOnlyMyProjects ? '👤 My Projects' : '🌐 All Projects';
    btn.className = `btn ${showOnlyMyProjects ? 'btn-primary' : 'btn-secondary'}`;

    filterProjects();
}

function filterProjects() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;

    // Start with either all projects or only user's projects
    let projectsToFilter = showOnlyMyProjects ? myProjects : allProjects;

    filteredProjects = projectsToFilter.filter(project => {
        const matchesSearch = !searchTerm || 
            project.project_name.toLowerCase().includes(searchTerm) ||
            (project.description && project.description.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || project.status === statusFilter;
        const matchesPriority = !priorityFilter || project.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    renderProjects();
}

function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    
    if (filteredProjects.length === 0) {
        grid.innerHTML = `
            <div class="card">
                <div class="empty-state" style="text-align: center; padding: 3rem;">
                    <div style="font-size: 4rem;">📁</div>
                    <p style="font-size: 1.125rem; color: var(--secondary);">
                        ${showOnlyMyProjects ? 'You are not assigned to any projects yet' : 'No projects found'}
                    </p>
                    ${Auth.isManagerOrAdmin() && !showOnlyMyProjects ? `
                        <button class="btn btn-primary" onclick="showCreateProjectModal()" style="margin-top: 1rem;">
                            Create Your First Project
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        return;
    }

    grid.innerHTML = `
        <div class="projects-grid">
            ${filteredProjects.map(project => {
                const isMember = project.isMember || showOnlyMyProjects;
                const isLocked = !isMember && !Auth.isManagerOrAdmin();
                
                return `
                <div class="card project-card ${isLocked ? 'locked-project' : ''}" 
                     onclick="${isLocked ? 'showAccessDeniedMessage()' : `viewProject(${project.project_id})`}"
                     style="${isLocked ? 'opacity: 0.95; cursor: not-allowed;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div style="flex: 1; display: flex; align-items: center; gap: 0.5rem;">
                            ${isLocked ? '<span style="font-size: 1.5rem;">🔒</span>' : ''}
                            <h3 style="margin: 0; font-size: 1.25rem;">${Utils.escapeHtml(project.project_name)}</h3>
                        </div>
                        ${Components.renderStatusBadge(project.status)}
                    </div>
                    <p style="color: var(--secondary); margin-bottom: 1rem; min-height: 3rem;">
                        ${Utils.truncate(project.description || 'No description', 120)}
                    </p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        ${Components.renderPriorityBadge(project.priority)}
                        <span style="font-size: 0.875rem; color: var(--secondary);">
                            📅 ${Utils.formatDate(project.start_date)} - ${Utils.formatDate(project.end_date)}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--light);">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-size: 0.875rem; color: var(--secondary);">
                                Created by: ${project.created_by || 'Unknown'}
                            </span>
                            ${isMember ? '<span style="color: var(--success); font-size: 0.875rem;">• Member</span>' : ''}
                        </div>
                        ${Auth.isManagerOrAdmin() && !isLocked ? `
                            <div style="display: flex; gap: 0.5rem;" onclick="event.stopPropagation();">
                                <button class="btn btn-sm" onclick="editProject(${project.project_id})">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteProject(${project.project_id})">Delete</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `}).join('')}
        </div>
    `;
}

function viewProject(projectId) {
    const project = allProjects.find(p => p.project_id === projectId);
    const isMember = project?.isMember;
    
    // Check if user has access
    if (!isMember && !Auth.isManagerOrAdmin()) {
        showAccessDeniedMessage();
        return;
    }
    
    window.location.href = `project-detail.html?id=${projectId}`;
}

function showAccessDeniedMessage() {
    Utils.showToast('You are not a member of this project', 'warning');
}

function showCreateProjectModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'createProjectModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Create New Project</h2>
                <button class="modal-close" onclick="closeModal('createProjectModal')">×</button>
            </div>
            <form id="createProjectForm" onsubmit="createProject(event)">
                <div class="form-group">
                    <label class="form-label">Project Name *</label>
                    <input type="text" class="form-control" id="projectName" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" id="projectDescription" rows="3"></textarea>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Start Date *</label>
                        <input type="date" class="form-control" id="startDate" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">End Date *</label>
                        <input type="date" class="form-control" id="endDate" required>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select class="form-control" id="projectStatus">
                            <option value="planning">Planning</option>
                            <option value="active">Active</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Priority</label>
                        <select class="form-control" id="projectPriority">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('createProjectModal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Project</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('projectDescription').value = '';
}

async function createProject(event) {
    event.preventDefault();
    
    const projectData = {
        project_name: document.getElementById('projectName').value.trim(),
        description: document.getElementById('projectDescription').value.trim(),
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        status: document.getElementById('projectStatus').value,
        priority: document.getElementById('projectPriority').value
    };

    try {
        await API.projects.create(projectData);
        Utils.showToast('Project created successfully!', 'success');
        closeModal('createProjectModal');
        await loadProjects();
    } catch (error) {
        console.error('Error creating project:', error);
        Utils.showToast('Failed to create project', 'error');
    }
}

function editProject(projectId) {
    // Find the project
    const project = allProjects.find(p => p.project_id === projectId);
    if (!project) return;

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'editProjectModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Edit Project</h2>
                <button class="modal-close" onclick="closeModal('editProjectModal')">×</button>
            </div>
            <form id="editProjectForm" onsubmit="updateProject(event, ${projectId})">
                <div class="form-group">
                    <label class="form-label">Project Name *</label>
                    <input type="text" class="form-control" id="editProjectName" value="${Utils.escapeHtml(project.project_name)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" id="editProjectDescription" rows="3"></textarea>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Start Date *</label>
                        <input type="date" class="form-control" id="editStartDate" value="${toDateInput(project.start_date)}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">End Date *</label>
                        <input type="date" class="form-control" id="editEndDate" value="${toDateInput(project.end_date)}" required>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('editProjectModal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Project</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('editProjectDescription').value = project.description || '';
}

async function updateProject(event, projectId) {
    event.preventDefault();
    
    const projectData = {
        project_name: document.getElementById('editProjectName').value.trim(),
        description: document.getElementById('editProjectDescription').value.trim(),
        start_date: document.getElementById('editStartDate').value,
        end_date: document.getElementById('editEndDate').value
    };

    try {
        await API.projects.update(projectId, projectData);
        Utils.showToast('Project updated successfully!', 'success');
        closeModal('editProjectModal');
        await loadProjects();
    } catch (error) {
        console.error('Error updating project:', error);
        Utils.showToast('Failed to update project', 'error');
    }
}

async function deleteProject(projectId) {
    Utils.confirmAction('Are you sure you want to delete this project? This cannot be undone.', async () => {
        await API.projects.delete(projectId);
        Utils.showToast('Project deleted', 'success');
        await loadProjects();
    });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}