const Utils = require('../../utils'); // If you create one

// Or test validation directly:
const validation = require('../../middleware/validation');
const { body, validationResult } = require('express-validator');

describe('Input Validation', () => {
  describe('Email validation', () => {
    it('should accept valid email', async () => {
      const validator = body('email').isEmail();
      const mockReq = { body: { email: 'john@example.com' } };
      
      await validator.run(mockReq);
      const result = validationResult(mockReq);
      
      expect(result.isEmpty()).toBe(true);
    });

    it('should reject invalid email', async () => {
      const validator = body('email').isEmail();
      const mockReq = { body: { email: 'not-an-email' } };
      
      await validator.run(mockReq);
      const result = validationResult(mockReq);
      
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('Password validation', () => {
    it('should reject passwords shorter than 6 chars', async () => {
      const validator = body('password').isLength({ min: 6 });
      const mockReq = { body: { password: '12345' } };
      
      await validator.run(mockReq);
      const result = validationResult(mockReq);
      
      expect(result.isEmpty()).toBe(false);
    });

    it('should accept passwords 6+ chars', async () => {
      const validator = body('password').isLength({ min: 6 });
      const mockReq = { body: { password: '123456' } };
      
      await validator.run(mockReq);
      const result = validationResult(mockReq);
      
      expect(result.isEmpty()).toBe(true);
    });
  });
});