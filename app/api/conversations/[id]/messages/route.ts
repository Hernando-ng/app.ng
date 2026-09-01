import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';
import { triggerRealtimeEvent } from '@/lib/pusher';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;

    // Check member
    const member = db.prepare('SELECT id FROM ConversationMember WHERE conversationId = ? AND userId = ?').get(conversationId, auth.userId);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check viewer privacy settings
    const viewerPrivacy: any = db.prepare('SELECT readReceiptsEnabled FROM PrivacySettings WHERE userId = ?').get(auth.userId);
    const viewerReadReceiptsEnabled = viewerPrivacy ? Boolean(viewerPrivacy.readReceiptsEnabled) : true;

    const messages = db.prepare(`
      SELECT m.*, u.name as senderName, u.image as senderImage
      FROM Message m
      JOIN User u ON m.senderId = u.id
      WHERE m.conversationId = ?
        AND m.id NOT IN (SELECT messageId FROM MessageDelete WHERE userId = ?)
      ORDER BY m.createdAt ASC
    `).all(conversationId, auth.userId);

    const enrichedMessages = messages.map((m: any) => {
      let receipts = db.prepare(`
        SELECT mr.*, u.name
        FROM MessageReceipt mr
        JOIN User u ON mr.userId = u.id
        WHERE mr.messageId = ?
      `).all(m.id);

      // Check sender privacy settings
      const senderPrivacy: any = db.prepare('SELECT readReceiptsEnabled FROM PrivacySettings WHERE userId = ?').get(m.senderId);
      const senderReadReceiptsEnabled = senderPrivacy ? Boolean(senderPrivacy.readReceiptsEnabled) : true;

      // Server-side privacy enforcement: if viewer OR sender has read receipts disabled, mask READ status to DELIVERED
      if (!viewerReadReceiptsEnabled || !senderReadReceiptsEnabled) {
        receipts = receipts.map((r: any) => ({
          ...r,
          status: r.status === 'READ' ? 'DELIVERED' : r.status
        }));
      }

      const replyTo = m.replyToId
        ? db.prepare('SELECT id, content, senderId FROM Message WHERE id = ?').get(m.replyToId)
        : null;

      return {
        ...m,
        isForwarded: Boolean(m.isForwarded),
        isEdited: Boolean(m.isEdited),
        deletedForEveryone: Boolean(m.deletedForEveryone),
        replyTo,
        receipts: receipts.map((r: any) => ({ ...r }))
      };
    });

    return NextResponse.json({ messages: enrichedMessages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;

    // Check member
    const member = db.prepare('SELECT id FROM ConversationMember WHERE conversationId = ? AND userId = ?').get(conversationId, auth.userId);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { content, mediaUrl, mediaType, fileName, fileSize, replyToId, isForwarded } = body;

    if (!content && !mediaUrl) {
      return NextResponse.json({ error: 'Message content or media is required' }, { status: 400 });
    }

    const messageId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO Message (id, conversationId, senderId, content, mediaUrl, mediaType, fileName, fileSize, replyToId, isForwarded)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      messageId,
      conversationId,
      auth.userId,
      content || null,
      mediaUrl || null,
      mediaType || null,
      fileName || null,
      fileSize || null,
      replyToId || null,
      isForwarded ? 1 : 0
    );

    // Update conversation timestamp
    db.prepare('UPDATE Conversation SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(conversationId);

    // Create initial DELIVERED receipts for other conversation members
    const otherMembers: any[] = db.prepare('SELECT userId FROM ConversationMember WHERE conversationId = ? AND userId != ?').all(conversationId, auth.userId);
    for (const om of otherMembers) {
      db.prepare(`
        INSERT INTO MessageReceipt (id, messageId, userId, status)
        VALUES (?, ?, ?, 'DELIVERED')
      `).run(crypto.randomUUID(), messageId, om.userId);
    }

    const message: any = db.prepare(`
      SELECT m.*, u.name as senderName, u.image as senderImage
      FROM Message m
      JOIN User u ON m.senderId = u.id
      WHERE m.id = ?
    `).get(messageId);

    const receipts = db.prepare('SELECT * FROM MessageReceipt WHERE messageId = ?').all(messageId);

    const fullMessage = {
      ...message,
      isForwarded: Boolean(message.isForwarded),
      isEdited: Boolean(message.isEdited),
      deletedForEveryone: Boolean(message.deletedForEveryone),
      receipts
    };

    // Real-time broadcast on private conversation channel
    await triggerRealtimeEvent(`private-conversation-${conversationId}`, 'new-message', fullMessage);

    return NextResponse.json({ message: fullMessage }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}
