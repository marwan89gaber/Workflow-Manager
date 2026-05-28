const bcrypt = require('bcrypt');  
const DbService = require('../dbService');
const AuthMiddleware = require('../middleware/auth'); 

class UserController {

    // Create - Register a new user
    static async register(req, res) {
        const { first_name, last_name, email, password, role, department, phone } = req.body;

        if (role === 'admin') {
            return res.status(403).json({ success: false, message: 'Admin accounts cannot self-register' });
        }
        
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.insertNewUser(first_name, last_name, email, password, role, department, phone, 'pending');
            res.json({ success: true, data: data });
        } catch (err) {
            console.error('[UserController.register]', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // Login
    static async login(req, res) {
        const { email, password } = req.body;
        const db = DbService.getDbServiceInstance();

        try {
            const user = await db.getUserByEmail(email);

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ success: false, message: 'Invalid password' });
            }

            if (user.status === 'pending') {
                return res.status(403).json({
                    success: false,
                    message: 'Your account is pending admin approval'
                });
            }

            if (user.status === 'inactive') {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been deactivated'
                });
            }

            // Set token in httpOnly cookie — NOT in response body
            AuthMiddleware.setCookieToken(res, user);

            const { password: _, ...userWithoutPassword } = user;

            res.json({
                success: true,
                user: userWithoutPassword
                // No token in the response body
            });
        } catch (err) {
            console.error('[UserController.login]', err.message);
            res.status(500).json({ success: false, message: 'Login failed' });
        }
    }

    // READ - Get all users
    static async getAllUsers(req, res) {
        const db = DbService.getDbServiceInstance();
        try {
            const { status } = req.query;
            const data = status ? await db.getUsersByStatus(status) : await db.getAllData();
            res.json({ data: data });
        } catch (err) {
            console.error('[UserController.getAllUsers]', err.message);
            res.status(500).json({ error: err.message });
        }
    }

    // Read - Get user by ID
    static async getUserById(req, res) {
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const user = await db.getUserById(id);
            if (!user) {
                console.error('[UserController.getUserById] User not found:', id);
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ data: user });
        } catch (err) {
            console.error('[UserController.getUserById]', err.message);
            res.status(500).json({ error: err.message });
        }
    }
    
    // Read - Get user dashboard data
    static async getUserDashboard(req, res) {
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
                
        try {
            // Get user by ID
            const user = await db.getUserById(id);
            
            if (!user) {
                console.error('[UserController.getUserDashboard] User not found:', id);
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Get user's tasks
            const tasks = await db.getTasksByUserId(id);
            
            // Get user's projects
            const projects = await db.getUserProjects(id);

            // Calculate statistics
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.status === 'done').length;
            const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
            const todoTasks = tasks.filter(t => t.status === 'todo').length;
            const activeProjects = projects.filter(p => p.status === 'active').length;

            const dashboardData = {
                user: {
                    user_id: user.user_id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role,
                    department: user.department
                },
                stats: {
                    total_tasks: totalTasks,
                    completed_tasks: completedTasks,
                    in_progress_tasks: inProgressTasks,
                    todo_tasks: todoTasks,
                    active_projects: activeProjects
                }
            };
            
            res.json({ data: dashboardData });
            
        } catch (err) {
            console.error('[UserController.getUserDashboard] Dashboard error:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // UPDATE - Update user by ID
    static async updateUser(req, res) {
        const { id } = req.params;
        const requestingUser = req.user;
        const db = DbService.getDbServiceInstance();

        if (requestingUser.user_id !== parseInt(id) && !['admin', 'manager'].includes(requestingUser.role)) {
            return res.status(403).json({ success: false, message: 'You can only update your own profile' });
        }

        const { first_name, last_name, email, role, department, phone } = req.body;

        try {
            const success = await db.updateUserById(id, first_name, last_name, email, department, phone);
            res.json({ success: success });
        } catch (err) {
            console.error('[UserController.updateUser]', err.message);
            res.status(500).json({ success: false, message: 'Update failed' });
        }
    }

    // DELETE - Delete user by ID
    static async deleteUser(req, res) {
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.deleteUserById(id);
            res.json({ success: success });
        } catch (err) {
            console.error('[UserController.deleteUser]', err.message);
            res.status(500).json({ success: false, message: 'Delete failed' });
        }
    }

    // Update - Update user status
    static async updateUserStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.updateUserStatus(id, status);
            if (success) {
                res.json({ success: true, message: `User status updated to ${status}` });
            } else {
                res.status(404).json({ success: false, message: 'User not found' });
            }
        } catch (err) {
            console.error('[UserController.updateUserStatus]', err.message);
            res.status(500).json({ success: false, message: 'Failed to update user status' });
        }
    }

    static async approveUser(req, res) {
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();

        try {
            const success = await db.updateUserStatus(id, 'active');
            if (success) {
                res.json({ success: true, message: 'User approved successfully' });
            } else {
                res.status(404).json({ success: false, message: 'User not found' });
            }
        } catch (err) {
            console.error('[UserController.approveUser]', err.message);
            res.status(500).json({ success: false, message: 'Failed to approve user' });
        }
    }

    static async promoteUser(req, res) {
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();

        try {
            const user = await db.getUserById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            if (user.role !== 'employee') {
                return res.status(400).json({ success: false, message: 'Only employees can be promoted' });
            }

            const success = await db.updateUserRole(id, 'manager');
            if (success) {
                res.json({ success: true, message: 'User promoted to manager' });
            } else {
                res.status(500).json({ success: false, message: 'Failed to promote user' });
            }
        } catch (err) {
            console.error('[UserController.promoteUser]', err.message);
            res.status(500).json({ success: false, message: 'Failed to promote user' });
        }
    }

    // Change User Password
    static async changePassword(req, res) {
        const { id } = req.params;
        const requestingUser = req.user;

        // Users can only change their own password
        if (requestingUser.user_id !== id) {
            return res.status(403).json({
                success: false,
                message: 'You can only change your own password'
            });
        }

        const { oldPassword, newPassword } = req.body;
        const db = DbService.getDbServiceInstance();

        try {
            const user = await db.getUserById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
            }

            const success = await db.updateUserPassword(id, newPassword);
            res.json({ success, message: 'Password changed successfully' });
        } catch (err) {
            console.error('[UserController.changePassword]', err.message);
            res.status(500).json({ success: false, message: 'Password change failed' });
        }
    }


    // Logout - Clear token cookie
    static async logout(req, res) {
        AuthMiddleware.clearCookieToken(res);
        res.json({ success: true, message: 'Logged out successfully' });
    }

}

module.exports = UserController;