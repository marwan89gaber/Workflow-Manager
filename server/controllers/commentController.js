const DbService = require('../dbService');

class CommentController {
    static async createComment(req, res){
        const { taskId, authorId, content } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.insertNewComment(taskId, authorId, content);
            res.json({ success: true, data: data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }          // POST - Add comment to task
    static async getCommentsByTask(req, res){
        const { taskId } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getCommentsByTaskId(taskId);
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }      // GET - Get all comments for task
    static async updateComment(req, res){
        const { id } = req.params;
        const { content } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.updateCommentById(id, content);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }          // PUT - Edit comment
    static async deleteComment(req, res){
        const { id } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.deleteCommentById(id);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }          // DELETE - Remove comment
    static async replyToComment(req, res){
        const { commentId, authorId, content } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.insertCommentReply(commentId, authorId, content);
            res.json({ success: true, data: data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }         // POST - Add reply to comment
    static async getCommentReplies(req, res){
        const { commentId } = req.params;
        const db = DbService.getDbServiceInstance();    
        try {
            const data = await db.getRepliesByCommentId(commentId);
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }      // GET - Get replies to comment
}

module.exports = CommentController;