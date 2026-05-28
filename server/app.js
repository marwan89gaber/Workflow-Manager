const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(helmet());

// Strict limiter — auth routes only
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 10,
    message: {
        success: false,
        message: 'Too many attempts. Please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// General limiter — all API routes
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    max: 100,
    message: {
        success: false,
        message: 'Too many requests. Please slow down.'
    }
});

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://127.0.0.1:5500',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const fileRoutes = require('./routes/fileRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const newsRoutes = require('./routes/newsRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Use Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', generalLimiter);  // Apply general rate limiter to all API routes
app.use('/api/users/login', authLimiter);  // Apply strict limiter to login route
app.use('/api/users/register', authLimiter);  // Apply strict limiter to registration route

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

module.exports = app;