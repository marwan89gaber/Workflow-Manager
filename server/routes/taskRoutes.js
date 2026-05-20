// ==========================================
// routes/taskRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// All routes require authentication
router.use(auth.authenticateToken);

router.post('/',
    validation.validateTask(),
    validation.handleValidationErrors,
    TaskController.createTask
);

router.get('/',
    TaskController.getAllTasks
);

router.get('/manager/:managerId',
    TaskController.getTasksByManager
);

router.get('/overdue',
    TaskController.getOverdueTasks
);

router.put('/:id/accept',
    auth.authorizeRole('admin', 'manager'),
    TaskController.acceptTask
);

router.put('/:id/decline',
    auth.authorizeRole('admin', 'manager'),
    TaskController.declineTask
);

router.get('/:id',
    validation.validateTaskId(),
    validation.handleValidationErrors,
    TaskController.getTaskById
);

router.put('/:id',
    validation.validateTaskId(),
    validation.handleValidationErrors,
    TaskController.updateTask
);

router.delete('/:id',
    auth.authorizeRole('admin', 'manager'),
    validation.validateTaskId(),
    validation.handleValidationErrors,
    TaskController.deleteTask
);

router.put('/:id/status',
    validation.validateTaskStatus(),
    validation.handleValidationErrors,
    TaskController.updateTaskStatus
);

router.put('/:id/assign',
    auth.authorizeRole('admin', 'manager'),
    TaskController.assignTask
);

router.get('/:id/history',
    validation.validateTaskId(),
    validation.handleValidationErrors,
    TaskController.getTaskHistory
);

router.get('/project/:projectId',
    TaskController.getTasksByProject
);

router.get('/user/:userId',
    TaskController.getTasksByUser
);

router.put('/:id/priority',
    auth.authorizeRole('admin', 'manager'),
    TaskController.updateTaskPriority
);

module.exports = router;