import { POST as createConversationHandler, GET as getConversationsHandler } from '@/app/api/conversations/route';
import { PUT as updateConversationHandler } from '@/app/api/conversations/[id]/route';
import { POST as signupHandler } from '@/app/api/auth/signup/route';

describe('Conversation & Group Management API Unit Tests', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let user3Id: string;

  beforeAll(async () => {
    // Signup User 1
    const res1 = await signupHandler(new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User One', email: 'u1@example.com', password: 'password123' }),
    }));
    const d1 = await res1.json();
    user1Token = d1.token;
    user1Id = d1.user.id;

    // Signup User 2
    const res2 = await signupHandler(new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Two', email: 'u2@example.com', password: 'password123' }),
    }));
    const d2 = await res2.json();
    user2Token = d2.token;
    user2Id = d2.user.id;

    // Signup User 3
    const res3 = await signupHandler(new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Three', email: 'u3@example.com', password: 'password123' }),
    }));
    const d3 = await res3.json();
    user3Id = d3.user.id;
  });

  it('should create a 1:1 direct conversation', async () => {
    const req = new Request('http://localhost:3000/api/conversations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isGroup: false, recipientId: user2Id }),
    });

    const res = await createConversationHandler(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.conversation.isGroup).toBe(false);
    expect(data.conversation.members.length).toBe(2);
  });

  it('should create a group conversation', async () => {
    const req = new Request('http://localhost:3000/api/conversations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isGroup: true,
        name: 'Project Alpha',
        description: 'Alpha team discussion',
        memberIds: [user2Id],
      }),
    });

    const res = await createConversationHandler(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.conversation.isGroup).toBe(true);
    expect(data.conversation.name).toBe('Project Alpha');
    expect(data.conversation.members.length).toBe(2);

    const admin = data.conversation.members.find((m: any) => m.userId === user1Id);
    expect(admin.isAdmin).toBe(true);
  });

  it('should add member and promote to admin in group', async () => {
    // Get user1 group
    const listReq = new Request('http://localhost:3000/api/conversations', {
      method: 'GET',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const listRes = await getConversationsHandler(listReq);
    const listData = await listRes.json();
    const group = listData.conversations.find((c: any) => c.isGroup);

    // Add user3
    const addReq = new Request(`http://localhost:3000/api/conversations/${group.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ADD_MEMBER', targetUserId: user3Id }),
    });

    const addRes = await updateConversationHandler(addReq, { params: { id: group.id } });
    const addData = await addRes.json();

    expect(addRes.status).toBe(200);
    expect(addData.conversation.members.length).toBe(3);

    // Promote user2 to admin
    const adminReq = new Request(`http://localhost:3000/api/conversations/${group.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SET_ADMIN', targetUserId: user2Id, isAdmin: true }),
    });

    const adminRes = await updateConversationHandler(adminReq, { params: { id: group.id } });
    const adminData = await adminRes.json();

    const promotedMember = adminData.conversation.members.find((m: any) => m.userId === user2Id);
    expect(promotedMember.isAdmin).toBe(true);
  });
});
