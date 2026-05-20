// ==========================================
// js/config.js - Application Configuration
// ==========================================

const CONFIG = {
    // API Configuration
    API_BASE_URL: 'http://localhost:5000/api',
    
    // Authentication
    TOKEN_KEY: 'auth_token',
    USER_KEY: 'user_data',
    
    // Roles
    ROLES: {
        ADMIN: 'admin',
        MANAGER: 'manager',
        EMPLOYEE: 'employee'
    },
    
    // Task Statuses
    TASK_STATUS: {
        TODO: 'todo',
        IN_PROGRESS: 'in_progress',
        IN_REVIEW: 'in_review',
        DONE: 'done'
    },
    
    // Task Priorities
    TASK_PRIORITY: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    },
    
    // Project Statuses
    PROJECT_STATUS: {
        PLANNING: 'planning',
        ACTIVE: 'active',
        ON_HOLD: 'on_hold',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    },
    
    // News Priorities
    NEWS_PRIORITY: {
        NORMAL: 'normal',
        IMPORTANT: 'important',
        URGENT: 'urgent'
    },
    
    // Pagination
    ITEMS_PER_PAGE: 10,
    
    // File Upload
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ],
    
    // Polling Intervals (for real-time updates)
    POLL_INTERVAL_NOTIFICATIONS: 30000, // 30 seconds
    POLL_INTERVAL_MESSAGES: 10000, // 10 seconds
    
    // Date Format
    DATE_FORMAT: 'YYYY-MM-DD',
    DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
    
    // Status Colors
    COLORS: {
        status: {
            todo: '#6c757d',
            in_progress: '#007bff',
            in_review: '#ffc107',
            done: '#28a745'
        },
        priority: {
            low: '#28a745',
            medium: '#ffc107',
            high: '#fd7e14',
            critical: '#dc3545'
        },
        project: {
            planning: '#6c757d',
            active: '#007bff',
            on_hold: '#ffc107',
            completed: '#28a745',
            cancelled: '#dc3545'
        }
    }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);