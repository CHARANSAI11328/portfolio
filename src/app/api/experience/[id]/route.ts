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
  db.experiences = db.experiences || [];
  const index = db.experiences.findIndex((e) => e.id === id);

  const n = getNeon();
  let existing = null;
  if (n) {
    try {
      existing = await n.getExperienceById(id);
    } catch {}
  }
  if (!existing && index !== -1) {
    existing = db.experiences[index];
  }

  if (!existing) {
    return NextResponse.json({ error: 'Experience record not found' }, { status: 404 });
  }

  try {
    const updates = await request.json();
    const updatedExp = { ...existing, ...updates, id };
    if (index !== -1) {
      db.experiences[index] = updatedExp;
    } else {
      db.experiences.push(updatedExp);
    }
    await upsertNeonRecord('experiences', updatedExp);
    saveDatabase(db);
    logActivity('UPDATE', 'Experience', `Updated: ${updatedExp.role}`);

    return NextResponse.json({ success: true, experience: updatedExp });
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
  db.experiences = db.experiences || [];
  const exp = db.experiences.find((e) => e.id === id);
  const delRole = exp ? exp.role : id;

  db.experiences = db.experiences.filter((e) => e.id !== id);
  await deleteNeonRecord('experiences', id);
  saveDatabase(db);
  logActivity('DELETE', 'Experience', `Deleted record: ${delRole}`);

  return NextResponse.json({ success: true, message: 'Experience record removed successfully' });
}
