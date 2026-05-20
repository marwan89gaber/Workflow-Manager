// ==========================================
// js/api.js - API Service Layer
// ==========================================

const API = {
    // Generic request handler
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const token = Auth.getToken();

        const defaultHeaders = {
            'Content-Type': 'application/json'
        };

        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    window.dispatchEvent(new Event('unauthorized'));
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },

    async upload(endpoint, formData) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const token = Auth.getToken();

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    window.dispatchEvent(new Event('unauthorized'));
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error(data.message || 'Upload failed');
            }

            return data;
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    },

    // AUTH
    auth: {
        login: (email, password) => API.post('/users/login', { email, password }),
        register: (userData) => API.post('/users/register', userData)
    },

    // USERS
    users: {
        getAll: () => API.get('/users'),
        getPending: () => API.get('/users?status=pending'),
        getById: (id) => API.get(`/users/${id}`),
        update: (id, data) => API.put(`/users/${id}`, data),
        delete: (id) => API.delete(`/users/${id}`),
        getDashboard: (id) => API.get(`/users/${id}/dashboard`),
        updateStatus: (id, status) => API.put(`/users/${id}/status`, { status }),
        approve: (id) => API.put(`/users/${id}/approve`),
        promote: (id) => API.put(`/users/${id}/promote`),
        changePassword: (id, oldPassword, newPassword) => 
            API.put(`/users/${id}/password`, { oldPassword, newPassword })
    },

    // PROJECTS
    projects: {
        getAll: () => API.get('/projects'),
        getById: (id) => API.get(`/projects/${id}`),
        create: (data) => API.post('/projects', data),
        update: (id, data) => API.put(`/projects/${id}`, data),
        delete: (id) => API.delete(`/projects/${id}`),
        addMember: (id, userId, role) => 
            API.post(`/projects/${id}/members`, { user_id: userId, role_in_project: role }),
        removeMember: (id, userId) => API.delete(`/projects/${id}/members/${userId}`),
        getMembers: (id) => API.get(`/projects/${id}/members`),
        getProgress: (id) => API.get(`/projects/${id}/progress`),
        updateStatus: (id, status) => API.put(`/projects/${id}/status`, { status }),
        getUserProjects: (userId) => API.get(`/projects/user/${userId}`)
    },

    // TASKS
    tasks: {
        getAll: () => API.get('/tasks'),
        getById: (id) => API.get(`/tasks/${id}`),
        create: (data) => API.post('/tasks', data),
        update: (id, data) => API.put(`/tasks/${id}`, data),
        delete: (id) => API.delete(`/tasks/${id}`),
        updateStatus: (id, status) => API.put(`/tasks/${id}/status`, { status }),
        assign: (id, userId) => API.put(`/tasks/${id}/assign`, { assigned_to: userId }),
        getHistory: (id) => API.get(`/tasks/${id}/history`),
        getByProject: (projectId) => API.get(`/tasks/project/${projectId}`),
        getByUser: (userId) => API.get(`/tasks/user/${userId}`),
        getByManager: (managerId) => API.get(`/tasks/manager/${managerId}`),
        accept: (id) => API.put(`/tasks/${id}/accept`),
        decline: (id) => API.put(`/tasks/${id}/decline`),
        updatePriority: (id, priority) => API.put(`/tasks/${id}/priority`, { priority }),
        getOverdue: () => API.get('/tasks/overdue')
    },

    // COMMENTS
    comments: {
        create: (taskId, commentText) => 
            API.post('/comments', { task_id: taskId, comment_text: commentText }),
        getByTask: (taskId) => API.get(`/comments/task/${taskId}`),
        update: (id, commentText) => API.put(`/comments/${id}`, { comment_text: commentText }),
        delete: (id) => API.delete(`/comments/${id}`),
        reply: (id, commentText) => 
            API.post(`/comments/${id}/reply`, { comment_text: commentText }),
        getReplies: (id) => API.get(`/comments/${id}/replies`)
    },

    // FILES
    files: {
        upload: (taskId, file) => {
            const formData = new FormData();
            formData.append('file', file);
            return API.upload(`/files/task/${taskId}`, formData);
        },
        getByTask: (taskId) => API.get(`/files/task/${taskId}`),
        delete: (id) => API.delete(`/files/${id}`),
        getDownloadUrl: (id) => `${CONFIG.API_BASE_URL}/files/${id}/download`
    },

    // MESSAGES
    messages: {
        createConversation: (data) => API.post('/messages/conversation', data),
        getConversations: () => API.get('/messages/conversations'),
        getMessages: (conversationId) => API.get(`/messages/conversation/${conversationId}`),
        send: (conversationId, messageText) => 
            API.post(`/messages/conversation/${conversationId}`, { message_text: messageText }),
        markAsRead: (conversationId) => API.put(`/messages/conversation/${conversationId}/read`),
        getUnreadCount: () => API.get('/messages/unread-count'),
        getProjectChat: (projectId) => API.get(`/messages/project/${projectId}`)
    },

    // NOTIFICATIONS
    notifications: {
        getAll: () => API.get('/notifications'),
        getUnread: () => API.get('/notifications/unread'),
        markAsRead: (id) => API.put(`/notifications/${id}/read`),
        markAllAsRead: () => API.put('/notifications/read-all'),
        delete: (id) => API.delete(`/notifications/${id}`),
        getUnreadCount: () => API.get('/notifications/unread-count')
    },

    // NEWS
    news: {
        getAll: () => API.get('/news'),
        getById: (id) => API.get(`/news/${id}`),
        create: (data) => API.post('/news', data),
        update: (id, data) => API.put(`/news/${id}`, data),
        delete: (id) => API.delete(`/news/${id}`),
        getPinned: () => API.get('/news/pinned'),
        togglePin: (id) => API.put(`/news/${id}/pin`)
    },

    // REPORTS
    reports: {
        generate: (data) => API.post('/reports/generate', data),
        getAll: () => API.get('/reports'),
        getById: (id) => API.get(`/reports/${id}`),
        delete: (id) => API.delete(`/reports/${id}`),
        getTeamPerformance: () => API.get('/reports/team-performance'),
        getProjectStatus: () => API.get('/reports/project-status'),
        getIndividualProductivity: () => API.get('/reports/individual-productivity'),
        getTaskCompletion: () => API.get('/reports/task-completion')
    }
};