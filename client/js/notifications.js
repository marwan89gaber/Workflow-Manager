// ==========================================
// js/notifications.js - Notifications Logic
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
                <p class="text-muted">Stay updated with your activities</p>
            </div>
            <div style="display:flex;gap:0.5rem;">
                <button class="btn btn-secondary" id="filterBtn" onclick="toggleUnreadFilter()">
                    Show Unread
                </button>
                <button class="btn btn-primary" onclick="markAllAsRead()">
                    Mark All as Read
                </button>
            </div>
        </div>

        <div class="card">
            <div id="notificationsList">
                <div class="loading-spinner"><div class="spinner"></div></div>
            </div>
        </div>
    `;

    await loadNotifications();
    startPolling();
}

async function loadNotifications() {
    try {
        let resp;
        if (showOnlyUnread) {
            resp = await API.notifications.getUnread();
        } else {
            resp = await API.notifications.getAll();
        }
        notifications = resp.data || resp || [];
        renderNotifications();
    } catch (error) {
        console.error('Error loading notifications:', error);
        Utils.showToast('Failed to load notifications', 'error');
        notifications = [];
        renderNotifications();
    }
}

function renderNotifications() {
    const list = document.getElementById('notificationsList');
    if (!list) return;

    if (!notifications.length) {
        list.innerHTML = `
            <div class="empty-state" style="text-align:center;padding:3rem;">
                <div style="font-size:4rem;">🔔</div>
                <p style="font-size:1.125rem;color:var(--secondary);">
                    ${showOnlyUnread ? 'No unread notifications' : 'No notifications yet'}
                </p>
            </div>
        `;
        return;
    }

    list.innerHTML = notifications.map(notif => `
        <div class="notification-item ${!notif.is_read ? 'unread' : ''}" data-id="${notif.notification_id}">
            <div style="flex:1;">
                <p style="margin:0 0 0.25rem 0;">${Utils.escapeHtml(notif.message)}</p>
                <small style="color:var(--secondary);">${Utils.formatRelativeTime(notif.created_at)}</small>
            </div>
            <div class="notification-actions">
                ${!notif.is_read ? `
                    <button class="btn btn-sm" onclick="markNotificationRead(${notif.notification_id})">Mark Read</button>
                ` : ''}
                <button class="btn btn-sm btn-danger" onclick="deleteNotification(${notif.notification_id})">Delete</button>
            </div>
        </div>
    `).join('');
}

async function markNotificationRead(notificationId) {
    try {
        await API.notifications.markAsRead(notificationId);
        Utils.showToast('Notification marked as read', 'success');
        await loadNotifications();
    } catch (error) {
        Utils.showToast('Failed to mark notification as read', 'error');
    }
}

async function deleteNotification(notificationId) {
    if (!confirm('Delete this notification?')) return;
    try {
        await API.notifications.delete(notificationId);
        Utils.showToast('Notification deleted', 'success');
        await loadNotifications();
    } catch (error) {
        Utils.showToast('Failed to delete notification', 'error');
    }
}

async function markAllAsRead() {
    try {
        await API.notifications.markAllAsRead();
        Utils.showToast('All notifications marked as read', 'success');
        await loadNotifications();
    } catch (error) {
        Utils.showToast('Failed to mark all as read', 'error');
    }
}

async function toggleUnreadFilter() {
    showOnlyUnread = !showOnlyUnread;
    const btn = document.getElementById('filterBtn');
    if (btn) btn.textContent = showOnlyUnread ? 'Show All' : 'Show Unread';
    await loadNotifications();
}

function startPolling() {
    setInterval(async () => {
        await loadNotifications();
    }, CONFIG.POLL_INTERVAL_NOTIFICATIONS);
}
