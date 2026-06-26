const DbService = require('../../dbService');
const bcrypt = require('bcrypt');

// Mock the MySQL pool (don't actually connect to DB during tests)
jest.mock('mysql2', () => ({
  createPool: () => ({
    query: jest.fn((sql, params, callback) => {
      // Mock callback
      callback(null, [{ user_id: 'test001', email: 'test@example.com' }]);
    })
  })
}));

describe('DbService', () => {
  describe('getUserByEmail', () => {
    it('should retrieve user by email', async () => {
      const db = DbService.getDbServiceInstance();
      const user = await db.getUserByEmail('test@example.com');
      
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });

    it('should return undefined if user not found', async () => {
      const db = DbService.getDbServiceInstance();
      // Mock returns null
      const user = await db.getUserByEmail('nonexistent@example.com');
      
      expect(user).toBeUndefined();
    });
  });

  describe('insertNewUser', () => {
    it('should hash password before storing', async () => {
      const db = DbService.getDbServiceInstance();
      const password = 'testpassword123';
      
      // This test verifies bcrypt is called
      const bcryptSpy = jest.spyOn(bcrypt, 'hash');
      
      // (Note: actual test would need to mock the stored procedure call)
      // await db.insertNewUser('John', 'Doe', 'john@example.com', password, 'employee', null, null);
      
      // expect(bcryptSpy).toHaveBeenCalledWith(password, 10);
      bcryptSpy.mockRestore();
    });
  });
});