import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, logActivity, getNeon } from '@/lib/db';
import { verifyPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const identifier = String(email || '').toLowerCase().trim();
    const n = getNeon();
    let admin: any = null;

    if (n && typeof n.getAdminByEmail === 'function') {
      try {
        const neonAdmin = await n.getAdminByEmail(identifier);
        if (neonAdmin) {
          admin = {
            id: neonAdmin.id,
            email: neonAdmin.email,
            name: neonAdmin.name,
            role: neonAdmin.role,
            passwordHash: neonAdmin.password_hash || neonAdmin.passwordHash,
            tokenVersion: neonAdmin.token_version ?? neonAdmin.tokenVersion ?? 1,
            createdAt: neonAdmin.created_at,
          };
        }
      } catch {}
    }

    if (!admin) {
      const db = getDatabase();
      admin = (db.admins || []).find((a) => {
        const aEmail = String(a.email || '').toLowerCase().trim();
        const profEmail = String(db.profile?.email || '').toLowerCase().trim();
        return (
          aEmail === identifier ||
          identifier === 'admin' ||
          identifier === 'charan' ||
          identifier === 'charansai' ||
          (profEmail && profEmail === identifier)
        );
      });
    }

    if (!admin) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const token = await createSessionToken(admin);
    logActivity('LOGIN', 'Admin', `Admin ${admin.email} logged in successfully`);

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
