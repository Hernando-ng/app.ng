import { POST as signupHandler } from '@/app/api/auth/signup/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { verifyToken } from '@/lib/auth';

describe('Auth API Unit Tests', () => {
  it('should sign up a new user with email and password', async () => {
    const req = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      }),
    });

    const res = await signupHandler(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe('alice@example.com');

    const decoded = verifyToken(data.token);
    expect(decoded?.userId).toBe(data.user.id);
  });

  it('should sign up a user with phone number', async () => {
    const req = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob',
        phone: '+1234567890',
        password: 'password123',
      }),
    });

    const res = await signupHandler(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.user.phone).toBe('+1234567890');
  });

  it('should log in an existing user with email', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'alice@example.com',
        password: 'password123',
      }),
    });

    const res = await loginHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.token).toBeDefined();
    expect(data.user.name).toBe('Alice');
  });

  it('should reject login with invalid password', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'alice@example.com',
        password: 'wrongpassword',
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);
  });
});
