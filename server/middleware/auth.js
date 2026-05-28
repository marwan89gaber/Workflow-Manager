// ==========================================
// middleware/auth.js
// ==========================================
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set');
}

const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000  // 24 hours in ms
};

class AuthMiddleware {
    static authenticateToken(req, res, next) {
        try {
            const token = req.cookies?.token;

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated'
                });
            }

            jwt.verify(token, JWT_SECRET, (err, user) => {
                if (err) {
                    res.clearCookie('token');
                    return res.status(401).json({
                        success: false,
                        message: 'Session expired, please log in again'
                    });
                }
                req.user = user;
                next();
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Authentication error'
            });
        }
    }

    static authorizeRole(...roles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated'
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

    static setCookieToken(res, user) {
        const token = AuthMiddleware.generateToken(user);
        res.cookie('token', token, COOKIE_OPTIONS);
    }

    static clearCookieToken(res) {
        res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
    }
}

module.exports = AuthMiddleware;
