// ==========================================
// js/reports.js - Reports Page Logic
// ==========================================

let allProjectsList = [];
let allUsersList    = [];

async function initReports() {
    if (!Auth.isManagerOrAdmin()) { window.location.href = 'dashboard.html'; return; }

    await Components.initLayout();

    // Pre-load projects and users for the custom-report modal
    try {
        const [pResp, uResp] = await Promise.all([API.projects.getAll(), API.users.getAll()]);
        allProjectsList = pResp.data || pResp || [];
        allUsersList    = uResp.data || uResp || [];
    } catch(e) {}

    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="page-header" style="margin-bottom:2rem;">
            <h1>Reports & Analytics</h1>
            <p class="text-muted">View team performance and project insights</p>
        </div>

        <div class="reports-grid">
            <div class="card report-card" onclick="loadTeamPerformance()" style="cursor:pointer;">
                <div class="report-icon">👥</div>
                <h3>Team Performance</h3>
                <p style="color:var(--secondary);">View team productivity and task completion rates</p>
            </div>
            <div class="card report-card" onclick="loadProjectStatus()" style="cursor:pointer;">
                <div class="report-icon">📊</div>
                <h3>Project Status</h3>
                <p style="color:var(--secondary);">Overview of all project statuses and progress</p>
            </div>
            <div class="card report-card" onclick="loadTaskCompletion()" style="cursor:pointer;">
                <div class="report-icon">✅</div>
                <h3>Task Completion</h3>
                <p style="color:var(--secondary);">Analyze task completion trends and metrics</p>
            </div>
            <div class="card report-card" onclick="showGenerateReportModal()" style="cursor:pointer;">
                <div class="report-icon">📈</div>
                <h3>Custom Report</h3>
                <p style="color:var(--secondary);">Generate a custom report with specific criteria</p>
            </div>
        </div>

        <div id="reportDisplay"></div>
    `;
}

// ---- Team Performance ----

async function loadTeamPerformance() {
    const display = document.getElementById('reportDisplay');
    display.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>Team Performance Report</h2>
                <button class="btn btn-sm btn-secondary" onclick="clearReport()">Close</button>
            </div>
            <div id="reportContent"><div class="loading-spinner"><div class="spinner"></div></div></div>
        </div>
    `;

    try {
        const resp = await API.reports.getTeamPerformance();
        const data = resp.data || resp;
        renderTeamPerformance(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error('Team performance error:', error);
        document.getElementById('reportContent').innerHTML =
            '<p class="text-muted text-center" style="padding:2rem;">Failed to load report. Make sure the backend method exists.</p>';
    }
}

function renderTeamPerformance(members) {
    document.getElementById('reportContent').innerHTML = `
        <div style="padding:1rem;">
            ${!members.length
              ? '<p class="text-muted text-center">No data available.</p>'
              : `<table class="table">
                    <thead>
                        <tr><th>Employee</th><th>Department</th><th>Total Tasks</th><th>Completed</th><th>In Progress</th><th>Overdue</th><th>Completion %</th></tr>
                    </thead>
                    <tbody>
                        ${members.map(m => {
                            const pct = m.total_tasks > 0 ? Math.round((m.completed_tasks / m.total_tasks) * 100) : 0;
                            return `
                                <tr>
                                    <td>${m.first_name} ${m.last_name}</td>
                                    <td>${m.department || '—'}</td>
                                    <td>${m.total_tasks || 0}</td>
                                    <td style="color:var(--success);">${m.completed_tasks || 0}</td>
                                    <td style="color:var(--warning);">${m.in_progress_tasks || 0}</td>
                                    <td style="color:var(--danger);">${m.overdue_tasks || 0}</td>
                                    <td>
                                        <div style="display:flex;align-items:center;gap:0.5rem;">
                                            <div style="flex:1;height:8px;background:var(--light);border-radius:4px;overflow:hidden;">
                                                <div style="width:${pct}%;height:100%;background:var(--success);"></div>
                                            </div>
                                            <span>${pct}%</span>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>`
            }
        </div>
    `;
}

// ---- Project Status ----

async function loadProjectStatus() {
    const display = document.getElementById('reportDisplay');
    display.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>Project Status Report</h2>
                <button class="btn btn-sm btn-secondary" onclick="clearReport()">Close</button>
            </div>
            <div id="reportContent"><div class="loading-spinner"><div class="spinner"></div></div></div>
        </div>
    `;

    try {
        const resp = await API.reports.getProjectStatus();
        const data = resp.data || resp;
        renderProjectStatus(data);
    } catch (error) {
        console.error('Project status error:', error);
        document.getElementById('reportContent').innerHTML =
            '<p class="text-muted text-center" style="padding:2rem;">Failed to load report.</p>';
    }
}

function renderProjectStatus(data) {
    const statuses = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
    const total    = data.total || 0;

    document.getElementById('reportContent').innerHTML = `
        <div style="padding:1rem;">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin-bottom:1.5rem;">
                ${statuses.map(s => `
                    <div style="text-align:center;padding:1rem;background:var(--light);border-radius:var(--radius-md);">
                        <div style="font-size:1.75rem;font-weight:bold;">${data[s] || 0}</div>
                        <div style="color:var(--secondary);font-size:0.875rem;">${Utils.snakeToTitle(s)}</div>
                        <div style="font-size:0.75rem;color:var(--secondary);">${data[`${s}_percent`] || 0}%</div>
                    </div>
                `).join('')}
            </div>
            <p style="color:var(--secondary);">Total Projects: <strong>${total}</strong></p>
        </div>
    `;
}

// ---- Task Completion ----

async function loadTaskCompletion() {
    const display = document.getElementById('reportDisplay');
    display.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>Task Completion Report</h2>
                <button class="btn btn-sm btn-secondary" onclick="clearReport()">Close</button>
            </div>
            <div id="reportContent"><div class="loading-spinner"><div class="spinner"></div></div></div>
        </div>
    `;

    try {
        const resp = await API.reports.getTaskCompletion();
        const data = resp.data || resp;
        renderTaskCompletion(data);
    } catch (error) {
        console.error('Task completion error:', error);
        document.getElementById('reportContent').innerHTML =
            '<p class="text-muted text-center" style="padding:2rem;">Failed to load report.</p>';
    }
}

function renderTaskCompletion(data) {
    const total     = data.total_tasks      || 0;
    const completed = data.completed_tasks  || 0;
    const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('reportContent').innerHTML = `
        <div style="padding:1rem;">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem;">
                <div style="text-align:center;padding:1rem;background:var(--light);border-radius:var(--radius-md);">
                    <div style="font-size:2rem;color:var(--primary);">${total}</div>
                    <div style="color:var(--secondary);">Total Tasks</div>
                </div>
                <div style="text-align:center;padding:1rem;background:var(--light);border-radius:var(--radius-md);">
                    <div style="font-size:2rem;color:var(--success);">${completed}</div>
                    <div style="color:var(--secondary);">Completed</div>
                </div>
                <div style="text-align:center;padding:1rem;background:var(--light);border-radius:var(--radius-md);">
                    <div style="font-size:2rem;color:var(--warning);">${data.in_progress || 0}</div>
                    <div style="color:var(--secondary);">In Progress</div>
                </div>
                <div style="text-align:center;padding:1rem;background:var(--light);border-radius:var(--radius-md);">
                    <div style="font-size:2rem;color:var(--danger);">${data.overdue || 0}</div>
                    <div style="color:var(--secondary);">Overdue</div>
                </div>
            </div>
            <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
                    <span>Overall Completion</span><span><strong>${pct}%</strong></span>
                </div>
                <div style="width:100%;height:20px;background:var(--light);border-radius:10px;overflow:hidden;">
                    <div style="width:${pct}%;height:100%;background:var(--success);transition:width 0.3s;"></div>
                </div>
            </div>
        </div>
    `;
}

// ---- Custom Report Modal ----

function showGenerateReportModal() {
    const departments = [...new Set(allUsersList.map(u => u.department).filter(Boolean))].sort();

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'generateReportModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:600px;">
            <div class="modal-header">
                <h2>Generate Custom Report</h2>
                <button class="modal-close" onclick="document.getElementById('generateReportModal').remove()">×</button>
            </div>
            <div class="form-group">
                <label class="form-label">Report Type</label>
                <select class="form-control" id="reportType" onchange="updateReportTypeFields()" required>
                    <option value="team_performance">Team Performance</option>
                    <option value="project_status">Project Status</option>
                    <option value="individual_productivity">Individual Productivity</option>
                    <option value="task_completion">Task Completion</option>
                </select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div class="form-group">
                    <label class="form-label">Start Date</label>
                    <input type="date" class="form-control" id="reportStartDate" required>
                </div>
                <div class="form-group">
                    <label class="form-label">End Date</label>
                    <input type="date" class="form-control" id="reportEndDate" required>
                </div>
            </div>
            <div id="reportTypeFields"></div>
            <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;">
                <button class="btn btn-secondary" onclick="document.getElementById('generateReportModal').remove()">Cancel</button>
                <button class="btn btn-primary" onclick="generateCustomReport()">Generate Report</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Set default dates (last 30 days → today)
    const today    = new Date();
    const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
    document.getElementById('reportEndDate').value   = today.toISOString().split('T')[0];
    document.getElementById('reportStartDate').value = monthAgo.toISOString().split('T')[0];

    updateReportTypeFields();
}

function updateReportTypeFields() {
    const type   = document.getElementById('reportType').value;
    const fields = document.getElementById('reportTypeFields');
    const departments = [...new Set(allUsersList.map(u => u.department).filter(Boolean))].sort();

    if (type === 'team_performance') {
        fields.innerHTML = `
            <div class="form-group">
                <label class="form-label">Department (optional)</label>
                <select class="form-control" id="rptDept">
                    <option value="">All Departments</option>
                    ${departments.map(d => `<option value="${d}">${d}</option>`).join('')}
                </select>
            </div>
        `;

    } else if (type === 'project_status') {
        fields.innerHTML = `
            <div class="form-group">
                <label class="form-label">Project (optional) — select or enter ID</label>
                <select class="form-control" id="rptProjSelect" onchange="syncRptProjId()">
                    <option value="">All Projects</option>
                    ${allProjectsList.map(p => `<option value="${p.project_id}">${p.project_name} (#${p.project_id})</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Project ID</label>
                <input type="number" class="form-control" id="rptProjId" placeholder="Leave empty for all" min="1" oninput="syncRptProjSelect()">
            </div>
        `;

    } else if (type === 'individual_productivity') {
        fields.innerHTML = `
            <div class="form-group">
                <label class="form-label">Department</label>
                <select class="form-control" id="rptEmpDept" onchange="populateRptEmployees()">
                    <option value="">All Departments</option>
                    ${departments.map(d => `<option value="${d}">${d}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Employee — select or enter ID</label>
                <select class="form-control" id="rptEmpSelect" onchange="syncRptEmpId()">
                    <option value="">All Employees</option>
                    ${allUsersList.map(u => `<option value="${u.user_id}">${u.first_name} ${u.last_name} (${u.user_id})</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Employee ID</label>
                <input type="text" class="form-control" id="rptEmpId" placeholder="Leave empty for all" oninput="syncRptEmpSelect()">
            </div>
        `;

    } else if (type === 'task_completion') {
        fields.innerHTML = `
            <div class="form-group">
                <label class="form-label">Project — select or enter ID</label>
                <select class="form-control" id="rptTCProjSelect" onchange="syncRptTCProjId()">
                    <option value="">All Projects</option>
                    ${allProjectsList.map(p => `<option value="${p.project_id}">${p.project_name} (#${p.project_id})</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Project ID</label>
                <input type="number" class="form-control" id="rptTCProjId" placeholder="Leave empty for all" min="1" oninput="syncRptTCProjSelect()">
            </div>
        `;
    }
}

function syncRptProjId()     { const v = document.getElementById('rptProjSelect')?.value;    if (v) document.getElementById('rptProjId').value = v; }
function syncRptProjSelect() { const v = document.getElementById('rptProjId')?.value;        const s = document.getElementById('rptProjSelect'); if(s) s.value = v || ''; }
function syncRptEmpId()      { const v = document.getElementById('rptEmpSelect')?.value;     if (v) document.getElementById('rptEmpId').value = v; }
function syncRptEmpSelect()  { const v = document.getElementById('rptEmpId')?.value;         const s = document.getElementById('rptEmpSelect'); if(s) s.value = v || ''; }
function syncRptTCProjId()   { const v = document.getElementById('rptTCProjSelect')?.value;  if (v) document.getElementById('rptTCProjId').value = v; }
function syncRptTCProjSelect(){ const v = document.getElementById('rptTCProjId')?.value;     const s = document.getElementById('rptTCProjSelect'); if(s) s.value = v || ''; }

function populateRptEmployees() {
    const dept = document.getElementById('rptEmpDept')?.value;
    const sel  = document.getElementById('rptEmpSelect');
    if (!sel) return;
    const filtered = dept ? allUsersList.filter(u => u.department === dept) : allUsersList;
    sel.innerHTML  = `<option value="">All Employees</option>` +
        filtered.map(u => `<option value="${u.user_id}">${u.first_name} ${u.last_name} (${u.user_id})</option>`).join('');
}

async function generateCustomReport() {
    const type      = document.getElementById('reportType').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate   = document.getElementById('reportEndDate').value;

    if (!startDate || !endDate) { Utils.showToast('Please select both dates', 'error'); return; }

    // Gather type-specific params
    let project_id = null;
    let user_id    = null;

    if (type === 'project_status' || type === 'task_completion') {
        const pidEl = document.getElementById('rptProjId') || document.getElementById('rptTCProjId');
        project_id  = pidEl?.value ? parseInt(pidEl.value) : null;
    }
    if (type === 'individual_productivity') {
        user_id = (document.getElementById('rptEmpId')?.value || '').trim() || null;
    }

    const reportData = { report_type: type, start_date: startDate, end_date: endDate, project_id, user_id };

    try {
        await API.reports.generate(reportData);
        Utils.showToast('Report generated successfully', 'success');
        document.getElementById('generateReportModal').remove();

        document.getElementById('reportDisplay').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2>${Utils.snakeToTitle(type)} — Custom Report</h2>
                    <button class="btn btn-sm btn-secondary" onclick="clearReport()">Close</button>
                </div>
                <div style="padding:1rem;">
                    <p>Period: <strong>${startDate}</strong> → <strong>${endDate}</strong></p>
                    ${project_id ? `<p>Project ID: <strong>${project_id}</strong></p>` : ''}
                    ${user_id    ? `<p>Employee ID: <strong>${user_id}</strong></p>`  : ''}
                    <p class="text-muted" style="margin-top:1rem;">Report saved. Integrate Chart.js or a similar library to visualize the data.</p>
                </div>
            </div>
        `;
    } catch (error) {
        Utils.showToast('Failed to generate report: ' + error.message, 'error');
    }
}

function clearReport() {
    document.getElementById('reportDisplay').innerHTML = '';
}
