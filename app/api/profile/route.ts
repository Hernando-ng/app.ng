import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user: any = db.prepare('SELECT id, name, email, phone, bio, image, isPhoneVerified, isBusiness, createdAt, updatedAt FROM User WHERE id = ?').get(auth.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...user,
        isPhoneVerified: Boolean(user.isPhoneVerified),
        isBusiness: Boolean(user.isBusiness)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, bio, image, isPhoneVerified } = body;

    const existing: any = db.prepare('SELECT * FROM User WHERE id = ?').get(auth.userId);
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newName = name !== undefined ? name : existing.name;
    const newBio = bio !== undefined ? bio : existing.bio;
    const newImage = image !== undefined ? image : existing.image;
    const newVerified = isPhoneVerified !== undefined ? (isPhoneVerified ? 1 : 0) : existing.isPhoneVerified;

    db.prepare(`
      UPDATE User
      SET name = ?, bio = ?, image = ?, isPhoneVerified = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newName, newBio, newImage, newVerified, auth.userId);

    const updatedUser: any = db.prepare('SELECT id, name, email, phone, bio, image, isPhoneVerified, isBusiness, createdAt, updatedAt FROM User WHERE id = ?').get(auth.userId);

    return NextResponse.json({
      user: {
        ...updatedUser,
        isPhoneVerified: Boolean(updatedUser.isPhoneVerified),
        isBusiness: Boolean(updatedUser.isBusiness)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}
