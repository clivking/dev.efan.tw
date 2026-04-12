'use client';

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    draft: { label: '草稿', icon: '📁', color: 'text-gray-600', bg: 'bg-gray-100' },
    confirmed: { label: '已確認', icon: '✅', color: 'text-blue-700', bg: 'bg-blue-100' },
    sent: { label: '已發送', icon: '📨', color: 'text-orange-700', bg: 'bg-orange-100' },
    signed: { label: '已回簽', icon: '✍️', color: 'text-green-700', bg: 'bg-green-100' },
    construction: { label: '施工中', icon: '🏗️', color: 'text-purple-700', bg: 'bg-purple-100' },
    completed: { label: '已完工', icon: '🏆', color: 'text-indigo-700', bg: 'bg-indigo-100' },
    paid: { label: '已付款', icon: '💰', color: 'text-emerald-800', bg: 'bg-emerald-100' },
    closed: { label: '作廢', icon: '🚫', color: 'text-gray-400', bg: 'bg-gray-100' },
};

export default function QuoteStatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold gap-1.5 ${cfg.color} ${cfg.bg}`}>
            <span>{cfg.icon}</span>
            <span>{cfg.label}</span>
        </span>
    );
}

export function getStatusLabel(status: string): string {
    return STATUS_CONFIG[status]?.label || status;
}
