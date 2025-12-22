// ==========================================
// routes/userRoutes.js
// ==========================================
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// Public routes (no authentication required)
router.post('/register', 
    validation.validateUserRegistration(),
    validation.handleValidationErrors,
    UserController.register
);

router.post('/login',
    validation.validateUserLogin(),
    validation.handleValidationErrors,
    UserController.login
);

// Protected routes (authentication required)
router.get('/',
    auth.authenticateToken,
    UserController.getAllUsers
);

router.get('/:id',
    auth.authenticateToken,
    UserController.getUserById
);

router.put('/:id',
    auth.authenticateToken,
    validation.validateUserUpdate(),
    validation.handleValidationErrors,
    UserController.updateUser
);

router.delete('/:id',
    auth.authenticateToken,
    auth.authorizeRole('admin', 'manager'),
    UserController.deleteUser
);

router.get('/:id/dashboard',
    auth.authenticateToken,
    UserController.getUserDashboard
);

router.put('/:id/status',
    auth.authenticateToken,
    auth.authorizeRole('admin', 'manager'),
    UserController.updateUserStatus
);

router.put('/:id/password',
    auth.authenticateToken,
    UserController.changePassword
);

module.exports = router;