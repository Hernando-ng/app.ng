import { POST as createConversationHandler } from '@/app/api/conversations/route';
import { POST as sendMessageHandler, GET as getMessagesHandler } from '@/app/api/conversations/[id]/messages/route';
import { PUT as editMessageHandler, DELETE as deleteMessageHandler } from '@/app/api/conversations/[id]/messages/[messageId]/route';
import { POST as signupHandler } from '@/app/api/auth/signup/route';

describe('Advanced Message Actions API Unit Tests', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let convId: string;

  beforeAll(async () => {
    const res1 = await signupHandler(new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User 1', email: 'action1@example.com', password: 'password123' }),
    }));
    const d1 = await res1.json();
    user1Token = d1.token;
    user1Id = d1.user.id;

    const res2 = await signupHandler(new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User 2', email: 'action2@example.com', password: 'password123' }),
    }));
    const d2 = await res2.json();
    user2Token = d2.token;
    user2Id = d2.user.id;

    const convRes = await createConversationHandler(new Request('http://localhost:3000/api/conversations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isGroup: false, recipientId: user2Id }),
    }));
    const convData = await convRes.json();
    convId = convData.conversation.id;
  });

  it('should support reply/quote and forwarding messages', async () => {
    // Send message 1
    const m1Res = await sendMessageHandler(new Request(`http://localhost:3000/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Original message' }),
    }), { params: { id: convId } });
    const m1Data = await m1Res.json();

    // Reply to message 1
    const replyRes = await sendMessageHandler(new Request(`http://localhost:3000/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Reply to original', replyToId: m1Data.message.id }),
    }), { params: { id: convId } });
    const replyData = await replyRes.json();

    expect(replyRes.status).toBe(201);
    expect(replyData.message.replyToId).toBe(m1Data.message.id);

    // Forward message 1
    const fwdRes = await sendMessageHandler(new Request(`http://localhost:3000/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: m1Data.message.content, isForwarded: true }),
    }), { params: { id: convId } });
    const fwdData = await fwdRes.json();

    expect(fwdRes.status).toBe(201);
    expect(fwdData.message.isForwarded).toBe(true);
  });

  it('should edit a message within edit window', async () => {
    const msgRes = await sendMessageHandler(new Request(`http://localhost:3000/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Text with typo' }),
    }), { params: { id: convId } });
    const msgData = await msgRes.json();
    const msgId = msgData.message.id;

    const editRes = await editMessageHandler(new Request(`http://localhost:3000/api/conversations/${convId}/messages/${msgId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Text corrected' }),
    }), { params: { id: convId, messageId: msgId } });

    const editData = await editRes.json();
    expect(editRes.status).toBe(200);
    expect(editData.message.content).toBe('Text corrected');
    expect(editData.message.isEdited).toBe(1);
  });

  it('should delete message for everyone vs delete for me', async () => {
    const msgRes = await sendMessageHandler(new Request(`http://localhost:3000/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Secret message' }),
    }), { params: { id: convId } });
    const msgData = await msgRes.json();
    const msgId = msgData.message.id;

    // Delete for everyone
    const delRes = await deleteMessageHandler(new Request(`http://localhost:3000/api/conversations/${convId}/messages/${msgId}?mode=FOR_EVERYONE`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user1Token}` },
    }), { params: { id: convId, messageId: msgId } });

    expect(delRes.status).toBe(200);

    const getRes = await getMessagesHandler(new Request(`http://localhost:3000/api/conversations/${convId}/messages`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${user2Token}` },
    }), { params: { id: convId } });

    const getData = await getRes.json();
    const deletedMsg = getData.messages.find((m: any) => m.id === msgId);
    expect(deletedMsg.content).toBe('This message was deleted');
    expect(deletedMsg.deletedForEveryone).toBe(true);
  });
});
