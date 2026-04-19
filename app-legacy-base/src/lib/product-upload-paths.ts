import fs from 'fs';
import path from 'path';
import { resolveUploadSubpath } from '@/lib/runtime-paths';

type ProductPathSource = {
    model?: string | null;
    name?: string | null;
};

const IMAGE_ROLES = ['front', 'angle', 'dimensions', 'wiring', 'installation'];

const MIME_EXTENSION_FALLBACKS: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
};

function sanitizeSegment(value: string) {
    return value
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^A-Za-z0-9._-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[-_.]+|[-_.]+$/g, '');
}

function extensionFromFile(filename: string, mimetype?: string | null) {
    const ext = path.extname(filename).toLowerCase();
    return ext || (mimetype ? MIME_EXTENSION_FALLBACKS[mimetype] : '') || '';
}

function productModelSegment(product: ProductPathSource) {
    const model = sanitizeSegment(product.model || product.name || '');
    if (!model) {
        throw new Error('Product model is required for canonical uploads');
    }
    return model;
}

function normalizeDocType(docType?: string | null) {
    const value = sanitizeSegment(docType || '');
    const lower = value.toLowerCase();

    if (lower === 'dm') return 'DM';
    if (lower === 'manual') return 'Manual';
    if (lower === 'spec') return 'Spec';
    if (lower === 'install' || lower === 'installation') return 'Installation';
    if (lower === 'wiring') return 'Wiring';
    if (lower === 'certificate') return 'Certificate';
    if (lower === 'firmware') return 'Firmware';
    if (lower === 'software') return 'Software';

    return value || 'Document';
}

function imageRoleForOrder(order: number) {
    return IMAGE_ROLES[order - 1] || 'detail';
}

function firstAvailableRelativePath(relativePath: string) {
    const ext = path.posix.extname(relativePath);
    const withoutExt = relativePath.slice(0, -ext.length);
    let candidate = relativePath;
    let suffix = 2;

    while (fs.existsSync(resolveUploadSubpath(candidate))) {
        candidate = `${withoutExt}_${suffix}${ext}`;
        suffix += 1;
    }

    return candidate;
}

export function buildCanonicalProductImagePath({
    product,
    originalFilename,
    mimetype,
    order,
}: {
    product: ProductPathSource;
    originalFilename: string;
    mimetype?: string | null;
    order: number;
}) {
    const model = productModelSegment(product);
    const ext = extensionFromFile(originalFilename, mimetype);
    const safeOrder = Math.max(1, order);
    const paddedOrder = String(safeOrder).padStart(2, '0');
    const role = imageRoleForOrder(safeOrder);
    const relativePath = firstAvailableRelativePath(
        path.posix.join('products', model, 'images', `${model}_${paddedOrder}_${role}${ext}`),
    );

    return {
        filename: path.posix.basename(relativePath),
        relativePath,
        apiPath: `/api/uploads/${relativePath}`,
        absolutePath: resolveUploadSubpath(relativePath),
    };
}

export function buildCanonicalProductDocumentPath({
    product,
    originalFilename,
    mimetype,
    docType,
}: {
    product: ProductPathSource;
    originalFilename: string;
    mimetype?: string | null;
    docType?: string | null;
}) {
    const model = productModelSegment(product);
    const ext = extensionFromFile(originalFilename, mimetype) || '.pdf';
    const normalizedDocType = normalizeDocType(docType);
    const relativePath = firstAvailableRelativePath(
        path.posix.join('products', model, 'documents', `${model}_${normalizedDocType}${ext}`),
    );

    return {
        filename: path.posix.basename(relativePath),
        relativePath,
        apiPath: `/api/uploads/${relativePath}`,
        absolutePath: resolveUploadSubpath(relativePath),
        docType: normalizedDocType,
    };
}
