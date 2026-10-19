import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const admin = await verifyApiAuth(request);
  if (!admin) {
    return NextResponse.json({ authenticated: false, admin: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
}
