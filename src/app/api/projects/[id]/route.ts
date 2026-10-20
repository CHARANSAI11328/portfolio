import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logActivity, deleteNeonRecord, upsertNeonRecord } from '@/lib/db';
import { verifyApiAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDatabase();
  const project = db.projects.find((p) => p.id === id || p.slug === id);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const admin = await verifyApiAuth(request);
  if (!project.published && !admin) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({ project });
}

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
  const index = db.projects.findIndex((p) => p.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  try {
    const updates = await request.json();
    const existing = db.projects[index];

    const updatedProject = {
      ...existing,
      ...updates,
      id: existing.id, // prevent id modification
      updatedAt: new Date().toISOString(),
    };

    db.projects[index] = updatedProject;
    await upsertNeonRecord('projects', updatedProject);
    saveDatabase(db);
    logActivity('UPDATE', 'Project', `Updated project: ${updatedProject.title}`);

    return NextResponse.json({ success: true, project: updatedProject });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update project';
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
  const project = db.projects.find((p) => p.id === id);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  db.projects = db.projects.filter((p) => p.id !== id);
  await deleteNeonRecord('projects', id);
  saveDatabase(db);
  logActivity('DELETE', 'Project', `Deleted project: ${project.title}`);

  return NextResponse.json({ success: true, message: 'Project removed successfully' });
}
