'use server';
import fs from 'fs';
import path from 'path';

export async function getSeoLogs() {
    const logPath = path.join(process.cwd(), 'logs', 'seo-redirects.log');
    try {
        if (fs.existsSync(logPath)) {
            return fs.readFileSync(logPath, 'utf8');
        }
    } catch (e) {
        return 'ERR';
    }
    return '';
}

export async function clearSeoLogs() {
    const logPath = path.join(process.cwd(), 'logs', 'seo-redirects.log');
    try {
        if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
    } catch (e) {
        console.error(e);
    }
}
