const mysql = require('mysql2');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DATABASE,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10
});

pool.getConnection((err, conn) => {
    if (err) {
        console.error('❌ CONNECTION ERROR:', err.message);
    } else {
        console.log('✅ Database connected successfully!');
        conn.release();
    }
});

class DbService {
    static getDbServiceInstance() {
        return new DbService();
    }

    static getConnection() {
        return pool;
    }

    // Generic query method
    query(sql, params) {
        return new Promise((resolve, reject) => {
            pool.query(sql, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    // ==========================================
    // USER METHODS
    // ==========================================

    async getAllData() {
        try {
            const query = "SELECT * FROM users;";
            const results = await this.query(query);
            return results;
        } catch (error) {
            console.error('[DbService.getAllData]', error.message);
            throw error;
        }
    }

    async insertNewUser(first_name, last_name, email, password, role, department, phone, status = 'pending') {
        try {
            // Generate custom user ID using stored procedure
            const userIdResult = await this.query(
                'CALL generate_user_id(?, ?, ?, @user_id)',
                [first_name, last_name, role]
            );
            
            const userIdQuery = await this.query('SELECT @user_id as user_id');
            const user_id = userIdQuery[0].user_id;

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user
            const query = `
                INSERT INTO users (user_id, first_name, last_name, email, password, role, department, phone, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            `;
            await this.query(query, [user_id, first_name, last_name, email, hashedPassword, role, department, phone, status]);

            return { user_id, first_name, last_name, email, role };
        } catch (error) {
            console.error('[DbService.insertNewUser]', error.message);
            throw error;
        }
    }

    async getUsersByStatus(status) {
        try {
            const query = "SELECT * FROM users WHERE status = ?;";
            const results = await this.query(query, [status]);
            return results;
        } catch (error) {
            console.error('[DbService.getUsersByStatus]', error.message);
            throw error;
        }
    }

    async updateUserRole(id, role) {
        try {
            const query = "UPDATE users SET role = ? WHERE user_id = ?;";
            const result = await this.query(query, [role, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.updateUserRole]', error.message);
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            const query = "SELECT * FROM users WHERE email = ?;";
            const results = await this.query(query, [email]);
            return results[0];
        } catch (error) {
            console.error('[DbService.getUserByEmail]', error.message);
            throw error;
        }
    }

    async getUserById(user_id) {
        try {
            const query = "SELECT * FROM users WHERE user_id = ?;";
            const results = await this.query(query, [user_id]);
            return results[0];
        } catch (error) {
            console.error('[DbService.getUserById]', error.message);
            throw error;
        }
    }

    async updateUserById(id, first_name, last_name, email, department, phone) {
        try {
            const query = `
                UPDATE users 
                SET first_name = ?, last_name = ?, email = ?, department = ?, phone = ?
                WHERE user_id = ?;
            `;
            const result = await this.query(query, [first_name, last_name, email, department, phone, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.updateUserById]', error.message);
            throw error;
        }
    }

    async deleteUserById(id) {
        try {
            const query = "DELETE FROM users WHERE user_id = ?;";
            const result = await this.query(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.deleteUserById]', error.message);
            throw error;
        }
    }

    async updateUserStatus(id, status) {
        try {
            const query = "UPDATE users SET status = ? WHERE user_id = ?;";
            const result = await this.query(query, [status, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.updateUserStatus]', error.message);
            throw error;
        }
    }

    async updateUserPassword(id, newPassword) {
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const query = "UPDATE users SET password = ? WHERE user_id = ?;";
            const result = await this.query(query, [hashedPassword, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.updateUserPassword]', error.message);
            throw error;
        }
    }

    // ==========================================
    // PROJECT METHODS
    // ==========================================

    async insertNewProject(project_name, description, created_by, start_date, end_date, priority) {
        try {
            const query = `
                INSERT INTO projects (project_name, description, created_by, start_date, end_date, priority) 
                VALUES (?, ?, ?, ?, ?, ?);
            `;
            const result = await this.query(query, [project_name, description, created_by, start_date, end_date, priority]);
            return { project_id: result.insertId, project_name, description };
        } catch (error) {
            console.error('[DbService.insertNewProject]', error.message);
            throw error;
        }
    }

    async getAllProjects() {
        try {
            const query = "SELECT * FROM projects;";
            const results = await this.query(query);
            return results;
        } catch (error) {
            console.error('[DbService.getAllProjects]', error.message);
            throw error;
        }
    }

    async getProjectById(id) {
        try {
            const query = "SELECT * FROM projects WHERE project_id = ?;";
            const results = await this.query(query, [id]);
            return results[0];
        } catch (error) {
            console.error('[DbService.getProjectById]', error.message);
            throw error;
        }
    }

    async updateProjectById(id, project_name, description, start_date, end_date) {
        try {
            const query = `
                UPDATE projects 
                SET project_name = ?, description = ?, start_date = ?, end_date = ?
                WHERE project_id = ?;
            `;
            const result = await this.query(query, [project_name, description, start_date, end_date, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.updateProjectById]', error.message);
            throw error;
        }
    }

    async deleteProjectById(id) {
        try {
            const query = "DELETE FROM projects WHERE project_id = ?;";
            const result = await this.query(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.deleteProjectById]', error.message);
            throw error;
        }
    }

    async addProjectMember(project_id, user_id, role_in_project = 'member') {
        try {
            const query = `
                INSERT INTO project_members (project_id, user_id, role_in_project) 
                VALUES (?, ?, ?);
            `;
            const result = await this.query(query, [project_id, user_id, role_in_project]);
            return { member_id: result.insertId, project_id, user_id };
        } catch (error) {
            console.error('[DbService.addProjectMember]', error.message);
            throw error;
        }
    }

    async removeProjectMember(project_id, user_id) {
        try {
            const query = "DELETE FROM project_members WHERE project_id = ? AND user_id = ?;";
            const result = await this.query(query, [project_id, user_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.removeProjectMember]', error.message);
            throw error;
        }
    }

    async getProjectMembers(project_id) {
        try {
            const query = `
                SELECT pm.*, u.first_name, u.last_name, u.email, u.role 
                FROM project_members pm
                JOIN users u ON pm.user_id = u.user_id
                WHERE pm.project_id = ?;
            `;
            const results = await this.query(query, [project_id]);
            return results;
        } catch (error) {
            console.error('[DbService.getProjectMembers]', error.message);
            throw error;
        }
    }

    async getProjectProgress(project_id) {
        try {
            const query = `
                SELECT * FROM project_progress WHERE project_id = ?;
            `;
            const results = await this.query(query, [project_id]);
            return results[0];
        } catch (error) {
            console.error('[DbService.getProjectProgress]', error.message);
            throw error;
        }
    }

    async updateProjectStatus(project_id, status) {
        try {
            const query = "UPDATE projects SET status = ? WHERE project_id = ?;";
            const result = await this.query(query, [status, project_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.updateProjectStatus]', error.message);
            throw error;
        }
    }

    async getUserProjects(user_id) {
        try {
            const query = `
                SELECT p.* FROM projects p
                JOIN project_members pm ON p.project_id = pm.project_id
                WHERE pm.user_id = ?;
            `;
            const results = await this.query(query, [user_id]);
            return results;
        } catch (error) {
            console.error('[DbService.getUserProjects]', error.message);
            throw error;
        }
    }

    // ==========================================
    // TASK METHODS
    // ==========================================

    async insertNewTask(project_id, task_name, description, assigned_to, created_by, status, priority, due_date) {
        try {
            const query = `
                INSERT INTO tasks (project_id, task_name, description, assigned_to, created_by, status, priority, due_date) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            `;
            const result = await this.query(query, [project_id, task_name, description, assigned_to, created_by, status, priority, due_date]);
            return { task_id: result.insertId, task_name, status };
        } catch (error) {
            console.error('[DbService.insertNewTask]', error.message);
            throw error;
        }
    }

    async getAllTasks() {
        try {
            const query = "SELECT * FROM tasks;";
            const results = await this.query(query);
            return results;
        } catch (error) {
            console.error('[DbService.getAllTasks]', error.message);
            throw error;
        }
    }

    async getOverdueTasks() {
        try {
            const query = `
                SELECT *
                FROM tasks
                WHERE due_date < NOW()
                  AND status != 'done';
            `;
            const results = await this.query(query);
            return results;
        } catch (error) {
            console.error('[DbService.getOverdueTasks]', error.message);
            throw error;
        }
    }

    async getTaskById(id) {
        try {
            const query = "SELECT * FROM tasks WHERE task_id = ?;";
            const results = await this.query(query, [id]);
            return results[0];
        } catch (error) {
            console.error('[DbService.getTaskById]', error.message);
            throw error;
        }
    }

    async updateTaskById(id, task_name, description, status, priority, assigned_to, due_date) {
        try {
            const query = `
                UPDATE tasks 
                SET task_name = ?, description = ?, status = ?, priority = ?, assigned_to = ?, due_date = ?
                WHERE task_id = ?;
            `;
            const result = await this.query(query, [task_name, description, status, priority, assigned_to, due_date, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.updateTaskById]', error.message);
            throw error;
        }
    }

    async deleteTaskById(id) {
        try {
            const query = "DELETE FROM tasks WHERE task_id = ?;";
            const result = await this.query(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.deleteTaskById]', error.message);
            throw error;
        }
    }

    async updateTaskStatusById(id, status) {
        try {
            const query = "UPDATE tasks SET status = ? WHERE task_id = ?;";
            const result = await this.query(query, [status, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.updateTaskStatusById]', error.message);
            throw error;
        }
    }

    async assignTaskById(id, assigned_to) {
        try {
            const query = "UPDATE tasks SET assigned_to = ? WHERE task_id = ?;";
            const result = await this.query(query, [assigned_to, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.assignTaskById]', error.message);
            throw error;
        }
    }

    async getTaskChangeHistoryById(id) {
        try {
            const query = `
                SELECT th.*, u.first_name, u.last_name 
                FROM task_history th
                JOIN users u ON th.changed_by = u.user_id
                WHERE th.task_id = ?
                ORDER BY th.changed_at DESC;
            `;
            const results = await this.query(query, [id]);
            return results;
        } catch (error) {
            console.error('[DbService.getTaskChangeHistoryById]', error.message);
            throw error;
        }
    }

    async updateTaskPriorityById(id, priority) {
        try {
            const query = "UPDATE tasks SET priority = ? WHERE task_id = ?;";
            const result = await this.query(query, [priority, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.updateTaskPriorityById]', error.message);
            throw error;
        }
    }

    async getTasksByProjectId(project_id) {
        try {
            const query = "SELECT * FROM tasks WHERE project_id = ?;";
            const results = await this.query(query, [project_id]);
            return results;
        } catch (error) {
            console.error('[DbService.getTasksByProjectId]', error.message);
            throw error;
        }
    }

    async getTasksByUserId(user_id) {
        try {
            const query = `
                SELECT t.*, p.project_name
                FROM tasks t
                LEFT JOIN projects p ON t.project_id = p.project_id
                WHERE t.assigned_to = ?;
            `;
            const results = await this.query(query, [user_id]);
            return results;
        } catch (error) {
            console.error('[DbService.getTasksByUserId]', error.message);
            throw error;
        }
    }

    async getTasksByManagerProjects(manager_id) {
        try {
            const query = `
                SELECT t.*
                FROM tasks t
                JOIN projects p ON t.project_id = p.project_id
                WHERE p.created_by = ?;
            `;
            const results = await this.query(query, [manager_id]);
            return results;
        } catch (error) {
            console.error('[DbService.getTasksByManagerProjects]', error.message);
            throw error;
        }
    }

    // ==========================================
    // COMMENT METHODS
    // ==========================================

    async insertNewComment(task_id, user_id, comment_text) {
        try {
            const query = `
                INSERT INTO comments (task_id, user_id, comment_text) 
                VALUES (?, ?, ?);
            `;
            const result = await this.query(query, [task_id, user_id, comment_text]);
            return { comment_id: result.insertId, task_id, comment_text };
        } catch (error) {
            console.error('[DbService.insertNewComment]', error.message);
            throw error;
        }
    }

    async getCommentsByTaskId(task_id) {
        try {
            const query = `
                SELECT c.*, u.first_name, u.last_name 
                FROM comments c
                JOIN users u ON c.user_id = u.user_id
                WHERE c.task_id = ? AND c.parent_comment_id IS NULL
                ORDER BY c.created_at DESC;
            `;
            const results = await this.query(query, [task_id]);
            return results;
        } catch (error) {
            console.error('[DbService.getCommentsByTaskId]', error.message);
            throw error;
        }
    }

    async updateCommentById(id, comment_text) {
        try {
            const query = "UPDATE comments SET comment_text = ? WHERE comment_id = ?;";
            const result = await this.query(query, [comment_text, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.updateCommentById]', error.message);
            throw error;
        }
    }

    async deleteCommentById(id) {
        try {
            const query = "DELETE FROM comments WHERE comment_id = ?;";
            const result = await this.query(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.deleteCommentById]', error.message);
            throw error;
        }
    }

    async insertCommentReply(parent_comment_id, user_id, comment_text) {
        try {
            // Get task_id from parent comment
            const parentQuery = "SELECT task_id FROM comments WHERE comment_id = ?;";
            const parentResult = await this.query(parentQuery, [parent_comment_id]);
            const task_id = parentResult[0].task_id;

            const query = `
                INSERT INTO comments (task_id, user_id, comment_text, parent_comment_id) 
                VALUES (?, ?, ?, ?);
            `;
            const result = await this.query(query, [task_id, user_id, comment_text, parent_comment_id]);
            return { comment_id: result.insertId, parent_comment_id, comment_text };
        } catch (error) {
            console.error('[DbService.insertCommentReply]', error.message);
            throw error;
        }
    }

    async getRepliesByCommentId(comment_id) {
        try {
            const query = `
                SELECT c.*, u.first_name, u.last_name 
                FROM comments c
                JOIN users u ON c.user_id = u.user_id
                WHERE c.parent_comment_id = ?
                ORDER BY c.created_at ASC;
            `;
            const results = await this.query(query, [comment_id]);
            return results;
        } catch (error) {
            console.error('[DbService.getRepliesByCommentId]', error.message);
            throw error;
        }
    }

    // ==========================================
    // FILE METHODS
    // ==========================================

    async insertNewFile(task_id, uploaded_by, file_name, file_path, file_type, file_size) {
        try {
            const query = `
                INSERT INTO files (task_id, uploaded_by, file_name, file_path, file_type, file_size) 
                VALUES (?, ?, ?, ?, ?, ?);
            `;
            const result = await this.query(query, [task_id, uploaded_by, file_name, file_path, file_type, file_size]);
            return { file_id: result.insertId, file_name };
        } catch (error) {
            console.error('[DbService.insertNewFile]', error.message);
            throw error;
        }
    }

    async getFilesByTaskId(task_id) {
        try {
            const query = `
                SELECT f.*, u.first_name, u.last_name 
                FROM files f
                JOIN users u ON f.uploaded_by = u.user_id
                WHERE f.task_id = ?;
            `;
            const results = await this.query(query, [task_id]);
            return results;
        } catch (error) {
            console.error('[DbService.getFilesByTaskId]', error.message);
            throw error;
        }
    }

    async getFileById(id) {
        try {
            const query = "SELECT * FROM files WHERE file_id = ?;";
            const results = await this.query(query, [id]);
            return results[0];
        } catch (error) {
            console.error('[DbService.getFileById]', error.message);
            throw error;
        }
    }

    async deleteFileById(id) {
        try {
            const query = "DELETE FROM files WHERE file_id = ?;";
            const result = await this.query(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.deleteFileById]', error.message);
            throw error;
        }
    }

    // ==========================================
    // MESSAGE METHODS
    // ==========================================

    async insertNewConversation(conversation_type, project_id = null) {
        try {
            if (!['direct', 'project_group'].includes(conversation_type)) {
                throw new Error('Invalid conversation type');
            }

            const query = `
                INSERT INTO conversations (conversation_type, project_id) 
                VALUES (?, ?);
            `;
            const result = await this.query(query, [conversation_type, project_id]);
            return { conversation_id: result.insertId };
        } catch (error) {
            console.error('[DbService.insertNewConversation]', error.message);
            throw error;
        }
    }

    async addConversationParticipant(conversation_id, user_id) {
        try {
            const query = `
                INSERT INTO conversation_participants (conversation_id, user_id) 
                VALUES (?, ?);
            `;
            await this.query(query, [conversation_id, user_id]);
            return true;
        } catch (error) {
            console.error('[DbService.addConversationParticipant]', error.message);
            throw error;
        }
    }

    async getConversationsByUserId(user_id) {
        try {
            const query = `
                SELECT DISTINCT c.*, 
                       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.conversation_id AND m.is_read = 0) as unread_count
                FROM conversations c
                JOIN conversation_participants cp ON c.conversation_id = cp.conversation_id
                WHERE cp.user_id = ?;
            `;
            const results = await this.query(query, [user_id]);
            return results;
        } catch (error) {
            console.error('[DbService.getConversationsByUserId]', error.message);
            throw error;
        }
    }

    async getMessagesByConversationId(conversation_id) {
        try {
            const query = `
                SELECT m.*, u.first_name, u.last_name 
                FROM messages m
                JOIN users u ON m.sender_id = u.user_id
                WHERE m.conversation_id = ?
                ORDER BY m.sent_at ASC;
            `;
            const results = await this.query(query, [conversation_id]);
            return results;
        } catch (error) {
            console.error('[DbService.getMessagesByConversationId]', error.message);
            throw error;
        }
    }

    async insertNewMessage(conversation_id, sender_id, message_text) {
        try {
            const query = `
                INSERT INTO messages (conversation_id, sender_id, message_text) 
                VALUES (?, ?, ?);
            `;
            const result = await this.query(query, [conversation_id, sender_id, message_text]);
            return { message_id: result.insertId, message_text };
        } catch (error) {
            console.error('[DbService.insertNewMessage]', error.message);
            throw error;
        }
    }

    async markMessagesAsRead(conversation_id, user_id) {
        try {
            const query = `
                UPDATE messages 
                SET is_read = 1 
                WHERE conversation_id = ? AND sender_id != ?;
            `;
            const result = await this.query(query, [conversation_id, user_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.markMessagesAsRead]', error.message);
            throw error;
        }
    }

    async getUnreadMessageCount(user_id) {
        try {
            const query = `
                SELECT COUNT(*) as count
                FROM messages m
                JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
                WHERE cp.user_id = ? AND m.sender_id != ? AND m.is_read = 0;
            `;
            const results = await this.query(query, [user_id, user_id]);
            return results[0].count;
        } catch (error) {
            console.error('[DbService.getUnreadMessageCount]', error.message);
            throw error;
        }
    }

    async getProjectGroupMessages(project_id) {
        try {
            const query = `
                SELECT m.*, u.first_name, u.last_name 
                FROM messages m
                JOIN users u ON m.sender_id = u.user_id
                JOIN conversations c ON m.conversation_id = c.conversation_id
                WHERE c.project_id = ?
                ORDER BY m.sent_at ASC;
            `;
            const results = await this.query(query, [project_id]);
            return results;
        } catch (error) {
            console.error('[DbService.getProjectGroupMessages]', error.message);
            throw error;
        }
    }

    // ==========================================
    // NOTIFICATION METHODS
    // ==========================================

    async getNotificationsByUserId(user_id) {
        try {
            const query = `
                SELECT * FROM notifications 
                WHERE user_id = ?
                ORDER BY created_at DESC;
            `;
            const results = await this.query(query, [user_id]);
            return results;
        } catch (error) {
            console.error('[DbService.getNotificationsByUserId]', error.message);
            throw error;
        }
    }

    async getUnreadNotificationsByUserId(user_id) {
        try {
            const query = `
                SELECT * FROM notifications 
                WHERE user_id = ? AND is_read = 0
                ORDER BY created_at DESC;
            `;
            const results = await this.query(query, [user_id]);
            return results;
        } catch (error) {
            console.error('[DbService.getUnreadNotificationsByUserId]', error.message);
            throw error;
        }
    }

    async markNotificationAsRead(notification_id) {
        try {
            const query = "UPDATE notifications SET is_read = 1 WHERE notification_id = ?;";
            const result = await this.query(query, [notification_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.markNotificationAsRead]', error.message);
            throw error;
        }
    }

    async markAllNotificationsAsRead(user_id) {
        try {
            const query = "UPDATE notifications SET is_read = 1 WHERE user_id = ?;";
            const result = await this.query(query, [user_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.markAllNotificationsAsRead]', error.message);
            throw error;
        }
    }

    async deleteNotificationById(notification_id) {
        try {
            const query = "DELETE FROM notifications WHERE notification_id = ?;";
            const result = await this.query(query, [notification_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.deleteNotificationById]', error.message);
            throw error;
        }
    }

    async getUnreadNotificationCount(user_id) {
        try {
            const query = "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0;";
            const results = await this.query(query, [user_id]);
            return results[0].count;
        } catch (error) {
            console.error('[DbService.getUnreadNotificationCount]', error.message);
            throw error;
        }
    }

    // ==========================================
    // NEWS METHODS
    // ==========================================

    async insertNewNews(title, content, posted_by, priority, target_audience, project_id) {
        try {
            const query = `
                INSERT INTO work_news (title, content, posted_by, priority, target_audience, project_id) 
                VALUES (?, ?, ?, ?, ?, ?);
            `;
            const result = await this.query(query, [title, content, posted_by, priority, target_audience, project_id]);
            return { news_id: result.insertId, title };
        } catch (error) {
            console.error('[DbService.insertNewNews]', error.message);
            throw error;
        }
    }

    async getAllNews() {
        try {
            const query = `
                SELECT n.*, u.first_name, u.last_name 
                FROM work_news n
                JOIN users u ON n.posted_by = u.user_id
                ORDER BY n.is_pinned DESC, n.created_at DESC;
            `;
            const results = await this.query(query);
            return results;
        } catch (error) {
            console.error('[DbService.getAllNews]', error.message);
            throw error;
        }
    }

    async getNewsById(id) {
        try {
            const query = "SELECT * FROM work_news WHERE news_id = ?;";
            const results = await this.query(query, [id]);
            return results[0];
        } catch (error) {
            console.error('[DbService.getNewsById]', error.message);
            throw error;
        }
    }

    async updateNewsById(id, title, content) {
        try {
            const query = `
                UPDATE work_news 
                SET title = ?, content = ?
                WHERE news_id = ?;
            `;
            const result = await this.query(query, [title, content, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.updateNewsById]', error.message);
            throw error;
        }
    }

    async deleteNewsById(id) {
        try {
            const query = "DELETE FROM work_news WHERE news_id = ?;";
            const result = await this.query(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.deleteNewsById]', error.message);
            throw error;
        }
    }

    async getPinnedNews() {
        try {
            const query = `
                SELECT n.*, u.first_name, u.last_name 
                FROM work_news n
                JOIN users u ON n.posted_by = u.user_id
                WHERE n.is_pinned = 1
                ORDER BY n.created_at DESC;
            `;
            const results = await this.query(query);
            return results;
        } catch (error) {
            console.error('[DbService.getPinnedNews]', error.message);
            throw error;
        }
    }

    async updateNewsPinStatus(id, isPinned) {
        try {
            const query = "UPDATE work_news SET is_pinned = ? WHERE news_id = ?;";
            const result = await this.query(query, [isPinned, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.updateNewsPinStatus]', error.message);
            throw error;
        }
    }

    async createReport(reportType, parameters) {
        try {
            const { start_date, end_date, project_id = null, user_id = null } = parameters;
            const generated_by = parameters.generated_by;
            const query = `
                INSERT INTO reports (report_type, generated_by, project_id, user_id, start_date, end_date, report_data)
                VALUES (?, ?, ?, ?, ?, ?, ?);
            `;
            const result = await this.query(query, [
                reportType, generated_by, project_id, user_id,
                start_date, end_date, JSON.stringify(parameters)
            ]);
            return { report_id: result.insertId, report_type: reportType };
        } catch (error) {
            console.error('[DbService.createReport]', error.message);
            throw error;
        }
    }

    async getAllReports() {
        try {
            const query = `
                SELECT r.*, u.first_name, u.last_name
                FROM reports r
                JOIN users u ON r.generated_by = u.user_id
                ORDER BY r.generated_at DESC;
            `;
            return await this.query(query);
        } catch (error) {
            console.error('[DbService.getAllReports]', error.message);
            throw error;
        }
    }

    async getReportById(id) {
        try {
            const query = "SELECT * FROM reports WHERE report_id = ?;";
            const results = await this.query(query, [id]);
            return results[0];
        } catch (error) {
            console.error('[DbService.getReportById]', error.message);
            throw error;
        }
    }

    async deleteReportById(id) {
        try {
            const query = "DELETE FROM reports WHERE report_id = ?;";
            const result = await this.query(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[DbService.deleteReportById]', error.message);
            throw error;
        }
    }

    async getTeamPerformanceStats() {
        try {
            const query = `
                SELECT 
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    u.department,
                    COUNT(t.task_id) AS total_tasks,
                    SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completed_tasks,
                    SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
                    SUM(CASE WHEN t.due_date < CURDATE() AND t.status != 'done' THEN 1 ELSE 0 END) AS overdue_tasks,
                    ROUND(
                        (SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.task_id), 0)) * 100, 1
                    ) AS completion_rate
                FROM users u
                LEFT JOIN tasks t ON u.user_id = t.assigned_to
                WHERE u.status = 'active'
                GROUP BY u.user_id, u.first_name, u.last_name, u.department
                ORDER BY completion_rate DESC;
            `;
            return await this.query(query);
        } catch (error) {
            console.error('[DbService.getTeamPerformanceStats]', error.message);
            throw error;
        }
    }

    async getProjectStatusReport() {
        try {
            const query = `
                SELECT 
                p.project_id,
                p.project_name,
                p.status,
                p.priority,
                p.start_date,
                p.end_date,
                COUNT(t.task_id) AS total_tasks,
                SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completed_tasks,
                ROUND(
                    (SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.task_id), 0)) * 100, 1
                ) AS completion_percentage,
                COUNT(DISTINCT pm.user_id) AS team_size
            FROM projects p
            LEFT JOIN tasks t ON p.project_id = t.project_id
            LEFT JOIN project_members pm ON p.project_id = pm.project_id
            GROUP BY p.project_id, p.project_name, p.status, p.priority, p.start_date, p.end_date
            ORDER BY p.status, completion_percentage DESC;
            `;
            return await this.query(query);
        } catch (error) {
            console.error('[DbService.getProjectStatusReport]', error.message);
            throw error;
        }
    }

    async getUserProductivityStats(user_id) {
        try {
            const query = `
                SELECT 
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    COUNT(t.task_id) AS total_tasks,
                    SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completed_tasks,
                    SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
                    SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) AS todo_tasks,
                    SUM(CASE WHEN t.due_date < CURDATE() AND t.status != 'done' THEN 1 ELSE 0 END) AS overdue_tasks,
                    ROUND(SUM(COALESCE(t.actual_hours, 0)), 1) AS total_hours_logged,
                    ROUND(
                        (SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.task_id), 0)) * 100, 1
                    ) AS completion_rate
                FROM users u
                LEFT JOIN tasks t ON u.user_id = t.assigned_to
                WHERE u.user_id = ?
                GROUP BY u.user_id, u.first_name, u.last_name;
            `;
            const results = await this.query(query, [user_id]);
            return results[0];
        } catch (error) {
            console.error('[DbService.getUserProductivityStats]', error.message);
            throw error;
        }
    }

    async getTaskCompletionStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) AS total_tasks,
                    SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS completed_tasks,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
                    SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) AS todo_tasks,
                    SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) AS in_review_tasks,
                    SUM(CASE WHEN due_date < CURDATE() AND status != 'done' THEN 1 ELSE 0 END) AS overdue_tasks,
                    SUM(CASE WHEN priority = 'critical' AND status != 'done' THEN 1 ELSE 0 END) AS critical_open_tasks,
                    ROUND(
                        (SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 1
                    ) AS overall_completion_rate
                FROM tasks;
            `;
            const results = await this.query(query);
            return results[0];
        } catch (error) {
            console.error('[DbService.getTaskCompletionStats]', error.message);
            throw error;
        }
    }


}

module.exports = DbService;