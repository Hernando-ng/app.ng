import { GET as getPrivacyHandler, PUT as updatePrivacyHandler } from '@/app/api/privacy/route';
import { POST as signupHandler } from '@/app/api/auth/signup/route';

describe('Privacy Settings API Unit Tests', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const signupReq = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Eve',
        email: 'eve@example.com',
        password: 'password123',
      }),
    });
    const signupRes = await signupHandler(signupReq);
    const signupData = await signupRes.json();
    token = signupData.token;
    userId = signupData.user.id;
  });

  it('should get default privacy settings', async () => {
    const req = new Request('http://localhost:3000/api/privacy', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await getPrivacyHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.privacySettings.profileVisibility).toBe('EVERYONE');
    expect(data.privacySettings.lastSeenVisibility).toBe('EVERYONE');
    expect(data.privacySettings.readReceiptsEnabled).toBe(true);
  });

  it('should update privacy settings', async () => {
    const req = new Request('http://localhost:3000/api/privacy', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileVisibility: 'CONTACTS',
        lastSeenVisibility: 'NOBODY',
        readReceiptsEnabled: false,
      }),
    });

    const res = await updatePrivacyHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.privacySettings.profileVisibility).toBe('CONTACTS');
    expect(data.privacySettings.lastSeenVisibility).toBe('NOBODY');
    expect(data.privacySettings.readReceiptsEnabled).toBe(false);
  });
});
