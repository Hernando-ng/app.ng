import { POST as pusherAuthHandler } from '@/app/api/pusher/auth/route';
import { POST as createConversationHandler } from '@/app/api/conversations/route';
import { POST as signupHandler } from '@/app/api/auth/signup/route';

describe('Pusher Private Channel Auth API Unit Tests', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let convId: string;

  beforeAll(async () => {
    const r1 = await signupHandler(new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Member', email: 'member@example.com', password: 'password123' }),
    }));
    const d1 = await r1.json();
    user1Token = d1.token;
    user1Id = d1.user.id;

    const r2 = await signupHandler(new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'NonMember', email: 'nonmember@example.com', password: 'password123' }),
    }));
    const d2 = await r2.json();
    user2Token = d2.token;
    user2Id = d2.user.id;

    // Create conversation with user1
    const convRes = await createConversationHandler(new Request('http://localhost:3000/api/conversations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isGroup: true, name: 'Secret Group' }),
    }));
    const convData = await convRes.json();
    convId = convData.conversation.id;
  });

  it('should authorize channel subscription for valid conversation member', async () => {
    const req = new Request('http://localhost:3000/api/pusher/auth', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `socket_id=123.456&channel_name=private-conversation-${convId}`,
    });

    const res = await pusherAuthHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.auth).toBeDefined();
  });

  it('should reject channel subscription for non-member', async () => {
    const req = new Request('http://localhost:3000/api/pusher/auth', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `socket_id=123.456&channel_name=private-conversation-${convId}`,
    });

    const res = await pusherAuthHandler(req);
    expect(res.status).toBe(403);
  });
});
