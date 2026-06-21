const mysql  = require('mysql2');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

const pool = mysql.createPool({
    host:             process.env.DB_HOST,
    user:             process.env.DB_USER,
    password:         process.env.DB_PASS,
    database:         process.env.DATABASE,
    port:             process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit:  10
});

pool.getConnection((err, conn) => {
    if (err) console.log('❌ CONNECTION ERROR:', err.message);
    else     { console.log('✅ Database connected successfully!'); conn.release(); }
});

class DbService {
    static getDbServiceInstance() { return new DbService(); }
    static getConnection()        { return pool; }

    query(sql, params) {
        return new Promise((resolve, reject) => {
            pool.query(sql, params, (err, results) => {
                if (err) reject(err);
                else     resolve(results);
            });
        });
    }

    // ==========================================
    // USER METHODS
    // ==========================================

    async getAllData() {
        return this.query('SELECT * FROM users;');
    }

    async insertNewUser(first_name, last_name, email, password, role, department, phone) {
        await this.query('CALL generate_user_id(?, ?, ?, @user_id)', [first_name, last_name, role]);
        const userIdQuery = await this.query('SELECT @user_id as user_id');
        const user_id     = userIdQuery[0].user_id;
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.query(
            'INSERT INTO users (user_id, first_name, last_name, email, password, role, department, phone) VALUES (?,?,?,?,?,?,?,?)',
            [user_id, first_name, last_name, email, hashedPassword, role, department, phone]
        );
        return { user_id, first_name, last_name, email, role };
    }

    async getUserByEmail(email) {
        const r = await this.query('SELECT * FROM users WHERE email = ?', [email]);
        return r[0];
    }

    async getUserById(user_id) {
        const r = await this.query('SELECT * FROM users WHERE user_id = ?', [user_id]);
        return r[0];
    }

    async updateUserById(id, first_name, last_name, email, department, phone) {
        const r = await this.query(
            'UPDATE users SET first_name=?, last_name=?, email=?, department=?, phone=? WHERE user_id=?',
            [first_name, last_name, email, department, phone, id]
        );
        return r.affectedRows > 0;
    }

    async deleteUserById(id) {
        const r = await this.query('DELETE FROM users WHERE user_id = ?', [id]);
        return r.affectedRows > 0;
    }

    async updateUserStatus(id, status) {
        const r = await this.query('UPDATE users SET status = ? WHERE user_id = ?', [status, id]);
        return r.affectedRows > 0;
    }

    async updateUserPassword(id, newPassword) {
        const hashed = await bcrypt.hash(newPassword, 10);
        const r      = await this.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, id]);
        return r.affectedRows > 0;
    }

    // ==========================================
    // PROJECT METHODS
    // ==========================================

    async insertNewProject(project_name, description, created_by, start_date, end_date, priority) {
        const r = await this.query(
            'INSERT INTO projects (project_name, description, created_by, start_date, end_date, priority) VALUES (?,?,?,?,?,?)',
            [project_name, description, created_by, start_date, end_date, priority]
        );
        return { project_id: r.insertId, project_name, description };
    }

    async getAllProjects() {
        return this.query('SELECT * FROM projects');
    }

    async getProjectById(id) {
        const r = await this.query('SELECT * FROM projects WHERE project_id = ?', [id]);
        return r[0];
    }

    async updateProjectById(id, project_name, description, start_date, end_date) {
        const r = await this.query(
            'UPDATE projects SET project_name=?, description=?, start_date=?, end_date=? WHERE project_id=?',
            [project_name, description, start_date, end_date, id]
        );
        return r.affectedRows > 0;
    }

    async deleteProjectById(id) {
        const r = await this.query('DELETE FROM projects WHERE project_id = ?', [id]);
        return r.affectedRows > 0;
    }

    async addProjectMember(project_id, user_id, role_in_project = 'member') {
        const r = await this.query(
            'INSERT INTO project_members (project_id, user_id, role_in_project) VALUES (?,?,?)',
            [project_id, user_id, role_in_project]
        );
        return { member_id: r.insertId, project_id, user_id };
    }

    async removeProjectMember(project_id, user_id) {
        const r = await this.query(
            'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
            [project_id, user_id]
        );
        return r.affectedRows > 0;
    }

    async getProjectMembers(project_id) {
        return this.query(
            `SELECT pm.*, u.first_name, u.last_name, u.email, u.role
             FROM project_members pm
             JOIN users u ON pm.user_id = u.user_id
             WHERE pm.project_id = ?`,
            [project_id]
        );
    }

    async getProjectProgress(project_id) {
        const r = await this.query('SELECT * FROM project_progress WHERE project_id = ?', [project_id]);
        return r[0];
    }

    async updateProjectStatus(project_id, status) {
        const r = await this.query('UPDATE projects SET status = ? WHERE project_id = ?', [status, project_id]);
        return r.affectedRows > 0;
    }

    async getUserProjects(user_id) {
        return this.query(
            `SELECT p.* FROM projects p
             JOIN project_members pm ON p.project_id = pm.project_id
             WHERE pm.user_id = ?`,
            [user_id]
        );
    }

    // ==========================================
    // TASK METHODS
    // ==========================================

    async insertNewTask(project_id, task_name, description, assigned_to, created_by, status, priority, due_date) {
        const r = await this.query(
            'INSERT INTO tasks (project_id, task_name, description, assigned_to, created_by, status, priority, due_date) VALUES (?,?,?,?,?,?,?,?)',
            [project_id, task_name, description, assigned_to, created_by, status, priority, due_date]
        );
        return { task_id: r.insertId, task_name, status };
    }

    async getAllTasks() {
        return this.query('SELECT * FROM tasks');
    }

    async getOverdueTasks() {
        return this.query(`SELECT * FROM tasks WHERE due_date < NOW() AND status != 'done'`);
    }

    async getTaskById(id) {
        const r = await this.query('SELECT * FROM tasks WHERE task_id = ?', [id]);
        return r[0];
    }

    async updateTaskById(id, task_name, description, status, priority, assigned_to, due_date) {
        const r = await this.query(
            'UPDATE tasks SET task_name=?, description=?, status=?, priority=?, assigned_to=?, due_date=? WHERE task_id=?',
            [task_name, description, status, priority, assigned_to, due_date, id]
        );
        return r.affectedRows > 0;
    }

    async deleteTaskById(id) {
        const r = await this.query('DELETE FROM tasks WHERE task_id = ?', [id]);
        return r.affectedRows > 0;
    }

    async updateTaskStatusById(id, status) {
        const r = await this.query('UPDATE tasks SET status = ? WHERE task_id = ?', [status, id]);
        return r.affectedRows > 0;
    }

    async assignTaskById(id, assigned_to) {
        const r = await this.query('UPDATE tasks SET assigned_to = ? WHERE task_id = ?', [assigned_to, id]);
        return r.affectedRows > 0;
    }

    async getTaskChangeHistoryById(id) {
        return this.query(
            `SELECT th.*, u.first_name, u.last_name
             FROM task_history th
             JOIN users u ON th.changed_by = u.user_id
             WHERE th.task_id = ?
             ORDER BY th.changed_at DESC`,
            [id]
        );
    }

    async updateTaskPriorityById(id, priority) {
        const r = await this.query('UPDATE tasks SET priority = ? WHERE task_id = ?', [priority, id]);
        return r.affectedRows > 0;
    }

    async getTasksByProjectId(project_id) {
        return this.query('SELECT * FROM tasks WHERE project_id = ?', [project_id]);
    }

    async getTasksByUserId(user_id) {
        return this.query('SELECT * FROM tasks WHERE assigned_to = ?', [user_id]);
    }

    // ==========================================
    // COMMENT METHODS
    // ==========================================

    async insertNewComment(task_id, user_id, comment_text) {
        const r = await this.query(
            'INSERT INTO comments (task_id, user_id, comment_text) VALUES (?,?,?)',
            [task_id, user_id, comment_text]
        );
        return { comment_id: r.insertId, task_id, comment_text };
    }

    async getCommentsByTaskId(task_id) {
        return this.query(
            `SELECT c.*, u.first_name, u.last_name
             FROM comments c
             JOIN users u ON c.user_id = u.user_id
             WHERE c.task_id = ? AND c.parent_comment_id IS NULL
             ORDER BY c.created_at DESC`,
            [task_id]
        );
    }

    async updateCommentById(id, comment_text) {
        const r = await this.query('UPDATE comments SET comment_text = ? WHERE comment_id = ?', [comment_text, id]);
        return r.affectedRows > 0;
    }

    async deleteCommentById(id) {
        const r = await this.query('DELETE FROM comments WHERE comment_id = ?', [id]);
        return r.affectedRows > 0;
    }

    async insertCommentReply(parent_comment_id, user_id, comment_text) {
        const parent = await this.query('SELECT task_id FROM comments WHERE comment_id = ?', [parent_comment_id]);
        const task_id = parent[0].task_id;
        const r = await this.query(
            'INSERT INTO comments (task_id, user_id, comment_text, parent_comment_id) VALUES (?,?,?,?)',
            [task_id, user_id, comment_text, parent_comment_id]
        );
        return { comment_id: r.insertId, parent_comment_id, comment_text };
    }

    async getRepliesByCommentId(comment_id) {
        return this.query(
            `SELECT c.*, u.first_name, u.last_name
             FROM comments c
             JOIN users u ON c.user_id = u.user_id
             WHERE c.parent_comment_id = ?
             ORDER BY c.created_at ASC`,
            [comment_id]
        );
    }

    // ==========================================
    // FILE METHODS
    // ==========================================

    async insertNewFile(task_id, uploaded_by, file_name, file_path, file_type, file_size) {
        const r = await this.query(
            'INSERT INTO files (task_id, uploaded_by, file_name, file_path, file_type, file_size) VALUES (?,?,?,?,?,?)',
            [task_id, uploaded_by, file_name, file_path, file_type, file_size]
        );
        return { file_id: r.insertId, file_name };
    }

    async getFilesByTaskId(task_id) {
        return this.query(
            `SELECT f.*, u.first_name, u.last_name
             FROM files f
             JOIN users u ON f.uploaded_by = u.user_id
             WHERE f.task_id = ?`,
            [task_id]
        );
    }

    async getFileById(id) {
        const r = await this.query('SELECT * FROM files WHERE file_id = ?', [id]);
        return r[0];
    }

    async deleteFileById(id) {
        const r = await this.query('DELETE FROM files WHERE file_id = ?', [id]);
        return r.affectedRows > 0;
    }

    // ==========================================
    // MESSAGE METHODS
    // ==========================================

    async insertNewConversation(conversation_type, project_id = null, conversation_name = null) {
        if (!['direct', 'project_group'].includes(conversation_type)) {
            throw new Error('Invalid conversation type');
        }
        const r = await this.query(
            'INSERT INTO conversations (conversation_type, project_id, conversation_name) VALUES (?,?,?)',
            [conversation_type, project_id, conversation_name]
        );
        return { conversation_id: r.insertId };
    }

    async addConversationParticipant(conversation_id, user_id) {
        await this.query(
            'INSERT IGNORE INTO conversation_participants (conversation_id, user_id) VALUES (?,?)',
            [conversation_id, user_id]
        );
        return true;
    }

    // Returns conversations enriched with participant names and project name
    async getConversationsByUserId(user_id) {
        return this.query(
            `SELECT c.*,
                (SELECT COUNT(*) FROM messages m
                 WHERE m.conversation_id = c.conversation_id
                   AND m.sender_id != ?
                   AND m.is_read = 0) AS unread_count,
                p.project_name,
                GROUP_CONCAT(
                    DISTINCT CONCAT(u.first_name, ' ', u.last_name)
                    ORDER BY u.user_id SEPARATOR ', '
                ) AS participant_names
             FROM conversations c
             JOIN conversation_participants cp  ON c.conversation_id = cp.conversation_id
             LEFT JOIN conversation_participants cp2 ON c.conversation_id = cp2.conversation_id
                                                    AND cp2.user_id != ?
             LEFT JOIN users u ON cp2.user_id = u.user_id
             LEFT JOIN projects p ON c.project_id = p.project_id
             WHERE cp.user_id = ?
             GROUP BY c.conversation_id
             ORDER BY c.created_at DESC`,
            [user_id, user_id, user_id]
        );
    }

    async getMessagesByConversationId(conversation_id) {
        return this.query(
            `SELECT m.*, u.first_name, u.last_name
             FROM messages m
             JOIN users u ON m.sender_id = u.user_id
             WHERE m.conversation_id = ?
             ORDER BY m.sent_at ASC`,
            [conversation_id]
        );
    }

    async insertNewMessage(conversation_id, sender_id, message_text) {
        const r = await this.query(
            'INSERT INTO messages (conversation_id, sender_id, message_text) VALUES (?,?,?)',
            [conversation_id, sender_id, message_text]
        );
        return { message_id: r.insertId, message_text };
    }

    async markMessagesAsRead(conversation_id, user_id) {
        const r = await this.query(
            'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?',
            [conversation_id, user_id]
        );
        return r.affectedRows > 0;
    }

    async getUnreadMessageCount(user_id) {
        const r = await this.query(
            `SELECT COUNT(*) AS count
             FROM messages m
             JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
             WHERE cp.user_id = ? AND m.sender_id != ? AND m.is_read = 0`,
            [user_id, user_id]
        );
        return r[0].count;
    }

    async getProjectGroupMessages(project_id) {
        return this.query(
            `SELECT m.*, u.first_name, u.last_name
             FROM messages m
             JOIN users u ON m.sender_id = u.user_id
             JOIN conversations c ON m.conversation_id = c.conversation_id
             WHERE c.project_id = ?
             ORDER BY m.sent_at ASC`,
            [project_id]
        );
    }

    // ==========================================
    // NOTIFICATION METHODS
    // ==========================================

    async getNotificationsByUserId(user_id) {
        return this.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [user_id]
        );
    }

    async getUnreadNotificationsByUserId(user_id) {
        return this.query(
            'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC',
            [user_id]
        );
    }

    async markNotificationAsRead(notification_id) {
        const r = await this.query('UPDATE notifications SET is_read = 1 WHERE notification_id = ?', [notification_id]);
        return r.affectedRows > 0;
    }

    async markAllNotificationsAsRead(user_id) {
        const r = await this.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [user_id]);
        return r.affectedRows > 0;
    }

    async deleteNotificationById(notification_id) {
        const r = await this.query('DELETE FROM notifications WHERE notification_id = ?', [notification_id]);
        return r.affectedRows > 0;
    }

    async getUnreadNotificationCount(user_id) {
        const r = await this.query(
            'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
            [user_id]
        );
        return r[0].count;
    }

    // ==========================================
    // NEWS METHODS
    // ==========================================

    async insertNewNews(title, content, posted_by, priority, target_audience, project_id) {
        const r = await this.query(
            'INSERT INTO work_news (title, content, posted_by, priority, target_audience, project_id) VALUES (?,?,?,?,?,?)',
            [title, content, posted_by, priority, target_audience, project_id]
        );
        return { news_id: r.insertId, title };
    }

    async getAllNews() {
        return this.query(
            `SELECT n.*, u.first_name, u.last_name
             FROM work_news n
             JOIN users u ON n.posted_by = u.user_id
             ORDER BY n.is_pinned DESC, n.created_at DESC`
        );
    }

    async getNewsById(id) {
        const r = await this.query('SELECT * FROM work_news WHERE news_id = ?', [id]);
        return r[0];
    }

    async updateNewsById(id, title, content) {
        const r = await this.query(
            'UPDATE work_news SET title = ?, content = ? WHERE news_id = ?',
            [title, content, id]
        );
        return r.affectedRows > 0;
    }

    async deleteNewsById(id) {
        const r = await this.query('DELETE FROM work_news WHERE news_id = ?', [id]);
        return r.affectedRows > 0;
    }

    async getPinnedNews() {
        return this.query(
            `SELECT n.*, u.first_name, u.last_name
             FROM work_news n
             JOIN users u ON n.posted_by = u.user_id
             WHERE n.is_pinned = 1
             ORDER BY n.created_at DESC`
        );
    }

    async updateNewsPinStatus(id, isPinned) {
        const r = await this.query('UPDATE work_news SET is_pinned = ? WHERE news_id = ?', [isPinned ? 1 : 0, id]);
        return r.affectedRows > 0;
    }

    // ==========================================
    // REPORT METHODS  (NEW)
    // ==========================================

    async createReport(report_type, generated_by, start_date, end_date, project_id = null, user_id = null) {
        const r = await this.query(
            `INSERT INTO reports (report_type, generated_by, project_id, user_id, start_date, end_date)
             VALUES (?,?,?,?,?,?)`,
            [report_type, generated_by, project_id, user_id, start_date, end_date]
        );
        return { report_id: r.insertId, report_type };
    }

    async getAllReports() {
        return this.query(
            `SELECT r.*, u.first_name, u.last_name
             FROM reports r
             JOIN users u ON r.generated_by = u.user_id
             ORDER BY r.generated_at DESC`
        );
    }

    async getReportById(id) {
        const r = await this.query('SELECT * FROM reports WHERE report_id = ?', [id]);
        return r[0];
    }

    async deleteReportById(id) {
        const r = await this.query('DELETE FROM reports WHERE report_id = ?', [id]);
        return r.affectedRows > 0;
    }

    // Team Performance: one row per employee with task counts
    async getTeamPerformanceStats() {
        return this.query(
            `SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.department,
                COUNT(t.task_id)                                                         AS total_tasks,
                SUM(CASE WHEN t.status = 'done'        THEN 1 ELSE 0 END)               AS completed_tasks,
                SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END)               AS in_progress_tasks,
                SUM(CASE WHEN t.due_date < NOW() AND t.status != 'done' THEN 1 ELSE 0 END) AS overdue_tasks
             FROM users u
             LEFT JOIN tasks t ON u.user_id = t.assigned_to
             WHERE u.role = 'employee'
             GROUP BY u.user_id, u.first_name, u.last_name, u.department
             ORDER BY completed_tasks DESC`
        );
    }

    // Project Status: count per status + total
    async getProjectStatusReport() {
        const rows  = await this.query(
            `SELECT status, COUNT(*) AS cnt FROM projects GROUP BY status`
        );
        const total = await this.query('SELECT COUNT(*) AS total FROM projects');
        const totalCount = total[0].total;

        const result = { total: totalCount };
        const statuses = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
        statuses.forEach(s => { result[s] = 0; result[`${s}_percent`] = 0; });

        rows.forEach(row => {
            result[row.status]                   = row.cnt;
            result[`${row.status}_percent`]       = totalCount > 0
                ? Math.round((row.cnt / totalCount) * 100)
                : 0;
        });
        return result;
    }

    // Task Completion: aggregate totals
    async getTaskCompletionStats() {
        const r = await this.query(
            `SELECT
                COUNT(*)                                                                     AS total_tasks,
                SUM(CASE WHEN status = 'done'        THEN 1 ELSE 0 END)                     AS completed_tasks,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)                     AS in_progress,
                SUM(CASE WHEN status = 'in_review'   THEN 1 ELSE 0 END)                     AS in_review,
                SUM(CASE WHEN due_date < NOW() AND status != 'done' THEN 1 ELSE 0 END)      AS overdue
             FROM tasks`
        );
        return r[0];
    }

    // Individual Productivity: stats for one user
    async getUserProductivityStats(user_id) {
        const r = await this.query(
            `SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.department,
                COUNT(t.task_id)                                          AS total_tasks,
                SUM(CASE WHEN t.status = 'done'        THEN 1 ELSE 0 END) AS completed_tasks,
                SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
                COALESCE(ROUND(SUM(t.actual_hours), 1), 0)                AS total_hours
             FROM users u
             LEFT JOIN tasks t ON u.user_id = t.assigned_to
             WHERE u.user_id = ?
             GROUP BY u.user_id, u.first_name, u.last_name, u.department`,
            [user_id]
        );
        return r[0];
    }
}

module.exports = DbService;