const DbService = require('../dbService');


class TaskController {
    static async createTask(req, res){
        const { title, description, status, priority, assignedTo, projectId, dueDate } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.insertNewTask(title, description, status, priority, assignedTo, projectId, dueDate);
            res.json({ success: true, data: data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }             // POST - Create new task
    static async getAllTasks(req, res){
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getAllTasks();
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }            // GET - Fetch all tasks (with filters)
    static async getTaskById(req, res){
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const allTasks = await db.getAllTasks();
            const task = allTasks.find(task => task.id == id);
            if (task) {
                res.json({ data: task });
            } else {
                res.status(404).json({ error: 'Task not found' });
            }
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }            // GET - Fetch task details
    static async updateTask(req, res){
        const { id } = req.params;
        const { title, description, status, priority, assignedTo, projectId, dueDate } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.updateTaskById(id, title, description, status, priority, assignedTo, projectId, dueDate);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }             // PUT - Update task
    static async deleteTask(req, res){ 
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.deleteTaskById(id);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }             // DELETE - Remove task
    static async updateTaskStatus(req, res){
        const { id } = req.params;
        const { status } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.updateTaskStatusById(id, status);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }       // PUT - Change task status
    static async assignTask(req, res){
        const { id } = req.params;
        const { assignedTo } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.assignTaskById(id, assignedTo);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }             // PUT - Assign task to user
    static async getTaskHistory(req, res){
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getTaskChangeHistoryById(id);
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }         // GET - Get task change history
    static async getTasksByProject(req, res){  
        const { projectId } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const allTasks = await db.getAllTasks();
            const tasks = allTasks.filter(task => task.projectId == projectId);
            res.json({ data: tasks });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }      // GET - Get all tasks in project
    static async getTasksByUser(req, res){
        const { userId } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const allTasks = await db.getAllTasks();
            const tasks = allTasks.filter(task => task.assignedTo == userId);
            res.json({ data: tasks });
        }catch (err) {
            res.status(500).json({ error: err.message });
        }
    }         // GET - Get tasks assigned to user
    static async getOverdueTasks(req, res){
        const db = DbService.getDbServiceInstance();
        try {
            const allTasks = await db.getAllTasks();
            const currentDate = new Date();
            const tasks = allTasks.filter(task => new Date(task.dueDate) < currentDate && task.status !== 'Completed');
            res.json({ data: tasks });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }        // GET - Get overdue tasks
    static async updateTaskPriority(req, res){
        const { id } = req.params;
        const { priority } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.updateTaskPriorityById(id, priority);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }     // PUT - Change task priority
}

module.exports = TaskController;