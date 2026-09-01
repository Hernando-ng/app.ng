import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password } = body; // identifier can be email or phone

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Identifier (email/phone) and password are required.' }, { status: 400 });
    }

    const user: any = db.prepare('SELECT * FROM User WHERE email = ? OR phone = ?').get(identifier, identifier);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const token = signToken({ userId: user.id, email: user.email, phone: user.phone });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      image: user.image,
      isPhoneVerified: Boolean(user.isPhoneVerified),
      isBusiness: Boolean(user.isBusiness)
    };

    return NextResponse.json({ token, user: safeUser }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
