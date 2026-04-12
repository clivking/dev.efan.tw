import { NextRequest, NextResponse } from 'next/server';
import { withAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { writeAudit } from '@/lib/audit';
import { encrypt } from '@/lib/encryption';
import { revalidateCompanyData } from '@/lib/revalidate-public';

const ENCRYPTED_MASK = '••••••••';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  return withAdmin(request, async (_req: AuthenticatedRequest) => {
    const { key } = await params;
    const setting = await prisma.setting.findUnique({ where: { key } });

    if (!setting) {
      return NextResponse.json({ error: '找不到設定項目。' }, { status: 404 });
    }

    return NextResponse.json({
      ...setting,
      value: setting.type === 'encrypted' ? ENCRYPTED_MASK : setting.value,
    });
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    const { key } = await params;
    const body = await request.json();
    const { value } = body;

    if (value === undefined) {
      return NextResponse.json({ error: '必須提供設定值。' }, { status: 400 });
    }

    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing) {
      return NextResponse.json({ error: '找不到設定項目。' }, { status: 404 });
    }

    const oldValue = existing.value;
    let newValue = String(value);

    if (existing.type === 'encrypted') {
      if (!newValue || newValue === ENCRYPTED_MASK) {
        return NextResponse.json({
          ...existing,
          value: ENCRYPTED_MASK,
        });
      }
      newValue = encrypt(newValue);
    }

    const updated = await prisma.setting.update({
      where: { key },
      data: { value: newValue, updatedAt: new Date() },
    });

    await writeAudit({
      userId: req.user!.id,
      action: 'update',
      tableName: 'settings',
      recordId: updated.id,
      before: { key, value: oldValue },
      after: { key, value: newValue },
    });

    if (
      key.startsWith('company_') ||
      key === 'site_title_suffix' ||
      key === 'ga4_measurement_id' ||
      key === 'google_rating' ||
      key === 'google_reviews'
    ) {
      revalidateCompanyData();
    }

    return NextResponse.json({
      ...updated,
      value: updated.type === 'encrypted' ? ENCRYPTED_MASK : updated.value,
    });
  });
}
