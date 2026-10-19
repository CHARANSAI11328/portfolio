import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logActivity } from '@/lib/db';
import { verifyApiAuth } from '@/lib/auth';
import { EventItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  const db = getDatabase();
  const admin = await verifyApiAuth(request);

  let events = db.events || [];
  if (!admin) {
    events = events.filter((e) => e.published);
  }

  events.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  return NextResponse.json({ events, isAdmin: !!admin });
}

export async function POST(request: NextRequest) {
  const admin = await verifyApiAuth(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, organizer, date, location, description, participationType, url, image, published, displayOrder } = body;

    if (!title || !organizer || !date) {
      return NextResponse.json({ error: 'Title, organizer, and date are required' }, { status: 400 });
    }

    const db = getDatabase();
    const newEvent: EventItem = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      organizer: organizer.trim(),
      date: date.trim(),
      location: location?.trim() || 'Online / Offline',
      description: description || '',
      participationType: participationType || 'Participant',
      url: url?.trim() || '',
      image: image || '',
      published: typeof published === 'boolean' ? published : true,
      displayOrder: typeof displayOrder === 'number' ? displayOrder : db.events.length + 1,
    };

    db.events.push(newEvent);
    saveDatabase(db);
    logActivity('CREATE', 'Event', `Recorded event: ${newEvent.title}`);

    return NextResponse.json({ success: true, event: newEvent }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create event';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
