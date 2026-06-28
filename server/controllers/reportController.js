// ==========================================
// controllers/reportController.js  (FIXED)
// ==========================================
const DbService = require('../dbService');

class ReportController {

    static async generateReport(req, res) {
        const { report_type, start_date, end_date, project_id, user_id, task_id } = req.body;
        const generated_by = req.user.user_id;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.createReport(
                report_type, generated_by, start_date, end_date,
                project_id || null, user_id || null
            );
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async getAllReports(req, res) {
        const db = DbService.getDbServiceInstance();
        try { res.json({ data: await db.getAllReports() }); }
        catch (err) { res.status(500).json({ error: err.message }); }
    }

    static async getReportById(req, res) {
        const db = DbService.getDbServiceInstance();
        try {
            const r = await db.getReportById(req.params.id);
            r ? res.json({ data: r }) : res.status(404).json({ error: 'Not found' });
        } catch (err) { res.status(500).json({ error: err.message }); }
    }

    static async deleteReport(req, res) {
        const db = DbService.getDbServiceInstance();
        try { res.json({ success: await db.deleteReportById(req.params.id) }); }
        catch (err) { res.status(500).json({ success: false, error: err.message }); }
    }

    static async getTeamPerformance(req, res) {
        const db = DbService.getDbServiceInstance();
        try { res.json({ data: await db.getTeamPerformanceStats() }); }
        catch (err) { res.status(500).json({ error: err.message }); }
    }

    static async getProjectStatus(req, res) {
        const db = DbService.getDbServiceInstance();
        try { res.json({ data: await db.getProjectStatusReport() }); }
        catch (err) { res.status(500).json({ error: err.message }); }
    }

    static async getIndividualProductivity(req, res) {
        const db = DbService.getDbServiceInstance();
        try { res.json({ data: await db.getUserProductivityStats(req.user.user_id) }); }
        catch (err) { res.status(500).json({ error: err.message }); }
    }

    static async getTaskCompletion(req, res) {
        const db = DbService.getDbServiceInstance();
        try { res.json({ data: await db.getTaskCompletionStats() }); }
        catch (err) { res.status(500).json({ error: err.message }); }
    }

    // NEW: detailed task completion (filterable)
    static async getTaskCompletionDetail(req, res) {
        const { task_id, project_id, user_id, start_date, end_date } = req.query;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getTaskCompletionDetail(
                task_id    || null,
                project_id || null,
                user_id    || null,
                start_date || null,
                end_date   || null
            );
            res.json({ data });
        } catch (err) { res.status(500).json({ error: err.message }); }
    }
}

module.exports = ReportController;
