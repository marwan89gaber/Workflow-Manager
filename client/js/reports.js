// ==========================================
// js/reports.js — Chart.js visualizations + all fixes
// ==========================================

let allProjectsList = [];
let allUsersList    = [];
let activeCharts    = {};

async function initReports() {
    if (!Auth.isManagerOrAdmin()) { window.location.href='dashboard.html'; return; }
    await Components.initLayout();

    try {
        const [pR, uR] = await Promise.all([API.projects.getAll(), API.users.getAll()]);
        allProjectsList = pR.data || pR || [];
        allUsersList    = uR.data || uR || [];
    } catch(e) {}

    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="page-header" style="margin-bottom:2rem;">
            <h1>Reports & Analytics</h1>
            <p class="text-muted">Visual insights powered by Chart.js</p>
        </div>
        <div class="reports-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-bottom:2rem;">
            ${[
                {fn:'loadTeamPerformance', icon:'👥', title:'Team Performance',    desc:'Employee productivity & completion rates'},
                {fn:'loadProjectStatus',   icon:'📊', title:'Project Status',      desc:'Status distribution across all projects'},
                {fn:'loadTaskCompletion',  icon:'✅', title:'Task Completion',      desc:'Overall task completion overview'},
                {fn:'showCustomModal',     icon:'📈', title:'Custom Report',       desc:'Filter by task, project, employee & date'}
            ].map(r=>`
                <div class="card" onclick="${r.fn}()" style="cursor:pointer;text-align:center;transition:var(--transition);"
                     onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='var(--shadow-lg)'"
                     onmouseleave="this.style.transform='';this.style.boxShadow=''">
                    <div style="font-size:3rem;margin-bottom:1rem;">${r.icon}</div>
                    <h3 style="margin:0 0 0.5rem;">${r.title}</h3>
                    <p style="color:var(--secondary);margin:0;font-size:0.9rem;">${r.desc}</p>
                </div>`).join('')}
        </div>
        <div id="reportDisplay"></div>`;
}

// ──────────── Helper: destroy chart if exists ────────────
function destroyChart(id) {
    if (activeCharts[id]) { activeCharts[id].destroy(); delete activeCharts[id]; }
}

// ──────────── Team Performance ────────────
async function loadTeamPerformance() {
    showReportShell('Team Performance Report');
    try {
        const r    = await API.reports.getTeamPerformance();
        const data = Array.isArray(r.data||r) ? (r.data||r) : [];
        renderTeamPerformance(data);
    } catch(e) { showReportError('team performance'); }
}

function renderTeamPerformance(members) {
    const rc = document.getElementById('reportContent');
    if (!members.length) { rc.innerHTML='<p class="text-muted text-center">No data available.</p>'; return; }

    rc.innerHTML = `
        <canvas id="teamChart" style="max-height:320px;margin-bottom:2rem;"></canvas>
        <table class="table">
            <thead><tr><th>Employee</th><th>Dept</th><th>Total</th><th>Done ✅</th><th>In Progress 🔄</th><th>Overdue ⚠️</th><th>Rate</th></tr></thead>
            <tbody>
                ${members.map(m=>{
                    const pct = m.total_tasks>0 ? Math.round((m.completed_tasks/m.total_tasks)*100) : 0;
                    return `<tr>
                        <td>${m.first_name} ${m.last_name}</td>
                        <td>${m.department||'—'}</td>
                        <td>${m.total_tasks||0}</td>
                        <td style="color:var(--success);">${m.completed_tasks||0}</td>
                        <td style="color:var(--warning);">${m.in_progress_tasks||0}</td>
                        <td style="color:var(--danger);">${m.overdue_tasks||0}</td>
                        <td>
                            <div style="display:flex;align-items:center;gap:0.5rem;">
                                <div style="flex:1;height:8px;background:var(--light);border-radius:4px;overflow:hidden;">
                                    <div style="width:${pct}%;height:100%;background:var(--${pct>=70?'success':pct>=40?'warning':'danger'});"></div>
                                </div>
                                <span style="font-size:0.8rem;">${pct}%</span>
                            </div>
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;

    destroyChart('teamChart');
    const ctx = document.getElementById('teamChart').getContext('2d');
    activeCharts['teamChart'] = new Chart(ctx, {
        type:'bar',
        data:{
            labels: members.map(m=>`${m.first_name} ${m.last_name}`),
            datasets:[
                { label:'Completed',    data:members.map(m=>m.completed_tasks||0),   backgroundColor:'rgba(40,167,69,0.75)'  },
                { label:'In Progress',  data:members.map(m=>m.in_progress_tasks||0), backgroundColor:'rgba(255,193,7,0.75)'  },
                { label:'Overdue',      data:members.map(m=>m.overdue_tasks||0),      backgroundColor:'rgba(220,53,69,0.75)'  }
            ]
        },
        options:{
            responsive:true, plugins:{legend:{position:'top'},title:{display:true,text:'Tasks per Employee'}},
            scales:{x:{stacked:false},y:{beginAtZero:true,ticks:{stepSize:1}}}
        }
    });
}

// ──────────── Project Status ────────────
async function loadProjectStatus() {
    showReportShell('Project Status Report');
    try {
        const r    = await API.reports.getProjectStatus();
        const data = r.data || r;
        renderProjectStatus(data);
    } catch(e) { showReportError('project status'); }
}

function renderProjectStatus(data) {
    const rc       = document.getElementById('reportContent');
    const statuses = ['planning','active','on_hold','completed','cancelled'];
    const colors   = ['#6c757d','#007bff','#ffc107','#28a745','#dc3545'];
    const vals     = statuses.map(s=>data[s]||0);

    rc.innerHTML = `
        <div style="display:flex;gap:2rem;flex-wrap:wrap;align-items:flex-start;">
            <div style="flex:1;min-width:220px;max-width:320px;">
                <canvas id="projChart"></canvas>
            </div>
            <div style="flex:2;min-width:240px;">
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:1rem;margin-bottom:1.5rem;">
                    ${statuses.map((s,i)=>`
                        <div style="text-align:center;padding:1rem;background:var(--light);border-radius:var(--radius-md);border-top:3px solid ${colors[i]};">
                            <div style="font-size:1.75rem;font-weight:bold;">${vals[i]}</div>
                            <div style="color:var(--secondary);font-size:0.8rem;">${Utils.snakeToTitle(s)}</div>
                            <div style="font-size:0.75rem;color:var(--secondary);">${data[s+'_percent']||0}%</div>
                        </div>`).join('')}
                </div>
                <p style="color:var(--secondary);">Total Projects: <strong>${data.total||0}</strong></p>
            </div>
        </div>`;

    destroyChart('projChart');
    const ctx = document.getElementById('projChart').getContext('2d');
    activeCharts['projChart'] = new Chart(ctx, {
        type:'doughnut',
        data:{ labels:statuses.map(s=>Utils.snakeToTitle(s)), datasets:[{ data:vals, backgroundColor:colors, borderWidth:2 }] },
        options:{ responsive:true, plugins:{ legend:{ position:'bottom' } } }
    });
}

// ──────────── Task Completion (aggregate) ────────────
async function loadTaskCompletion() {
    showReportShell('Task Completion Overview');
    try {
        const r    = await API.reports.getTaskCompletion();
        const data = r.data || r;
        renderTaskCompletion(data);
    } catch(e) { showReportError('task completion'); }
}

function renderTaskCompletion(data) {
    const rc    = document.getElementById('reportContent');
    const total = data.total_tasks    || 0;
    const done  = data.completed_tasks || 0;
    const prog  = data.in_progress    || 0;
    const rev   = data.in_review      || 0;
    const todo  = total - done - prog - rev;
    const over  = data.overdue        || 0;
    const pct   = total>0 ? Math.round((done/total)*100) : 0;

    rc.innerHTML = `
        <div style="display:flex;gap:2rem;flex-wrap:wrap;align-items:flex-start;">
            <div style="flex:1;min-width:220px;max-width:300px;">
                <canvas id="taskPieChart"></canvas>
            </div>
            <div style="flex:2;min-width:240px;">
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:1rem;margin-bottom:1.5rem;">
                    ${[
                        {label:'Total',      val:total, c:'var(--primary)'},
                        {label:'Done ✅',    val:done,  c:'var(--success)'},
                        {label:'In Progress',val:prog,  c:'var(--warning)'},
                        {label:'To Review',  val:rev,   c:'var(--info)'},
                        {label:'To Do',      val:Math.max(0,todo), c:'var(--secondary)'},
                        {label:'Overdue ⚠️', val:over,  c:'var(--danger)'}
                    ].map(s=>`
                        <div style="text-align:center;padding:1rem;background:var(--light);border-radius:var(--radius-md);">
                            <div style="font-size:1.75rem;font-weight:bold;color:${s.c};">${s.val}</div>
                            <div style="color:var(--secondary);font-size:0.8rem;">${s.label}</div>
                        </div>`).join('')}
                </div>
                <p>Overall completion rate: <strong style="color:var(--${pct>=70?'success':pct>=40?'warning':'danger'});">${pct}%</strong></p>
                <div style="width:100%;height:16px;background:var(--light);border-radius:8px;overflow:hidden;margin-top:0.5rem;">
                    <div style="width:${pct}%;height:100%;background:var(--${pct>=70?'success':pct>=40?'warning':'danger'});transition:width 0.5s;"></div>
                </div>
            </div>
        </div>`;

    destroyChart('taskPieChart');
    const ctx = document.getElementById('taskPieChart').getContext('2d');
    activeCharts['taskPieChart'] = new Chart(ctx, {
        type:'doughnut',
        data:{
            labels:['Done','In Progress','To Review','To Do'],
            datasets:[{ data:[done,prog,rev,Math.max(0,todo)],
                backgroundColor:['#28a745','#ffc107','#17a2b8','#6c757d'], borderWidth:2 }]
        },
        options:{ responsive:true, plugins:{ legend:{ position:'bottom' } } }
    });
}

// ──────────── Custom Report Modal ────────────
function showCustomModal() {
    const depts = [...new Set(allUsersList.map(u=>u.department).filter(Boolean))].sort();
    const modal = document.createElement('div');
    modal.className='modal show'; modal.id='customReportModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:600px;">
            <div class="modal-header">
                <h2>Generate Custom Report</h2>
                <button class="modal-close" onclick="document.getElementById('customReportModal').remove()">×</button>
            </div>
            <div class="form-group">
                <label class="form-label">Report Type</label>
                <select class="form-control" id="rptType" onchange="updateCustomFields()" required>
                    <option value="team_performance">Team Performance</option>
                    <option value="project_status">Project Status</option>
                    <option value="individual_productivity">Individual Productivity</option>
                    <option value="task_completion">Task Completion Detail</option>
                </select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div class="form-group"><label class="form-label">Start Date</label>
                    <input type="date" class="form-control" id="rptStart" required></div>
                <div class="form-group"><label class="form-label">End Date</label>
                    <input type="date" class="form-control" id="rptEnd" required></div>
            </div>
            <div id="customFields"></div>
            <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;">
                <button class="btn btn-secondary" onclick="document.getElementById('customReportModal').remove()">Cancel</button>
                <button class="btn btn-primary" onclick="generateCustomReport()">Generate</button>
            </div>
        </div>`;
    document.body.appendChild(modal);

    // Default date range: last 30 days → today (no max restriction)
    const today    = new Date().toISOString().split('T')[0];
    const monthAgo = new Date(Date.now()-30*24*3600*1000).toISOString().split('T')[0];
    document.getElementById('rptStart').value = monthAgo;
    document.getElementById('rptEnd').value   = today;
    updateCustomFields();
}

function updateCustomFields() {
    const type   = document.getElementById('rptType').value;
    const fields = document.getElementById('customFields');
    const depts  = [...new Set(allUsersList.map(u=>u.department).filter(Boolean))].sort();

    const projOpts = `<option value="">All Projects</option>`+allProjectsList.map(p=>`<option value="${p.project_id}">${p.project_name} (#${p.project_id})</option>`).join('');
    const empOpts  = (dep='')=>{ const list=dep?allUsersList.filter(u=>u.department===dep):allUsersList; return `<option value="">All</option>`+list.map(u=>`<option value="${u.user_id}">${u.first_name} ${u.last_name} (${u.user_id})</option>`).join(''); };
    const deptSel  = `<select class="form-control" id="rptDept" onchange="refreshEmpOpts()">`+`<option value="">All Departments</option>`+depts.map(d=>`<option value="${d}">${d}</option>`).join('')+`</select>`;

    if (type==='team_performance') {
        fields.innerHTML=`<div class="form-group"><label class="form-label">Department (optional)</label>${deptSel}</div>`;
    } else if (type==='project_status') {
        fields.innerHTML=`
            <div class="form-group"><label class="form-label">Project (optional)</label>
                <select class="form-control" id="rptProjSel" onchange="syncField('rptProjSel','rptProjId')">${projOpts}</select></div>
            <div class="form-group"><label class="form-label">or Project ID</label>
                <input type="number" class="form-control" id="rptProjId" placeholder="Leave empty for all" min="1" oninput="syncSel('rptProjId','rptProjSel')"></div>`;
    } else if (type==='individual_productivity') {
        fields.innerHTML=`
            <div class="form-group"><label class="form-label">Department</label>${deptSel}</div>
            <div class="form-group"><label class="form-label">Employee (optional)</label>
                <select class="form-control" id="rptEmpSel" onchange="syncField('rptEmpSel','rptEmpId')">${empOpts()}</select></div>
            <div class="form-group"><label class="form-label">or Employee ID</label>
                <input type="text" class="form-control" id="rptEmpId" placeholder="Leave empty for all" oninput="syncSel('rptEmpId','rptEmpSel')"></div>`;
    } else { // task_completion detail
        fields.innerHTML=`
            <div class="form-group"><label class="form-label">Project (optional)</label>
                <select class="form-control" id="rptProjSel" onchange="syncField('rptProjSel','rptProjId')">${projOpts}</select></div>
            <div class="form-group"><label class="form-label">or Project ID</label>
                <input type="number" class="form-control" id="rptProjId" placeholder="Leave empty for all" min="1" oninput="syncSel('rptProjId','rptProjSel')"></div>
            <div class="form-group"><label class="form-label">Employee (optional — filters by assignee/creator)</label>
                <select class="form-control" id="rptEmpSel" onchange="syncField('rptEmpSel','rptEmpId')"><option value="">All</option>${allUsersList.map(u=>`<option value="${u.user_id}">${u.first_name} ${u.last_name} (${u.user_id})</option>`).join('')}</select></div>
            <div class="form-group"><label class="form-label">or Employee ID</label>
                <input type="text" class="form-control" id="rptEmpId" placeholder="Leave empty for all" oninput="syncSel('rptEmpId','rptEmpSel')"></div>
            <div class="form-group"><label class="form-label">Specific Task ID (optional)</label>
                <input type="number" class="form-control" id="rptTaskId" placeholder="Leave empty for all" min="1"></div>`;
    }
}

function refreshEmpOpts() {
    const dept = document.getElementById('rptDept')?.value;
    const sel  = document.getElementById('rptEmpSel');
    if (!sel) return;
    const list = dept ? allUsersList.filter(u=>u.department===dept) : allUsersList;
    sel.innerHTML = `<option value="">All</option>`+list.map(u=>`<option value="${u.user_id}">${u.first_name} ${u.last_name} (${u.user_id})</option>`).join('');
}

function syncField(selId,inpId){ const v=document.getElementById(selId)?.value; if(v&&document.getElementById(inpId)) document.getElementById(inpId).value=v; }
function syncSel(inpId,selId){   const v=document.getElementById(inpId)?.value; const s=document.getElementById(selId); if(s) s.value=v||''; }

async function generateCustomReport() {
    const type  = document.getElementById('rptType').value;
    const start = document.getElementById('rptStart').value;
    const end   = document.getElementById('rptEnd').value;
    if (!start||!end) { Utils.showToast('Please select both dates','error'); return; }

    // Build payload — only include fields that are set (avoid null validation failures)
    const payload = { report_type:type, start_date:start, end_date:end };
    const projId = document.getElementById('rptProjId')?.value;
    const empId  = document.getElementById('rptEmpId')?.value?.trim();
    const taskId = document.getElementById('rptTaskId')?.value;
    if (projId) payload.project_id = parseInt(projId);
    if (empId)  payload.user_id    = empId;
    if (taskId) payload.task_id    = parseInt(taskId);

    try {
        if (type === 'task_completion') {
            // Use detail endpoint via query string instead of POST (avoid validation)
            const params = new URLSearchParams();
            if (projId)  params.set('project_id', projId);
            if (empId)   params.set('user_id', empId);
            if (taskId)  params.set('task_id', taskId);
            if (start)   params.set('start_date', start);
            if (end)     params.set('end_date', end);
            const r    = await API.get(`/reports/task-completion-detail?${params}`);
            const data = r.data || r || [];
            document.getElementById('customReportModal').remove();
            renderTaskCompletionDetail(data, payload);
        } else {
            await API.reports.generate(payload);
            Utils.showToast('Report generated!','success');
            document.getElementById('customReportModal').remove();
            renderCustomReportSummary(type, start, end, projId, empId);
        }
    } catch(e) { Utils.showToast('Failed: '+e.message,'error'); }
}

function renderTaskCompletionDetail(tasks, params) {
    clearReport();
    const display = document.getElementById('reportDisplay');
    const done    = tasks.filter(t=>t.status==='done').length;
    const pct     = tasks.length ? Math.round((done/tasks.length)*100) : 0;
    display.innerHTML=`
        <div class="card">
            <div class="card-header">
                <h2>Task Completion Detail Report</h2>
                <button class="btn btn-sm btn-secondary" onclick="clearReport()">Close</button>
            </div>
            <div style="padding:1rem;">
                <p style="color:var(--secondary);">Period: <strong>${params.start_date}</strong> → <strong>${params.end_date}</strong>
                    ${params.project_id?` · Project #${params.project_id}`:''}
                    ${params.user_id?` · Employee: ${params.user_id}`:''}
                    ${params.task_id?` · Task #${params.task_id}`:''}
                </p>
                <canvas id="detailChart" style="max-height:240px;margin:1rem 0;"></canvas>
                ${!tasks.length?'<p class="text-muted text-center">No tasks matched your filters.</p>':`
                <table class="table">
                    <thead><tr><th>#</th><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Creator</th><th>Due Date</th></tr></thead>
                    <tbody>
                        ${tasks.map(t=>`<tr>
                            <td>${t.task_id}</td>
                            <td>${Utils.escapeHtml(t.task_name)}</td>
                            <td>${t.project_name||t.project_id||'—'}</td>
                            <td>${Components.renderStatusBadge(t.status)}</td>
                            <td>${Components.renderPriorityBadge(t.priority)}</td>
                            <td>${t.assignee_first?t.assignee_first+' '+t.assignee_last:'Unassigned'}</td>
                            <td>${t.creator_first?t.creator_first+' '+t.creator_last:'—'}</td>
                            <td>${Utils.formatDate(t.due_date)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>`}
            </div>
        </div>`;

    if (tasks.length) {
        const groups = {done:0,in_progress:0,in_review:0,todo:0};
        tasks.forEach(t=>{ if(groups[t.status]!==undefined) groups[t.status]++; });
        destroyChart('detailChart');
        const ctx = document.getElementById('detailChart').getContext('2d');
        activeCharts['detailChart'] = new Chart(ctx,{
            type:'bar',
            data:{ labels:['Done','In Progress','To Review','To Do'],
                   datasets:[{ label:'Tasks', data:[groups.done,groups.in_progress,groups.in_review,groups.todo],
                               backgroundColor:['#28a745','#ffc107','#17a2b8','#6c757d'] }] },
            options:{ responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,ticks:{stepSize:1}}} }
        });
    }
}

function renderCustomReportSummary(type, start, end, projId, empId) {
    clearReport();
    document.getElementById('reportDisplay').innerHTML=`
        <div class="card">
            <div class="card-header">
                <h2>${Utils.snakeToTitle(type)} — Custom Report</h2>
                <button class="btn btn-sm btn-secondary" onclick="clearReport()">Close</button>
            </div>
            <div style="padding:1rem;">
                <p>Period: <strong>${start}</strong> → <strong>${end}</strong></p>
                ${projId?`<p>Project ID: <strong>${projId}</strong></p>`:''}
                ${empId ?`<p>Employee ID: <strong>${empId}</strong></p>`:''}
                <p class="text-muted" style="margin-top:1rem;">Report saved to database. Use the individual report cards above to view live visualizations.</p>
            </div>
        </div>`;
}

// ──────────── Shared UI helpers ────────────
function showReportShell(title) {
    clearReport();
    document.getElementById('reportDisplay').innerHTML=`
        <div class="card">
            <div class="card-header">
                <h2>${title}</h2>
                <button class="btn btn-sm btn-secondary" onclick="clearReport()">Close</button>
            </div>
            <div id="reportContent"><div class="loading-spinner"><div class="spinner"></div></div></div>
        </div>`;
}

function showReportError(name) {
    const rc = document.getElementById('reportContent');
    if (rc) rc.innerHTML=`<p class="text-muted text-center" style="padding:2rem;">Failed to load ${name} report. Check server logs.</p>`;
}

function clearReport() {
    Object.keys(activeCharts).forEach(k => { try{activeCharts[k].destroy();}catch(e){} });
    activeCharts = {};
    document.getElementById('reportDisplay').innerHTML='';
}
