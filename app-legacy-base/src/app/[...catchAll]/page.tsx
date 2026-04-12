import { notFound, permanentRedirect } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { resolveLegacyRedirect } from '@/lib/seo-redirects';
import { SLUG_TO_PATH } from '@/lib/page-content';

function appendSeoLog(message: string) {
    try {
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        fs.appendFileSync(path.join(logDir, 'seo-redirects.log'), `${message}\n`);
    } catch (error) {
        console.error('Failed to write global SEO log', error);
    }
}

export default async function CatchAllGlobalRoute({ params }: { params: Promise<{ catchAll: string[] }> }) {
    const resolvedParams = await params;
    const slugPath = resolvedParams.catchAll?.join('/') || '';
    const pathname = `/${slugPath}`;

    if (
        slugPath.startsWith('api/') ||
        slugPath.startsWith('_next/') ||
        slugPath.startsWith('admin/') ||
        slugPath.startsWith('.well-known/')
    ) {
        notFound();
    }

    const cmsMappedPath = SLUG_TO_PATH[slugPath];
    if (cmsMappedPath) {
        appendSeoLog(`[${new Date().toISOString()}] [CMS_PAGE_REDIRECT] ${pathname} -> ${cmsMappedPath}`);
        permanentRedirect(cmsMappedPath);
    }

    const redirectMatch = await resolveLegacyRedirect(pathname);
    if (redirectMatch) {
        appendSeoLog(`[${new Date().toISOString()}] [SEO_REDIRECT] ${pathname} -> ${redirectMatch.destination} (${redirectMatch.reason}, ${redirectMatch.confidence.toFixed(2)})`);
        permanentRedirect(redirectMatch.destination);
    }

    appendSeoLog(`[${new Date().toISOString()}] [404_FAILED] ${pathname} -> no match found`);
    notFound();
}
