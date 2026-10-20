import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logActivity, upsertNeonRecord, getNeon } from '@/lib/db';
import { verifyApiAuth } from '@/lib/auth';
import { ServiceItem } from '@/lib/types';

export async function GET() {
  const db = getDatabase();
  const n = getNeon();
  if (n) {
    try {
      const rows = await n.query(`SELECT * FROM services ORDER BY display_order ASC, id ASC;`);
      if (rows && rows.length > 0) {
        const liveServices = rows.map(n.formatService);
        db.services = liveServices;
        return NextResponse.json({ services: liveServices }, {
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        });
      }
    } catch {}
  }
  const services = (db.services || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  return NextResponse.json({ services }, {
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
  });
}

export async function POST(request: NextRequest) {
  const admin = await verifyApiAuth(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, icon, category, features, displayOrder } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Service title and description are required' }, { status: 400 });
    }

    const db = getDatabase();
    const newService: ServiceItem = {
      id: `serv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: description.trim(),
      icon: icon || 'Briefcase',
      category: category || 'General',
      features: Array.isArray(features) ? features : [],
      displayOrder: typeof displayOrder === 'number' ? displayOrder : db.services.length + 1,
    };

    db.services.push(newService);
    await upsertNeonRecord('services', newService);
    saveDatabase(db);
    logActivity('CREATE', 'Service', `Created service: ${newService.title}`);

    return NextResponse.json({ success: true, service: newService }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create service';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
