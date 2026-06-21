const DbService = require('../dbService');

class ReportController {

    // POST - Generate new report
    static async generateReport(req, res) {
        const { report_type, start_date, end_date, project_id, user_id } = req.body;
        const generated_by = req.user.user_id;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.createReport(report_type, generated_by, start_date, end_date, project_id || null, user_id || null);
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // GET - Get all reports
    static async getAllReports(req, res) {
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getAllReports();
            res.json({ data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // GET - Get specific report
    static async getReportById(req, res) {
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const report = await db.getReportById(id);
            if (report) res.json({ data: report });
            else res.status(404).json({ error: 'Report not found' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // DELETE - Remove report
    static async deleteReport(req, res) {
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.deleteReportById(id);
            res.json({ success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // GET - Team performance stats
    static async getTeamPerformance(req, res) {
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getTeamPerformanceStats();
            res.json({ data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // GET - Project status report
    static async getProjectStatus(req, res) {
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getProjectStatusReport();
            res.json({ data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // GET - Individual productivity (own stats for employees, all for managers)
    static async getIndividualProductivity(req, res) {
        const userId = req.user.user_id;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getUserProductivityStats(userId);
            res.json({ data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // GET - Task completion stats
    static async getTaskCompletion(req, res) {
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getTaskCompletionStats();
            res.json({ data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = ReportController;