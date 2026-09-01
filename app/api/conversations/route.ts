import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = db.prepare(`
      SELECT c.*, cm.isAdmin, cm.joinedAt
      FROM Conversation c
      JOIN ConversationMember cm ON c.id = cm.conversationId
      WHERE cm.userId = ?
      ORDER BY c.updatedAt DESC
    `).all(auth.userId);

    const enriched = conversations.map((conv: any) => {
      const members = db.prepare(`
        SELECT cm.id, cm.conversationId, cm.userId, cm.isAdmin, cm.joinedAt,
               u.name, u.email, u.phone, u.image, u.bio
        FROM ConversationMember cm
        JOIN User u ON cm.userId = u.id
        WHERE cm.conversationId = ?
      `).all(conv.id);

      const lastMessage = db.prepare(`
        SELECT * FROM Message
        WHERE conversationId = ?
        ORDER BY createdAt DESC
        LIMIT 1
      `).get(conv.id);

      return {
        ...conv,
        isGroup: Boolean(conv.isGroup),
        isAdmin: Boolean(conv.isAdmin),
        members: members.map((m: any) => ({ ...m, isAdmin: Boolean(m.isAdmin) })),
        lastMessage
      };
    });

    return NextResponse.json({ conversations: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { isGroup, name, recipientId, memberIds, groupImage, description } = body;

    if (isGroup) {
      if (!name) {
        return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
      }

      const convId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO Conversation (id, isGroup, name, groupImage, description)
        VALUES (?, 1, ?, ?, ?)
      `).run(convId, name, groupImage || null, description || null);

      // Add creator as admin
      db.prepare(`
        INSERT INTO ConversationMember (id, conversationId, userId, isAdmin)
        VALUES (?, ?, ?, 1)
      `).run(crypto.randomUUID(), convId, auth.userId);

      // Add other members
      if (Array.isArray(memberIds)) {
        for (const mid of memberIds) {
          if (mid !== auth.userId) {
            db.prepare(`
              INSERT OR IGNORE INTO ConversationMember (id, conversationId, userId, isAdmin)
              VALUES (?, ?, ?, 0)
            `).run(crypto.randomUUID(), convId, mid);
          }
        }
      }

      const conversation: any = db.prepare('SELECT * FROM Conversation WHERE id = ?').get(convId);
      const members = db.prepare('SELECT * FROM ConversationMember WHERE conversationId = ?').all(convId);

      return NextResponse.json({
        conversation: {
          ...conversation,
          isGroup: true,
          members: members.map((m: any) => ({ ...m, isAdmin: Boolean(m.isAdmin) }))
        }
      }, { status: 201 });
    } else {
      if (!recipientId) {
        return NextResponse.json({ error: 'recipientId is required for 1:1 conversation' }, { status: 400 });
      }

      // Check if 1:1 conversation already exists
      const existing = db.prepare(`
        SELECT c.id
        FROM Conversation c
        JOIN ConversationMember cm1 ON c.id = cm1.conversationId
        JOIN ConversationMember cm2 ON c.id = cm2.conversationId
        WHERE c.isGroup = 0 AND cm1.userId = ? AND cm2.userId = ?
      `).get(auth.userId, recipientId) as any;

      if (existing) {
        const conversation: any = db.prepare('SELECT * FROM Conversation WHERE id = ?').get(existing.id);
        const members = db.prepare('SELECT * FROM ConversationMember WHERE conversationId = ?').all(existing.id);
        return NextResponse.json({
          conversation: {
            ...conversation,
            isGroup: false,
            members: members.map((m: any) => ({ ...m, isAdmin: Boolean(m.isAdmin) }))
          }
        });
      }

      const convId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO Conversation (id, isGroup)
        VALUES (?, 0)
      `).run(convId);

      db.prepare(`
        INSERT INTO ConversationMember (id, conversationId, userId, isAdmin)
        VALUES (?, ?, ?, 0)
      `).run(crypto.randomUUID(), convId, auth.userId);

      db.prepare(`
        INSERT INTO ConversationMember (id, conversationId, userId, isAdmin)
        VALUES (?, ?, ?, 0)
      `).run(crypto.randomUUID(), convId, recipientId);

      const conversation: any = db.prepare('SELECT * FROM Conversation WHERE id = ?').get(convId);
      const members = db.prepare('SELECT * FROM ConversationMember WHERE conversationId = ?').all(convId);

      return NextResponse.json({
        conversation: {
          ...conversation,
          isGroup: false,
          members: members.map((m: any) => ({ ...m, isAdmin: Boolean(m.isAdmin) }))
        }
      }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create conversation' }, { status: 500 });
  }
}
