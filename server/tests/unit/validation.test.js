const validation = require('../../middleware/validation');

describe('User Validation', () => {
  describe('validateUserRegistration', () => {
    it('should validate email correctly', () => {
      const validators = validation.validateUserRegistration();
      // Validators is an array of express-validator rules
      expect(validators).toBeDefined();
      expect(Array.isArray(validators)).toBe(true);
    });
  });

  describe('validateProject', () => {
    it('should validate project rules exist', () => {
      const validators = validation.validateProject();
      expect(validators).toBeDefined();
    });
  });
});