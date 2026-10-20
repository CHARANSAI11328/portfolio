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

  try {
    const { id } = await params;
    const updates = await request.json();
    const db = getDatabase();
    db.team = db.team || [];
    const idx = db.team.findIndex((m) => m.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    let skills = db.team[idx].skills;
    if (Array.isArray(updates.skills)) {
      skills = updates.skills;
    } else if (typeof updates.skills === 'string') {
      skills = updates.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    const github = (updates.github !== undefined ? updates.github : updates.socials?.github !== undefined ? updates.socials.github : db.team[idx].github) || '';
    const linkedin = (updates.linkedin !== undefined ? updates.linkedin : updates.socials?.linkedin !== undefined ? updates.socials.linkedin : db.team[idx].linkedin) || '';
    const email = (updates.email !== undefined ? updates.email : updates.socials?.email !== undefined ? updates.socials.email : db.team[idx].email) || '';
    const portfolio = (updates.portfolio !== undefined ? updates.portfolio : updates.socials?.portfolio !== undefined ? updates.socials.portfolio : db.team[idx].portfolio) || '';

    db.team[idx] = {
      ...db.team[idx],
      ...updates,
      skills,
      github: String(github).trim(),
      linkedin: String(linkedin).trim(),
      email: String(email).trim(),
      portfolio: String(portfolio).trim(),
      socials: {
        github: String(github).trim(),
        linkedin: String(linkedin).trim(),
        email: String(email).trim(),
        portfolio: String(portfolio).trim(),
      },
      id,
      updatedAt: new Date().toISOString(),
    };

    saveDatabase(db);
    logActivity('UPDATE', 'Team', `Updated team member: ${db.team[idx].name}`);

    return NextResponse.json({ success: true, member: db.team[idx] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update team member';
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

  try {
    const { id } = await params;
    const db = getDatabase();
    db.team = db.team || [];
    const idx = db.team.findIndex((m) => m.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    const del = db.team.splice(idx, 1)[0];
    saveDatabase(db);
    logActivity('DELETE', 'Team', `Removed team member: ${del.name}`);

    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete team member';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
