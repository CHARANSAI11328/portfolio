import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logActivity, upsertNeonRecord, getNeon } from '@/lib/db';
import { verifyApiAuth } from '@/lib/auth';
import { TeamMember } from '@/lib/types';

export async function GET() {
  const n = getNeon();
  if (n) {
    try {
      const liveMembers = await n.getTeamMembers();
      return NextResponse.json({ team: liveMembers }, {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
    } catch (err: unknown) {
      console.warn('[NEON] Error querying team:', err);
    }
  }
  const db = getDatabase();
  const team = (db.team || []).sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
  );
  return NextResponse.json({ team }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

export async function POST(request: NextRequest) {
  const admin = await verifyApiAuth(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.name || !body.role) {
      return NextResponse.json({ error: 'Member name and role are required' }, { status: 400 });
    }

    let skills: string[] = [];
    if (Array.isArray(body.skills)) {
      skills = body.skills;
    } else if (typeof body.skills === 'string') {
      skills = body.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    const github = String(body.github || body.socials?.github || '').trim();
    const linkedin = String(body.linkedin || body.socials?.linkedin || '').trim();
    const email = String(body.email || body.socials?.email || '').trim();
    const portfolio = String(body.portfolio || body.socials?.portfolio || '').trim();

    const db = getDatabase();
    db.team = db.team || [];

    const newMember: TeamMember = {
      id: `team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: body.name.trim(),
      role: body.role.trim(),
      bio: body.bio?.trim() || '',
      avatarUrl: body.avatarUrl?.trim() || '',
      skills,
      github,
      linkedin,
      email,
      portfolio,
      socials: { github, linkedin, email, portfolio },
      displayOrder: parseInt(body.displayOrder, 10) || db.team.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.team.push(newMember);
    await upsertNeonRecord('team', newMember);
    saveDatabase(db);
    logActivity('CREATE', 'Team', `Added team member: ${newMember.name} (${newMember.role})`);

    return NextResponse.json({ success: true, member: newMember }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save team member';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
