// ==========================================
// js/profile.js — shows user ID between name and email
// ==========================================

let profileData = { user:null, stats:null };

async function initProfile() {
    await Components.initLayout();
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="profile-container">
            <div class="card">
                <div class="profile-header" id="profileHeader">
                    <div class="loading-spinner"><div class="spinner"></div></div>
                </div>
                <div id="profileContent">
                    <div class="loading-spinner"><div class="spinner"></div></div>
                </div>
            </div>
            <div class="card" style="margin-top:2rem;">
                <h3>Change Password</h3>
                <form id="changePasswordForm" style="max-width:420px;">
                    <div class="form-group">
                        <label class="form-label">Current Password</label>
                        <div style="position:relative;">
                            <input type="password" class="form-control" id="currentPassword" required style="padding-right:3rem;">
                            <button type="button" class="eye-btn" onclick="togglePwd('currentPassword',this)" title="Show/hide password"
                                style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.25rem;line-height:1;color:var(--secondary);">👁</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">New Password</label>
                        <div style="position:relative;">
                            <input type="password" class="form-control" id="newPassword" required minlength="6" style="padding-right:3rem;">
                            <button type="button" class="eye-btn" onclick="togglePwd('newPassword',this)" title="Show/hide password"
                                style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.25rem;line-height:1;color:var(--secondary);">👁</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm New Password</label>
                        <div style="position:relative;">
                            <input type="password" class="form-control" id="confirmPassword" required style="padding-right:3rem;">
                            <button type="button" class="eye-btn" onclick="togglePwd('confirmPassword',this)" title="Show/hide password"
                                style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.25rem;line-height:1;color:var(--secondary);">👁</button>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Update Password</button>
                </form>
            </div>
        </div>`;

    await loadProfileData();
    setupPasswordForm();
}

function togglePwd(inputId, btn) {
    const input  = document.getElementById(inputId);
    const isHide = input.type === 'password';
    input.type   = isHide ? 'text' : 'password';
    btn.textContent = isHide ? '🙈' : '👁';
    btn.style.color  = isHide ? 'var(--primary)' : 'var(--secondary)';
}

async function loadProfileData() {
    try {
        const user = Auth.getUser();
        const [uResp, sResp] = await Promise.all([
            API.users.getById(user.user_id),
            API.users.getDashboard(user.user_id)
        ]);
        profileData.user  = uResp.data || uResp;
        profileData.stats = sResp.data || sResp;
        renderProfileHeader();
        renderProfileContent();
    } catch(e) { Utils.showToast('Failed to load profile','error'); }
}

function renderProfileHeader() {
    const u        = profileData.user;
    const initials = Utils.getInitials(u.first_name, u.last_name);
    document.getElementById('profileHeader').innerHTML = `
        <div class="profile-avatar">${initials}</div>
        <h2 style="margin:0.5rem 0 0.25rem;">${u.first_name} ${u.last_name}</h2>
        <!-- User ID shown here, read-only, between name and email -->
        <p style="margin:0 0 0.25rem;font-family:monospace;background:var(--light);display:inline-block;
                  padding:0.2rem 0.75rem;border-radius:var(--radius-sm);font-size:0.875rem;color:var(--secondary);"
           title="Your User ID (read-only)">
            🪪 ${u.user_id}
        </p>
        <p style="color:var(--secondary);margin:0.25rem 0 0.75rem;">${u.email}</p>
        <div style="display:flex;gap:0.5rem;justify-content:center;">
            <span class="badge" style="background:var(--primary);color:white;">${Utils.capitalize(u.role)}</span>
            <span class="badge" style="background:var(--success);color:white;">${Utils.capitalize(u.status||'active')}</span>
        </div>`;
}

function renderProfileContent() {
    const u     = profileData.user;
    const stats = profileData.stats?.stats || {};
    document.getElementById('profileContent').innerHTML = `
        <div style="margin-top:2rem;">
            <h3>Personal Information</h3>
            <form id="profileForm">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                    <div class="form-group"><label class="form-label">First Name</label>
                        <input type="text" class="form-control" id="firstName" value="${u.first_name}" required></div>
                    <div class="form-group"><label class="form-label">Last Name</label>
                        <input type="text" class="form-control" id="lastName"  value="${u.last_name}"  required></div>
                </div>
                <div class="form-group"><label class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" value="${u.email}" required></div>
                <div class="form-group"><label class="form-label">Department</label>
                    <input type="text" class="form-control" id="department" value="${u.department||''}"></div>
                <div class="form-group"><label class="form-label">Phone</label>
                    <input type="tel" class="form-control" id="phone" value="${u.phone||''}"></div>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </form>
        </div>
        <div style="margin-top:2rem;">
            <h3>Your Statistics</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin-top:1rem;">
                ${[
                    {val:stats.total_tasks||0,    label:'Total Tasks',  color:'var(--primary)'},
                    {val:stats.completed_tasks||0, label:'Completed',    color:'var(--success)'},
                    {val:stats.in_progress_tasks||0,label:'In Progress', color:'var(--warning)'},
                    {val:stats.active_projects||0, label:'Projects',     color:'var(--info)'}
                ].map(s=>`
                    <div style="text-align:center;padding:1rem;background:var(--light);border-radius:var(--radius-md);">
                        <div style="font-size:2rem;color:${s.color};">${s.val}</div>
                        <div style="color:var(--secondary);">${s.label}</div>
                    </div>`).join('')}
            </div>
        </div>`;
    setupProfileForm();
}

function setupProfileForm() {
    document.getElementById('profileForm').addEventListener('submit', async e => {
        e.preventDefault();
        const user = Auth.getUser();
        const data = {
            first_name: document.getElementById('firstName').value.trim(),
            last_name:  document.getElementById('lastName').value.trim(),
            email:      document.getElementById('email').value.trim(),
            department: document.getElementById('department').value.trim(),
            phone:      document.getElementById('phone').value.trim()
        };
        try {
            await API.users.update(user.user_id, data);
            Auth.setUser({ ...user, ...data });
            Utils.showToast('Profile updated','success');
            await loadProfileData();
        } catch(e) { Utils.showToast('Failed to update profile','error'); }
    });
}

function setupPasswordForm() {
    document.getElementById('changePasswordForm').addEventListener('submit', async e => {
        e.preventDefault();
        const curr    = document.getElementById('currentPassword').value;
        const newPwd  = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;
        if (newPwd !== confirm)  { Utils.showToast('Passwords do not match','error'); return; }
        if (newPwd.length < 6)   { Utils.showToast('Password must be at least 6 characters','error'); return; }
        try {
            await API.users.changePassword(Auth.getUser().user_id, curr, newPwd);
            Utils.showToast('Password changed successfully','success');
            document.getElementById('changePasswordForm').reset();
        } catch(e) { Utils.showToast(e.message||'Failed to change password','error'); }
    });
}
