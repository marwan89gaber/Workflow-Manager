const DbService = require('../dbService');

class CommentController {
    static async createComment(req, res){
        const { task_id, comment_text } = req.body;
        const user_id = req.user.user_id;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.insertNewComment(task_id, user_id, comment_text);
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
        const { comment_text } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.updateCommentById(id, comment_text);
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
        const commentId = req.params.id;
        const authorId = req.user.user_id;
        const { comment_text } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.insertCommentReply(commentId, authorId, comment_text);
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