import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;
    const conversation: any = db.prepare('SELECT * FROM Conversation WHERE id = ?').get(conversationId);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const member: any = db.prepare('SELECT * FROM ConversationMember WHERE conversationId = ? AND userId = ?').get(conversationId, auth.userId);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action, name, groupImage, description, targetUserId, isAdmin } = body;

    if (action === 'UPDATE_DETAILS') {
      if (!conversation.isGroup) {
        return NextResponse.json({ error: 'Cannot update details on 1:1 conversation' }, { status: 400 });
      }
      if (!member.isAdmin) {
        return NextResponse.json({ error: 'Only admins can update group details' }, { status: 403 });
      }

      const newName = name !== undefined ? name : conversation.name;
      const newImage = groupImage !== undefined ? groupImage : conversation.groupImage;
      const newDesc = description !== undefined ? description : conversation.description;

      db.prepare(`
        UPDATE Conversation
        SET name = ?, groupImage = ?, description = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newName, newImage, newDesc, conversationId);
    } else if (action === 'ADD_MEMBER') {
      if (!conversation.isGroup) {
        return NextResponse.json({ error: 'Cannot add members to 1:1 conversation' }, { status: 400 });
      }
      if (!member.isAdmin) {
        return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 });
      }
      if (!targetUserId) {
        return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
      }

      db.prepare(`
        INSERT OR IGNORE INTO ConversationMember (id, conversationId, userId, isAdmin)
        VALUES (?, ?, ?, 0)
      `).run(crypto.randomUUID(), conversationId, targetUserId);
    } else if (action === 'REMOVE_MEMBER') {
      if (!conversation.isGroup) {
        return NextResponse.json({ error: 'Cannot remove members from 1:1 conversation' }, { status: 400 });
      }
      if (!member.isAdmin && targetUserId !== auth.userId) {
        return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 });
      }

      db.prepare('DELETE FROM ConversationMember WHERE conversationId = ? AND userId = ?').run(conversationId, targetUserId);
    } else if (action === 'SET_ADMIN') {
      if (!conversation.isGroup) {
        return NextResponse.json({ error: 'Cannot set admin in 1:1 conversation' }, { status: 400 });
      }
      if (!member.isAdmin) {
        return NextResponse.json({ error: 'Only admins can set admin status' }, { status: 403 });
      }

      db.prepare('UPDATE ConversationMember SET isAdmin = ? WHERE conversationId = ? AND userId = ?')
        .run(isAdmin ? 1 : 0, conversationId, targetUserId);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedConv: any = db.prepare('SELECT * FROM Conversation WHERE id = ?').get(conversationId);
    const updatedMembers = db.prepare(`
      SELECT cm.id, cm.conversationId, cm.userId, cm.isAdmin, cm.joinedAt, u.name, u.email
      FROM ConversationMember cm
      JOIN User u ON cm.userId = u.id
      WHERE cm.conversationId = ?
    `).all(conversationId);

    return NextResponse.json({
      conversation: {
        ...updatedConv,
        isGroup: Boolean(updatedConv.isGroup),
        members: updatedMembers.map((m: any) => ({ ...m, isAdmin: Boolean(m.isAdmin) }))
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update conversation' }, { status: 500 });
  }
}
