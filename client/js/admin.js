// ==========================================
// js/admin.js - Admin User Management
// ==========================================

let pendingUsers = [];
let activeEmployees = [];

async function initAdminPage() {
    if (!Auth.requireAuth()) return;
    if (!Auth.isAdmin()) {
        window.location.href = 'dashboard.html';
        return;
    }

    await Components.initLayout();

    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="page-header" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
            <div>
                <h1>Admin User Management</h1>
                <p class="text-muted">Approve new users and manage role promotions</p>
            </div>
        </div>

        <div class="card" style="margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; gap: 1rem; flex-wrap: wrap;">
                <h2 style="margin: 0;">Pending Approvals</h2>
                <button class="btn btn-secondary" onclick="loadAdminUsers()">Refresh</button>
            </div>
            <div id="pendingUsersSection"></div>
        </div>

        <div class="card">
            <h2 style="margin-top: 0;">Active Employees</h2>
            <div id="activeEmployeesSection"></div>
        </div>
    `;

    await loadAdminUsers();
}

async function loadAdminUsers() {
    try {
        const [pendingResponse, allResponse] = await Promise.all([
            API.users.getPending(),
            API.users.getAll()
        ]);

        pendingUsers = pendingResponse.data || [];
        const allUsers = allResponse.data || [];
        activeEmployees = allUsers.filter(user => user.status === 'active' && user.role === 'employee');

        renderPendingUsers();
        renderActiveEmployees();
    } catch (error) {
        console.error('Error loading admin users:', error);
        Utils.showToast('Failed to load users', 'error');
    }
}

function renderPendingUsers() {
    const container = document.getElementById('pendingUsersSection');

    if (!pendingUsers.length) {
        container.innerHTML = '<p class="text-muted">No pending users.</p>';
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${pendingUsers.map(user => `
                        <tr>
                            <td>${Utils.escapeHtml(user.first_name)} ${Utils.escapeHtml(user.last_name)}</td>
                            <td>${Utils.escapeHtml(user.email)}</td>
                            <td>${Utils.escapeHtml(user.role)}</td>
                            <td>${Utils.escapeHtml(user.department || 'N/A')}</td>
                            <td>
                                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                    <button class="btn btn-sm btn-primary" onclick="approveUser('${user.user_id}')">Approve</button>
                                    <button class="btn btn-sm btn-danger" onclick="rejectUser('${user.user_id}')">Reject</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderActiveEmployees() {
    const container = document.getElementById('activeEmployeesSection');

    if (!activeEmployees.length) {
        container.innerHTML = '<p class="text-muted">No active employees found.</p>';
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${activeEmployees.map(user => `
                        <tr>
                            <td>${Utils.escapeHtml(user.first_name)} ${Utils.escapeHtml(user.last_name)}</td>
                            <td>${Utils.escapeHtml(user.email)}</td>
                            <td>${Utils.escapeHtml(user.department || 'N/A')}</td>
                            <td><span class="badge badge-status-${user.status}">${Utils.snakeToTitle(user.status)}</span></td>
                            <td>
                                <button class="btn btn-sm btn-secondary" onclick="promoteUser('${user.user_id}')">Promote to Manager</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function approveUser(userId) {
    try {
        await API.users.approve(userId);
        Utils.showToast('User approved', 'success');
        await loadAdminUsers();
    } catch (error) {
        console.error('Error approving user:', error);
        Utils.showToast('Failed to approve user', 'error');
    }
}

async function rejectUser(userId) {
    try {
        await API.users.updateStatus(userId, 'inactive');
        Utils.showToast('User rejected', 'success');
        await loadAdminUsers();
    } catch (error) {
        console.error('Error rejecting user:', error);
        Utils.showToast('Failed to reject user', 'error');
    }
}

async function promoteUser(userId) {
    try {
        await API.users.promote(userId);
        Utils.showToast('User promoted to manager', 'success');
        await loadAdminUsers();
    } catch (error) {
        console.error('Error promoting user:', error);
        Utils.showToast('Failed to promote user', 'error');
    }
}