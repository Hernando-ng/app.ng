import { POST as signupHandler } from '@/app/api/auth/signup/route';
import { POST as createConversationHandler } from '@/app/api/conversations/route';
import { POST as sendMessageHandler, GET as getMessagesHandler } from '@/app/api/conversations/[id]/messages/route';
import { POST as statusHandler } from '@/app/api/conversations/status/route';
import { PUT as updatePrivacyHandler } from '@/app/api/privacy/route';

describe('Privacy Server-Side Enforcement API Unit Tests', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let convId: string;

  beforeAll(async () => {
    const r1 = await signupHandler(new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User 1', email: 'p1@example.com', password: 'password123' }),
    }));
    const d1 = await r1.json();
    user1Token = d1.token;
    user1Id = d1.user.id;

    const r2 = await signupHandler(new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User 2', email: 'p2@example.com', password: 'password123' }),
    }));
    const d2 = await r2.json();
    user2Token = d2.token;
    user2Id = d2.user.id;

    // Create 1:1 conversation
    const convRes = await createConversationHandler(new Request('http://localhost:3000/api/conversations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isGroup: false, recipientId: user2Id }),
    }));
    const convData = await convRes.json();
    convId = convData.conversation.id;

    // Send message from user 1
    await sendMessageHandler(new Request(`http://localhost:3000/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Message with privacy check' }),
    }), { params: { id: convId } });

    // Mark read by user 2
    await statusHandler(new Request('http://localhost:3000/api/conversations/status', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'MARK_READ', conversationId: convId }),
    }));
  });

  it('should reflect READ status when read receipts are enabled for both', async () => {
    const res = await getMessagesHandler(new Request(`http://localhost:3000/api/conversations/${convId}/messages`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${user1Token}` },
    }), { params: { id: convId } });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.messages[0].receipts[0].status).toBe('READ');
  });

  it('should mask READ status to DELIVERED when viewer turns off read receipts', async () => {
    // User 1 turns off read receipts
    await updatePrivacyHandler(new Request('http://localhost:3000/api/privacy', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ readReceiptsEnabled: false }),
    }));

    const res = await getMessagesHandler(new Request(`http://localhost:3000/api/conversations/${convId}/messages`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${user1Token}` },
    }), { params: { id: convId } });

    const data = await res.json();
    expect(res.status).toBe(200);
    // Server-side privacy enforcement masks status to DELIVERED
    expect(data.messages[0].receipts[0].status).toBe('DELIVERED');
  });
});
