import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth';
import { logActivity, getNeon } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const admin = await verifyApiAuth(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
  }

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch {}

    const contentType = request.headers.get('content-type') || '';
    let buffer: Buffer;
    let filename: string;
    let mimeType = 'image/jpeg';
    let dataUrl = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const rawData = body.data || body.fileData;
      const rawName = body.filename || body.fileName || 'upload.png';

      if (!rawData || typeof rawData !== 'string') {
        return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
      }

      const match = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: 'Invalid file format. Base64 data URL required.' }, { status: 400 });
      }

      mimeType = match[1].toLowerCase();
      const base64Data = match[2];
      buffer = Buffer.from(base64Data, 'base64');
      dataUrl = rawData;

      const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg';
      const safeBase = path.basename(rawName, path.extname(rawName))
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 30) || 'asset';
      const randSuffix = crypto.randomBytes(4).toString('hex');
      filename = `${safeBase}_${Date.now()}_${randSuffix}${ext}`;
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      mimeType = file.type || 'image/jpeg';
      dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

      const ext = path.extname(file.name).toLowerCase() || '.jpg';
      const safeBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
      const randSuffix = crypto.randomBytes(4).toString('hex');
      filename = `${safeBase}_${Date.now()}_${randSuffix}${ext}`;
    }

    const filePath = path.join(uploadDir, filename);
    try {
      fs.writeFileSync(filePath, buffer);
    } catch {
      // In serverless environments, file is persisted into Neon cloud database below
    }
    const publicUrl = `/uploads/${filename}`;

    // Cloud database persistence in Neon
    const n = getNeon();
    if (n && typeof n.saveUploadedAsset === 'function') {
      try {
        await n.saveUploadedAsset(filename, mimeType, buffer.toString('base64'));
      } catch (err: unknown) {
        console.warn('[NEON] Could not sync asset to Neon:', err instanceof Error ? err.message : String(err));
      }
    }

    logActivity('UPLOAD', 'File', `Uploaded asset: ${filename}`);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      dataUrl,
      filename,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
