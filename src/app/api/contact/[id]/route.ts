import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logActivity, deleteNeonRecord, getNeon } from '@/lib/db';
import { verifyApiAuth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyApiAuth(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDatabase();
  const inquiry = db.inquiries.find((i) => i.id === id);

  if (!inquiry) {
    return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
  }

  try {
    const { status } = await request.json();
    if (status) {
      inquiry.status = status;
      const n = getNeon();
      if (n && typeof n.updateInquiry === 'function') {
        await n.updateInquiry(id, { status }).catch(() => {});
      }
      saveDatabase(db);
      logActivity('UPDATE', 'Inquiry', `Marked inquiry from ${inquiry.name} as ${status}`);
    }

    return NextResponse.json({ success: true, inquiry });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update inquiry';
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
  const inquiry = db.inquiries.find((i) => i.id === id);

  if (!inquiry) {
    return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
  }

  db.inquiries = db.inquiries.filter((i) => i.id !== id);
  await deleteNeonRecord('inquiries', id);
  saveDatabase(db);
  logActivity('DELETE', 'Inquiry', `Deleted inquiry from ${inquiry.name}`);

  return NextResponse.json({ success: true, message: 'Inquiry deleted' });
}
