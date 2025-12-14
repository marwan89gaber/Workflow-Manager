// ==========================================
// js/profile.js - Profile Page Logic
// ==========================================

let profileData = {
    user: null,
    stats: null
};

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

            <!-- Change Password Section -->
            <div class="card" style="margin-top: 2rem;">
                <h3>Change Password</h3>
                <form id="changePasswordForm" style="max-width: 400px;">
                    <div class="form-group">
                        <label class="form-label">Current Password</label>
                        <input type="password" class="form-control" id="currentPassword" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">New Password</label>
                        <input type="password" class="form-control" id="newPassword" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm New Password</label>
                        <input type="password" class="form-control" id="confirmPassword" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Update Password</button>
                </form>
            </div>
        </div>
    `;

    await loadProfileData();
    setupPasswordForm();
}

async function loadProfileData() {
    try {
        const user = Auth.getUser();
        const [userData, stats] = await Promise.all([
            API.users.getById(user.user_id),
            API.users.getDashboard(user.user_id)
        ]);

        profileData.user = userData.data;
        profileData.stats = stats.data;

        renderProfileHeader();
        renderProfileContent();
    } catch (error) {
        console.error('Error loading profile:', error);
        Utils.showToast('Failed to load profile', 'error');
    }
}

function renderProfileHeader() {
    const user = profileData.user;
    const initials = Utils.getInitials(user.first_name, user.last_name);

    document.getElementById('profileHeader').innerHTML = `
        <div class="profile-avatar">${initials}</div>
        <h2 style="margin: 0;">${user.first_name} ${user.last_name}</h2>
        <p style="color: var(--secondary); margin: 0.5rem 0;">
            ${user.email}
        </p>
        <div style="display: flex; gap: 0.5rem; justify-content: center;">
            <span class="badge" style="background: var(--primary); color: white;">
                ${Utils.capitalize(user.role)}
            </span>
            <span class="badge" style="background: var(--success); color: white;">
                ${Utils.capitalize(user.status)}
            </span>
        </div>
    `;
}

function renderProfileContent() {
    const user = profileData.user;
    const stats = profileData.stats.stats;

    document.getElementById('profileContent').innerHTML = `
        <!-- User Information -->
        <div style="margin-top: 2rem;">
            <h3>Personal Information</h3>
            <form id="profileForm">
                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label">First Name</label>
                        <input type="text" class="form-control" id="firstName" value="${user.first_name}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Last Name</label>
                        <input type="text" class="form-control" id="lastName" value="${user.last_name}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" value="${user.email}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Department</label>
                    <input type="text" class="form-control" id="department" value="${user.department || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" class="form-control" id="phone" value="${user.phone || ''}">
                </div>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </form>
        </div>

        <!-- Statistics -->
        <div style="margin-top: 2rem;">
            <h3>Your Statistics</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 1rem;">
                <div style="text-align: center; padding: 1rem; background: var(--light); border-radius: var(--radius-md);">
                    <div style="font-size: 2rem; color: var(--primary);">${stats.total_tasks || 0}</div>
                    <div style="color: var(--secondary);">Total Tasks</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--light); border-radius: var(--radius-md);">
                    <div style="font-size: 2rem; color: var(--success);">${stats.completed_tasks || 0}</div>
                    <div style="color: var(--secondary);">Completed</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--light); border-radius: var(--radius-md);">
                    <div style="font-size: 2rem; color: var(--warning);">${stats.in_progress_tasks || 0}</div>
                    <div style="color: var(--secondary);">In Progress</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--light); border-radius: var(--radius-md);">
                    <div style="font-size: 2rem; color: var(--info);">${stats.active_projects || 0}</div>
                    <div style="color: var(--secondary);">Projects</div>
                </div>
            </div>
        </div>
    `;

    setupProfileForm();
}

function setupProfileForm() {
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = Auth.getUser();
        const updatedData = {
            first_name: document.getElementById('firstName').value.trim(),
            last_name: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            department: document.getElementById('department').value.trim(),
            phone: document.getElementById('phone').value.trim()
        };

        try {
            await API.users.update(user.user_id, updatedData);
            
            // Update stored user data
            const updatedUser = { ...user, ...updatedData };
            Auth.setUser(updatedUser);
            
            Utils.showToast('Profile updated successfully', 'success');
            await loadProfileData();
        } catch (error) {
            Utils.showToast('Failed to update profile', 'error');
        }
    });
}

function setupPasswordForm() {
    document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            Utils.showToast('Passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            Utils.showToast('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            const user = Auth.getUser();
            await API.users.changePassword(user.user_id, currentPassword, newPassword);
            
            Utils.showToast('Password changed successfully', 'success');
            
            // Clear form
            document.getElementById('changePasswordForm').reset();
        } catch (error) {
            Utils.showToast(error.message || 'Failed to change password', 'error');
        }
    });
}