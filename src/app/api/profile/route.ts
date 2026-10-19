import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logActivity } from '@/lib/db';
import { verifyApiAuth } from '@/lib/auth';

export async function GET() {
  const db = getDatabase();
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

    saveDatabase(db);
    logActivity('UPDATE', 'Profile', 'Updated personal profile details');

    return NextResponse.json({ success: true, profile: db.profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
