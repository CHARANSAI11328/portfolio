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
  db.skills = db.skills || [];
  const index = db.skills.findIndex((s) => s.id === id);

  const n = getNeon();
  let existing = null;
  if (n) {
    try {
      existing = await n.getSkillById(id);
    } catch {}
  }
  if (!existing && index !== -1) {
    existing = db.skills[index];
  }

  if (!existing) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  try {
    const updates = await request.json();
    const updatedSkill = { ...existing, ...updates, id };
    if (index !== -1) {
      db.skills[index] = updatedSkill;
    } else {
      db.skills.push(updatedSkill);
    }
    await upsertNeonRecord('skills', updatedSkill);
    saveDatabase(db);
    logActivity('UPDATE', 'Skill', `Updated skill: ${updatedSkill.name}`);

    return NextResponse.json({ success: true, skill: updatedSkill });
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
  db.skills = db.skills || [];
  const skill = db.skills.find((s) => s.id === id);
  const delName = skill ? skill.name : id;

  db.skills = db.skills.filter((s) => s.id !== id);
  await deleteNeonRecord('skills', id);
  saveDatabase(db);
  logActivity('DELETE', 'Skill', `Deleted skill: ${delName}`);

  return NextResponse.json({ success: true, message: 'Skill deleted successfully' });
}
