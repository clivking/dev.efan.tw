import 'server-only';
import { generateHTML } from '@tiptap/html';
import sanitizeHtml from 'sanitize-html';
import { sharedExtensions } from './tiptap-extensions';

const sanitizeOptions: sanitizeHtml.IOptions = {
    allowedTags: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3',
        'ul', 'ol', 'li', 'blockquote', 'img', 'a', 'hr',
        'pre', 'code',
    ],
    allowedAttributes: {
        'a': ['href', 'target', 'rel', 'class'],
        'img': ['src', 'alt', 'width', 'height', 'class'],
        'p': ['class'],
        'blockquote': ['class'],
        'pre': ['class'],
        'code': ['class'],
    },
    allowedSchemes: ['http', 'https'],
};

/**
 * Convert TipTap ProseMirror JSON to sanitized HTML string.
 * Only call from Server Components or API routes.
 */
export function renderContent(json: any): string {
    if (!json) return '';
    try {
        const html = generateHTML(json, sharedExtensions);
        return sanitizeHtml(html, sanitizeOptions);
    } catch (e) {
        console.error('[tiptap] renderContent error:', e);
        return '';
    }
}

/**
 * Sanitize HTML for websiteDescription (product features).
 * Only allows lightweight formatting: paragraphs, line breaks, bold, lists.
 * Called at save time (PUT API) so frontend can render directly.
 */
export function sanitizeFeatures(html: string): string {
    if (!html) return '';
    return sanitizeHtml(html, {
        allowedTags: ['p', 'br', 'strong', 'ul', 'li'],
        allowedAttributes: {},
    });
}

/**
 * @deprecated Will be removed in cleanup step. Auto-fill logic has been removed.
 * Extract plain text from TipTap ProseMirror JSON.
 */
export function extractPlainText(json: any): string {
    if (!json) return '';
    try {
        const texts: string[] = [];
        const walk = (node: any) => {
            if (node.type === 'text' && node.text) {
                texts.push(node.text);
            }
            if (node.content) {
                node.content.forEach(walk);
            }
        };
        walk(json);
        return texts.join(' ').replace(/\s+/g, ' ').trim();
    } catch {
        return '';
    }
}
