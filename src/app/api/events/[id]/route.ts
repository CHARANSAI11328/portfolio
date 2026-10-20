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
  db.events = db.events || [];
  const index = db.events.findIndex((e) => e.id === id);

  const n = getNeon();
  let existing = null;
  if (n) {
    try {
      existing = await n.getEventById(id);
    } catch {}
  }
  if (!existing && index !== -1) {
    existing = db.events[index];
  }

  if (!existing) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  try {
    const updates = await request.json();
    const updatedEvent = { ...existing, ...updates, id };
    if (index !== -1) {
      db.events[index] = updatedEvent;
    } else {
      db.events.push(updatedEvent);
    }
    await upsertNeonRecord('events', updatedEvent);
    saveDatabase(db);
    logActivity('UPDATE', 'Event', `Updated event: ${updatedEvent.title}`);

    return NextResponse.json({ success: true, event: updatedEvent });
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
  db.events = db.events || [];
  const event = db.events.find((e) => e.id === id);
  const delTitle = event ? event.title : id;

  db.events = db.events.filter((e) => e.id !== id);
  await deleteNeonRecord('events', id);
  saveDatabase(db);
  logActivity('DELETE', 'Event', `Deleted event: ${delTitle}`);

  return NextResponse.json({ success: true, message: 'Event removed successfully' });
}
