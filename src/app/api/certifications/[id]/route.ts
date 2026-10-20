import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logActivity, deleteNeonRecord, upsertNeonRecord, getNeon } from '@/lib/db';
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
  db.certifications = db.certifications || [];
  const index = db.certifications.findIndex((c) => c.id === id);

  const n = getNeon();
  let existing = null;
  if (n) {
    try {
      existing = await n.getCertificationById(id);
    } catch {}
  }
  if (!existing && index !== -1) {
    existing = db.certifications[index];
  }

  if (!existing) {
    return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
  }

  try {
    const updates = await request.json();
    const updatedCert = { ...existing, ...updates, id };
    if (index !== -1) {
      db.certifications[index] = updatedCert;
    } else {
      db.certifications.push(updatedCert);
    }
    await upsertNeonRecord('certifications', updatedCert);
    saveDatabase(db);
    logActivity('UPDATE', 'Certification', `Updated certification: ${updatedCert.title}`);

    return NextResponse.json({ success: true, certification: updatedCert });
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
  db.certifications = db.certifications || [];
  const cert = db.certifications.find((c) => c.id === id);
  const delTitle = cert ? cert.title : id;

  db.certifications = db.certifications.filter((c) => c.id !== id);
  await deleteNeonRecord('certifications', id);
  saveDatabase(db);
  logActivity('DELETE', 'Certification', `Deleted certification: ${delTitle}`);

  return NextResponse.json({ success: true, message: 'Certification removed successfully' });
}
