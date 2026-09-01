import { GET as getProfileHandler, PUT as updateProfileHandler } from '@/app/api/profile/route';
import { POST as signupHandler } from '@/app/api/auth/signup/route';

describe('User Profile API Unit Tests', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const signupReq = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Charlie',
        email: 'charlie@example.com',
        password: 'password123',
      }),
    });
    const signupRes = await signupHandler(signupReq);
    const signupData = await signupRes.json();
    token = signupData.token;
    userId = signupData.user.id;
  });

  it('should fetch user profile', async () => {
    const req = new Request('http://localhost:3000/api/profile', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await getProfileHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.id).toBe(userId);
    expect(data.user.name).toBe('Charlie');
  });

  it('should update user display name, bio, and phone verification', async () => {
    const req = new Request('http://localhost:3000/api/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Charlie Brown',
        bio: 'Coding day and night',
        isPhoneVerified: true,
      }),
    });

    const res = await updateProfileHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.name).toBe('Charlie Brown');
    expect(data.user.bio).toBe('Coding day and night');
    expect(data.user.isPhoneVerified).toBe(true);
  });
});
