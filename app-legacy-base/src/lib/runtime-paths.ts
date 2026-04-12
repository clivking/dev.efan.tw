import path from 'path';

const WINDOWS_DEV_PUBLIC_ROOT = 'D:\\Coding\\efan.tw\\web\\public';
const DEFAULT_PUBLIC_ROOT =
    process.env.NODE_ENV === 'production' ? '/app/public' : WINDOWS_DEV_PUBLIC_ROOT;

function normalizeRoot(root: string) {
    return path.normalize(root);
}

function stripLeadingSlashes(value: string) {
    return value.replace(/^[/\\]+/, '');
}

function stripUploadPrefix(value: string) {
    return value.replace(/^\/?api\/uploads\/?/i, '');
}

export function getPublicRoot() {
    return normalizeRoot(process.env.PUBLIC_ROOT || DEFAULT_PUBLIC_ROOT);
}

export function getUploadsRoot() {
    return normalizeRoot(process.env.UPLOADS_ROOT || path.join(getPublicRoot(), 'uploads'));
}

export function resolveUploadSubpath(...segments: string[]) {
    return path.join(getUploadsRoot(), ...segments.map(stripLeadingSlashes));
}

export function resolveApiUploadPath(apiPath: string) {
    return resolveUploadSubpath(stripUploadPrefix(apiPath));
}
