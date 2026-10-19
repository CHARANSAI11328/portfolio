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
  const index = db.certifications.findIndex((c) => c.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
  }

  try {
    const updates = await request.json();
    db.certifications[index] = { ...db.certifications[index], ...updates, id };
    saveDatabase(db);
    logActivity('UPDATE', 'Certification', `Updated certification: ${db.certifications[index].title}`);

    return NextResponse.json({ success: true, certification: db.certifications[index] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update certification';
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
  const cert = db.certifications.find((c) => c.id === id);

  if (!cert) {
    return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
  }

  db.certifications = db.certifications.filter((c) => c.id !== id);
  saveDatabase(db);
  logActivity('DELETE', 'Certification', `Deleted certification: ${cert.title}`);

  return NextResponse.json({ success: true, message: 'Certification removed successfully' });
}
