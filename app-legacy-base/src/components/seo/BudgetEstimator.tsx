'use client';

import Link from 'next/link';
import React, { useState } from 'react';

// A powerful interactive tool specifically designed to increase "Dwell Time" (SEO Factor).
export default function BudgetEstimator() {
    const [doors, setDoors] = useState<number>(1);
    const [type, setType] = useState<string>('card'); // card, face, fingerprint
    const [attendance, setAttendance] = useState<boolean>(false);
    
    // Simple logic for budget calculation
    const calculateBudget = () => {
        let basePerDoor = 9000;
        if (type === 'face') basePerDoor = 21000;
        if (type === 'fingerprint') basePerDoor = 16000;
        
        let total = doors * basePerDoor;
        if (attendance) total += 6000; // Software module
        
        const wiring = doors * 3000; // Average wiring cost in Taipei
        
        const min = total + wiring - 3000;
        const max = total + wiring + 5000;
        
        return {
            min: min.toLocaleString('zh-TW'),
            max: max.toLocaleString('zh-TW')
        };
    };

    const budget = calculateBudget();

    return (
        <div id="budget-estimator" className="bg-gradient-to-br from-slate-900 via-slate-800 to-efan-primary-dark p-8 md:p-12 rounded-[32px] shadow-2xl overflow-hidden relative text-white my-16">
            <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-efan-accent/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                <div>
                    <h3 className="text-3xl font-black mb-4 flex items-center gap-3">
                        <span className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">📐</span>
                        台北辦公室門禁預算估算器
                    </h3>
                    <p className="text-white/70 mb-8 leading-relaxed">
                        選擇您的需求，系統將自動根據台北市一般商辦標準（含牽線施工）試算出約略的預算範圍。這能幫助您在採購前心裡有底。
                    </p>
                    
                    <div className="space-y-6">
                        {/* Doors */}
                        <div>
                            <label className="block text-sm font-bold text-white/90 mb-3">1. 請問共有幾扇門需要管制？</label>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="range" 
                                    min="1" max="10" 
                                    value={doors} 
                                    onChange={e => setDoors(Number(e.target.value))}
                                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-efan-accent"
                                />
                                <span className="text-2xl font-black w-12 text-center text-efan-accent">{doors}</span>
                            </div>
                        </div>
                        
                        {/* Type */}
                        <div>
                            <label className="block text-sm font-bold text-white/90 mb-3">2. 您希望使用哪種辨識方式？</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'card', label: '刷卡/密碼', icon: '💳' },
                                    { id: 'fingerprint', label: '指紋辨識', icon: '👆' },
                                    { id: 'face', label: '人臉辨識', icon: '👤' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setType(t.id)}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === t.id ? 'bg-efan-accent border-efan-accent shadow-lg shadow-efan-accent/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                    >
                                        <span className="text-2xl">{t.icon}</span>
                                        <span className="text-xs font-bold">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Attendance */}
                        <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={attendance}
                                onChange={e => setAttendance(e.target.checked)}
                                className="w-5 h-5 rounded text-efan-accent bg-white/10 border-white/20 focus:ring-efan-accent focus:ring-offset-efan-primary"
                            />
                            <div>
                                <div className="text-sm font-bold text-white">是否需要結合「考勤薪資系統」？</div>
                                <div className="text-xs text-white/50 mt-1">匯出報表，直接管理上下班打卡</div>
                            </div>
                        </label>
                    </div>
                </div>
                
                {/* Result side */}
                <div className="bg-white rounded-[24px] p-8 text-center flex flex-col justify-center shadow-xl">
                    <div className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-2">預估完工總價 (含稅)</div>
                    <div className="text-efan-primary mb-2 flex justify-center items-end gap-2">
                        <span className="text-4xl lg:text-5xl font-black">NT$ {budget.min}</span>
                    </div>
                    <div className="text-gray-400 font-bold mb-6">~ NT$ {budget.max}</div>
                    
                    <p className="text-xs text-gray-500 mb-8 px-4 leading-relaxed">
                        * 此為線上初步估算值。實際價格將視現場管線複雜度、防火門材質與既有裝潢有所浮動。
                    </p>
                    
                    <Link 
                        href="/quote-request" 
                        className="block w-full bg-gradient-to-r from-efan-accent to-orange-400 hover:from-efan-accent-dark hover:to-efan-accent text-white font-black text-lg py-4 rounded-xl shadow-lg shadow-efan-accent/30 transition-transform active:scale-95"
                    >
                        取得精準的到場勘估報價 ➔
                    </Link>
                </div>
            </div>
        </div>
    );
}
