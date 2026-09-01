import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';
import { triggerRealtimeEvent } from '@/lib/pusher';

export async function PUT(req: Request, { params }: { params: { id: string; messageId: string } }) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId, messageId } = params;

    const message: any = db.prepare('SELECT * FROM Message WHERE id = ? AND conversationId = ?').get(messageId, conversationId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.senderId !== auth.userId) {
      return NextResponse.json({ error: 'Only message sender can edit' }, { status: 403 });
    }

    // Check edit window (e.g., 15 minutes)
    const createdAt = new Date(message.createdAt).getTime();
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;

    if (now - createdAt > fifteenMinutes) {
      return NextResponse.json({ error: 'Edit window expired (15 minutes limit)' }, { status: 400 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    db.prepare(`
      UPDATE Message
      SET content = ?, isEdited = 1, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(content, messageId);

    const updatedMessage = db.prepare('SELECT * FROM Message WHERE id = ?').get(messageId);

    await triggerRealtimeEvent(`private-conversation-${conversationId}`, 'message-edited', updatedMessage);

    return NextResponse.json({ message: updatedMessage });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Edit failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string; messageId: string } }) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId, messageId } = params;
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'FOR_ME'; // FOR_ME or FOR_EVERYONE

    const message: any = db.prepare('SELECT * FROM Message WHERE id = ? AND conversationId = ?').get(messageId, conversationId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (mode === 'FOR_EVERYONE') {
      if (message.senderId !== auth.userId) {
        return NextResponse.json({ error: 'Only message sender can delete for everyone' }, { status: 403 });
      }

      db.prepare(`
        UPDATE Message
        SET content = 'This message was deleted', mediaUrl = NULL, deletedForEveryone = 1, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(messageId);

      await triggerRealtimeEvent(`private-conversation-${conversationId}`, 'message-deleted', { messageId, mode: 'FOR_EVERYONE' });
    } else {
      db.prepare(`
        INSERT OR IGNORE INTO MessageDelete (id, messageId, userId)
        VALUES (?, ?, ?)
      `).run(crypto.randomUUID(), messageId, auth.userId);
    }

    return NextResponse.json({ success: true, messageId, mode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}
