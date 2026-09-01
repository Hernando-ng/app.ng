import { POST as createConversationHandler } from '@/app/api/conversations/route';
import { POST as sendMessageHandler, GET as getMessagesHandler } from '@/app/api/conversations/[id]/messages/route';
import { POST as statusHandler } from '@/app/api/conversations/status/route';
import { POST as signupHandler } from '@/app/api/auth/signup/route';

describe('Real-time Messaging & Status API Unit Tests', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let convId: string;

  beforeAll(async () => {
    const res1 = await signupHandler(new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sender', email: 'sender@example.com', password: 'password123' }),
    }));
    const d1 = await res1.json();
    user1Token = d1.token;
    user1Id = d1.user.id;

    const res2 = await signupHandler(new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Receiver', email: 'receiver@example.com', password: 'password123' }),
    }));
    const d2 = await res2.json();
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
  });

  it('should send a text message in conversation', async () => {
    const req = new Request(`http://localhost:3000/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Hello there!' }),
    });

    const res = await sendMessageHandler(req, { params: { id: convId } });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.message.content).toBe('Hello there!');
    expect(data.message.senderId).toBe(user1Id);
    expect(data.message.receipts.length).toBe(1);
    expect(data.message.receipts[0].status).toBe('DELIVERED');
  });

  it('should fetch conversation messages', async () => {
    const req = new Request(`http://localhost:3000/api/conversations/${convId}/messages`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    const res = await getMessagesHandler(req, { params: { id: convId } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.messages.length).toBe(1);
    expect(data.messages[0].content).toBe('Hello there!');
  });

  it('should trigger typing indicator and mark messages as read', async () => {
    // Typing action
    const typingReq = new Request('http://localhost:3000/api/conversations/status', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'TYPING', conversationId: convId, isTyping: true }),
    });

    const typingRes = await statusHandler(typingReq);
    expect(typingRes.status).toBe(200);

    // Read receipts action by receiver
    const readReq = new Request('http://localhost:3000/api/conversations/status', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'MARK_READ', conversationId: convId }),
    });

    const readRes = await statusHandler(readReq);
    expect(readRes.status).toBe(200);

    // Verify receipt status changed to READ
    const getReq = new Request(`http://localhost:3000/api/conversations/${convId}/messages`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const getRes = await getMessagesHandler(getReq, { params: { id: convId } });
    const getData = await getRes.json();

    expect(getData.messages[0].receipts[0].status).toBe('READ');
  });
});
