// ==========================================
// middleware/validation.js  (FIXED)
// ==========================================
const { body, param, validationResult } = require('express-validator');

class ValidationMiddleware {
    static handleValidationErrors(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }

    static validateUserRegistration() {
        return [
            body('first_name').trim().notEmpty(),
            body('last_name').trim().notEmpty(),
            body('email').isEmail(),
            body('password').isLength({ min: 6 }),
            body('role').isIn(['employee', 'manager', 'admin']),
            body('department').optional().trim(),
            body('phone').optional().trim()
        ];
    }

    static validateUserLogin() {
        return [
            body('email').isEmail(),
            body('password').notEmpty()
        ];
    }

    static validateUserUpdate() {
        return [
            param('id').notEmpty(),
            body('first_name').optional().trim().notEmpty(),
            body('last_name').optional().trim().notEmpty(),
            body('email').optional().isEmail(),
            body('phone').optional().trim(),
            body('department').optional().trim()
        ];
    }

    static validateProject() {
        return [
            body('project_name').trim().notEmpty(),
            body('description').optional().trim(),
            body('start_date').optional().isDate(),
            body('end_date').optional().isDate(),
            body('status').optional().isIn(['planning','active','on_hold','completed','cancelled']),
            body('priority').optional().isIn(['low','medium','high','critical'])
        ];
    }

    static validateProjectId() {
        return [ param('id').isInt() ];
    }

    static validateTask() {
        return [
            body('project_id').isInt(),
            body('task_name').trim().notEmpty(),
            body('description').optional().trim(),
            body('assigned_to').optional().trim(),
            body('status').optional().isIn(['todo','in_progress','in_review','done']),
            body('priority').optional().isIn(['low','medium','high','critical']),
            body('start_date').optional().isDate(),
            body('due_date').optional().isDate(),
            body('estimated_hours').optional().isFloat({ min: 0 })
        ];
    }

    static validateTaskId() {
        return [ param('id').isInt() ];
    }

    static validateTaskStatus() {
        return [
            param('id').isInt(),
            body('status').isIn(['todo','in_progress','in_review','done'])
        ];
    }

    static validateComment() {
        return [
            body('task_id').isInt(),
            body('comment_text').trim().notEmpty(),
            body('parent_comment_id').optional().isInt()
        ];
    }

    static validateCommentId() {
        return [ param('id').isInt() ];
    }

    static validateMessage() {
        return [
            body('message_text').trim().notEmpty()
        ];
    }

    static validateConversation() {
        return [
            body('conversation_type').isIn(['direct','group','project_group']),
            body('receiver_id').optional().trim(),
            body('project_id').optional({ nullable: true, checkFalsy: true }).isInt()
        ];
    }

    static validateNews() {
        return [
            body('title').trim().notEmpty(),
            body('content').trim().notEmpty(),
            body('priority').optional().isIn(['normal','important','urgent']),
            body('target_audience').optional().isIn(['all','managers','employees','specific_project']),
            body('project_id').optional({ nullable: true, checkFalsy: true }).isInt()
        ];
    }

    // FIX: nullable optional fields so null values don't trigger isInt/trim failures
    static validateReport() {
        return [
            body('report_type').isIn(['team_performance','project_status','individual_productivity','task_completion']),
            body('start_date').isDate().withMessage('Valid start date required (YYYY-MM-DD)'),
            body('end_date').isDate().withMessage('Valid end date required (YYYY-MM-DD)'),
            body('project_id').optional({ nullable: true, checkFalsy: true }).isInt(),
            body('user_id').optional({ nullable: true, checkFalsy: true }).trim(),
            body('task_id').optional({ nullable: true, checkFalsy: true }).isInt()
        ];
    }
}

module.exports = ValidationMiddleware;
