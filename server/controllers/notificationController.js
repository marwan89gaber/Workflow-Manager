const DbService = require('../dbService');

class NotificationController {
    static async getUserNotifications(req, res){
        const { userId } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getNotificationsByUserId(userId);
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }   // GET - Get user notifications
    static async getUnreadNotifications(req, res){
        const { userId } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getUnreadNotificationsByUserId(userId);
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    } // GET - Get unread notifications
    static async markAsRead(req, res){  
        const { notificationId } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.markNotificationAsRead(notificationId);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }             // PUT - Mark notification as read
    static async markAllAsRead(req, res){   
        const { userId } = req.body;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.markAllNotificationsAsRead(userId);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }          // PUT - Mark all as read
    static async deleteNotification(req, res){
        const { notificationId } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const success = await db.deleteNotificationById(notificationId);
            res.json({ success: success });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }     // DELETE - Remove notification
    static async getUnreadCount(req, res){
        const { userId } = req.params;
        const db = DbService.getDbServiceInstance();
        try {
            const data = await db.getUnreadNotificationCount(userId);
            res.json({ data: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }         // GET - Get unread count
}

module.exports = NotificationController;