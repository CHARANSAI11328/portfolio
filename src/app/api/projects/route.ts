import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logActivity, upsertNeonRecord, getNeon } from '@/lib/db';
import { verifyApiAuth } from '@/lib/auth';
import { ProjectItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  const db = getDatabase();
  const admin = await verifyApiAuth(request);
  const n = getNeon();

  if (n) {
    try {
      const rows = await n.query(`SELECT * FROM projects ORDER BY display_order ASC, id ASC;`);
      let liveProjects = rows.map(n.formatProject);
      db.projects = liveProjects;
      if (!admin) liveProjects = liveProjects.filter((p: any) => p.published);
      return NextResponse.json({ projects: liveProjects, isAdmin: !!admin }, {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
    } catch {}
  }

  const isPublic = !admin;
  let projects = db.projects || [];

  if (isPublic) {
    projects = projects.filter((p) => p.published);
  }

  projects.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  return NextResponse.json({ projects, isAdmin: !!admin }, {
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
    const {
      title,
      slug,
      shortDesc,
      caseStudy,
      category,
      thumbnail,
      images,
      technologies,
      status,
      liveUrl,
      repoUrl,
      featured,
      published,
      displayOrder,
    } = body;

    if (!title || !shortDesc) {
      return NextResponse.json({ error: 'Project title and short description are required' }, { status: 400 });
    }

    const db = getDatabase();
    const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newProject: ProjectItem = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      slug: generatedSlug,
      shortDesc: shortDesc.trim(),
      caseStudy: caseStudy || '',
      category: category || 'Web Applications',
      thumbnail: thumbnail || '',
      images: Array.isArray(images) ? images : [],
      technologies: Array.isArray(technologies) ? technologies : [],
      status: status || 'In Progress',
      liveUrl: liveUrl?.trim() || '',
      repoUrl: repoUrl?.trim() || '',
      featured: typeof featured === 'boolean' ? featured : false,
      published: typeof published === 'boolean' ? published : true,
      displayOrder: typeof displayOrder === 'number' ? displayOrder : db.projects.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.projects.push(newProject);
    await upsertNeonRecord('projects', newProject);
    saveDatabase(db);
    logActivity('CREATE', 'Project', `Created project: ${newProject.title} (${newProject.published ? 'Published' : 'Draft'})`);

    return NextResponse.json({ success: true, project: newProject }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create project';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
