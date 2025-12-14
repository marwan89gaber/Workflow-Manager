// ==========================================
// routes/messageRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/messageController');
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// All routes require authentication
router.use(auth.authenticateToken);

router.post('/conversation',
    validation.validateConversation(),
    validation.handleValidationErrors,
    MessageController.createConversation
);

router.get('/conversations',
    MessageController.getUserConversations
);

router.get('/conversation/:id',
    MessageController.getConversationMessages
);

router.post('/conversation/:id',
    validation.validateMessage(),
    validation.handleValidationErrors,
    MessageController.sendMessage
);

router.put('/conversation/:id/read',
    MessageController.markAsRead
);

router.get('/unread-count',
    MessageController.getUnreadCount
);

router.get('/project/:projectId',
    MessageController.getProjectGroupChat
);

module.exports = router;