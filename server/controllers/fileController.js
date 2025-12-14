const DbService = require('../dbService');

class FileController {
    static async uploadFile(req, res){
        const { taskId, fileName, filePath } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.insertNewFile(taskId, fileName, filePath);
            res.json({ success: true, data: data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }             // POST - Upload file to task
    static async getFilesByTask(req, res){
        const { taskId } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getFilesByTaskId(taskId);
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }         // GET - Get all files for task
    static async deleteFile(req, res){
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.deleteFileById(id);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }             // DELETE - Remove file
    static async downloadFile(req, res){
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const file = await db.getFileById(id);
            if (file) {
                res.download(file.filePath, file.fileName);
            } else {
                res.status(404).json({ error: 'File not found' });
            }
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }           // GET - Download file
}

module.exports = FileController;