import { NextRequest, NextResponse } from 'next/server';
import { withAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/prisma';
import { SECURITY_SETTING_DEFAULTS } from '@/lib/security-settings';

export const dynamic = 'force-dynamic';

const ENCRYPTED_MASK = '••••••••';

const REQUIRED_SETTING_DEFAULTS = [
  { key: 'delivery_stamp_url', value: '', type: 'string', category: 'company', description: '出貨章圖片' },
  { key: 'invoice_stamp_url', value: '', type: 'string', category: 'company', description: '請款章圖片' },
  { key: 'receipt_stamp_url', value: '', type: 'string', category: 'company', description: '收據章圖片' },
  { key: 'warranty_stamp_url', value: '', type: 'string', category: 'company', description: '保固章圖片' },
  { key: 'default_customer_note', value: '', type: 'string', category: 'document', description: '客戶備註預設文字（顯示在 PDF）' },
  { key: 'warranty_terms', value: '', type: 'string', category: 'document', description: '保固書條款內容（支援多行，顯示在保固 PDF）' },
  ...SECURITY_SETTING_DEFAULTS,
] as const;

export async function GET(request: NextRequest) {
  return withAdmin(request, async (_req: AuthenticatedRequest) => {
    await prisma.$transaction(
      REQUIRED_SETTING_DEFAULTS.map((setting) =>
        prisma.setting.upsert({
          where: { key: setting.key },
          update: {
            description: setting.description,
            category: setting.category,
            type: setting.type,
          },
          create: setting,
        }),
      ),
    );

    const settings = await prisma.setting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    const grouped: Record<string, Array<{
      key: string;
      value: string;
      type: string;
      category: string;
      description: string | null;
    }>> = {};

    for (const setting of settings) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = [];
      }

      grouped[setting.category].push({
        key: setting.key,
        value: setting.type === 'encrypted' ? ENCRYPTED_MASK : setting.value,
        type: setting.type,
        category: setting.category,
        description: setting.description,
      });
    }

    return NextResponse.json(grouped);
  });
}
