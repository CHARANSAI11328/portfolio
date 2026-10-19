import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logActivity } from '@/lib/db';
import { verifyApiAuth } from '@/lib/auth';

export async function GET() {
  const db = getDatabase();
  return NextResponse.json({ settings: db.settings });
}

export async function PUT(request: NextRequest) {
  const admin = await verifyApiAuth(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
  }

  try {
    const updates = await request.json();
    const db = getDatabase();
    db.settings = { ...db.settings, ...updates };
    saveDatabase(db);
    logActivity('UPDATE', 'Settings', 'Updated website appearance & SEO settings');

    return NextResponse.json({ success: true, settings: db.settings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
