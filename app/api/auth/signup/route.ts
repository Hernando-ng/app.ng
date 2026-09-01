import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!password || (!email && !phone)) {
      return NextResponse.json({ error: 'Password and either email or phone are required.' }, { status: 400 });
    }

    if (email) {
      const existingEmail = db.prepare('SELECT id FROM User WHERE email = ?').get(email);
      if (existingEmail) {
        return NextResponse.json({ error: 'Email already registered.' }, { status: 400 });
      }
    }

    if (phone) {
      const existingPhone = db.prepare('SELECT id FROM User WHERE phone = ?').get(phone);
      if (existingPhone) {
        return NextResponse.json({ error: 'Phone already registered.' }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO User (id, name, email, phone, passwordHash, isPhoneVerified, bio)
      VALUES (?, ?, ?, ?, ?, 0, 'Hey there! I am using app.ng.')
    `).run(userId, name || null, email || null, phone || null, passwordHash);

    // Create default privacy settings
    db.prepare(`
      INSERT INTO PrivacySettings (id, userId, profileVisibility, lastSeenVisibility, readReceiptsEnabled)
      VALUES (?, ?, 'EVERYONE', 'EVERYONE', 1)
    `).run(crypto.randomUUID(), userId);

    const token = signToken({ userId, email: email || null, phone: phone || null });

    const user = db.prepare('SELECT id, name, email, phone, bio, image, isPhoneVerified, isBusiness FROM User WHERE id = ?').get(userId);

    return NextResponse.json({ token, user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Signup failed' }, { status: 500 });
  }
}
