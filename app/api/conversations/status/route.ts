import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';
import { triggerRealtimeEvent } from '@/lib/pusher';

export async function POST(req: Request) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, conversationId, messageId, isTyping } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
    }

    const member = db.prepare('SELECT id FROM ConversationMember WHERE conversationId = ? AND userId = ?').get(conversationId, auth.userId);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'TYPING') {
      await triggerRealtimeEvent(`private-conversation-${conversationId}`, 'typing-indicator', {
        userId: auth.userId,
        isTyping: Boolean(isTyping)
      });
      return NextResponse.json({ success: true });
    } else if (action === 'MARK_READ') {
      if (!messageId) {
        // Mark all messages in conversation as read
        const unreadMessages: any[] = db.prepare(`
          SELECT mr.id, mr.messageId
          FROM MessageReceipt mr
          JOIN Message m ON mr.messageId = m.id
          WHERE m.conversationId = ? AND mr.userId = ? AND mr.status != 'READ'
        `).all(conversationId, auth.userId);

        for (const unread of unreadMessages) {
          db.prepare(`
            UPDATE MessageReceipt
            SET status = 'READ', readAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(unread.id);
        }

        await triggerRealtimeEvent(`private-conversation-${conversationId}`, 'messages-read', {
          conversationId,
          readByUserId: auth.userId
        });
      } else {
        db.prepare(`
          UPDATE MessageReceipt
          SET status = 'READ', readAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
          WHERE messageId = ? AND userId = ?
        `).run(messageId, auth.userId);

        await triggerRealtimeEvent(`private-conversation-${conversationId}`, 'message-read', {
          messageId,
          readByUserId: auth.userId
        });
      }
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}
