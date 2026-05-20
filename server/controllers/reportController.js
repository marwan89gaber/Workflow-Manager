const DbService = require('../dbService');

class ReportController {
    static async generateReport(req, res){
        const { reportType, parameters } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.createReport(reportType, parameters);
            res.json({ success: true, data: data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }         // POST - Generate new report
    static async getAllReports(req, res){
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getAllReports();
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }          // GET - Get all reports
    static async getReportById(req, res){
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const report = await db.getReportById(id);
            if (report) {
                res.json({ data: report });
            } else {
                res.status(404).json({ error: 'Report not found' });
            }
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }          // GET - Get specific report
    static async deleteReport(req, res){
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.deleteReportById(id);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }           // DELETE - Remove report
    static async getTeamPerformance(req, res){
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getTeamPerformanceStats();
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }     // GET - Team performance stats
    static async getProjectStatus(req, res){
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getProjectStatusReport();
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }       // GET - Project status report
    static async getIndividualProductivity(req, res){
        const userId = req.user.user_id;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getUserProductivityStats(userId);
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    } // GET - User productivity
    static async getTaskCompletion(req, res){
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getTaskCompletionStats();
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }      // GET - Task completion stats
}

module.exports = ReportController;