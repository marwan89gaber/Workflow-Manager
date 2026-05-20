// ==========================================
// routes/notificationRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth.authenticateToken);

router.get('/',
    NotificationController.getUserNotifications
);

router.get('/unread',
    NotificationController.getUnreadNotifications
);

router.put('/read-all',
    NotificationController.markAllAsRead
);

router.put('/:id/read',
    NotificationController.markAsRead
);

router.delete('/:id',
    NotificationController.deleteNotification
);

router.get('/unread-count',
    NotificationController.getUnreadCount
);

module.exports = router;