const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const request = require('supertest');

const app = require('../../src/app');
const config = require('../../src/config/config');
const User = require('../../src/modules/users/user.model');

const buildRequester = (ipAddress) => {
  return (method, path) => request(app)[method](path).set('X-Forwarded-For', ipAddress);
};

const extractRefreshCookie = (response) => {
  return response.headers['set-cookie']?.find((cookie) => cookie.startsWith('refreshToken='));
};

describe('Auth integration', () => {
  beforeAll(() => {
    // Trusting the forwarded IP in tests keeps rate limiting deterministic without altering app code.
    app.set('trust proxy', 1);
  });

  it('registers a user, hashes the stored password, and returns access credentials', async () => {
    const post = buildRequester('10.0.0.1');

    const response = await post('post', '/api/v1/auth/register').send({
      name: 'Register User',
      email: 'register@example.com',
      password: 'Password1@'
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('register@example.com');
    expect(response.body.data.accessToken).toBeTruthy();
    expect(extractRefreshCookie(response)).toBeTruthy();

    const persistedUser = await User.findOne({ email: 'register@example.com' }).select('+password');
    expect(persistedUser.password).not.toBe('Password1@');
    await expect(bcrypt.compare('Password1@', persistedUser.password)).resolves.toBe(true);
  });

  it('rejects duplicate registration attempts', async () => {
    const post = buildRequester('10.0.0.2');

    await User.create({
      name: 'Existing User',
      email: 'existing@example.com',
      password: 'Password1@'
    });

    const response = await post('post', '/api/v1/auth/register').send({
      name: 'Existing User',
      email: 'existing@example.com',
      password: 'Password1@'
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('An account with this email already exists.');
  });

  it('rejects invalid registration payloads', async () => {
    const post = buildRequester('10.0.0.3');

    const response = await post('post', '/api/v1/auth/register').send({
      name: 'A',
      email: 'invalid-email',
      password: 'short'
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  it('logs users in with valid credentials', async () => {
    const post = buildRequester('10.0.0.4');

    await User.create({
      name: 'Login User',
      email: 'login@example.com',
      password: 'Password1@'
    });

    const response = await post('post', '/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'Password1@'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('login@example.com');
    expect(response.body.data.accessToken).toBeTruthy();
    expect(extractRefreshCookie(response)).toBeTruthy();
  });

  it('rejects invalid passwords during login', async () => {
    const post = buildRequester('10.0.0.5');

    await User.create({
      name: 'Wrong Password User',
      email: 'wrong-password@example.com',
      password: 'Password1@'
    });

    const response = await post('post', '/api/v1/auth/login').send({
      email: 'wrong-password@example.com',
      password: 'WrongPassword1@'
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid email or password.');
  });

  it('rejects login for nonexistent users', async () => {
    const post = buildRequester('10.0.0.6');

    const response = await post('post', '/api/v1/auth/login').send({
      email: 'missing@example.com',
      password: 'Password1@'
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid email or password.');
  });

  it('logs out authenticated users and clears the refresh cookie', async () => {
    const post = buildRequester('10.0.0.7');
    const user = await User.create({
      name: 'Logout User',
      email: 'logout@example.com',
      password: 'Password1@'
    });
    const accessToken = user.generateAccessToken();

    const response = await post('post', '/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.headers['set-cookie']?.some((cookie) => cookie.startsWith('refreshToken='))).toBe(
      true
    );
  });

  it('requires authentication for logout', async () => {
    const post = buildRequester('10.0.0.8');

    const response = await post('post', '/api/v1/auth/logout').send();

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Access token is required.');
  });

  it('refreshes the access token from the httpOnly refresh cookie', async () => {
    const agent = request.agent(app);

    const registerResponse = await agent
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', '10.0.0.9')
      .send({
        name: 'Refresh User',
        email: 'refresh@example.com',
        password: 'Password1@'
      });

    expect(registerResponse.statusCode).toBe(201);

    const response = await agent
      .post('/api/v1/auth/refresh-token')
      .set('X-Forwarded-For', '10.0.0.9')
      .send();

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeTruthy();
  });

  it('rejects invalid refresh tokens', async () => {
    const post = buildRequester('10.0.0.10');

    const response = await post('post', '/api/v1/auth/refresh-token')
      .set('Cookie', ['refreshToken=invalid-token'])
      .send();

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid refresh token.');
  });

  it('rejects expired refresh tokens', async () => {
    const post = buildRequester('10.0.0.11');
    const expiredToken = jwt.sign(
      {
        userId: '507f1f77bcf86cd799439011',
        role: 'user'
      },
      config.jwt.refreshSecret,
      {
        expiresIn: '1ms'
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 25));

    const response = await post('post', '/api/v1/auth/refresh-token')
      .set('Cookie', [`refreshToken=${expiredToken}`])
      .send();

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Refresh token has expired.');
  });
});
