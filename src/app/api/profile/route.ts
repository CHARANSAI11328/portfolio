import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logActivity, upsertNeonRecord, getNeon } from '@/lib/db';
import { verifyApiAuth } from '@/lib/auth';

export async function GET() {
  const db = getDatabase();
  const n = getNeon();
  if (n) {
    try {
      const rows = await n.query(`SELECT * FROM profile WHERE id = 'profile-charan-sai' LIMIT 1;`);
      if (rows && rows.length > 0) {
        const liveProfile = n.formatProfile(rows[0]);
        db.profile = liveProfile;
        return NextResponse.json({ profile: liveProfile });
      }
    } catch {}
  }
  return NextResponse.json({ profile: db.profile });
}

export async function PUT(request: NextRequest) {
  const admin = await verifyApiAuth(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
  }

  try {
    const updates = await request.json();
    const db = getDatabase();

    db.profile = {
      ...db.profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await upsertNeonRecord('profile', db.profile);
    saveDatabase(db);
    logActivity('UPDATE', 'Profile', 'Updated personal profile details');

    return NextResponse.json({ success: true, profile: db.profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
