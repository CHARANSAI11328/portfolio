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

  try {
    const { id } = await params;
    const updates = await request.json();
    const db = getDatabase();
    db.team = db.team || [];
    const idx = db.team.findIndex((m) => m.id === id);

    const n = getNeon();
    let existing = null;
    if (n) {
      try {
        existing = await n.getTeamMemberById(id);
      } catch {}
    }
    if (!existing && idx !== -1) {
      existing = db.team[idx];
    }

    if (!existing) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    let skills = existing.skills;
    if (Array.isArray(updates.skills)) {
      skills = updates.skills;
    } else if (typeof updates.skills === 'string') {
      skills = updates.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    const github = (updates.github !== undefined ? updates.github : updates.socials?.github !== undefined ? updates.socials.github : existing.github) || '';
    const linkedin = (updates.linkedin !== undefined ? updates.linkedin : updates.socials?.linkedin !== undefined ? updates.socials.linkedin : existing.linkedin) || '';
    const email = (updates.email !== undefined ? updates.email : updates.socials?.email !== undefined ? updates.socials.email : existing.email) || '';
    const portfolio = (updates.portfolio !== undefined ? updates.portfolio : updates.socials?.portfolio !== undefined ? updates.socials.portfolio : existing.portfolio) || '';
    const avatarUrl = (updates.avatarUrl !== undefined ? updates.avatarUrl : existing.avatarUrl) || '';

    const updatedMember = {
      ...existing,
      ...updates,
      avatarUrl: String(avatarUrl).trim(),
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

    await upsertNeonRecord('team', updatedMember);
    if (idx !== -1) {
      db.team[idx] = updatedMember;
    } else {
      db.team.push(updatedMember);
    }
    saveDatabase(db);
    logActivity('UPDATE', 'Team', `Updated team member: ${updatedMember.name}`);

    return NextResponse.json({ success: true, member: updatedMember });
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

    let delName = id;
    if (idx !== -1) {
      const del = db.team.splice(idx, 1)[0];
      delName = del.name;
    }

    await deleteNeonRecord('team', id);
    saveDatabase(db);
    logActivity('DELETE', 'Team', `Removed team member: ${delName}`);

    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete team member';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
