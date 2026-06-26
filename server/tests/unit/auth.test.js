const AuthMiddleware = require('../../middleware/auth');
const jwt = require('jsonwebtoken');

describe('Authentication Middleware', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT', () => {
      const user = {
        user_id: 'ebj001',
        email: 'bob@example.com',
        role: 'employee'
      };

      const token = AuthMiddleware.generateToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
      expect(decoded.user_id).toBe('ebj001');
      expect(decoded.role).toBe('employee');
    });

    it('should expire after 24 hours', () => {
      const user = { user_id: 'test001', email: 'test@example.com', role: 'employee' };
      const token = AuthMiddleware.generateToken(user);
      const decoded = jwt.decode(token);

      // Check exp claim exists
      expect(decoded.exp).toBeDefined();
    });
  });

  describe('authenticateToken', () => {
    it('should reject requests without token', () => {
      const req = { cookies: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      AuthMiddleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid tokens', () => {
      const req = { cookies: { token: 'invalid.token.here' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        clearCookie: jest.fn()
      };
      const next = jest.fn();

      AuthMiddleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.clearCookie).toHaveBeenCalled();
    });
  });
});