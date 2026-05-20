// ==========================================
// middleware/validation.js
// ==========================================
const { body, param, query, validationResult } = require('express-validator');

class ValidationMiddleware {
    // Handle validation errors
    static handleValidationErrors(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }
        next();
    }

    // User validation rules
    static validateUserRegistration() {
        return [
            body('first_name').trim().notEmpty().withMessage('First name is required'),
            body('last_name').trim().notEmpty().withMessage('Last name is required'),
            body('email').isEmail().withMessage('Valid email is required'),
            body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
            body('role').isIn(['employee', 'manager', 'admin']).withMessage('Invalid role'),
            body('department').optional().trim(),
            body('phone').optional().trim()
        ];
    }

    static validateUserLogin() {
        return [
            body('email').isEmail().withMessage('Valid email is required'),
            body('password').notEmpty().withMessage('Password is required')
        ];
    }

    static validateUserUpdate() {
        return [
            param('id').notEmpty().withMessage('User ID is required'),
            body('first_name').optional().trim().notEmpty(),
            body('last_name').optional().trim().notEmpty(),
            body('email').optional().isEmail(),
            body('phone').optional().trim(),
            body('department').optional().trim()
        ];
    }

    // Project validation rules
    static validateProject() {
        return [
            body('project_name').trim().notEmpty().withMessage('Project name is required'),
            body('description').optional().trim(),
            body('start_date').optional().isDate().withMessage('Invalid start date'),
            body('end_date').optional().isDate().withMessage('Invalid end date'),
            body('status').optional().isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
            body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
        ];
    }

    static validateProjectId() {
        return [
            param('id').isInt().withMessage('Invalid project ID')
        ];
    }

    // Task validation rules
    static validateTask() {
        return [
            body('project_id').isInt().withMessage('Valid project ID is required'),
            body('task_name').trim().notEmpty().withMessage('Task name is required'),
            body('description').optional().trim(),
            body('assigned_to').optional().trim(),
            body('status').optional().isIn(['todo', 'in_progress', 'in_review', 'done']),
            body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
            body('start_date').optional().isDate(),
            body('due_date').optional().isDate(),
            body('estimated_hours').optional().isFloat({ min: 0 })
        ];
    }

    static validateTaskId() {
        return [
            param('id').isInt().withMessage('Invalid task ID')
        ];
    }

    static validateTaskStatus() {
        return [
            param('id').isInt().withMessage('Invalid task ID'),
            body('status').isIn(['todo', 'in_progress', 'in_review', 'done']).withMessage('Invalid status')
        ];
    }

    // Comment validation rules
    static validateComment() {
        return [
            body('task_id').isInt().withMessage('Valid task ID is required'),
            body('comment_text').trim().notEmpty().withMessage('Comment text is required'),
            body('parent_comment_id').optional().isInt()
        ];
    }

    static validateCommentId() {
        return [
            param('id').isInt().withMessage('Invalid comment ID')
        ];
    }

    // Message validation rules
    static validateMessage() {
        return [
            body('conversation_id').isInt().withMessage('Valid conversation ID is required'),
            body('message_text').trim().notEmpty().withMessage('Message text is required')
        ];
    }

    static validateConversation() {
        return [
            body('conversation_type').isIn(['direct', 'group', 'project_group']).withMessage('Invalid conversation type'),
            body('receiver_id').optional().trim(),
            body('project_id').optional().isInt()
        ];
    }

    // News validation rules
    static validateNews() {
        return [
            body('title').trim().notEmpty().withMessage('Title is required'),
            body('content').trim().notEmpty().withMessage('Content is required'),
            body('priority').optional().isIn(['normal', 'important', 'urgent']),
            body('target_audience').optional().isIn(['all', 'managers', 'employees', 'specific_project']),
            body('project_id').optional().isInt()
        ];
    }

    // Report validation rules
    static validateReport() {
        return [
            body('report_type').isIn(['team_performance', 'project_status', 'individual_productivity', 'task_completion']),
            body('start_date').isDate().withMessage('Valid start date is required'),
            body('end_date').isDate().withMessage('Valid end date is required'),
            body('project_id').optional().isInt(),
            body('user_id').optional().trim()
        ];
    }
}

module.exports = ValidationMiddleware;