import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    const auth = getAuthUserFromRequest(req);
    const userId = targetUserId || auth?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID or Auth token required' }, { status: 400 });
    }

    const profile: any = db.prepare('SELECT * FROM BusinessProfile WHERE userId = ?').get(userId);

    if (!profile) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      businessProfile: {
        ...profile,
        isVerified: Boolean(profile.isVerified)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch business profile' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { businessName, category, description, operatingHours, contactEmail, contactPhone, website, address } = body;

    if (!businessName || !category) {
      return NextResponse.json({ error: 'businessName and category are required' }, { status: 400 });
    }

    const existing: any = db.prepare('SELECT id, isVerified FROM BusinessProfile WHERE userId = ?').get(auth.userId);

    const profileId = existing ? existing.id : crypto.randomUUID();
    const verifiedFlag = existing ? existing.isVerified : 0;

    if (existing) {
      db.prepare(`
        UPDATE BusinessProfile
        SET businessName = ?, category = ?, description = ?, operatingHours = ?, contactEmail = ?, contactPhone = ?, website = ?, address = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE userId = ?
      `).run(businessName, category, description || null, operatingHours || null, contactEmail || null, contactPhone || null, website || null, address || null, auth.userId);
    } else {
      db.prepare(`
        INSERT INTO BusinessProfile (id, userId, businessName, category, description, operatingHours, contactEmail, contactPhone, website, address, isVerified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(profileId, auth.userId, businessName, category, description || null, operatingHours || null, contactEmail || null, contactPhone || null, website || null, address || null, verifiedFlag);

      // Mark user as business
      db.prepare('UPDATE User SET isBusiness = 1 WHERE id = ?').run(auth.userId);
    }

    const savedProfile: any = db.prepare('SELECT * FROM BusinessProfile WHERE userId = ?').get(auth.userId);

    return NextResponse.json({
      businessProfile: {
        ...savedProfile,
        isVerified: Boolean(savedProfile.isVerified)
      }
    }, { status: existing ? 200 : 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save business profile' }, { status: 500 });
  }
}
