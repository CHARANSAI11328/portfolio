import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logActivity } from '@/lib/db';
import { verifyApiAuth } from '@/lib/auth';
import { SkillItem } from '@/lib/types';

export async function GET() {
  const db = getDatabase();
  const skills = (db.skills || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  return NextResponse.json({ skills });
}

export async function POST(request: NextRequest) {
  const admin = await verifyApiAuth(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, category, icon, level, featured, displayOrder } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Skill name and category are required' }, { status: 400 });
    }

    const db = getDatabase();
    const newSkill: SkillItem = {
      id: `sk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      category,
      icon: icon || 'Code',
      level: level || '',
      featured: typeof featured === 'boolean' ? featured : true,
      displayOrder: typeof displayOrder === 'number' ? displayOrder : db.skills.length + 1,
    };

    db.skills.push(newSkill);
    saveDatabase(db);
    logActivity('CREATE', 'Skill', `Added skill: ${newSkill.name} (${newSkill.category})`);

    return NextResponse.json({ success: true, skill: newSkill }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add skill';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
