export function normalizeIpAddress(ipAddress: string | null | undefined): string {
    if (!ipAddress) return 'unknown';

    const rawIp = String(ipAddress).split(',')[0]?.trim().toLowerCase() || 'unknown';
    if (!rawIp || rawIp === 'unknown') return 'unknown';

    if (rawIp === '::1') return '127.0.0.1';
    if (rawIp.startsWith('::ffff:')) return rawIp.slice(7);

    return rawIp;
}

export function parseIpList(ipListValue: string | null | undefined): string[] {
    if (!ipListValue) return [];

    return ipListValue
        .split(',')
        .map((ip) => normalizeIpAddress(ip))
        .filter((ip, index, list) => ip !== 'unknown' && list.indexOf(ip) === index);
}
