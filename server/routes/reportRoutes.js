// ==========================================
// routes/reportRoutes.js  (updated — adds task-completion-detail)
// ==========================================
const express        = require('express');
const router         = express.Router();
const ReportController = require('../controllers/reportController');
const auth           = require('../middleware/auth');
const validation     = require('../middleware/validation');

router.use(auth.authenticateToken);

router.post('/generate',
    auth.authorizeRole('admin','manager'),
    validation.validateReport(),
    validation.handleValidationErrors,
    ReportController.generateReport
);

router.get('/',
    auth.authorizeRole('admin','manager'),
    ReportController.getAllReports
);

router.get('/team-performance',
    auth.authorizeRole('admin','manager'),
    ReportController.getTeamPerformance
);

router.get('/project-status',
    auth.authorizeRole('admin','manager'),
    ReportController.getProjectStatus
);

router.get('/individual-productivity',
    ReportController.getIndividualProductivity
);

router.get('/task-completion',
    auth.authorizeRole('admin','manager'),
    ReportController.getTaskCompletion
);

// NEW: detailed task-completion filtered by task / project / user / date
router.get('/task-completion-detail',
    auth.authorizeRole('admin','manager'),
    ReportController.getTaskCompletionDetail
);

router.get('/:id',
    ReportController.getReportById
);

router.delete('/:id',
    auth.authorizeRole('admin','manager'),
    ReportController.deleteReport
);

module.exports = router;
