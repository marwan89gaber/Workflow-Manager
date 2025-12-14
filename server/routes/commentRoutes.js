// ==========================================
// routes/commentRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/commentController');
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// All routes require authentication
router.use(auth.authenticateToken);

router.post('/',
    validation.validateComment(),
    validation.handleValidationErrors,
    CommentController.createComment
);

router.get('/task/:taskId',
    CommentController.getCommentsByTask
);

router.put('/:id',
    validation.validateCommentId(),
    validation.handleValidationErrors,
    CommentController.updateComment
);

router.delete('/:id',
    validation.validateCommentId(),
    validation.handleValidationErrors,
    CommentController.deleteComment
);

router.post('/:id/reply',
    validation.validateCommentId(),
    validation.handleValidationErrors,
    CommentController.replyToComment
);

router.get('/:id/replies',
    validation.validateCommentId(),
    validation.handleValidationErrors,
    CommentController.getCommentReplies
);

module.exports = router;