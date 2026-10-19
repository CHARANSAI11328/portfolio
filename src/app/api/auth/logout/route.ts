import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';
import { logActivity } from '@/lib/db';

export async function POST() {
  logActivity('LOGOUT', 'Admin', 'Admin logged out');
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
