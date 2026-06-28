// ==========================================
// js/notifications.js  — clickable, redirect, no delete/markread buttons
// ==========================================

let notifications  = [];
let showOnlyUnread = false;

async function initNotifications() {
    await Components.initLayout();
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="page-header" style="margin-bottom:2rem;display:flex;justify-content:space-between;align-items:center;">
            <div>
                <h1>Notifications</h1>
                <p class="text-muted">Click a notification to go directly to the related item</p>
            </div>
            <div style="display:flex;gap:0.5rem;">
                <button class="btn btn-secondary" id="filterBtn" onclick="toggleUnreadFilter()">Show Unread</button>
                <button class="btn btn-primary" onclick="markAllRead()">Mark All as Read</button>
            </div>
        </div>
        <div class="card" id="notifCard">
            <div id="notificationsList">
                <div class="loading-spinner"><div class="spinner"></div></div>
            </div>
        </div>`;
    await loadNotifications();
    setInterval(loadNotifications, CONFIG.POLL_INTERVAL_NOTIFICATIONS);
}

async function loadNotifications() {
    try {
        const resp    = showOnlyUnread
            ? await API.notifications.getUnread()
            : await API.notifications.getAll();
        notifications = resp.data || resp || [];
        renderNotifications();
    } catch (e) {
        notifications = [];
        renderNotifications();
    }
}

function renderNotifications() {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    if (!notifications.length) {
        list.innerHTML = `<div style="text-align:center;padding:3rem;">
            <div style="font-size:4rem;">🔔</div>
            <p style="color:var(--secondary);">${showOnlyUnread?'No unread notifications':'No notifications yet'}</p></div>`;
        return;
    }
    list.innerHTML = notifications.map(n => `
        <div class="notification-item ${!n.is_read?'unread':''}"
             onclick="handleNotificationClick(${n.notification_id},'${n.related_type}',${n.related_id})"
             style="cursor:pointer;${!n.is_read?'font-weight:600;border-left:3px solid var(--primary);':''}" title="Click to view">
            <div style="flex:1;">
                <p style="margin:0 0 0.25rem 0;">${Utils.escapeHtml(n.message)}</p>
                <small style="color:var(--secondary);">${Utils.formatRelativeTime(n.created_at)}</small>
            </div>
            ${!n.is_read?`<span style="width:8px;height:8px;border-radius:50%;background:var(--primary);display:inline-block;margin-left:1rem;flex-shrink:0;align-self:center;"></span>`:''}
        </div>`).join('');
}

// Click handler: mark as read + navigate
async function handleNotificationClick(notificationId, relatedType, relatedId) {
    try { await API.notifications.markAsRead(notificationId); } catch(e) {}

    switch (relatedType) {
        case 'task':
            window.location.href = `tasks.html?modal=${relatedId}`;
            break;
        case 'comment':
            // comment's related_id IS the comment_id, but we navigate to the task
            // We'll just go to tasks with the comment_id as a hint — server has the task_id in task history
            // Best effort: navigate to tasks with modal=relatedId (comment_id may differ from task_id)
            window.location.href = `tasks.html?modal=${relatedId}`;
            break;
        case 'project':
            window.location.href = `project-detail.html?id=${relatedId}`;
            break;
        case 'message':
            window.location.href = 'chat.html';
            break;
        default:
            window.location.href = 'dashboard.html';
    }
}

async function toggleUnreadFilter() {
    showOnlyUnread = !showOnlyUnread;
    const btn = document.getElementById('filterBtn');
    if (btn) btn.textContent = showOnlyUnread ? 'Show All' : 'Show Unread';
    await loadNotifications();
}

async function markAllRead() {
    try {
        await API.notifications.markAllAsRead();
        Utils.showToast('All marked as read', 'success');
        await loadNotifications();
    } catch(e) { Utils.showToast('Failed', 'error'); }
}
