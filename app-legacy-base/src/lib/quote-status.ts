import { getSetting } from '@/lib/settings';

export type QuoteStatusType = 'draft' | 'confirmed' | 'sent' | 'signed' | 'construction' | 'completed' | 'paid' | 'closed';

export const DEAL_WON_STATUSES: QuoteStatusType[] = ['signed', 'construction', 'completed', 'paid'];
export const PENDING_PAYMENT_STATUSES: QuoteStatusType[] = ['signed', 'construction', 'completed']; // 待收款 (需要再加上未全額收款條件)

/**
 * 管理員可以任意跳轉狀態（admin 完全自由控制）。
 * 這個函式只處理刪除權限檢查。
 */
export async function canDeleteQuote(status: QuoteStatusType): Promise<boolean> {
    const allowedStatuses = await getSetting<string[]>('allow_delete_status', [
        'draft',
        'confirmed',
        'sent',
    ]);
    return allowedStatuses.includes(status);
}

/**
 * 檢查是否可以直接編輯（只有 draft 可以）。
 * confirmed 以上必須建新版。
 */
export function canDirectEdit(status: QuoteStatusType): boolean {
    return status === 'draft';
}

/**
 * 取得狀態變更時需要更新的時間欄位。
 */
export function getStatusTimestamp(newStatus: QuoteStatusType): Record<string, Date> {
    const now = new Date();
    switch (newStatus) {
        case 'confirmed': return { confirmedAt: now };
        case 'sent': return { sentAt: now };
        case 'signed': return { signedAt: now };
        case 'construction': return { constructionAt: now };
        case 'completed': return { completedAt: now };
        case 'paid': return { paidAt: now };
        default: return {};
    }
}
