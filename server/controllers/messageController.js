const DbService = require('../dbService');

class MessageController {
    static async createConversation(req, res){
        const { userIds } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.insertNewConversation(userIds);
            res.json({ success: true, data: data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }     // POST - Start new conversation (DM)
    static async getUserConversations(req, res){
        const { userId } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getConversationsByUserId(userId);
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }   // GET - Get user's conversations
    static async getConversationMessages(req, res){
        const { conversationId } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getMessagesByConversationId(conversationId);
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }// GET - Get messages in conversation
    static async sendMessage(req, res){
        const { conversationId, senderId, content } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.insertNewMessage(conversationId, senderId, content);
            res.json({ success: true, data: data });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }            // POST - Send message
    static async markAsRead(req, res){
        const { conversationId, userId } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.markMessagesAsRead(conversationId, userId);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }             // PUT - Mark messages as read
    static async getUnreadCount(req, res){
        const { userId } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getUnreadMessageCount(userId);
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }         // GET - Get unread message count
    static async getProjectGroupChat(req, res){
        const { projectId } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getProjectGroupMessages(projectId);
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }    // GET - Get project group conversation
}

module.exports = MessageController;