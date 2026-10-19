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
  const index = db.events.findIndex((e) => e.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  try {
    const updates = await request.json();
    db.events[index] = { ...db.events[index], ...updates, id };
    saveDatabase(db);
    logActivity('UPDATE', 'Event', `Updated event: ${db.events[index].title}`);

    return NextResponse.json({ success: true, event: db.events[index] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update event';
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
  const event = db.events.find((e) => e.id === id);

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  db.events = db.events.filter((e) => e.id !== id);
  saveDatabase(db);
  logActivity('DELETE', 'Event', `Deleted event: ${event.title}`);

  return NextResponse.json({ success: true, message: 'Event removed successfully' });
}
