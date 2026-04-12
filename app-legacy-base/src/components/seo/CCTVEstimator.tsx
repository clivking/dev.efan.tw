'use client';

import Link from 'next/link';
import React, { useState } from 'react';

export default function CCTVEstimator() {
    const [cameras, setCameras] = useState<number>(4);
    const [quality, setQuality] = useState<string>('1080p'); // 1080p, 4k
    const [storageDays, setStorageDays] = useState<number>(14); // 14, 30
    
    // Logic for CCTV budget calculation
    const calculateBudget = () => {
        // 1. Wiring cost (Taipei standard overhead + per camera wiring)
        const wiring = cameras * 3500;
        
        // 2. Camera hardware cost
        let camCostBase = 2500; // 1080p
        if (quality === '2k') camCostBase = 3800; // estimated intermediate cost
        if (quality === '4k') camCostBase = 5500;
        const camerasCost = cameras * camCostBase;
        
        // 3. NVR (Recorder) cost based on channels needed
        let nvrCost = 4500; // 4-channel
        if (cameras > 4) nvrCost = 7500; // 8-channel
        if (cameras > 8) nvrCost = 13000; // 16-channel
        if (cameras > 16) nvrCost = 22000; // 32-channel
        
        // 4. HDD Storage Cost (Rough estimate: 2TB per 4 cams for 14 days = ~2500 NTD)
        const hddUnits = Math.ceil(cameras / 4) * (storageDays === 30 ? 2 : 1);
        const hddCost = hddUnits * 2500;
        
        const total = wiring + camerasCost + nvrCost + hddCost;
        
        const min = total - 3000;
        const max = total + Math.max(5000, total * 0.15); // Add variance for complex environments
        
        return {
            min: Math.floor(min).toLocaleString('zh-TW'),
            max: Math.floor(max).toLocaleString('zh-TW')
        };
    };

    const budget = calculateBudget();

    return (
        <div id="cctv-estimator" className="bg-gradient-to-br from-slate-900 via-slate-800 to-efan-primary-dark p-8 md:p-12 rounded-[32px] shadow-2xl overflow-hidden relative text-white my-16">
            <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-slate-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                <div>
                    <h3 className="text-3xl font-black mb-4 flex items-center gap-3">
                        <span className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">📷</span>
                        企業級監視系統預算估算器
                    </h3>
                    <p className="text-white/70 mb-8 leading-relaxed">
                        與家用 Wifi 攝影機不同，企業級安裝需要穩定的專屬同軸或網路線材佈放。請選擇您的需求，系統將自動估算包含施工、拉線、NVR主機與硬碟的總預算。
                    </p>
                    
                    <div className="space-y-6">
                        {/* Cameras */}
                        <div>
                            <label className="block text-sm font-bold text-white/90 mb-3">1. 預計需要幾支監視攝影機？</label>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="range" 
                                    min="1" max="32" 
                                    value={cameras} 
                                    onChange={e => setCameras(Number(e.target.value))}
                                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-400"
                                />
                                <span className="text-2xl font-black w-16 text-center text-blue-400">{cameras}</span>
                            </div>
                        </div>
                        
                        {/* Quality */}
                        <div>
                            <label className="block text-sm font-bold text-white/90 mb-3">2. 攝影機畫質與等級需求？</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { id: '1080p', label: '標準 1080p', desc: '辦公室與一般走道' },
                                    { id: '2k', label: '高階 2K', desc: '出入口與櫃檯區' },
                                    { id: '4k', label: '星光級 4K', desc: '無光環境或看車牌' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setQuality(t.id)}
                                        className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1 transition-all ${quality === t.id ? 'bg-blue-500/20 border-blue-400 shadow-lg' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                    >
                                        <span className="text-sm font-bold">{t.label}</span>
                                        <span className="text-xs text-white/60">{t.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Storage */}
                        <div>
                            <label className="block text-sm font-bold text-white/90 mb-3">3. 錄影檔案需要保留多久？</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 14, label: '約 14 天 (標準)' },
                                    { id: 30, label: '約 30 天 (法規/特需)' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setStorageDays(t.id as number)}
                                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${storageDays === t.id ? 'bg-blue-500/20 border-blue-400 shadow-lg' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                    >
                                        <span className="text-sm font-bold">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Result side */}
                <div className="bg-white rounded-[24px] p-8 text-center flex flex-col justify-center shadow-xl">
                    <div className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-2">預估完工總價 (含稅與施工)</div>
                    <div className="text-slate-800 mb-2 flex justify-center items-end gap-2">
                        <span className="text-4xl lg:text-5xl font-black">NT$ {budget.min}</span>
                    </div>
                    <div className="text-gray-400 font-bold mb-6">~ NT$ {budget.max}</div>
                    
                    <p className="text-xs text-gray-500 mb-8 px-4 leading-relaxed">
                        * 此為線上初步估算值，已包含攝影機、NVR主機、監控級硬碟與平均佈線工資。實際價格依現場管線難易度而定。
                    </p>
                    
                    <Link 
                        href="/quote-request" 
                        className="block w-full bg-gradient-to-r from-slate-800 to-efan-primary hover:from-slate-700 hover:to-efan-primary-light text-white font-black text-lg py-4 rounded-xl shadow-lg transition-transform active:scale-95"
                    >
                        取得精準的到場勘估報價 ➔
                    </Link>
                </div>
            </div>
        </div>
    );
}
