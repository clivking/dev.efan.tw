'use client';

import { formatCapacityTb, formatDays, suggestDrivePlan, type CapacityResult, type RetentionResult } from '@/lib/cctv-capacity';

interface Props {
    mode: 'storage' | 'retention';
    result: CapacityResult | RetentionResult;
    safetyMarginPercent: number;
    driveCapacityTb: number;
}

function hasRetentionFields(result: CapacityResult | RetentionResult): result is RetentionResult {
    return 'estimatedRetentionDays' in result;
}

export default function CctvCapacityResults({ mode, result, safetyMarginPercent, driveCapacityTb }: Props) {
    const targetCapacity = mode === 'storage' ? result.recommendedStorageTb : driveCapacityTb;
    const mainValue = mode === 'storage' ? formatCapacityTb(result.recommendedStorageTb) : hasRetentionFields(result) ? formatDays(result.estimatedRetentionDays) : '--';
    const summary =
        mode === 'storage'
            ? `你這樣抓 ${mainValue} 會比較安全，裡面已經先預留 ${safetyMarginPercent}% 安全餘量。`
            : `以你目前的硬碟容量來看，大約可保存 ${mainValue}，這裡已先扣掉 ${safetyMarginPercent}% 安全餘量。`;

    return (
        <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(160deg,#0f172a_0%,#172554_55%,#1e293b_100%)] p-6 text-white shadow-2xl shadow-slate-900/10 md:p-8">
            <div className="text-xs font-bold tracking-[0.24em] text-sky-200">CALCULATION RESULT</div>
            <div className="mt-3 text-sm font-bold text-slate-300">{mode === 'storage' ? '建議硬碟容量' : '大約可錄天數'}</div>
            <h3 className="mt-3 text-3xl font-black md:text-5xl">{mainValue}</h3>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-100">{summary}</p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-5">
                    <div className="text-xs font-bold tracking-[0.18em] text-slate-300">一天大約會用掉</div>
                    <div className="mt-2 text-2xl font-black">{result.dailyStorageGb.toFixed(1)} GB</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-5">
                    <div className="text-xs font-bold tracking-[0.18em] text-slate-300">建議怎麼配硬碟</div>
                    <div className="mt-2 text-2xl font-black">{suggestDrivePlan(targetCapacity)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-5">
                    <div className="text-xs font-bold tracking-[0.18em] text-slate-300">估算提醒</div>
                    <div className="mt-2 text-sm leading-7 text-slate-100">實際結果仍會受品牌編碼效率、夜間雜訊與畫面變化影響。</div>
                </div>
            </div>
        </div>
    );
}
