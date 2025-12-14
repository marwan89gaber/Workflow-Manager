const DbService = require('../dbService');

class ProjectController {
    // POST - Create new project
    static async createProject(req, res) {
        const { name, description, startDate, endDate } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.insertNewProject(name, description, startDate, endDate);
            res.json({ success: true, data: data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }       
    
    // GET - Fetch all projects
    static async getAllProjects(req, res) {
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getAllProjects();
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }        
    
    // GET - Fetch project details
    static async getProjectById(req, res)  {
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const allProjects = await db.getAllProjects();
            const project = allProjects.find(project => project.id == id);
            if (project) {
                res.json({ data: project });
            } else {
                res.status(404).json({ error: 'Project not found' });
            }
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }    
    
    // PUT - Update project
    static async updateProject(req, res)    {
        const { id } = req.params;
        const { name, description, startDate, endDate } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.updateProjectById(id, name, description, startDate, endDate);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }    
    
    // DELETE - Remove project
    static async deleteProject(req, res)     {
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();    
        try {
            const success = await db.deleteProjectById(id);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }    
    
    // POST - Add user to project
    static async addProjectMember(req, res)   {
        const { projectId, userId } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.addProjectMember(projectId, userId);
            res.json({ success: true, data: data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }    

    // DELETE - Remove user from project
    static async removeProjectMember(req, res) {
        const { projectId, userId } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.removeProjectMember(projectId, userId);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }   

    // GET - Get all project members
    static async getProjectMembers(req, res)    {
        const { projectId } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getProjectMembers(projectId);
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }  

    // GET - Get completion stats
    static async getProjectProgress(req, res)    {
        const { projectId } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getProjectProgress(projectId);
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    } 

    // PUT - Change project status
    static async updateProjectStatus(req, res)    {
        const { projectId } = req.params;
        const { status } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.updateProjectStatus(projectId, status);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    } 

    // GET - Get projects for specific user
    static async getUserProjects(req, res)       {
        const { userId } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getUserProjects(userId);
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    } 
}

module.exports = ProjectController;