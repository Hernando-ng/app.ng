import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.trim() === '') {
      return NextResponse.json({ messages: [] });
    }

    // Check member
    const member = db.prepare('SELECT id FROM ConversationMember WHERE conversationId = ? AND userId = ?').get(conversationId, auth.userId);
    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchQuery = `%${query.trim()}%`;
    const messages = db.prepare(`
      SELECT m.*, u.name as senderName, u.image as senderImage
      FROM Message m
      JOIN User u ON m.senderId = u.id
      WHERE m.conversationId = ?
        AND m.content LIKE ?
        AND m.deletedForEveryone = 0
        AND m.id NOT IN (SELECT messageId FROM MessageDelete WHERE userId = ?)
      ORDER BY m.createdAt DESC
    `).all(conversationId, searchQuery, auth.userId);

    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Search failed' }, { status: 500 });
  }
}
