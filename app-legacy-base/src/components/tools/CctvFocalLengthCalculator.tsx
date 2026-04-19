'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { shouldBypassImageOptimization } from '@/lib/image-paths';
import {
    calculateCoverageWidthMeters,
    calculateFocalLengthMm,
    calculateHorizontalFovDegrees,
    describeLensDirection,
    findNearestLensOption,
    findNeighborLensOptions,
    SENSOR_OPTIONS,
    type FocalCalculatorMode,
    type SensorFormat,
} from '@/lib/cctv-focal';
import {
    CCTV_FOCAL_EXAMPLES,
    CCTV_FOCAL_FAQ_ITEMS,
    CCTV_FOCAL_LENS_GUIDE,
} from '@/lib/cctv-focal-content';

interface CalculatorState {
    sensor: SensorFormat;
    distanceMeters: number;
    targetWidthMeters: number;
    focalLengthMm: number;
}

const DEFAULT_STATE: CalculatorState = {
    sensor: '1/2.8',
    distanceMeters: 6,
    targetWidthMeters: 4,
    focalLengthMm: 4,
};

const RECOMMENDED_CAMERAS = [
    {
        title: 'ACTi 4MP AI 海螺型攝影機',
        description: '常見商辦與店面起點，適合先搭配 2.8mm 或 4mm 方向評估。',
        href: '/products/acti-z72',
        cta: '看鏡頭產品',
        image: '/api/uploads/products/Z72-Z79/images/Z72-Z79_01_front.png',
        alt: 'ACTi 4MP AI 海螺型攝影機',
    },
    {
        title: 'ACTi 4MP AI 雙光源海螺型攝影機',
        description: '夜間與逆光場景更實用，適合門口、走道與出入口。',
        href: '/products/acti-z722',
        cta: '看鏡頭產品',
        image: '/api/uploads/products/Z722-Z511/images/Z722-Z511_01_front.png',
        alt: 'ACTi 4MP AI 雙光源海螺型攝影機',
    },
    {
        title: 'ACTi 5MP AI 雙光源海螺型攝影機',
        description: '需要更高細節時很常見，適合搭配較聚焦的鏡頭規劃。',
        href: '/products/acti-z53',
        cta: '看鏡頭產品',
        image: '/api/uploads/products/Z53-Z512/images/Z53-Z512_01_front.png',
        alt: 'ACTi 5MP AI 雙光源海螺型攝影機',
    },
];

function NumberField({
    label,
    value,
    suffix,
    min,
    max,
    step = 0.1,
    onChange,
}: {
    label: string;
    value: number;
    suffix: string;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-800">{label}</span>
            <div className="relative">
                <input
                    type="number"
                    value={value}
                    min={min}
                    max={max}
                    step={step}
                    onChange={(event) => onChange(Number(event.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-16 text-slate-900 shadow-sm outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed8]/10"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">{suffix}</span>
            </div>
        </label>
    );
}

export default function CctvFocalLengthCalculator() {
    const [mode, setMode] = useState<FocalCalculatorMode>('focal');
    const [state, setState] = useState<CalculatorState>(DEFAULT_STATE);

    const exactFocalLengthMm = calculateFocalLengthMm(state.distanceMeters, state.targetWidthMeters, state.sensor);
    const nearestLensMm = findNearestLensOption(exactFocalLengthMm);
    const { lower, upper } = findNeighborLensOptions(exactFocalLengthMm);
    const nearestCoverageWidth = calculateCoverageWidthMeters(state.distanceMeters, nearestLensMm, state.sensor);
    const focalModeFovDegrees = calculateHorizontalFovDegrees(nearestLensMm, state.sensor);

    const coverageWidthMeters = calculateCoverageWidthMeters(state.distanceMeters, state.focalLengthMm, state.sensor);
    const coverageModeFovDegrees = calculateHorizontalFovDegrees(state.focalLengthMm, state.sensor);
    const nearestInputLensMm = findNearestLensOption(state.focalLengthMm);

    return (
        <div className="bg-[#f5f1e8] text-slate-950">
            <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
                <div id="ai-summary" className="rounded-[2.25rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="space-y-8">
                        <section>
                            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">1. 選模式</div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => setMode('focal')}
                                    className={`rounded-[1.75rem] border p-6 text-left transition ${mode === 'focal' ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                                >
                                    <div className={`text-sm font-bold tracking-[0.18em] ${mode === 'focal' ? 'text-sky-100' : 'text-slate-400'}`}>焦距</div>
                                    <div className={`mt-2 text-2xl font-black ${mode === 'focal' ? 'text-white' : 'text-slate-950'}`}>反推要幾 mm</div>
                                    <p className={`mt-3 text-sm leading-7 ${mode === 'focal' ? 'text-slate-100' : 'text-slate-600'}`}>輸入距離和想拍多寬。</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('coverage')}
                                    className={`rounded-[1.75rem] border p-6 text-left transition ${mode === 'coverage' ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                                >
                                    <div className={`text-sm font-bold tracking-[0.18em] ${mode === 'coverage' ? 'text-sky-100' : 'text-slate-400'}`}>視角</div>
                                    <div className={`mt-2 text-2xl font-black ${mode === 'coverage' ? 'text-white' : 'text-slate-950'}`}>看這顆鏡頭能拍多寬</div>
                                    <p className={`mt-3 text-sm leading-7 ${mode === 'coverage' ? 'text-slate-100' : 'text-slate-600'}`}>輸入距離和鏡頭焦距。</p>
                                </button>
                            </div>
                        </section>

                        <section>
                            <div className="mb-4 text-sm font-bold tracking-[0.18em] text-slate-400">2. 填條件</div>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <label className="block">
                                    <span className="mb-2 block text-sm font-bold text-slate-800">感光元件尺寸</span>
                                    <select
                                        value={state.sensor}
                                        onChange={(event) => setState((current) => ({ ...current, sensor: event.target.value as SensorFormat }))}
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed8]/10"
                                    >
                                        {SENSOR_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label} ({option.note})
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <NumberField
                                    label="安裝距離"
                                    value={state.distanceMeters}
                                    min={0.5}
                                    max={200}
                                    suffix="公尺"
                                    onChange={(value) => setState((current) => ({ ...current, distanceMeters: value }))}
                                />

                                {mode === 'focal' ? (
                                    <NumberField
                                        label="想拍多寬"
                                        value={state.targetWidthMeters}
                                        min={0.5}
                                        max={200}
                                        suffix="公尺"
                                        onChange={(value) => setState((current) => ({ ...current, targetWidthMeters: value }))}
                                    />
                                ) : (
                                    <NumberField
                                        label="鏡頭焦距"
                                        value={state.focalLengthMm}
                                        min={1.4}
                                        max={100}
                                        suffix="mm"
                                        onChange={(value) => setState((current) => ({ ...current, focalLengthMm: value }))}
                                    />
                                )}
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">3. 看結果</div>

                            {mode === 'focal' ? (
                                <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(160deg,#0f172a_0%,#172554_55%,#1e293b_100%)] p-6 text-white shadow-2xl shadow-slate-900/10 md:p-8">
                                    <div className="text-xs font-bold tracking-[0.24em] text-sky-200">FOCAL RESULT</div>
                                    <div className="mt-3 text-sm font-bold text-slate-300">建議焦距</div>
                                    <h3 className="mt-3 text-3xl font-black md:text-5xl">{exactFocalLengthMm.toFixed(1)} mm</h3>
                                    <p className="mt-4 max-w-3xl text-base leading-8 text-slate-100">
                                        以你現在輸入的距離和畫面寬度來看，常見鏡頭可以先從 <strong>{nearestLensMm}mm</strong> 開始比。若要更保守抓清楚，可優先往上比較；若想拍更廣，再往下看。
                                    </p>

                                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                                        <div className="rounded-2xl border border-white/10 bg-white/8 p-5">
                                            <div className="text-xs font-bold tracking-[0.18em] text-slate-300">常見鏡頭建議</div>
                                            <div className="mt-2 text-2xl font-black">{nearestLensMm} mm</div>
                                            <div className="mt-2 text-sm leading-7 text-slate-100">{describeLensDirection(exactFocalLengthMm, nearestLensMm)}</div>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/8 p-5">
                                            <div className="text-xs font-bold tracking-[0.18em] text-slate-300">水平視角</div>
                                            <div className="mt-2 text-2xl font-black">{focalModeFovDegrees}&deg;</div>
                                            <div className="mt-2 text-sm leading-7 text-slate-100">以 {nearestLensMm}mm 粗估的水平視角。</div>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/8 p-5">
                                            <div className="text-xs font-bold tracking-[0.18em] text-slate-300">這顆鏡頭大約拍多寬</div>
                                            <div className="mt-2 text-2xl font-black">{nearestCoverageWidth.toFixed(1)} 公尺</div>
                                            <div className="mt-2 text-sm leading-7 text-slate-100">同距離下，{nearestLensMm}mm 的大概覆蓋寬度。</div>
                                        </div>
                                    </div>

                                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/8 px-5 py-4 text-sm leading-7 text-slate-100">
                                        常見比法：
                                        {lower ? ` ${lower}mm` : ''}
                                        {upper && upper !== lower ? ` / ${upper}mm` : ''}
                                        。如果你主要想看範圍，就偏向小一點；如果想看清楚重點，就偏向大一點。
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(160deg,#0f172a_0%,#172554_55%,#1e293b_100%)] p-6 text-white shadow-2xl shadow-slate-900/10 md:p-8">
                                    <div className="text-xs font-bold tracking-[0.24em] text-sky-200">COVERAGE RESULT</div>
                                    <div className="mt-3 text-sm font-bold text-slate-300">大約可拍寬度</div>
                                    <h3 className="mt-3 text-3xl font-black md:text-5xl">{coverageWidthMeters.toFixed(1)} 公尺</h3>
                                    <p className="mt-4 max-w-3xl text-base leading-8 text-slate-100">
                                        以 {state.distanceMeters} 公尺距離來看，{state.focalLengthMm.toFixed(1)}mm 鏡頭大約可拍到這個寬度。若你希望更聚焦，就把焦距往上拉；想拍更廣，就往下調。
                                    </p>

                                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                                        <div className="rounded-2xl border border-white/10 bg-white/8 p-5">
                                            <div className="text-xs font-bold tracking-[0.18em] text-slate-300">水平視角</div>
                                            <div className="mt-2 text-2xl font-black">{coverageModeFovDegrees}&deg;</div>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/8 p-5">
                                            <div className="text-xs font-bold tracking-[0.18em] text-slate-300">常見焦距對照</div>
                                            <div className="mt-2 text-2xl font-black">{nearestInputLensMm} mm</div>
                                            <div className="mt-2 text-sm leading-7 text-slate-100">最接近你輸入的常見鏡頭級距。</div>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/8 p-5">
                                            <div className="text-xs font-bold tracking-[0.18em] text-slate-300">估算提醒</div>
                                            <div className="mt-2 text-sm leading-7 text-slate-100">不同品牌的實際感光元件尺寸與裁切方式，會讓畫面略有差異。</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="text-sm font-bold tracking-[0.18em] text-slate-400">下一步</div>
                                <h3 className="mt-2 text-2xl font-black text-slate-950">下一步可以一起看容量和產品</h3>
                                <p className="mt-3 text-sm leading-7 text-slate-500">
                                    焦距抓對後，通常就會接著確認硬碟容量、保存天數，以及實際要搭哪顆鏡頭。
                                </p>
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <Link href="/tools/cctv-storage-calculator" className="rounded-full bg-[#1d4ed8] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1e40af]">
                                        再算硬碟容量
                                    </Link>
                                    <Link href="/quote-request" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-900 hover:text-slate-950">
                                        請工程師協助規劃
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </section>

            <section className="border-y border-slate-200 bg-white">
                <div className="mx-auto max-w-6xl space-y-12 px-4 py-14">
                    <section id="quick-answer" className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="text-sm font-bold tracking-[0.18em] text-slate-400">FOCAL GUIDE</div>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">常見焦距速查</h2>
                        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                            {CCTV_FOCAL_LENS_GUIDE.map((item) => (
                                <article key={item.lens} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                    <h3 className="text-xl font-black text-slate-950">{item.lens}</h3>
                                    <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-800">{item.degrees}</div>
                                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.scene}</p>
                                    <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-800">{item.feel}</div>
                                    <p className="mt-4 text-sm leading-7 text-slate-600">{item.advice}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="text-sm font-bold tracking-[0.18em] text-slate-400">EXAMPLES</div>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">常見場景怎麼抓</h2>
                        <div className="mt-8 grid gap-4 md:grid-cols-3">
                            {CCTV_FOCAL_EXAMPLES.map((item) => (
                                <article key={item.title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                    <h3 className="text-xl font-black text-slate-950">{item.title}</h3>
                                    <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-800">{item.inputs}</div>
                                    <p className="mt-4 text-sm leading-7 text-slate-600">{item.answer}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="text-sm font-bold tracking-[0.18em] text-slate-400">FOR TAIPEI PROJECTS</div>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">台北商辦、店面與社區案場怎麼用這支工具</h2>
                        <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                            <p>對台北辦公室與店面來說，最常見的誤差不是鏡頭畫素不夠，而是焦距抓錯，結果畫面拍太廣、主體太小。</p>
                            <p>如果你是在櫃台、門口、電梯廳、走道或車道口規劃 CCTV，先用這支工具抓鏡頭 mm，再回頭搭配解析度、補光與錄影保存，會比直接猜 2.8mm 或 4mm 更穩。</p>
                            <p>這個結果適合做前期判斷；正式施工前，仍建議把實際安裝高度、出線位置、逆光與夜間環境一起確認。</p>
                        </div>
                        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                            <div className="text-sm font-bold text-amber-900">採購提醒</div>
                            <p className="mt-2 text-sm leading-7 text-amber-900/80">
                                焦距只是第一步。若你的案場還要確認畫質、夜間辨識、NVR 與硬碟配置，建議把焦距與容量一起看，會更接近實際採購需求。
                            </p>
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="text-sm font-bold tracking-[0.18em] text-slate-400">PRODUCTS</div>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">相關鏡頭產品</h2>
                        <p className="mt-3 text-sm leading-7 text-slate-500">如果你已經抓到焦距方向，下面這幾款可以直接接著看。</p>
                        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {RECOMMENDED_CAMERAS.map((product) => (
                                <article key={product.title} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#fcfbf8] shadow-sm">
                                    <div className="relative aspect-[16/10] bg-white">
                                        <Image
                                            src={product.image}
                                            alt={product.alt}
                                            fill
                                            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                                            unoptimized={shouldBypassImageOptimization(product.image)}
                                            className="object-contain p-6"
                                        />
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-lg font-black text-slate-950">{product.title}</h3>
                                        <p className="mt-2 text-sm leading-7 text-slate-600">{product.description}</p>
                                        <div className="mt-5">
                                            <Link href={product.href} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1d4ed8]">
                                                {product.cta}
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 py-14">
                <div className="space-y-8">
                    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="text-sm font-bold tracking-[0.18em] text-slate-400">FAQ</div>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">監視器焦距常見問題</h2>
                        <div className="mt-8 space-y-5">
                            {CCTV_FOCAL_FAQ_ITEMS.map((item) => (
                                <div key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                    <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.answer}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_100%)] p-8 shadow-sm">
                        <div className="text-sm font-bold tracking-[0.18em] text-sky-700">RELATED</div>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">如果你已經抓到焦距，下一步通常是這兩件事</h2>
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <Link href="/tools/cctv-storage-calculator" className="rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
                                <div className="text-lg font-black text-slate-950">監視器容量計算器</div>
                                <p className="mt-2 text-sm leading-7 text-slate-600">繼續試算 NVR / 硬碟需要多大容量，或反推大概能保存幾天。</p>
                            </Link>
                            <Link href="/services/cctv" className="rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
                                <div className="text-lg font-black text-slate-950">監視系統規劃服務</div>
                                <p className="mt-2 text-sm leading-7 text-slate-600">如果你還要一起看鏡頭位置、錄影主機與施工方式，可以直接進一步規劃。</p>
                            </Link>
                        </div>
                    </section>
                </div>
            </section>
        </div>
    );
}
