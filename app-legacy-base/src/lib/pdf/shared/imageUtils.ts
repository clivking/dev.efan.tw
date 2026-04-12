import fs from 'fs';
import path from 'path';
import { getSetting } from '@/lib/settings';
import { getConfiguredSiteOrigin, toAbsoluteUrl } from '@/lib/site-url';

/**
 * Resolve the PDF logo as a base64 data URL for reliable Puppeteer rendering.
 * Priority: pdf_logo_url > company_logo_url
 * Falls back to absolute HTTP URL if local file not found.
 */
export async function resolvePdfLogoUrl(baseUrl = getConfiguredSiteOrigin()): Promise<string> {
    const pdfLogoUrlRaw = await getSetting('pdf_logo_url', '');
    const logoUrlRaw = pdfLogoUrlRaw || await getSetting('company_logo_url', '');

    if (!logoUrlRaw) return '';

    try {
        // Handle /api/uploads/... or /uploads/... paths
        const localPath = logoUrlRaw.replace(/^\/api\/uploads\//, '/uploads/');
        const logoPath = path.join(process.cwd(), 'public', localPath);
        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            const ext = path.extname(logoPath).toLowerCase();
            const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
            return `data:${mime};base64,${logoBuffer.toString('base64')}`;
        }
    } catch {
        // fall through to URL-based approach
    }

    // Fallback: return as absolute URL
    return toAbsoluteUrl(logoUrlRaw, baseUrl);
}

/**
 * Resolve any image URL to base64 if it's a local file, otherwise return absolute URL.
 */
export function resolveImageToBase64OrUrl(urlRaw: string, baseUrl = getConfiguredSiteOrigin()): string {
    if (!urlRaw) return '';

    try {
        const localPath = urlRaw.replace(/^\/api\/uploads\//, '/uploads/');
        const filePath = path.join(process.cwd(), 'public', localPath);
        if (fs.existsSync(filePath)) {
            const buffer = fs.readFileSync(filePath);
            const ext = path.extname(filePath).toLowerCase();
            const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
            return `data:${mime};base64,${buffer.toString('base64')}`;
        }
    } catch {
        // fall through
    }

    return toAbsoluteUrl(urlRaw, baseUrl);
}
