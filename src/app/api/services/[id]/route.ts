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
  db.services = db.services || [];
  const index = db.services.findIndex((s) => s.id === id);

  const n = getNeon();
  let existing = null;
  if (n) {
    try {
      existing = await n.getServiceById(id);
    } catch {}
  }
  if (!existing && index !== -1) {
    existing = db.services[index];
  }

  if (!existing) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  try {
    const updates = await request.json();
    const updatedService = { ...existing, ...updates, id };
    if (index !== -1) {
      db.services[index] = updatedService;
    } else {
      db.services.push(updatedService);
    }
    await upsertNeonRecord('services', updatedService);
    saveDatabase(db);
    logActivity('UPDATE', 'Service', `Updated service: ${updatedService.title}`);

    return NextResponse.json({ success: true, service: updatedService });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update service';
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
  db.services = db.services || [];
  const serv = db.services.find((s) => s.id === id);
  const delTitle = serv ? serv.title : id;

  db.services = db.services.filter((s) => s.id !== id);
  await deleteNeonRecord('services', id);
  saveDatabase(db);
  logActivity('DELETE', 'Service', `Deleted service: ${delTitle}`);

  return NextResponse.json({ success: true, message: 'Service removed successfully' });
}
