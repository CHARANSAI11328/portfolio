import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logActivity, upsertNeonRecord, getNeon } from '@/lib/db';
import { verifyApiAuth } from '@/lib/auth';
import { ExperienceItem } from '@/lib/types';

export async function GET() {
  const n = getNeon();
  if (n) {
    try {
      const liveExperiences = await n.getExperiences();
      return NextResponse.json({ experiences: liveExperiences }, {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
    } catch (err: unknown) {
      console.warn('[NEON] Error querying experiences:', err);
    }
  }
  const db = getDatabase();
  const experiences = (db.experiences || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  return NextResponse.json({ experiences }, {
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
    const { role, company, location, period, description, highlights, type, displayOrder } = body;

    if (!role || !company) {
      return NextResponse.json({ error: 'Role/Degree and Company/Institution are required' }, { status: 400 });
    }

    const db = getDatabase();
    const newExp: ExperienceItem = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role: role.trim(),
      company: company.trim(),
      location: location?.trim() || '',
      period: period?.trim() || '',
      description: description?.trim() || '',
      highlights: Array.isArray(highlights) ? highlights : [],
      type: type === 'education' ? 'education' : 'work',
      displayOrder: typeof displayOrder === 'number' ? displayOrder : db.experiences.length + 1,
    };

    db.experiences.push(newExp);
    await upsertNeonRecord('experiences', newExp);
    saveDatabase(db);
    logActivity('CREATE', 'Experience', `Added ${newExp.type}: ${newExp.role} at ${newExp.company}`);

    return NextResponse.json({ success: true, experience: newExp }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add experience';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
