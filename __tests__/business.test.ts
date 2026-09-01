import { GET as getBusinessHandler, POST as saveBusinessHandler } from '@/app/api/business/route';
import { POST as signupHandler } from '@/app/api/auth/signup/route';

describe('Business Profile API Unit Tests', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const signupReq = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dave Enterprise',
        email: 'dave@enterprise.com',
        password: 'password123',
      }),
    });
    const signupRes = await signupHandler(signupReq);
    const signupData = await signupRes.json();
    token = signupData.token;
    userId = signupData.user.id;
  });

  it('should create a new business profile and ignore user attempt to set isVerified', async () => {
    const req = new Request('http://localhost:3000/api/business', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName: 'Dave Tech Solutions',
        category: 'Software & Technology',
        description: 'Providing top-notch software development',
        operatingHours: 'Mon-Fri 09:00 - 18:00',
        contactEmail: 'contact@davetech.com',
        contactPhone: '+1999888777',
        isVerified: true, // User attempt to self-verify should be ignored
      }),
    });

    const res = await saveBusinessHandler(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.businessProfile.businessName).toBe('Dave Tech Solutions');
    expect(data.businessProfile.category).toBe('Software & Technology');
    expect(data.businessProfile.isVerified).toBe(false); // Secured: remains false
  });

  it('should retrieve the created business profile', async () => {
    const req = new Request(`http://localhost:3000/api/business?userId=${userId}`, {
      method: 'GET',
    });

    const res = await getBusinessHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.businessProfile.businessName).toBe('Dave Tech Solutions');
    expect(data.businessProfile.contactEmail).toBe('contact@davetech.com');
  });
});
