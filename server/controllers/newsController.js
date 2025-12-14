const DbService = require('../dbService');

class NewsController {
    static async createNews(req, res){
        const { title, content, authorId, isPinned } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.insertNewNews(title, content, authorId, isPinned);
            res.json({ success: true, data: data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }             // POST - Create announcement
    static async getAllNews(req, res){
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getAllNews();
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }             // GET - Get all news
    static async getNewsById(req, res){
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const news = await db.getNewsById(id);
            if (news) {
                res.json({ data: news });
            } else {
                res.status(404).json({ error: 'News not found' });
            }
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }            // GET - Get specific news
    static async updateNews(req, res){
        const { id } = req.params;
        const { title, content, isPinned } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.updateNewsById(id, title, content, isPinned);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }             // PUT - Update announcement
    static async deleteNews(req, res){
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.deleteNewsById(id);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }             // DELETE - Remove news
    static async getPinnedNews(req, res){
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getPinnedNews();
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }          // GET - Get pinned announcements
    static async togglePin(req, res){
        const { id } = req.params;
        const { isPinned } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.updateNewsPinStatus(id, isPinned);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }              // PUT - Pin/unpin news
}

module.exports = NewsController;