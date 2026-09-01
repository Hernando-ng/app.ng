import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings: any = db.prepare('SELECT * FROM PrivacySettings WHERE userId = ?').get(auth.userId);

    if (!settings) {
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO PrivacySettings (id, userId, profileVisibility, lastSeenVisibility, readReceiptsEnabled)
        VALUES (?, ?, 'EVERYONE', 'EVERYONE', 1)
      `).run(id, auth.userId);
      settings = db.prepare('SELECT * FROM PrivacySettings WHERE id = ?').get(id);
    }

    return NextResponse.json({
      privacySettings: {
        ...settings,
        readReceiptsEnabled: Boolean(settings.readReceiptsEnabled)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch privacy settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { profileVisibility, lastSeenVisibility, readReceiptsEnabled } = body;

    let existing: any = db.prepare('SELECT * FROM PrivacySettings WHERE userId = ?').get(auth.userId);

    if (!existing) {
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO PrivacySettings (id, userId, profileVisibility, lastSeenVisibility, readReceiptsEnabled)
        VALUES (?, ?, 'EVERYONE', 'EVERYONE', 1)
      `).run(id, auth.userId);
      existing = db.prepare('SELECT * FROM PrivacySettings WHERE id = ?').get(id);
    }

    const newProfileVis = profileVisibility !== undefined ? profileVisibility : existing.profileVisibility;
    const newLastSeenVis = lastSeenVisibility !== undefined ? lastSeenVisibility : existing.lastSeenVisibility;
    const newReadReceipts = readReceiptsEnabled !== undefined ? (readReceiptsEnabled ? 1 : 0) : existing.readReceiptsEnabled;

    db.prepare(`
      UPDATE PrivacySettings
      SET profileVisibility = ?, lastSeenVisibility = ?, readReceiptsEnabled = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE userId = ?
    `).run(newProfileVis, newLastSeenVis, newReadReceipts, auth.userId);

    const updatedSettings: any = db.prepare('SELECT * FROM PrivacySettings WHERE userId = ?').get(auth.userId);

    return NextResponse.json({
      privacySettings: {
        ...updatedSettings,
        readReceiptsEnabled: Boolean(updatedSettings.readReceiptsEnabled)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update privacy settings' }, { status: 500 });
  }
}
