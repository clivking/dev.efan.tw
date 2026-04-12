// ─── Consultation Summary Builder ────────────────────────────────
// Pure functions — usable in both frontend and backend.
// Used by: Step 3 UI preview, Email confirmation, Telegram notification.

import { SERVICE_NAMES, TIER_NAMES } from '@/lib/types/consultation-types';
import type { ConsultationData } from '@/lib/types/consultation-types';

// ─── Door type / feature label mappings ─────────────────────────

const DOOR_TYPE_LABELS: Record<string, string> = {
    non_auto: '一般門', auto: '自動門', roller: '鐵捲門', barrier: '柵欄機',
};

const ACCESS_FEATURE_LABELS: Record<string, string> = {
    log: '出入紀錄', attendance: '考勤連動', intercom: '對講機',
    remote: '遠端開門', mobile_app: '手機開門',
};

const CCTV_FEATURE_LABELS: Record<string, string> = {
    night_vision: '夜視功能', mobile: '手機遠端', cloud: '雲端儲存',
    ai_human: 'AI人形偵測', ai_plate: 'AI車牌辨識', ai_intrusion: 'AI入侵警報',
};

const CCTV_RESOLUTION_LABELS: Record<string, string> = {
    '1080p': '1080P', '2k': '2K', '4k': '4K',
};

const CCTV_ORIGIN_LABELS: Record<string, string> = {
    any: '不指定', taiwan: '台灣品牌', military: '國防部採購',
};

const PHONE_FEATURE_LABELS: Record<string, string> = {
    caller_id: '來電顯示', auto_attendant: '自動總機',
    recording: '通話錄音', mobile_ext: '手機分機',
};

const ATTENDANCE_METHOD_LABELS: Record<string, string> = {
    card: '刷卡', fingerprint: '指紋', face: '人臉辨識', mobile: '手機打卡',
};

const NETWORK_ITEM_LABELS: Record<string, string> = {
    wired: '有線網路', wifi: 'WiFi', switch: '交換機', rack: '機櫃',
};

// ─── Helper: map array of codes to labels ───────────────────────

function mapLabels(codes: string[] | undefined, labels: Record<string, string>): string {
    if (!codes?.length) return '';
    return codes.map(c => labels[c] || c).join('+');
}

// ─── Build full human-readable summary ──────────────────────────

/**
 * Build a human-readable summary of consultation needs.
 * Used for Step 3 preview, Email body, and Telegram notification.
 *
 * Example output:
 *   📹 監視錄影 8支：4K、30天儲存、夜視+手機遠端+AI人形偵測、台灣品牌
 *   🔒 門禁系統 4門：一般門+自動門、刷卡+手機開門
 *   📋 方案偏好：標準型、進階型
 */
export function buildConsultationSummary(data: ConsultationData): string {
    const lines: string[] = [];

    for (const svc of data.services) {
        const name = SERVICE_NAMES[svc] || svc;
        const icon = getServiceIcon(svc);
        const d = getServiceDetails(data, svc);

        if (svc === 'access_control' && d) {
            const parts: string[] = [];
            const doorTypes = mapLabels(d.doorTypes, DOOR_TYPE_LABELS);
            if (doorTypes) parts.push(doorTypes);
            const features = mapLabels(d.extras, ACCESS_FEATURE_LABELS);
            if (features) parts.push(features);
            const qty = d.doorCount || '';
            lines.push(`${icon} ${name}${qty ? ` ${qty}門` : ''}${parts.length ? '：' + parts.join('、') : ''}`);
        } else if (svc === 'cctv' && d) {
            const parts: string[] = [];
            const res = d.resolution?.length ? d.resolution.map((r: string) => CCTV_RESOLUTION_LABELS[r] || r).join('/') : '';
            if (res) parts.push(res);
            if (d.storageDays) parts.push(`${d.storageDays}天儲存`);
            const features = mapLabels(d.extras, CCTV_FEATURE_LABELS);
            if (features) parts.push(features);
            const origin = d.origin?.length ? d.origin.map((o: string) => CCTV_ORIGIN_LABELS[o] || o).filter((o: string) => o !== '不指定').join('/') : '';
            if (origin) parts.push(origin);
            const qty = d.cameraCount || '';
            lines.push(`${icon} ${name}${qty ? ` ${qty}支` : ''}${parts.length ? '：' + parts.join('、') : ''}`);
        } else if (svc === 'phone_system' && d) {
            const parts: string[] = [];
            if (d.externalLines) parts.push(`外線${d.externalLines}條`);
            if (d.extensions) parts.push(`分機${d.extensions}台`);
            const features = mapLabels(d.extras, PHONE_FEATURE_LABELS);
            if (features) parts.push(features);
            lines.push(`${icon} ${name}${parts.length ? '：' + parts.join('、') : ''}`);
        } else if (svc === 'attendance' && d) {
            const parts: string[] = [];
            if (d.employeeCount) parts.push(`${d.employeeCount}人`);
            const methods = mapLabels(d.methods, ATTENDANCE_METHOD_LABELS);
            if (methods) parts.push(methods);
            lines.push(`${icon} ${name}${parts.length ? '：' + parts.join('、') : ''}`);
        } else if (svc === 'network' && d) {
            const items = mapLabels(d.extras, NETWORK_ITEM_LABELS);
            lines.push(`${icon} ${name}${items ? '：' + items : ''}`);
        } else {
            lines.push(`${icon} ${name}`);
        }
    }

    // Budget tiers
    if (data.budgetTiers?.length) {
        const tierNames = data.budgetTiers.map(t => TIER_NAMES[t] || t).join('、');
        lines.push(`📋 方案偏好：${tierNames}`);
    }

    return lines.join('\n');
}

// ─── Build short service description (for Telegram inline) ──────

/**
 * Build a compact service description for Telegram notifications.
 * Example: 監視(8支 4K)+門禁(4門)
 */
export function buildServiceShorthand(services: string[], details: Record<string, any>): string {
    return services.map(s => {
        const name = SERVICE_NAMES[s] || s;
        const d = details?.[s];
        if (!d) return name;

        if (s === 'access_control' && d.doorCount) return `門禁(${d.doorCount}門)`;
        if (s === 'cctv') {
            const resText = Array.isArray(d.resolution) ? d.resolution.map((r: string) => CCTV_RESOLUTION_LABELS[r] || r).join('/') : d.resolution;
            const parts = [d.cameraCount ? `${d.cameraCount}支` : '', resText].filter(Boolean);
            return parts.length ? `監視(${parts.join(' ')})` : name;
        }
        if (s === 'phone_system' && d.extensions) return `總機(分機${d.extensions}台)`;
        if (s === 'attendance' && d.employeeCount) return `考勤(${d.employeeCount}人)`;
        return name;
    }).join('+');
}

// ─── Build internal note summary (for quote internalNote) ───────

/**
 * Build a detailed multi-line summary for quote internalNote.
 * Similar to the old buildSummary() in quote-request/route.ts.
 */
export function buildInternalNoteSummary(data: {
    services: string[];
    details: Record<string, any>;
    budgetTiers: string[];
    address?: string;
    message?: string;
    otherDescription?: string;
}): string {
    const lines: string[] = ['[線上報價需求]', ''];
    const svcNames = (data.services || []).map((s: string) => SERVICE_NAMES[s] || s);
    const tierNames = (data.budgetTiers || []).map((t: string) => TIER_NAMES[t] || t);
    lines.push(`【報價需求】`);
    lines.push(`服務：${svcNames.join('、')}`);
    if (tierNames.length) lines.push(`方案：${tierNames.join('、')}`);
    lines.push('');

    const d = data.details || {};

    if (d.access_control || d.accessControl) {
        const ac = d.access_control || d.accessControl;
        lines.push(`【門禁系統】`);
        if (ac.doorCount) lines.push(`門數：${ac.doorCount}`);
        if (ac.doorTypes?.length) lines.push(`門型：${ac.doorTypes.map((t: string) => DOOR_TYPE_LABELS[t] || t).join('、')}`);
        if (ac.extras?.length) lines.push(`其他：${ac.extras.map((e: string) => ACCESS_FEATURE_LABELS[e] || e).join('、')}`);
        if (ac.plans?.length) lines.push(`方案偏好：${ac.plans.join('、')}`);
        lines.push('');
    }
    if (d.cctv) {
        const c = d.cctv;
        lines.push(`【監視錄影】`);
        if (c.cameraCount) lines.push(`攝影機：${c.cameraCount} 台`);
        const storArr = Array.isArray(c.storageDays) ? c.storageDays : (c.storageDays ? [c.storageDays] : []);
        if (storArr.length) lines.push(`儲存：${storArr.join('、')}`);
        const res = Array.isArray(c.resolution) ? c.resolution : (c.resolution ? [c.resolution] : []);
        if (res.length) lines.push(`畫質：${res.map((r: string) => CCTV_RESOLUTION_LABELS[r] || r).join('、')}`);
        const ori = Array.isArray(c.origin) ? c.origin : (c.origin ? [c.origin] : []);
        if (ori.length) lines.push(`產品偏好：${ori.map((o: string) => CCTV_ORIGIN_LABELS[o] || o).join('、')}`);
        if (c.extras?.length) lines.push(`功能需求：${c.extras.map((e: string) => CCTV_FEATURE_LABELS[e] || e).join('、')}`);
        lines.push('');
    }
    if (d.phone_system || d.phoneSystem) {
        const p = d.phone_system || d.phoneSystem;
        lines.push(`【電話總機】`);
        if (p.externalLines) lines.push(`外線數：${p.externalLines} 條`);
        if (p.extensions) lines.push(`內線數：${p.extensions} 台`);
        if (p.extras?.length) lines.push(`附加功能：${p.extras.map((e: string) => PHONE_FEATURE_LABELS[e] || e).join('、')}`);
        lines.push('');
    }
    if (d.attendance) {
        const a = d.attendance;
        lines.push(`【考勤系統】`);
        if (a.employeeCount) lines.push(`員工人數：${a.employeeCount}`);
        if (a.methods?.length) lines.push(`打卡方式：${a.methods.map((m: string) => ATTENDANCE_METHOD_LABELS[m] || m).join('、')}`);
        if (a.extras?.length) lines.push(`功能需求：${a.extras.join('、')}`);
        lines.push('');
    }
    if (d.network) {
        const n = d.network;
        lines.push(`【網路佈建】`);
        if (n.area) lines.push(`空間坪數：${n.area}坪`);
        if (n.rooms) lines.push(`隔間數量：${n.rooms}間`);
        if (n.users) lines.push(`使用人數：${n.users}人`);
        if (n.withElectrician !== null && n.withElectrician !== undefined) lines.push(`配合水電：${n.withElectrician ? '是' : '否'}`);
        if (n.extras?.length) lines.push(`需求項目：${n.extras.map((e: string) => NETWORK_ITEM_LABELS[e] || e).join('、')}`);
        lines.push('');
    }

    if (data.address) lines.push(`安裝地址：${data.address}`);
    if (data.otherDescription) lines.push(`其他需求：${data.otherDescription}`);
    if (data.message) lines.push(`補充說明：${data.message}`);

    return lines.join('\n');
}

// ─── Helpers ────────────────────────────────────────────────────

function getServiceIcon(svc: string): string {
    const icons: Record<string, string> = {
        access_control: '🔒', cctv: '📹', phone_system: '📞',
        attendance: '🕐', network: '🌐', other: '📝',
    };
    return icons[svc] || '📋';
}

/** Get service details from ConsultationData, handling both camelCase and snake_case keys */
function getServiceDetails(data: ConsultationData, svc: string): any {
    const d = data.details;
    if (!d) return null;
    if (svc === 'access_control') return (d as any).accessControl || (d as any).access_control;
    if (svc === 'phone_system') return (d as any).phoneSystem || (d as any).phone_system;
    return (d as any)[svc];
}
