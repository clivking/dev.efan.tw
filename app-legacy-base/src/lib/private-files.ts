import path from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

const PRIVATE_ROOT = path.join(process.cwd(), 'storage', 'private');

export function getPrivateAbsolutePath(relativePath: string): string {
    const normalized = relativePath.replace(/^[/\\]+/, '');
    return path.join(PRIVATE_ROOT, normalized);
}

export async function savePrivateFile(relativePath: string, buffer: Buffer): Promise<string> {
    const absolutePath = getPrivateAbsolutePath(relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);
    return relativePath.replace(/\\/g, '/');
}

export async function readPrivateFile(relativePath: string): Promise<Buffer> {
    return readFile(getPrivateAbsolutePath(relativePath));
}

export function privateFileExists(relativePath: string): boolean {
    return existsSync(getPrivateAbsolutePath(relativePath));
}
