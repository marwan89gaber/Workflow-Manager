// ==========================================
// routes/newsRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const NewsController = require('../controllers/newsController');
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// All routes require authentication
router.use(auth.authenticateToken);

router.post('/',
    auth.authorizeRole('admin', 'manager'),
    validation.validateNews(),
    validation.handleValidationErrors,
    NewsController.createNews
);

router.get('/',
    NewsController.getAllNews
);

router.get('/pinned',
    NewsController.getPinnedNews
);

router.get('/:id',
    NewsController.getNewsById
);

router.put('/:id',
    auth.authorizeRole('admin', 'manager'),
    validation.validateNews(),
    validation.handleValidationErrors,
    NewsController.updateNews
);

router.delete('/:id',
    auth.authorizeRole('admin', 'manager'),
    NewsController.deleteNews
);

router.put('/:id/pin',
    auth.authorizeRole('admin', 'manager'),
    NewsController.togglePin
);

module.exports = router;
