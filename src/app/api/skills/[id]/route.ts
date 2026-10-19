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
  const index = db.skills.findIndex((s) => s.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  try {
    const updates = await request.json();
    db.skills[index] = { ...db.skills[index], ...updates, id };
    saveDatabase(db);
    logActivity('UPDATE', 'Skill', `Updated skill: ${db.skills[index].name}`);

    return NextResponse.json({ success: true, skill: db.skills[index] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update skill';
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
  const skill = db.skills.find((s) => s.id === id);

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  db.skills = db.skills.filter((s) => s.id !== id);
  saveDatabase(db);
  logActivity('DELETE', 'Skill', `Deleted skill: ${skill.name}`);

  return NextResponse.json({ success: true, message: 'Skill deleted successfully' });
}
