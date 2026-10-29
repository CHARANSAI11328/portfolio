import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getNeon } from '@/lib/db';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const safeFilename = path.basename(filename);

    // 1. Check local disk
    const diskPath = path.join(process.cwd(), 'public', 'uploads', safeFilename);
    if (fs.existsSync(diskPath) && !fs.statSync(diskPath).isDirectory()) {
      const buffer = fs.readFileSync(diskPath);
      const ext = path.extname(safeFilename).toLowerCase();
      const mime = MIME_TYPES[ext] || 'image/jpeg';
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    // 2. Check Neon cloud database fallback
    const n = getNeon();
    if (n && typeof n.getUploadedAsset === 'function') {
      try {
        const asset = await n.getUploadedAsset(safeFilename);
        if (asset && asset.data_base64) {
          const buffer = Buffer.from(asset.data_base64, 'base64');
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': asset.mime_type || 'image/jpeg',
              'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            },
          });
        }
      } catch (neonErr) {
        console.warn('[NEON UPLOADS] Fallback error:', neonErr);
      }
    }

    return new NextResponse('Asset not found', { status: 404 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new NextResponse(`Server error: ${msg}`, { status: 500 });
  }
}

