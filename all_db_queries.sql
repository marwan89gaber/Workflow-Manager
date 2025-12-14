-- ============================================
-- TASK MANAGER DATABASE - COMPLETE SCHEMA
-- ============================================

-- Create database
DROP DATABASE IF EXISTS task_manager_db;
CREATE DATABASE task_manager_db;
USE task_manager_db;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    user_id VARCHAR(10) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('employee', 'manager', 'admin') NOT NULL DEFAULT 'employee',
    phone VARCHAR(20),
    department VARCHAR(50),
    profile_picture VARCHAR(255),
    status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 2. PROJECTS TABLE
-- ============================================
CREATE TABLE projects (
    project_id INT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by VARCHAR(10) NOT NULL,
    start_date DATE,
    end_date DATE,
    status ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled') DEFAULT 'planning',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    budget DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_status (status),
    INDEX idx_created_by (created_by),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 3. PROJECT_MEMBERS TABLE (Junction Table)
-- ============================================
CREATE TABLE project_members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id VARCHAR(10) NOT NULL,
    role_in_project ENUM('owner', 'lead', 'member', 'viewer') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_member (project_id, user_id),
    INDEX idx_project (project_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 4. TASKS TABLE
-- ============================================
CREATE TABLE tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    task_name VARCHAR(150) NOT NULL,
    description TEXT,
    assigned_to VARCHAR(10),
    created_by VARCHAR(10) NOT NULL,
    status ENUM('todo', 'in_progress', 'in_review', 'done') DEFAULT 'todo',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    start_date DATE,
    due_date DATE,
    completed_at TIMESTAMP NULL,
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_assigned_status (assigned_to, status),
    INDEX idx_project_status (project_id, status),
    INDEX idx_due_date (due_date),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 5. COMMENTS TABLE
-- ============================================
CREATE TABLE comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    user_id VARCHAR(10) NOT NULL,
    comment_text TEXT NOT NULL,
    parent_comment_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(comment_id) ON DELETE CASCADE,
    INDEX idx_task (task_id, created_at),
    INDEX idx_user (user_id),
    INDEX idx_parent (parent_comment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 6. FILES TABLE
-- ============================================
CREATE TABLE files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    uploaded_by VARCHAR(10) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_task (task_id),
    INDEX idx_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 7. CONVERSATIONS TABLE
-- ============================================
CREATE TABLE conversations (
    conversation_id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_type ENUM('direct', 'project_group') NOT NULL,
    project_id INT NULL,
    conversation_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    INDEX idx_type (conversation_type),
    INDEX idx_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 8. CONVERSATION_PARTICIPANTS TABLE
-- ============================================
CREATE TABLE conversation_participants (
    participant_id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    user_id VARCHAR(10) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_conversation_participant (conversation_id, user_id),
    INDEX idx_conversation (conversation_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 9. MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id VARCHAR(10) NOT NULL,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_conversation_time (conversation_id, sent_at),
    INDEX idx_sender (sender_id),
    INDEX idx_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 10. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(10) NOT NULL,
    notification_type ENUM('task_assigned', 'task_overdue', 'comment_added', 'project_update', 'message_received') NOT NULL,
    related_id INT NOT NULL,
    related_type ENUM('task', 'project', 'comment', 'message') NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 11. WORK_NEWS TABLE
-- ============================================
CREATE TABLE work_news (
    news_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    posted_by VARCHAR(10) NOT NULL,
    priority ENUM('normal', 'important', 'urgent') DEFAULT 'normal',
    target_audience ENUM('all', 'managers', 'employees', 'specific_project') DEFAULT 'all',
    project_id INT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (posted_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    INDEX idx_posted_by (posted_by),
    INDEX idx_pinned (is_pinned),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 12. REPORTS TABLE
-- ============================================
CREATE TABLE reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    report_type ENUM('team_performance', 'project_status', 'individual_productivity', 'task_completion') NOT NULL,
    generated_by VARCHAR(10) NOT NULL,
    project_id INT NULL,
    user_id VARCHAR(10) NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    report_data JSON,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_generated_by (generated_by),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_type (report_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 13. TASK_HISTORY TABLE (Audit Trail)
-- ============================================
CREATE TABLE task_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    changed_by VARCHAR(10) NOT NULL,
    field_changed VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_task (task_id, changed_at),
    INDEX idx_changed_by (changed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- STORED PROCEDURE: Generate Custom User ID
-- ============================================
DELIMITER //

CREATE PROCEDURE generate_user_id(
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_role ENUM('employee', 'manager', 'admin'),
    OUT p_user_id VARCHAR(10)
)
BEGIN
    DECLARE role_prefix CHAR(1);
    DECLARE first_initial CHAR(1);
    DECLARE last_initial CHAR(1);
    DECLARE counter INT;
    DECLARE new_id VARCHAR(10);
    
    -- Get role prefix
    SET role_prefix = CASE p_role
        WHEN 'employee' THEN 'e'
        WHEN 'manager' THEN 'm'
        WHEN 'admin' THEN 'a'
    END;
    
    -- Get first initials (lowercase)
    SET first_initial = LOWER(SUBSTRING(p_first_name, 1, 1));
    SET last_initial = LOWER(SUBSTRING(p_last_name, 1, 1));
    
    -- Find the next available counter
    SET counter = 1;
    SET new_id = CONCAT(role_prefix, first_initial, last_initial, LPAD(counter, 3, '0'));
    
    -- Loop until we find an unused ID
    WHILE EXISTS(SELECT 1 FROM users WHERE user_id = new_id) DO
        SET counter = counter + 1;
        SET new_id = CONCAT(role_prefix, first_initial, last_initial, LPAD(counter, 3, '0'));
    END WHILE;
    
    SET p_user_id = new_id;
END //

DELIMITER ;

-- ============================================
-- TRIGGER: Auto-create project group chat
-- ============================================
DELIMITER //

CREATE TRIGGER after_project_insert
AFTER INSERT ON projects
FOR EACH ROW
BEGIN
    -- Create a project group conversation
    INSERT INTO conversations (conversation_type, project_id, conversation_name)
    VALUES ('project_group', NEW.project_id, CONCAT(NEW.project_name, ' Group Chat'));
    
    -- Add the project creator to the conversation
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (LAST_INSERT_ID(), NEW.created_by);
END //

DELIMITER ;

-- ============================================
-- TRIGGER: Auto-add project members to group chat
-- ============================================
DELIMITER //

CREATE TRIGGER after_project_member_insert
AFTER INSERT ON project_members
FOR EACH ROW
BEGIN
    DECLARE conv_id INT;
    
    -- Get the conversation ID for this project
    SELECT conversation_id INTO conv_id
    FROM conversations
    WHERE project_id = NEW.project_id AND conversation_type = 'project_group'
    LIMIT 1;
    
    -- Add the new member to the project group chat
    IF conv_id IS NOT NULL THEN
        INSERT IGNORE INTO conversation_participants (conversation_id, user_id)
        VALUES (conv_id, NEW.user_id);
    END IF;
END //

DELIMITER ;

-- ============================================
-- TRIGGER: Create notification on task assignment
-- ============================================
DELIMITER //

CREATE TRIGGER after_task_insert
AFTER INSERT ON tasks
FOR EACH ROW
BEGIN
    -- Notify the assigned user
    IF NEW.assigned_to IS NOT NULL THEN
        INSERT INTO notifications (user_id, notification_type, related_id, related_type, message)
        VALUES (
            NEW.assigned_to,
            'task_assigned',
            NEW.task_id,
            'task',
            CONCAT('You have been assigned to task: ', NEW.task_name)
        );
    END IF;
END //

DELIMITER ;

-- ============================================
-- TRIGGER: Track task changes in history
-- ============================================
DELIMITER //

CREATE TRIGGER after_task_update
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
    -- Track status changes
    IF OLD.status != NEW.status THEN
        INSERT INTO task_history (task_id, changed_by, field_changed, old_value, new_value)
        VALUES (NEW.task_id, NEW.assigned_to, 'status', OLD.status, NEW.status);
    END IF;
    
    -- Track assignment changes
    IF OLD.assigned_to != NEW.assigned_to THEN
        INSERT INTO task_history (task_id, changed_by, field_changed, old_value, new_value)
        VALUES (NEW.task_id, NEW.assigned_to, 'assigned_to', OLD.assigned_to, NEW.assigned_to);
        
        -- Create notification for new assignee
        IF NEW.assigned_to IS NOT NULL THEN
            INSERT INTO notifications (user_id, notification_type, related_id, related_type, message)
            VALUES (
                NEW.assigned_to,
                'task_assigned',
                NEW.task_id,
                'task',
                CONCAT('You have been assigned to task: ', NEW.task_name)
            );
        END IF;
    END IF;
    
    -- Track priority changes
    IF OLD.priority != NEW.priority THEN
        INSERT INTO task_history (task_id, changed_by, field_changed, old_value, new_value)
        VALUES (NEW.task_id, NEW.assigned_to, 'priority', OLD.priority, NEW.priority);
    END IF;
END //

DELIMITER ;

-- ============================================
-- TRIGGER: Notify on new comment
-- ============================================
DELIMITER //

CREATE TRIGGER after_comment_insert
AFTER INSERT ON comments
FOR EACH ROW
BEGIN
    DECLARE task_assignee VARCHAR(10);
    
    -- Get the task assignee
    SELECT assigned_to INTO task_assignee
    FROM tasks
    WHERE task_id = NEW.task_id;
    
    -- Notify the assignee if they didn't write the comment
    IF task_assignee IS NOT NULL AND task_assignee != NEW.user_id THEN
        INSERT INTO notifications (user_id, notification_type, related_id, related_type, message)
        VALUES (
            task_assignee,
            'comment_added',
            NEW.comment_id,
            'comment',
            CONCAT('New comment added on your task')
        );
    END IF;
END //

DELIMITER ;

-- ============================================
-- VIEW: Dashboard Statistics
-- ============================================
CREATE VIEW dashboard_stats AS
SELECT 
    u.user_id,
    u.first_name,
    u.last_name,
    COUNT(DISTINCT t.task_id) as total_tasks,
    SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo_tasks,
    SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as inprogress_tasks,
    SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
    SUM(CASE WHEN t.due_date < CURDATE() AND t.status != 'done' THEN 1 ELSE 0 END) as overdue_tasks,
    COUNT(DISTINCT pm.project_id) as active_projects
FROM users u
LEFT JOIN tasks t ON u.user_id = t.assigned_to
LEFT JOIN project_members pm ON u.user_id = pm.user_id
GROUP BY u.user_id, u.first_name, u.last_name;

-- ============================================
-- VIEW: Project Progress
-- ============================================
CREATE VIEW project_progress AS
SELECT 
    p.project_id,
    p.project_name,
    p.status,
    COUNT(t.task_id) as total_tasks,
    SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
    ROUND((SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) / COUNT(t.task_id)) * 100, 2) as completion_percentage,
    COUNT(DISTINCT pm.user_id) as team_size
FROM projects p
LEFT JOIN tasks t ON p.project_id = t.project_id
LEFT JOIN project_members pm ON p.project_id = pm.project_id
GROUP BY p.project_id, p.project_name, p.status;

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert sample users using the stored procedure
CALL generate_user_id('John', 'Doe', 'admin', @user_id1);
INSERT INTO users (user_id, first_name, last_name, email, password, role, department)
VALUES (@user_id1, 'John', 'Doe', 'john.doe@company.com', '$2b$10$hashedpassword', 'admin', 'IT');

CALL generate_user_id('Alice', 'Smith', 'manager', @user_id2);
INSERT INTO users (user_id, first_name, last_name, email, password, role, department)
VALUES (@user_id2, 'Alice', 'Smith', 'alice.smith@company.com', '$2b$10$hashedpassword', 'manager', 'Development');

CALL generate_user_id('Bob', 'Johnson', 'employee', @user_id3);
INSERT INTO users (user_id, first_name, last_name, email, password, role, department)
VALUES (@user_id3, 'Bob', 'Johnson', 'bob.johnson@company.com', '$2b$10$hashedpassword', 'employee', 'Development');

CALL generate_user_id('Emma', 'Wilson', 'employee', @user_id4);
INSERT INTO users (user_id, first_name, last_name, email, password, role, department)
VALUES (@user_id4, 'Emma', 'Wilson', 'emma.wilson@company.com', '$2b$10$hashedpassword', 'employee', 'Design');

-- Insert sample project
INSERT INTO projects (project_name, description, created_by, start_date, end_date, status, priority)
VALUES ('Website Redesign', 'Complete redesign of company website', @user_id2, '2024-01-01', '2024-06-30', 'active', 'high');

-- Add team members to project (triggers will auto-create group chat)
INSERT INTO project_members (project_id, user_id, role_in_project)
VALUES 
    (1, @user_id2, 'owner'),
    (1, @user_id3, 'member'),
    (1, @user_id4, 'member');

-- Insert sample tasks
INSERT INTO tasks (project_id, task_name, description, assigned_to, created_by, status, priority, due_date)
VALUES 
    (1, 'Design Homepage', 'Create mockups for new homepage', @user_id4, @user_id2, 'in_progress', 'high', '2024-02-15'),
    (1, 'Setup Database', 'Configure MySQL database', @user_id3, @user_id2, 'done', 'critical', '2024-01-20'),
    (1, 'Implement API', 'Build REST API endpoints', @user_id3, @user_id2, 'todo', 'high', '2024-03-01');

-- ============================================
-- USEFUL QUERIES FOR TESTING
-- ============================================

-- View all users with their IDs
-- SELECT user_id, first_name, last_name, role, email FROM users;

-- View dashboard statistics
-- SELECT * FROM dashboard_stats;

-- View project progress
-- SELECT * FROM project_progress;

-- Get user's unread notifications
-- SELECT * FROM notifications WHERE user_id = 'ejd001' AND is_read = FALSE ORDER BY created_at DESC;

-- Get all messages in a conversation
-- SELECT m.*, u.first_name, u.last_name 
-- FROM messages m 
-- JOIN users u ON m.sender_id = u.user_id 
-- WHERE conversation_id = 1 
-- ORDER BY sent_at;

-- Get overdue tasks
-- SELECT t.*, u.first_name, u.last_name 
-- FROM tasks t 
-- JOIN users u ON t.assigned_to = u.user_id 
-- WHERE t.due_date < CURDATE() AND t.status != 'done';

-- ============================================
-- END OF SCHEMA
-- ============================================