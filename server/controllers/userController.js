const bcrypt = require('bcrypt');  
const DbService = require('../dbService');
const AuthMiddleware = require('../middleware/auth'); 

class UserController {

    // Create - Register a new user
    static async register(req, res) {
        console.log('📥 Request body:', req.body);
        
        const { first_name, last_name, email, password, role, department, phone } = req.body;
        
        console.log('📝 Extracted values:', {
            first_name,
            last_name,
            email,
            password: password ? '***' : 'UNDEFINED',
            role,
            department,
            phone
        });
        
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.insertNewUser(first_name, last_name, email, password, role, department, phone);
            res.json({ success: true, data: data });
        } catch (err) {
            console.error('❌ Error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // Login
    static async login(req, res) {
        const { email, password } = req.body;
        const db = DbService.getDbServiceInstance();
        
        console.log('🔐 Login attempt:', { email, password: password ? '***' : 'UNDEFINED' });
        
        try {
            const user = await db.getUserByEmail(email);
            
            console.log('👤 User found:', user ? 'YES' : 'NO');
            
            if (!user) {
                console.log('❌ User not found in database');
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            console.log('🔑 Comparing passwords...');
            console.log('Stored hash:', user.password);
            console.log('Input password:', password);
            
            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            
            console.log('✅ Password valid:', isPasswordValid);
            
            if (!isPasswordValid) {
                console.log('❌ Password mismatch');
                return res.status(401).json({ success: false, message: 'Invalid password' });
            }

            // Generate token
            const token = AuthMiddleware.generateToken(user);
            console.log('🎫 Token generated');

            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;

            console.log('✅ Login successful');
            res.json({ 
                success: true, 
                token: token,
                user: userWithoutPassword 
            });
        } catch (err) {
            console.error('❌ Login error:', err.message);
            console.error('Stack:', err.stack);
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // READ - Get all users
    static async getAllUsers(req, res) {
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getAllData();
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // Read - Get user by ID
    static async getUserById(req, res) {
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const user = await db.getUserById(id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json({ data: user });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    
    // Read - Get user dashboard data
    static async getUserDashboard(req, res) {
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        
        console.log('📊 Getting dashboard for user:', id);
        
        try {
            // Get user by ID
            const user = await db.getUserById(id);
            
            if (!user) {
                console.log('❌ User not found:', id);
                return res.status(404).json({ error: 'User not found' });
            }
            
            //console.log('✅ User found:', user.user_id);

            // Get user's tasks
            const tasks = await db.getTasksByUserId(id);
            //console.log('📋 Tasks found:', tasks.length);
            
            // Get user's projects
            const projects = await db.getUserProjects(id);
            //console.log('📁 Projects found:', projects.length);

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
            
            //console.log('✅ Dashboard data prepared:', dashboardData);
            res.json({ data: dashboardData });
            
        } catch (err) {
            console.error('❌ Dashboard error:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // UPDATE - Update user by ID
    static async updateUser(req, res) {
        const { id } = req.params;
        const { first_name, last_name, email, department, phone } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.updateUserById(id, first_name, last_name, email, department, phone);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
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
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // Update - Update user status
    static async updateUserStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const allUsers = await db.getAllData();
            const user = allUsers.find(user => user.id == id);
            if (user) {
                // Here we would update the status in the database
                res.json({ success: true, message: `User status updated to ${status}` });
            } else {
                res.status(404).json({ success: false, error: 'User not found' });
            }
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // Change User Password
    static async changePassword(req, res) {
        const { id } = req.params;
        const { oldPassword, newPassword } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const allUsers = await db.getAllData();
            const user = allUsers.find(user => user.id == id);
            if (user) {
                // Here we would verify the old password and update to the new password in the database
                res.json({ success: true, message: 'Password changed successfully' });
            } else {
                res.status(404).json({ success: false, error: 'User not found' });
            }
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

}

module.exports = UserController;