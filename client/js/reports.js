// ==========================================
// js/reports.js - Reports Page Logic
// ==========================================

async function initReports() {
    // Check if user has access
    if (!Auth.isManagerOrAdmin()) {
        window.location.href = 'dashboard.html';
        return;
    }

    await Components.initLayout();
    
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="page-header" style="margin-bottom: 2rem;">
            <h1>Reports & Analytics</h1>
            <p class="text-muted">View team performance and project insights</p>
        </div>

        <!-- Report Cards -->
        <div class="reports-grid">
            <div class="card report-card" onclick="loadTeamPerformance()">
                <div class="report-icon">👥</div>
                <h3>Team Performance</h3>
                <p style="color: var(--secondary);">View team productivity and task completion rates</p>
            </div>

            <div class="card report-card" onclick="loadProjectStatus()">
                <div class="report-icon">📊</div>
                <h3>Project Status</h3>
                <p style="color: var(--secondary);">Overview of all project statuses and progress</p>
            </div>

            <div class="card report-card" onclick="loadTaskCompletion()">
                <div class="report-icon">✅</div>
                <h3>Task Completion</h3>
                <p style="color: var(--secondary);">Analyze task completion trends and metrics</p>
            </div>

            <div class="card report-card" onclick="showGenerateReportModal()">
                <div class="report-icon">📈</div>
                <h3>Custom Report</h3>
                <p style="color: var(--secondary);">Generate a custom report with specific criteria</p>
            </div>
        </div>

        <!-- Report Display Area -->
        <div id="reportDisplay"></div>
    `;
}

async function loadTeamPerformance() {
    const display = document.getElementById('reportDisplay');
    display.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>Team Performance Report</h2>
                <button class="btn btn-sm btn-secondary" onclick="clearReport()">Close</button>
            </div>
            <div id="reportContent">
                <div class="loading-spinner"><div class="spinner"></div></div>
            </div>
        </div>
    `;

    try {
        const data = await API.reports.getTeamPerformance();
        renderTeamPerformance(data);
    } catch (error) {
        console.error('Error loading team performance:', error);
        Utils.showToast('Failed to load team performance report', 'error');
    }
}

function renderTeamPerformance(data) {
    document.getElementById('reportContent').innerHTML = `
        <div style="padding: 1rem;">
            <h3>Team Metrics</h3>
            <div class="chart-container">
                <p style="color: var(--secondary);">📊 Chart visualization would go here</p>
                <p style="color: var(--secondary); font-size: 0.875rem;">
                    (Integrate Chart.js or similar library for actual charts)
                </p>
            </div>
            <div style="margin-top: 2rem;">
                <h4>Summary Statistics</h4>
                <p>Total team members: ${data?.total_members || 'N/A'}</p>
                <p>Average completion rate: ${data?.completion_rate || 'N/A'}%</p>
                <p>Active tasks: ${data?.active_tasks || 'N/A'}</p>
            </div>
        </div>
    `;
}

async function loadProjectStatus() {
    const display = document.getElementById('reportDisplay');
    display.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>Project Status Report</h2>
                <button class="btn btn-sm btn-secondary" onclick="clearReport()">Close</button>
            </div>
            <div id="reportContent">
                <div class="loading-spinner"><div class="spinner"></div></div>
            </div>
        </div>
    `;

    try {
        const data = await API.reports.getProjectStatus();
        renderProjectStatus(data);
    } catch (error) {
        console.error('Error loading project status:', error);
        Utils.showToast('Failed to load project status report', 'error');
    }
}

function renderProjectStatus(data) {
    document.getElementById('reportContent').innerHTML = `
        <div style="padding: 1rem;">
            <h3>Project Overview</h3>
            <div class="chart-container">
                <p style="color: var(--secondary);">📊 Project status distribution chart</p>
            </div>
            <div style="margin-top: 2rem;">
                <h4>Project Breakdown</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Count</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Planning</td>
                            <td>${data?.planning || 0}</td>
                            <td>${data?.planning_percent || 0}%</td>
                        </tr>
                        <tr>
                            <td>Active</td>
                            <td>${data?.active || 0}</td>
                            <td>${data?.active_percent || 0}%</td>
                        </tr>
                        <tr>
                            <td>Completed</td>
                            <td>${data?.completed || 0}</td>
                            <td>${data?.completed_percent || 0}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function loadTaskCompletion() {
    const display = document.getElementById('reportDisplay');
    display.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2>Task Completion Report</h2>
                <button class="btn btn-sm btn-secondary" onclick="clearReport()">Close</button>
            </div>
            <div id="reportContent">
                <div class="loading-spinner"><div class="spinner"></div></div>
            </div>
        </div>
    `;

    try {
        const data = await API.reports.getTaskCompletion();
        renderTaskCompletion(data);
    } catch (error) {
        console.error('Error loading task completion:', error);
        Utils.showToast('Failed to load task completion report', 'error');
    }
}

function renderTaskCompletion(data) {
    document.getElementById('reportContent').innerHTML = `
        <div style="padding: 1rem;">
            <h3>Task Completion Trends</h3>
            <div class="chart-container">
                <p style="color: var(--secondary);">📊 Task completion timeline chart</p>
            </div>
            <div style="margin-top: 2rem;">
                <h4>Completion Statistics</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div style="padding: 1rem; background: var(--light); border-radius: var(--radius-md); text-align: center;">
                        <div style="font-size: 2rem; color: var(--primary);">${data?.total_tasks || 0}</div>
                        <div style="color: var(--secondary);">Total Tasks</div>
                    </div>
                    <div style="padding: 1rem; background: var(--light); border-radius: var(--radius-md); text-align: center;">
                        <div style="font-size: 2rem; color: var(--success);">${data?.completed_tasks || 0}</div>
                        <div style="color: var(--secondary);">Completed</div>
                    </div>
                    <div style="padding: 1rem; background: var(--light); border-radius: var(--radius-md); text-align: center;">
                        <div style="font-size: 2rem; color: var(--warning);">${data?.in_progress || 0}</div>
                        <div style="color: var(--secondary);">In Progress</div>
                    </div>
                    <div style="padding: 1rem; background: var(--light); border-radius: var(--radius-md); text-align: center;">
                        <div style="font-size: 2rem; color: var(--danger);">${data?.overdue || 0}</div>
                        <div style="color: var(--secondary);">Overdue</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showGenerateReportModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Generate Custom Report</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <form id="generateReportForm">
                <div class="form-group">
                    <label class="form-label">Report Type</label>
                    <select class="form-control" id="reportType" required>
                        <option value="team_performance">Team Performance</option>
                        <option value="project_status">Project Status</option>
                        <option value="individual_productivity">Individual Productivity</option>
                        <option value="task_completion">Task Completion</option>
                    </select>
                </div>
                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Start Date</label>
                        <input type="date" class="form-control" id="startDate" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">End Date</label>
                        <input type="date" class="form-control" id="endDate" required>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Project ID (Optional)</label>
                    <input type="number" class="form-control" id="projectId" placeholder="Leave empty for all projects">
                </div>
                <div class="form-group">
                    <label class="form-label">User ID (Optional)</label>
                    <input type="text" class="form-control" id="userId" placeholder="e.g., EMP001">
                </div>
                <button type="submit" class="btn btn-primary">Generate Report</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('generateReportForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await generateCustomReport();
    });
}

async function generateCustomReport() {
    const reportData = {
        report_type: document.getElementById('reportType').value,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        project_id: document.getElementById('projectId').value || null,
        user_id: document.getElementById('userId').value || null
    };

    try {
        const result = await API.reports.generate(reportData);
        Utils.showToast('Report generated successfully', 'success');
        document.querySelector('.modal').remove();
        
        // Display the generated report
        const display = document.getElementById('reportDisplay');
        display.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2>Custom Report</h2>
                    <button class="btn btn-sm btn-secondary" onclick="clearReport()">Close</button>
                </div>
                <div style="padding: 1rem;">
                    <p>Report generated for period: ${reportData.start_date} to ${reportData.end_date}</p>
                    <p>Type: ${Utils.snakeToTitle(reportData.report_type)}</p>
                    <div class="chart-container">
                        <p style="color: var(--secondary);">📊 Report visualization</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        Utils.showToast('Failed to generate report', 'error');
    }
}

function clearReport() {
    document.getElementById('reportDisplay').innerHTML = '';
}