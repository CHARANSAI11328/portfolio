import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logActivity } from '@/lib/db';
import { verifyApiAuth } from '@/lib/auth';
import { InquiryItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  const admin = await verifyApiAuth(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
  }

  const db = getDatabase();
  const inquiries = (db.inquiries || []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ inquiries });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const db = getDatabase();
    const newInquiry: InquiryItem = {
      id: `inq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: email.trim(),
      subject: subject?.trim() || 'Project Inquiry via Portfolio',
      message: message.trim(),
      status: 'unread',
      createdAt: new Date().toISOString(),
    };

    db.inquiries = [newInquiry, ...(db.inquiries || [])];
    saveDatabase(db);
    logActivity('INQUIRY', 'Contact', `New project inquiry received from ${newInquiry.name} (${newInquiry.email})`);

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your message has been sent directly to Charan Sai.',
      inquiryId: newInquiry.id,
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit inquiry';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
