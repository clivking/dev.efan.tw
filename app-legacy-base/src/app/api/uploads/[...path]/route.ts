import { NextRequest, NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { getUploadsRoot } from '@/lib/runtime-paths';

export const dynamic = 'force-dynamic';

const UPLOADS_ROOT = getUploadsRoot();

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
};

/**
 * Case-insensitive file lookup fallback.
 * If exact path not found, scan the directory for a case-insensitive match.
 * This handles Windows (case-insensitive) to Linux (case-sensitive) differences.
 */
async function resolveFilePath(filePath: string): Promise<string | null> {
  if (existsSync(filePath)) return filePath;

  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath).toLowerCase();
  const requestedName = path.basename(filePath, path.extname(filePath)).toLowerCase();

  try {
    const files = await readdir(dir);
    const match = files.find((file) => file.toLowerCase() === baseName);
    if (match) return path.join(dir, match);

    const extFallback = files.find((file) => {
      const parsed = path.parse(file);
      return parsed.name.toLowerCase() === requestedName && parsed.ext.toLowerCase() in MIME_TYPES;
    });
    if (extFallback) return path.join(dir, extFallback);
  } catch {
    // Directory doesn't exist
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const topLevelFolder = segments[0]?.toLowerCase();

  if (['customers', 'common', 'signatures'].includes(topLevelFolder)) {
    return NextResponse.json(
      { error: 'File not found' },
      {
        status: 404,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  const safePath = segments.join('/').replace(/\.\./g, '');
  const requestedPath = path.join(UPLOADS_ROOT, safePath);

  const filePath = await resolveFilePath(requestedPath);
  if (!filePath) {
    return NextResponse.json(
      { error: 'File not found' },
      {
        status: 404,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const buffer = await readFile(filePath);

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
  };

  if (ext === '.pdf') {
    headers['X-Robots-Tag'] = 'noindex, nofollow';
  }

  return new NextResponse(buffer, { headers });
}
