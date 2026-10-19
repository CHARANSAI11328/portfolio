import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, logActivity } from '@/lib/db';
import { verifyApiAuth } from '@/lib/auth';
import { CertificationItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  const db = getDatabase();
  const admin = await verifyApiAuth(request);

  let certs = db.certifications || [];
  if (!admin) {
    certs = certs.filter((c) => c.published);
  }

  certs.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  return NextResponse.json({ certifications: certs, isAdmin: !!admin });
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
      issuer,
      issueDate,
      expDate,
      credentialId,
      verificationUrl,
      image,
      description,
      published,
      displayOrder,
    } = body;

    if (!title || !issuer || !issueDate) {
      return NextResponse.json({ error: 'Title, issuer, and issue date are required' }, { status: 400 });
    }

    const db = getDatabase();
    const newCert: CertificationItem = {
      id: `cert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      issuer: issuer.trim(),
      issueDate: issueDate.trim(),
      expDate: expDate?.trim() || '',
      credentialId: credentialId?.trim() || '',
      verificationUrl: verificationUrl?.trim() || '',
      image: image || '',
      description: description || '',
      published: typeof published === 'boolean' ? published : true,
      displayOrder: typeof displayOrder === 'number' ? displayOrder : db.certifications.length + 1,
    };

    db.certifications.push(newCert);
    saveDatabase(db);
    logActivity('CREATE', 'Certification', `Added certification: ${newCert.title} from ${newCert.issuer}`);

    return NextResponse.json({ success: true, certification: newCert }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add certification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
