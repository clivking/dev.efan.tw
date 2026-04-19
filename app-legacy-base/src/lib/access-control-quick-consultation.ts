import type { AccessControlQuickConsultationMeta } from '@/lib/types/consultation-types';

export type AccessScenario = 'office' | 'clinic' | 'store' | 'factory' | 'community' | 'school' | 'other';
export type AccessUserFlow = 'employees' | 'visitors' | 'mixed' | 'residents';
export type AccessVisitorFlow = 'none' | 'sometimes' | 'frequent';
export type AccessProjectStage = 'new' | 'upgrade' | 'expand';
export type AccessMethod = 'card' | 'mobile' | 'pin' | 'face' | 'fingerprint' | 'not_sure';

export interface AccessControlConsultationAnswers {
    scenario: AccessScenario;
    doorCount: number;
    users: AccessUserFlow;
    methods: AccessMethod[];
    visitorFlow: AccessVisitorFlow;
    remoteManagement: boolean;
    attendanceIntegration: boolean;
    projectStage: AccessProjectStage;
}

export interface AccessControlRecommendation {
    architecture: string;
    architectureDescription: string;
    openingRecommendation: string;
    planPreferences: string[];
    extras: string[];
    keyPoints: string[];
    risks: string[];
    summaryLines: string[];
}

export const ACCESS_SCENARIO_LABELS: Record<AccessScenario, string> = {
    office: '辦公室',
    clinic: '診所',
    store: '門市店面',
    factory: '工廠倉庫',
    community: '社區大樓',
    school: '學校教室',
    other: '其他場域',
};

export const ACCESS_USER_FLOW_LABELS: Record<AccessUserFlow, string> = {
    employees: '以員工為主',
    visitors: '以訪客為主',
    mixed: '員工與訪客都有',
    residents: '住戶或固定住使用者',
};

export const ACCESS_VISITOR_FLOW_LABELS: Record<AccessVisitorFlow, string> = {
    none: '幾乎沒有訪客',
    sometimes: '偶爾有訪客',
    frequent: '經常有訪客',
};

export const ACCESS_STAGE_LABELS: Record<AccessProjectStage, string> = {
    new: '新裝規劃',
    upgrade: '舊系統升級',
    expand: '既有系統擴充',
};

export const ACCESS_METHOD_LABELS: Record<AccessMethod, string> = {
    card: '刷卡',
    mobile: '手機開門',
    pin: '密碼',
    face: '人臉辨識',
    fingerprint: '指紋辨識',
    not_sure: '還不確定',
};

function normalizeMethods(methods: AccessMethod[]) {
    const filtered = methods.filter((method, index) => methods.indexOf(method) === index);
    if (filtered.length > 1) {
        return filtered.filter((method) => method !== 'not_sure');
    }
    return filtered;
}

function inferArchitecture(answers: AccessControlConsultationAnswers) {
    if (answers.doorCount <= 2 && !answers.remoteManagement && answers.visitorFlow === 'none' && answers.users !== 'mixed') {
        return {
            architecture: '1 到 2 門輕量型門禁',
            architectureDescription: '適合點位少、流程單純的空間，先把基本開門與權限管理做好。',
        };
    }

    if (answers.doorCount <= 8 && answers.projectStage !== 'expand') {
        return {
            architecture: '多門控制器型門禁',
            architectureDescription: '適合多數辦公室、診所與中小型商用空間，兼顧穩定與後續擴充。',
        };
    }

    return {
        architecture: '網路型 / 多門點架構',
        architectureDescription: '適合門點較多、需要遠端管理，或未來還會持續擴充的場域。',
    };
}

function inferOpeningRecommendation(answers: AccessControlConsultationAnswers) {
    const methods = normalizeMethods(answers.methods);

    if (methods.includes('face')) return '可先評估人臉辨識門禁，若有訪客再搭配櫃台或門口機流程。';
    if (methods.includes('fingerprint')) return '可先評估指紋辨識門禁，特別適合希望降低代刷風險的場域。';
    if (methods.includes('mobile') && methods.includes('card')) return '建議先以刷卡 + 手機開門為主，兼顧穩定與便利。';
    if (methods.includes('mobile')) return '可先以手機開門為方向，再視現場情況補卡片或密碼作為備援。';
    if (methods.includes('pin')) return '可先以密碼搭配卡片或手機評估，避免純密碼在多人場域難管理。';
    if (methods.includes('card')) return '可先從刷卡門禁開始評估，若未來還要遠端或訪客流程，再保留擴充。';
    return '若還不確定開門方式，建議先從刷卡 + 手機開門這種主流組合開始比較。';
}

function inferPlanPreferences(answers: AccessControlConsultationAnswers) {
    const methods = normalizeMethods(answers.methods);

    if (methods.includes('face')) return ['AI智慧型 — 人臉AI辨識'];
    if (methods.includes('fingerprint')) return ['AI智慧型 — 指紋生物辨識'];
    if (answers.remoteManagement || answers.visitorFlow !== 'none' || answers.doorCount >= 5) return ['進階型'];
    if (answers.projectStage === 'upgrade') return ['標準型'];
    return ['標準型'];
}

function inferExtras(answers: AccessControlConsultationAnswers) {
    const methods = normalizeMethods(answers.methods);
    const extras = ['log'];
    if (answers.visitorFlow !== 'none') extras.push('intercom');
    if (answers.remoteManagement) extras.push('remote');
    if (answers.attendanceIntegration) extras.push('attendance');
    if (methods.includes('mobile')) extras.push('mobile_app');
    return extras;
}

function buildKeyPoints(answers: AccessControlConsultationAnswers, architecture: string) {
    const points: string[] = [`目前比較適合先往「${architecture}」方向看。`];

    if (answers.visitorFlow !== 'none') {
        points.push('建議把訪客放行流程一起規劃，不要只看開門設備。');
    }
    if (answers.remoteManagement) {
        points.push('若你要遠端管理，前期就要考慮網路、權限角色與後續維護方式。');
    }
    if (answers.attendanceIntegration) {
        points.push('如果未來可能串考勤，現在就保留整合架構會比較省事。');
    }
    if (answers.projectStage === 'upgrade') {
        points.push('舊系統升級時，通常要先盤點門型、鎖具與既有配線能不能沿用。');
    }

    return points;
}

function buildRisks(answers: AccessControlConsultationAnswers) {
    const risks: string[] = [];

    if (answers.visitorFlow === 'frequent') {
        risks.push('如果訪客很多，單純只裝讀卡機，後續常會卡在訪客應答與放行流程。');
    }
    if (answers.projectStage === 'upgrade') {
        risks.push('舊系統升級最常漏掉的，是既有控制器、鎖具與消防聯動條件。');
    }
    if (answers.doorCount >= 5) {
        risks.push('門點一多，就不要只看單門設備價格，後續權限管理才是重點。');
    }
    if (answers.methods.includes('not_sure')) {
        risks.push('如果開門方式還不確定，建議先把管理流程定清楚，再選設備。');
    }

    if (risks.length === 0) {
        risks.push('規劃時先看管理流程，再看設備，通常比較不會重工。');
    }

    return risks;
}

export function buildAccessControlConsultationRecommendation(
    answers: AccessControlConsultationAnswers
): AccessControlRecommendation {
    const normalizedAnswers = { ...answers, methods: normalizeMethods(answers.methods) };
    const architectureInfo = inferArchitecture(normalizedAnswers);
    const planPreferences = inferPlanPreferences(normalizedAnswers);
    const extras = inferExtras(normalizedAnswers);
    const openingRecommendation = inferOpeningRecommendation(normalizedAnswers);
    const keyPoints = buildKeyPoints(normalizedAnswers, architectureInfo.architecture);
    const risks = buildRisks(normalizedAnswers);

    const summaryLines = [
        `場域：${ACCESS_SCENARIO_LABELS[normalizedAnswers.scenario]}`,
        `出入口：${normalizedAnswers.doorCount} 門`,
        `使用對象：${ACCESS_USER_FLOW_LABELS[normalizedAnswers.users]}`,
        `訪客需求：${ACCESS_VISITOR_FLOW_LABELS[normalizedAnswers.visitorFlow]}`,
        `專案類型：${ACCESS_STAGE_LABELS[normalizedAnswers.projectStage]}`,
        `開門偏好：${normalizedAnswers.methods.length ? normalizedAnswers.methods.map((method) => ACCESS_METHOD_LABELS[method]).join('、') : '尚未指定'}`,
        normalizedAnswers.remoteManagement ? '管理需求：需要遠端管理' : '管理需求：現場管理為主',
        normalizedAnswers.attendanceIntegration ? '整合需求：希望保留考勤整合' : '整合需求：目前不以考勤為主',
        `系統建議：${architectureInfo.architecture}`,
        `開門方向：${openingRecommendation}`,
    ];

    return {
        architecture: architectureInfo.architecture,
        architectureDescription: architectureInfo.architectureDescription,
        openingRecommendation,
        planPreferences,
        extras,
        keyPoints,
        risks,
        summaryLines,
    };
}

export function buildAccessControlConsultationMeta(
    answers: AccessControlConsultationAnswers,
    recommendation: AccessControlRecommendation
): AccessControlQuickConsultationMeta {
    return {
        version: 'v1',
        scenario: ACCESS_SCENARIO_LABELS[answers.scenario],
        userFlow: ACCESS_USER_FLOW_LABELS[answers.users],
        visitorFlow: ACCESS_VISITOR_FLOW_LABELS[answers.visitorFlow],
        methods: answers.methods.length ? answers.methods.map((method) => ACCESS_METHOD_LABELS[method]) : ['尚未指定'],
        projectStage: ACCESS_STAGE_LABELS[answers.projectStage],
        remoteManagement: answers.remoteManagement,
        attendanceIntegration: answers.attendanceIntegration,
        architecture: recommendation.architecture,
        openingRecommendation: recommendation.openingRecommendation,
        keyPoints: recommendation.keyPoints,
        risks: recommendation.risks,
        aiSummary: [
            ...recommendation.summaryLines,
            ...recommendation.keyPoints.map((point) => `規劃提醒：${point}`),
            ...recommendation.risks.map((risk) => `注意事項：${risk}`),
        ],
    };
}

export function buildAccessControlConsultationNarrative(
    answers: AccessControlConsultationAnswers,
    recommendation: AccessControlRecommendation
) {
    const meta = buildAccessControlConsultationMeta(answers, recommendation);

    return [
        '【門禁快速諮詢摘要】',
        ...meta.aiSummary,
    ].join('\n');
}
