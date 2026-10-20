import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logActivity, deleteNeonRecord, upsertNeonRecord } from '@/lib/db';
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
  const index = db.services.findIndex((s) => s.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  try {
    const updates = await request.json();
    db.services[index] = { ...db.services[index], ...updates, id };
    await upsertNeonRecord('services', db.services[index]);
    saveDatabase(db);
    logActivity('UPDATE', 'Service', `Updated service: ${db.services[index].title}`);

    return NextResponse.json({ success: true, service: db.services[index] });
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
  const serv = db.services.find((s) => s.id === id);

  if (!serv) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  db.services = db.services.filter((s) => s.id !== id);
  await deleteNeonRecord('services', id);
  saveDatabase(db);
  logActivity('DELETE', 'Service', `Deleted service: ${serv.title}`);

  return NextResponse.json({ success: true, message: 'Service removed successfully' });
}
