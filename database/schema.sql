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
    status ENUM('active', 'inactive', 'on_leave', 'pending') DEFAULT 'active',
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

-- INSERT USERS (16 total)
-- Password for ALL users: "password123"
-- Hashed with bcrypt (10 rounds)
-- ============================================

-- 2 ADMINS
INSERT INTO users (user_id, first_name, last_name, email, password, role, department, phone, status) VALUES
('ajd001', 'John', 'Doe', 'john.doe@company.com', '$2b$10$rXK5P7QZ9uJ3dY8FW.HqCOXvZJ3r0qY7K8/L9wH1xY8c2R5T6V8K.', 'admin', 'Executive', '+1-555-0101', 'active'),
('ath002', 'Thomas', 'Harris', 'thomas.harris@company.com', '$2b$10$rXK5P7QZ9uJ3dY8FW.HqCOXvZJ3r0qY7K8/L9wH1xY8c2R5T6V8K.', 'admin', 'IT', '+1-555-0102', 'active');

-- 3 MANAGERS
INSERT INTO users (user_id, first_name, last_name, email, password, role, department, phone, status) VALUES
('mas001', 'Alice', 'Smith', 'alice.smith@company.com', '$2b$10$rXK5P7QZ9uJ3dY8FW.HqCOXvZJ3r0qY7K8/L9wH1xY8c2R5T6V8K.', 'manager', 'Development', '+1-555-0201', 'active'),
('mmb002', 'Michael', 'Brown', 'michael.brown@company.com', '$2b$10$rXK5P7QZ9uJ3dY8FW.HqCOXvZJ3r0qY7K8/L9wH1xY8c2R5T6V8K.', 'manager', 'Design', '+1-555-0202', 'active'),
('mjw003', 'Jennifer', 'Williams', 'jennifer.williams@company.com', '$2b$10$rXK5P7QZ9uJ3dY8FW.HqCOXvZJ3r0qY7K8/L9wH1xY8c2R5T6V8K.', 'manager', 'Marketing', '+1-555-0203', 'active');

-- 11 EMPLOYEES
INSERT INTO users (user_id, first_name, last_name, email, password, role, department, phone, status) VALUES
('ebj001', 'Bob', 'Johnson', 'bob.johnson@company.com', '$2b$10$rXK5P7QZ9uJ3dY8FW.HqCOXvZJ3r0qY7K8/L9wH1xY8c2R5T6V8K.', 'employee', 'Development', '+1-555-0301', 'active'),
('eew002', 'Emma', 'Wilson', 'emma.wilson@company.com', '$2b$10$rXK5P7QZ9uJ3dY8FW.HqCOXvZJ3r0qY7K8/L9wH1xY8c2R5T6V8K.', 'employee', 'Design', '+1-555-0302', 'active'),
('edm003', 'David', 'Martinez', 'david.martinez@company.com', '$2b$10$rXK5P7QZ9uJ3dY8FW.HqCOXvZJ3r0qY7K8/L9wH1xY8c2R5T6V8K.', 'employee', 'Development', '+1-555-0303', 'active'),
('esa004', 'Sarah', 'Anderson', 'sarah.anderson@company.com', '$2b$10$rXK5P7QZ9uJ3dY8FW.HqCOXvZJ3r0qY7K8/L9wH1xY8c2R5T6V8K.', 'employee', 'Development', '+1-555-0304', 'active'),
('ejt005', 'James', 'Taylor', 'james.taylor@company.com', '$2b$10$rXK5P7QZ9uJ3dY8FW.HqCOXvZJ3r0qY7K8/L9wH1xY8c2R5T6V8K.', 'employee', 'Design', '+1-555-0305', 'active'),
('ell006', 'Laura', 'Lee', 'laura.lee@company.com', '$2b$10$rXK5P7QZ9uJ3dY8FW.HqCOXvZJ3r0qY7K8/L9wH1xY8c2R5T6V8K.', 'employee', 'Marketing', '+1-555-0306', 'active'),
('erw007', 'Robert', 'White', 'robert.white@company.com', '$2b$10$rXK5P7QZ9uJ3dY8FW.HqCOXvZJ3r0qY7K8/L9wH1xY8c2R5T6V8K.', 'employee', 'Development', '+1-555-0307', 'active'),
('emh008', 'Maria', 'Hernandez', 'maria.hernandez@company.com', '$2b$10$rXK5P7QZ9uJ3dY8FW.HqCOXvZJ3r0qY7K8/L9wH1xY8c2R5T6V8K.', 'employee', 'Design', '+1-555-0308', 'active'),
('ecm009', 'Christopher', 'Moore', 'chris.moore@company.com', '$2b$10$rXK5P7QZ9uJ3dY8FW.HqCOXvZJ3r0qY7K8/L9wH1xY8c2R5T6V8K.', 'employee', 'Marketing', '+1-555-0309', 'active'),
('epa010', 'Patricia', 'Anderson', 'patricia.anderson@company.com', '$2b$10$rXK5P7QZ9uJ3dY8FW.HqCOXvZJ3r0qY7K8/L9wH1xY8c2R5T6V8K.', 'employee', 'Development', '+1-555-0310', 'active'),
('edg011', 'Daniel', 'Garcia', 'daniel.garcia@company.com', '$2b$10$rXK5P7QZ9uJ3dY8FW.HqCOXvZJ3r0qY7K8/L9wH1xY8c2R5T6V8K.', 'employee', 'Development', '+1-555-0311', 'active');

-- ============================================
-- INSERT PROJECTS (8 projects)
-- ============================================
INSERT INTO projects (project_name, description, created_by, start_date, end_date, status, priority, budget) VALUES
('Website Redesign', 'Complete overhaul of company website with modern UI/UX', 'mas001', '2024-01-15', '2024-06-30', 'active', 'high', 85000.00),
('Mobile App Development', 'Native iOS and Android app for customer portal', 'mas001', '2024-02-01', '2024-08-31', 'active', 'critical', 120000.00),
('Marketing Campaign Q1', 'Digital marketing campaign for new product launch', 'mjw003', '2024-01-01', '2024-03-31', 'completed', 'high', 45000.00),
('Internal Tools Upgrade', 'Modernize internal project management tools', 'ath002', '2024-03-01', '2024-09-30', 'active', 'medium', 60000.00),
('Brand Identity Refresh', 'Update company branding and visual identity', 'mmb002', '2024-02-15', '2024-05-15', 'active', 'medium', 35000.00),
('Customer Portal Enhancement', 'Add new features to customer self-service portal', 'mas001', '2024-04-01', '2024-07-31', 'planning', 'high', 75000.00),
('Data Analytics Platform', 'Build comprehensive analytics dashboard', 'ath002', '2023-11-01', '2024-02-28', 'completed', 'critical', 95000.00),
('Social Media Integration', 'Integrate social media feeds and sharing', 'mjw003', '2024-05-01', '2024-06-30', 'planning', 'low', 25000.00);

-- ============================================
-- INSERT PROJECT MEMBERS
-- Automatically creates group conversations via trigger
-- ============================================
INSERT INTO project_members (project_id, user_id, role_in_project) VALUES
-- Project 1: Website Redesign (6 members)
(1, 'mas001', 'owner'),
(1, 'ebj001', 'member'),
(1, 'edm003', 'member'),
(1, 'esa004', 'member'),
(1, 'eew002', 'member'),
(1, 'ejt005', 'member'),

-- Project 2: Mobile App (7 members)
(2, 'mas001', 'owner'),
(2, 'ebj001', 'lead'),
(2, 'edm003', 'member'),
(2, 'esa004', 'member'),
(2, 'erw007', 'member'),
(2, 'epa010', 'member'),
(2, 'edg011', 'member'),

-- Project 3: Marketing Campaign (4 members)
(3, 'mjw003', 'owner'),
(3, 'ell006', 'lead'),
(3, 'ecm009', 'member'),
(3, 'eew002', 'member'),

-- Project 4: Internal Tools (5 members)
(4, 'ath002', 'owner'),
(4, 'ebj001', 'member'),
(4, 'edm003', 'member'),
(4, 'erw007', 'member'),
(4, 'edg011', 'member'),

-- Project 5: Brand Identity (4 members)
(5, 'mmb002', 'owner'),
(5, 'eew002', 'lead'),
(5, 'ejt005', 'member'),
(5, 'emh008', 'member'),

-- Project 6: Customer Portal (6 members)
(6, 'mas001', 'owner'),
(6, 'esa004', 'lead'),
(6, 'ebj001', 'member'),
(6, 'erw007', 'member'),
(6, 'epa010', 'member'),
(6, 'edg011', 'member'),

-- Project 7: Analytics Platform (4 members)
(7, 'ath002', 'owner'),
(7, 'edm003', 'lead'),
(7, 'ebj001', 'member'),
(7, 'erw007', 'member'),

-- Project 8: Social Media (3 members)
(8, 'mjw003', 'owner'),
(8, 'ell006', 'member'),
(8, 'ecm009', 'member');

-- ============================================
-- INSERT TASKS (55 tasks across projects)
-- Automatically creates notifications via trigger
-- ============================================

-- Project 1: Website Redesign Tasks
INSERT INTO tasks (project_id, task_name, description, assigned_to, created_by, status, priority, start_date, due_date, estimated_hours, actual_hours) VALUES
(1, 'Design Homepage Mockup', 'Create initial design mockups for new homepage', 'eew002', 'mas001', 'done', 'high', '2024-01-15', '2024-01-30', 16, 18),
(1, 'Develop Header Component', 'Build responsive header with navigation', 'ebj001', 'mas001', 'done', 'high', '2024-02-01', '2024-02-10', 12, 14),
(1, 'Implement User Authentication', 'Add login and registration functionality', 'edm003', 'mas001', 'in_progress', 'critical', '2024-02-15', '2024-03-01', 24, 16),
(1, 'Create Product Pages', 'Design and develop product showcase pages', 'esa004', 'mas001', 'in_progress', 'high', '2024-03-01', '2024-03-20', 20, 12),
(1, 'Setup Contact Form', 'Implement contact form with email integration', 'ebj001', 'mas001', 'todo', 'medium', '2024-03-15', '2024-03-25', 8, NULL),
(1, 'Optimize Images', 'Compress and optimize all website images', 'ejt005', 'mas001', 'todo', 'low', '2024-04-01', '2024-04-10', 6, NULL),
(1, 'SEO Implementation', 'Add meta tags and optimize for search engines', 'esa004', 'mas001', 'todo', 'medium', '2024-04-15', '2024-04-30', 10, NULL),
(1, 'Browser Testing', 'Test site across all major browsers', 'edm003', 'mas001', 'todo', 'medium', '2024-05-01', '2024-05-15', 12, NULL),

-- Project 2: Mobile App Tasks
(2, 'Setup Project Structure', 'Initialize React Native project with dependencies', 'ebj001', 'mas001', 'done', 'critical', '2024-02-01', '2024-02-05', 8, 8),
(2, 'Design App UI/UX', 'Create complete UI/UX design system', 'eew002', 'mas001', 'done', 'high', '2024-02-05', '2024-02-20', 32, 35),
(2, 'Implement Navigation', 'Setup navigation between screens', 'edm003', 'mas001', 'done', 'high', '2024-02-20', '2024-02-28', 16, 14),
(2, 'Build Login Screen', 'Create login and registration screens', 'esa004', 'mas001', 'in_progress', 'critical', '2024-03-01', '2024-03-10', 12, 8),
(2, 'Develop Dashboard', 'Create main dashboard with widgets', 'erw007', 'mas001', 'in_progress', 'high', '2024-03-10', '2024-03-25', 24, 15),
(2, 'API Integration', 'Connect app to backend APIs', 'epa010', 'mas001', 'in_progress', 'critical', '2024-03-15', '2024-04-05', 32, 20),
(2, 'Push Notifications', 'Implement push notification system', 'edg011', 'mas001', 'todo', 'high', '2024-04-10', '2024-04-25', 16, NULL),
(2, 'Offline Mode', 'Add offline data caching', 'ebj001', 'mas001', 'todo', 'medium', '2024-05-01', '2024-05-20', 20, NULL),
(2, 'App Store Preparation', 'Prepare app for iOS App Store submission', 'edm003', 'mas001', 'todo', 'high', '2024-06-01', '2024-06-15', 12, NULL),
(2, 'Android Testing', 'Test on various Android devices', 'esa004', 'mas001', 'todo', 'high', '2024-06-15', '2024-06-30', 16, NULL),

-- Project 3: Marketing Campaign Tasks (Completed)
(3, 'Market Research', 'Conduct target audience research', 'ell006', 'mjw003', 'done', 'high', '2024-01-01', '2024-01-15', 20, 22),
(3, 'Create Campaign Strategy', 'Develop comprehensive marketing strategy', 'mjw003', 'mjw003', 'done', 'critical', '2024-01-15', '2024-01-30', 16, 18),
(3, 'Design Ad Creatives', 'Create social media ad designs', 'eew002', 'mjw003', 'done', 'high', '2024-02-01', '2024-02-10', 24, 26),
(3, 'Write Copy', 'Write compelling ad copy', 'ecm009', 'mjw003', 'done', 'high', '2024-02-10', '2024-02-15', 12, 10),
(3, 'Launch Ads', 'Deploy ads across platforms', 'ell006', 'mjw003', 'done', 'critical', '2024-02-20', '2024-02-25', 8, 8),
(3, 'Monitor Performance', 'Track and optimize campaign performance', 'ell006', 'mjw003', 'done', 'high', '2024-02-25', '2024-03-31', 40, 42),

-- Project 4: Internal Tools Tasks
(4, 'Audit Current Tools', 'Review existing tools and pain points', 'ath002', 'ath002', 'done', 'high', '2024-03-01', '2024-03-10', 16, 18),
(4, 'Design New Architecture', 'Plan modern tool architecture', 'ebj001', 'ath002', 'done', 'high', '2024-03-10', '2024-03-20', 20, 22),
(4, 'Setup Database', 'Configure PostgreSQL database', 'edm003', 'ath002', 'in_progress', 'critical', '2024-03-20', '2024-04-05', 16, 10),
(4, 'Build API Layer', 'Create RESTful API', 'erw007', 'ath002', 'in_progress', 'high', '2024-04-01', '2024-04-20', 32, 18),
(4, 'Frontend Development', 'Build React frontend', 'edg011', 'ath002', 'todo', 'high', '2024-04-20', '2024-05-15', 40, NULL),
(4, 'User Testing', 'Conduct internal user testing', 'ebj001', 'ath002', 'todo', 'medium', '2024-05-15', '2024-05-30', 12, NULL),

-- Project 5: Brand Identity Tasks
(5, 'Brand Audit', 'Analyze current brand perception', 'mmb002', 'mmb002', 'done', 'high', '2024-02-15', '2024-02-28', 20, 20),
(5, 'Logo Design Options', 'Create 3 logo design concepts', 'eew002', 'mmb002', 'done', 'critical', '2024-03-01', '2024-03-15', 24, 28),
(5, 'Color Palette Selection', 'Define brand color system', 'ejt005', 'mmb002', 'in_progress', 'high', '2024-03-15', '2024-03-25', 8, 6),
(5, 'Typography System', 'Select and define brand typography', 'emh008', 'mmb002', 'in_progress', 'medium', '2024-03-20', '2024-03-30', 6, 4),
(5, 'Brand Guidelines', 'Create comprehensive brand guidelines', 'eew002', 'mmb002', 'todo', 'high', '2024-04-01', '2024-04-20', 16, NULL),
(5, 'Marketing Collateral', 'Design business cards, letterhead, etc', 'ejt005', 'mmb002', 'todo', 'medium', '2024-04-20', '2024-05-10', 12, NULL),

-- Project 6: Customer Portal Tasks
(6, 'Requirements Gathering', 'Collect customer feedback and requirements', 'mas001', 'mas001', 'in_progress', 'high', '2024-04-01', '2024-04-15', 12, 8),
(6, 'Design Portal UI', 'Create mockups for new features', 'eew002', 'mas001', 'todo', 'high', '2024-04-15', '2024-04-30', 20, NULL),
(6, 'Implement Chat Feature', 'Add live chat support', 'ebj001', 'mas001', 'todo', 'critical', '2024-05-01', '2024-05-20', 24, NULL),
(6, 'Document Upload', 'Allow customers to upload documents', 'erw007', 'mas001', 'todo', 'high', '2024-05-20', '2024-06-05', 16, NULL),
(6, 'Payment Integration', 'Add payment gateway integration', 'epa010', 'mas001', 'todo', 'critical', '2024-06-05', '2024-06-25', 20, NULL),

-- Project 7: Analytics Platform Tasks (Completed)
(7, 'Data Source Integration', 'Connect to all data sources', 'edm003', 'ath002', 'done', 'critical', '2023-11-01', '2023-11-20', 32, 36),
(7, 'ETL Pipeline', 'Build data extraction and transformation pipeline', 'ebj001', 'ath002', 'done', 'critical', '2023-11-20', '2023-12-10', 40, 44),
(7, 'Dashboard Design', 'Design analytics dashboard interface', 'eew002', 'ath002', 'done', 'high', '2023-12-10', '2023-12-20', 20, 22),
(7, 'Chart Components', 'Develop interactive chart components', 'erw007', 'ath002', 'done', 'high', '2023-12-20', '2024-01-10', 24, 26),
(7, 'Report Generation', 'Implement automated report generation', 'edm003', 'ath002', 'done', 'high', '2024-01-10', '2024-01-31', 28, 30),
(7, 'Performance Optimization', 'Optimize dashboard loading times', 'ebj001', 'ath002', 'done', 'medium', '2024-02-01', '2024-02-20', 16, 18),

-- Project 8: Social Media Tasks
(8, 'API Research', 'Research social media APIs', 'ell006', 'mjw003', 'todo', 'high', '2024-05-01', '2024-05-10', 12, NULL),
(8, 'Facebook Integration', 'Integrate Facebook feed and sharing', 'ecm009', 'mjw003', 'todo', 'medium', '2024-05-10', '2024-05-25', 16, NULL),
(8, 'Twitter Integration', 'Integrate Twitter feed', 'ell006', 'mjw003', 'todo', 'medium', '2024-05-25', '2024-06-10', 12, NULL),
(8, 'Instagram Feed', 'Display Instagram posts', 'ecm009', 'mjw003', 'todo', 'low', '2024-06-10', '2024-06-25', 10, NULL);

-- ============================================
-- INSERT COMMENTS (50+ comments on various tasks)
-- Automatically creates notifications via trigger
-- ============================================
INSERT INTO comments (task_id, user_id, comment_text, created_at) VALUES
-- Comments on task 1 (Homepage Mockup)
(1, 'mas001', 'Great work on the initial mockups! Love the modern aesthetic.', '2024-01-25 10:30:00'),
(1, 'eew002', 'Thanks! I will prepare the final version by tomorrow.', '2024-01-25 11:45:00'),
(1, 'mmb002', 'The color scheme looks perfect. Well done!', '2024-01-26 09:15:00'),

-- Comments on task 2 (Header Component)
(2, 'mas001', 'Make sure the header is fully responsive on mobile devices.', '2024-02-05 14:00:00'),
(2, 'ebj001', 'Already tested on iPhone and Android. All looking good!', '2024-02-05 15:30:00'),

-- Comments on task 3 (User Authentication)
(3, 'mas001', 'How is the authentication coming along?', '2024-02-20 14:00:00'),
(3, 'edm003', 'Making good progress. OAuth integration is almost done.', '2024-02-20 15:30:00'),
(3, 'ebj001', 'Need any help with JWT implementation?', '2024-02-21 10:00:00'),
(3, 'edm003', 'Yes! Can we pair program on it tomorrow?', '2024-02-21 10:15:00'),
(3, 'ebj001', 'Sure, let me schedule a meeting for 2 PM.', '2024-02-21 10:30:00'),

-- Comments on task 4 (Product Pages)
(4, 'esa004', 'Working on responsive design for product pages now.', '2024-03-05 09:00:00'),
(4, 'eew002', 'Let me know if you need any design assets!', '2024-03-05 09:30:00'),
(4, 'esa004', 'Thanks! Will ping you when I need the hero images.', '2024-03-05 10:00:00'),

-- Comments on task 10 (App UI/UX)
(10, 'mas001', 'The designs look amazing! Very clean and intuitive.', '2024-02-18 11:00:00'),
(10, 'eew002', 'Thank you! I focused on making navigation seamless.', '2024-02-18 11:30:00'),
(10, 'mmb002', 'Can we use similar patterns for other projects?', '2024-02-18 14:00:00'),
(10, 'eew002', 'Absolutely! I will create a design system document.', '2024-02-18 14:30:00'),

-- Comments on task 12 (Login Screen)
(12, 'esa004', 'Implementing biometric authentication for iOS.', '2024-03-05 13:00:00'),
(12, 'ebj001', 'Great idea! Android has similar capability we should use.', '2024-03-05 13:30:00'),
(12, 'mas001', 'Make sure to add fallback to password if biometric fails.', '2024-03-05 14:00:00'),

-- Comments on task 13 (Dashboard)
(13, 'erw007', 'Dashboard widgets are coming together nicely.', '2024-03-15 10:00:00'),
(13, 'mas001', 'Can we add a refresh button for real-time data?', '2024-03-15 10:30:00'),
(13, 'erw007', 'Already implemented! Pull-to-refresh also works.', '2024-03-15 11:00:00'),

-- Comments on task 14 (API Integration)
(14, 'epa010', 'API connection is working but response times are slow.', '2024-03-20 15:00:00'),
(14, 'ebj001', 'Let me check the backend. Might need to add caching.', '2024-03-20 15:30:00'),
(14, 'ath002', 'I will optimize the database queries this week.', '2024-03-20 16:00:00'),

-- Comments on task 19 (Marketing Research)
(19, 'ell006', 'Survey results show strong interest in our target demographic.', '2024-01-12 10:00:00'),
(19, 'mjw003', 'Excellent! Let me analyze the data for our strategy.', '2024-01-12 11:00:00'),

-- Comments on task 21 (Ad Creatives)
(21, 'eew002', 'Created three design variations for A/B testing.', '2024-02-08 14:00:00'),
(21, 'mjw003', 'Love option B! Let me run it by the client.', '2024-02-08 15:00:00'),
(21, 'mmb002', 'Option B aligns well with our brand guidelines.', '2024-02-08 16:00:00'),

-- Comments on task 27 (Database Setup)
(27, 'edm003', 'PostgreSQL is configured. Setting up migrations now.', '2024-03-25 09:00:00'),
(27, 'ath002', 'Perfect! Make sure to enable automatic backups.', '2024-03-25 09:30:00'),
(27, 'edm003', 'Already done. Daily backups scheduled at midnight.', '2024-03-25 10:00:00'),

-- Comments on task 28 (API Layer)
(28, 'erw007', 'RESTful endpoints are complete. Working on documentation.', '2024-04-10 11:00:00'),
(28, 'ebj001', 'Can you add Swagger docs for easier testing?', '2024-04-10 11:30:00'),
(28, 'erw007', 'Good idea! Will add that today.', '2024-04-10 12:00:00'),

-- Comments on task 32 (Logo Design)
(32, 'eew002', 'Here are three logo concepts. Which do you prefer?', '2024-03-10 14:00:00'),
(32, 'mmb002', 'Concept 2 is the winner! Modern and memorable.', '2024-03-10 15:00:00'),
(32, 'ajd001', 'Agreed! Let me get approval from the board.', '2024-03-10 16:00:00');


-- Insert sample files
INSERT INTO files (task_id, uploaded_by, file_name, file_path, file_type, file_size) VALUES
(1, 'eew002', 'homepage_mockup_v1.png', '/files/homepage_mockup_v1.png', 'image/png', 204800),
(10, 'eew002', 'app_ui_ux_design.pdf', '/files/app_ui_ux_design.pdf', 'application/pdf', 512000),
(21, 'eew002', 'ad_creatives.zip', '/files/ad_creatives.zip', 'application/zip', 1024000),
(28, 'erw007', 'api_documentation.md', '/files/api_documentation.md', 'text/markdown', 10240),
(32, 'eew002', 'logo_concept_2.ai', '/files/logo_concept_2.ai', 'application/postscript', 307200),
(3, 'edm003', 'oauth_integration_guide.pdf', '/files/oauth_integration_guide.pdf', 'application/pdf', 256000),
(14, 'epa010', 'api_performance_report.xlsx', '/files/api_performance_report.xlsx', 'application/xlsx', 51200),
(27, 'edm003', 'database_backup_20240401.sql', '/files/database_backup_20240401.sql', 'application/sql', 1048576),
(28, 'erw007', 'swagger_api_docs.json', '/files/swagger_api_docs.json', 'application/json', 20480),
(4, 'eew002', 'product_page_designs.psd', '/files/product_page_designs.psd', 'application/octet-stream', 409600);

-- Insert direct conversation between manager and employee
INSERT INTO conversations (conversation_type,conversation_name) VALUES 
('direct', 'Alice & Michael'),
('direct', 'John & Bob');

INSERT INTO conversation_participants (conversation_id, user_id) VALUES
(9, 'mas001'),
(9, 'mmb002'),
(10, 'ajd001'),
(10, 'ebj001');

INSERT INTO messages (conversation_id, sender_id, message_text) VALUES 
(1, 'mas001', 'Hi Mike, can you send me the latest project updates?'),
(1, 'mmb002', 'Sure Alice, I will compile the report and send it by EOD.'),
(2, 'ajd001', 'Bob, please ensure the security protocols are up to date.'),
(2, 'ebj001', 'Will do, John. I will review them today.'),
(3, 'mas001', 'Team, lets have a quick sync-up tomorrow at 10 AM.'),
(3, 'ebj001', 'Sounds good!'),
(3, 'edm003', 'I will prepare the API integration status.'),
(3, 'esa004', 'I have some design updates to share as well.'),
(3, 'eew002', 'Looking forward to it!'),
(3, 'ejt005', 'See you all tomorrow.');

-- Insert work news
INSERT INTO work_news (title, content, posted_by, priority, target_audience, is_pinned) VALUES
('Quarterly Town Hall Meeting', 'Join us for the Q2 town hall meeting on June 15th at 3 PM in the main auditorium. We will discuss company performance and future plans.', 'ajd001', 'urgent', 'all', TRUE),
('New Health Benefits Plan', 'We are excited to announce a new health benefits plan starting July 1st. Please review the attached document for details and enrollment instructions.', 'ath002', 'important', 'employees', FALSE),
('Office Renovation Update', 'The office renovation is progressing well. The new collaboration spaces are expected to be completed by the end of June. Stay tuned for more updates!', 'mmb002', 'normal', 'managers', FALSE),
('IT Security Training', 'Mandatory IT security training sessions will be held throughout July. Please sign up for a session that fits your schedule.', 'ath002', 'urgent', 'all', TRUE);


