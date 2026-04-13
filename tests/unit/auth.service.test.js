jest.mock('../../src/modules/users/user.model', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));

const authService = require('../../src/modules/auth/auth.service');
const User = require('../../src/modules/users/user.model');

const buildMockUser = (overrides = {}) => {
  return {
    _id: '507f1f77bcf86cd799439011',
    role: 'user',
    isActive: true,
    refreshToken: null,
    save: jest.fn().mockResolvedValue(undefined),
    comparePassword: jest.fn().mockResolvedValue(true),
    generateAccessToken: jest.fn().mockReturnValue('access-token'),
    generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
    toJSON: jest.fn().mockReturnValue({
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      isActive: true
    }),
    ...overrides
  };
};

describe('auth.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('creates a user, normalizes email, and returns sanitized auth payload', async () => {
      const mockUser = buildMockUser();

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      const result = await authService.registerUser({
        name: '  Test User  ',
        email: '  TEST@Example.com  ',
        password: 'Password1@'
      });

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(User.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1@'
      });
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        user: mockUser.toJSON(),
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });
    });

    it('throws a bad request error when the email already exists', async () => {
      User.findOne.mockResolvedValue(buildMockUser());

      await expect(
        authService.registerUser({
          name: 'Existing User',
          email: 'existing@example.com',
          password: 'Password1@'
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'An account with this email already exists.'
      });
    });
  });

  describe('loginUser', () => {
    it('returns tokens for valid active users with correct credentials', async () => {
      const mockUser = buildMockUser();
      const select = jest.fn().mockResolvedValue(mockUser);

      User.findOne.mockReturnValue({ select });

      const result = await authService.loginUser('TEST@example.com', 'Password1@');

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(select).toHaveBeenCalledWith('+password +refreshToken');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('Password1@');
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('throws unauthorized when the user does not exist', async () => {
      const select = jest.fn().mockResolvedValue(null);
      User.findOne.mockReturnValue({ select });

      await expect(
        authService.loginUser('missing@example.com', 'Password1@')
      ).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid email or password.'
      });
    });

    it('throws unauthorized when the password is incorrect', async () => {
      const mockUser = buildMockUser({
        comparePassword: jest.fn().mockResolvedValue(false)
      });
      const select = jest.fn().mockResolvedValue(mockUser);

      User.findOne.mockReturnValue({ select });

      await expect(
        authService.loginUser('test@example.com', 'WrongPassword1@')
      ).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid email or password.'
      });
    });

    it('throws unauthorized when the account is inactive', async () => {
      const mockUser = buildMockUser({
        isActive: false
      });
      const select = jest.fn().mockResolvedValue(mockUser);

      User.findOne.mockReturnValue({ select });

      await expect(
        authService.loginUser('test@example.com', 'Password1@')
      ).rejects.toMatchObject({
        statusCode: 401,
        message: 'This account is inactive.'
      });
    });
  });
});
