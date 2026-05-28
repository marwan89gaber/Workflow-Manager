// ==========================================
// routes/fileRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const FileController = require('../controllers/fileController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(auth.authenticateToken);

router.post('/task/:taskId',
    upload.single('file'),
    upload.verifyFileMagicBytes,
    FileController.uploadFile
);

router.get('/task/:taskId',
    FileController.getFilesByTask
);

router.delete('/:id',
    FileController.deleteFile
);

router.get('/:id/download',
    FileController.downloadFile
);

module.exports = router;