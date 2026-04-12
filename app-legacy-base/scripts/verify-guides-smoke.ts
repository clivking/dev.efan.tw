import http from 'node:http';
import { createPrismaClient } from './prisma-client';

const prisma = createPrismaClient();
const baseUrl = process.env.GUIDE_SMOKE_BASE_URL ?? 'http://127.0.0.1:3000';

function fetchPage(pathname: string) {
  return new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
    const url = new URL(pathname, baseUrl);
    const req = http.request(
      {
        host: url.hostname,
        port: Number(url.port || 80),
        path: `${url.pathname}${url.search}`,
        method: 'GET',
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode ?? 0,
            body,
          });
        });
      }
    );

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const guides = await prisma.guideArticle.findMany({
    where: { isPublished: true },
    select: { slug: true },
    orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { updatedAt: 'desc' }],
  });

  if (guides.length === 0) {
    console.log('No published guides to verify.');
    return;
  }

  let hasFailure = false;

  for (const guide of guides) {
    const path = `/guides/${guide.slug}`;
    const result = await fetchPage(path);
    const hasGuideLabel = result.body.includes('知識指南');
    const hasErrorUi = result.body.includes('頁面載入發生問題');

    if (result.statusCode !== 200 || !hasGuideLabel || hasErrorUi) {
      hasFailure = true;
      console.error(`FAIL ${path} status=${result.statusCode} hasGuideLabel=${hasGuideLabel} hasErrorUi=${hasErrorUi}`);
      continue;
    }

    console.log(`OK   ${path}`);
  }

  if (hasFailure) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
