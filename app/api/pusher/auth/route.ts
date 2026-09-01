import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bodyText = await req.text();
    const params = new URLSearchParams(bodyText);
    const socketId = params.get('socket_id');
    const channelName = params.get('channel_name');

    if (!socketId || !channelName) {
      return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 });
    }

    if (channelName.startsWith('private-conversation-')) {
      const conversationId = channelName.replace('private-conversation-', '');
      const member = db.prepare('SELECT id FROM ConversationMember WHERE conversationId = ? AND userId = ?').get(conversationId, auth.userId);

      if (!member) {
        return NextResponse.json({ error: 'Forbidden: Not a member of this conversation' }, { status: 403 });
      }
    }

    // Generate auth response for Pusher
    const authData = pusherServer.authorizeChannel(socketId, channelName, {
      user_id: auth.userId,
    });

    return NextResponse.json(authData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Pusher auth failed' }, { status: 500 });
  }
}
