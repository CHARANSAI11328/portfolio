import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logActivity } from '@/lib/db';
import { verifyApiAuth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyApiAuth(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDatabase();
  const index = db.experiences.findIndex((e) => e.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Experience record not found' }, { status: 404 });
  }

  try {
    const updates = await request.json();
    db.experiences[index] = { ...db.experiences[index], ...updates, id };
    saveDatabase(db);
    logActivity('UPDATE', 'Experience', `Updated: ${db.experiences[index].role}`);

    return NextResponse.json({ success: true, experience: db.experiences[index] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update experience';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyApiAuth(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDatabase();
  const exp = db.experiences.find((e) => e.id === id);

  if (!exp) {
    return NextResponse.json({ error: 'Experience record not found' }, { status: 404 });
  }

  db.experiences = db.experiences.filter((e) => e.id !== id);
  saveDatabase(db);
  logActivity('DELETE', 'Experience', `Deleted record: ${exp.role}`);

  return NextResponse.json({ success: true, message: 'Experience record removed successfully' });
}
