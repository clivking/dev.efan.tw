// ─── Shared Type Definitions for Consultation / Quote Request ────
// Used by: ChatWidget consultation flow, /quote-request form, email, Telegram notifications

// ─── Service Types ───────────────────────────────────────────────

export type ServiceType = 'access_control' | 'cctv' | 'phone_system' | 'attendance' | 'network' | 'other';
export type BudgetTier = 'basic' | 'standard' | 'advanced' | 'ai_smart';

// ─── Service Detail Interfaces ──────────────────────────────────

export interface AccessControlDetails {
    doorCount: number;
    doorTypes: string[];
    extras: string[];
    plans: string[];   // 經濟型 / 標準型 / 進階型 / AI指紋 / AI人臉
}

export interface CCTVDetails {
    cameraCount: number;
    storageDays: string[];   // multi-select: '7天','14天','30天','60天','90天'
    resolution: string[];
    origin: string[];
    extras: string[];
}

export interface PhoneSystemDetails {
    externalLines: number;
    extensions: number;
    extras: string[];
}

export interface AttendanceDetails {
    employeeCount: number;
    methods: string[];
    extras: string[];       // 功能需求: 出勤紀錄, 計算薪資, 人事管理
}

export interface NetworkDetails {
    area: number;           // 坪數
    rooms: number;          // 隔間數量
    users: number;          // 使用人數
    withElectrician: boolean | null;  // 配合水電
    extras: string[];
}

// ─── Consultation Data (structured needs) ───────────────────────

export interface ConsultationData {
    services: ServiceType[];
    details: {
        access_control?: AccessControlDetails;
        cctv?: CCTVDetails;
        phone_system?: PhoneSystemDetails;
        attendance?: AttendanceDetails;
        network?: NetworkDetails;
    };
    budgetTiers: BudgetTier[];
    installLocation?: string;
    companyName?: string;
    lineId?: string;
    message?: string;
}

// ─── Quote Request Form Data (extends ConsultationData) ─────────

export interface QuoteRequestData {
    services: ServiceType[];
    details: {
        accessControl?: AccessControlDetails;
        cctv?: CCTVDetails;
        phoneSystem?: PhoneSystemDetails;
        attendance?: AttendanceDetails;
        network?: NetworkDetails;
    };
    budgetTiers: BudgetTier[];
    otherDescription: string;       // 「其他」的文字描述
    companyName: string;
    contactName: string;
    phone: string;                  // 合併電話/手機 (智能判斷)
    mobile: string;                 // 保留分離欄位給 API
    address: string;
    email: string;
    message: string;
}

// ─── Labels (UI display) ────────────────────────────────────────

export const SERVICE_LABELS: Record<ServiceType, { name: string; desc: string; icon: string }> = {
    access_control: { name: '門禁系統', desc: '門禁卡、電子鎖、對講機', icon: '🔒' },
    cctv: { name: '監視錄影', desc: '攝影機、錄影主機、AI 偵測', icon: '📹' },
    phone_system: { name: '電話總機', desc: '電話主機、分機、自動總機', icon: '📞' },
    attendance: { name: '考勤系統', desc: '打卡機、人臉辨識、出勤管理', icon: '🕐' },
    network: { name: '網路工程', desc: '有線網路、WiFi、交換機、機櫃', icon: '🌐' },
    other: { name: '其他需求', desc: '維修保養、搬遷、其他弱電工程', icon: '📝' },
};

export const BUDGET_TIER_LABELS: Record<BudgetTier, { name: string; desc: string; icon: string }> = {
    basic: { name: '經濟型', desc: '基本功能，高CP值', icon: '💰' },
    standard: { name: '標準型', desc: '主流品牌，穩定耐用', icon: '⭐' },
    advanced: { name: '進階型', desc: '進階功能，企業首選', icon: '🏆' },
    ai_smart: { name: 'AI智慧型', desc: '人臉辨識、AI偵測、智慧整合', icon: '🤖' },
};

// ─── Name Mappings (for backend: email, Telegram, summary) ──────

export const SERVICE_NAMES: Record<string, string> = {
    access_control: '門禁系統',
    cctv: '監視錄影',
    phone_system: '電話總機',
    attendance: '考勤薪資',
    network: '網路佈建',
    other: '其他需求',
};

export const TIER_NAMES: Record<string, string> = {
    basic: '基本型',
    standard: '標準型',
    advanced: '進階型',
    ai_smart: 'AI 智慧型',
};

// ─── Initial Data ───────────────────────────────────────────────

export const INITIAL_QUOTE_REQUEST_DATA: QuoteRequestData = {
    services: [],
    details: {},
    budgetTiers: [],
    otherDescription: '',
    companyName: '',
    contactName: '',
    phone: '',
    mobile: '',
    address: '',
    email: '',
    message: '',
};

export const INITIAL_CONSULTATION_DATA: ConsultationData = {
    services: [],
    details: {},
    budgetTiers: [],
};
