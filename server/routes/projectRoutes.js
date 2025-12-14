// ==========================================
// routes/projectRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/projectController');
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// All routes require authentication
router.use(auth.authenticateToken);

router.post('/',
    auth.authorizeRole('admin', 'manager'),
    validation.validateProject(),
    validation.handleValidationErrors,
    ProjectController.createProject
);

router.get('/',
    ProjectController.getAllProjects
);

router.get('/:id',
    validation.validateProjectId(),
    validation.handleValidationErrors,
    ProjectController.getProjectById
);

router.put('/:id',
    auth.authorizeRole('admin', 'manager'),
    validation.validateProjectId(),
    validation.validateProject(),
    validation.handleValidationErrors,
    ProjectController.updateProject
);

router.delete('/:id',
    auth.authorizeRole('admin', 'manager'),
    validation.validateProjectId(),
    validation.handleValidationErrors,
    ProjectController.deleteProject
);

router.post('/:id/members',
    auth.authorizeRole('admin', 'manager'),
    ProjectController.addProjectMember
);

router.delete('/:id/members/:userId',
    auth.authorizeRole('admin', 'manager'),
    ProjectController.removeProjectMember
);

router.get('/:id/members',
    ProjectController.getProjectMembers
);

router.get('/:id/progress',
    ProjectController.getProjectProgress
);

router.put('/:id/status',
    auth.authorizeRole('admin', 'manager'),
    ProjectController.updateProjectStatus
);

router.get('/user/:userId',
    ProjectController.getUserProjects
);

module.exports = router;
