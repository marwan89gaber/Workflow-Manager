// ==========================================
// middleware/auth.js
// ==========================================
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

class AuthMiddleware {
    // Verify JWT token and attach user info to request
    static authenticateToken(req, res, next) {
        try {
            // Get token from header
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

            if (!token) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Access token required' 
                });
            }

            // Verify token
            jwt.verify(token, JWT_SECRET, (err, user) => {
                if (err) {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'Invalid or expired token' 
                    });
                }

                // Attach user info to request
                req.user = user;
                next();
            });
        } catch (error) {
            return res.status(500).json({ 
                success: false, 
                message: 'Authentication error',
                error: error.message 
            });
        }
    }

    // Check if user has required role
    static authorizeRole(...roles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'User not authenticated' 
                });
            }

            if (!roles.includes(req.user.role)) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Insufficient permissions' 
                });
            }

            next();
        };
    }

    // Generate JWT token
    static generateToken(user) {
        return jwt.sign(
            { 
                user_id: user.user_id, 
                email: user.email, 
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
    }
}

module.exports = AuthMiddleware;
