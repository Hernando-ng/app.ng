import { POST as createConversationHandler } from '@/app/api/conversations/route';
import { POST as sendMessageHandler } from '@/app/api/conversations/[id]/messages/route';
import { GET as searchMessagesHandler } from '@/app/api/conversations/[id]/search/route';
import { POST as signupHandler } from '@/app/api/auth/signup/route';

describe('Message Search API Unit Tests', () => {
  let token: string;
  let userId: string;
  let convId: string;

  beforeAll(async () => {
    const res1 = await signupHandler(new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Searcher', email: 'searcher@example.com', password: 'password123' }),
    }));
    const d1 = await res1.json();
    token = d1.token;
    userId = d1.user.id;

    const res2 = await signupHandler(new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Partner', email: 'partner@example.com', password: 'password123' }),
    }));
    const d2 = await res2.json();

    const convRes = await createConversationHandler(new Request('http://localhost:3000/api/conversations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isGroup: false, recipientId: d2.user.id }),
    }));
    const convData = await convRes.json();
    convId = convData.conversation.id;

    // Send messages
    await sendMessageHandler(new Request(`http://localhost:3000/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'We are discussing project deployment details' }),
    }), { params: { id: convId } });

    await sendMessageHandler(new Request(`http://localhost:3000/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Remember to check database migrations' }),
    }), { params: { id: convId } });
  });

  it('should search and return matching messages within conversation', async () => {
    const req = new Request(`http://localhost:3000/api/conversations/${convId}/search?q=deployment`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await searchMessagesHandler(req, { params: { id: convId } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.messages.length).toBe(1);
    expect(data.messages[0].content).toContain('deployment');
  });

  it('should return empty list if no messages match query', async () => {
    const req = new Request(`http://localhost:3000/api/conversations/${convId}/search?q=unrelatedkeyword`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await searchMessagesHandler(req, { params: { id: convId } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.messages.length).toBe(0);
  });
});
