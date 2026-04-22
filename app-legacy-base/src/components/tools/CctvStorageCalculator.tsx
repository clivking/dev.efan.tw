'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import CctvCapacityForm, { type CalculatorFormState } from '@/components/tools/CctvCapacityForm';
import CctvCapacityResults from '@/components/tools/CctvCapacityResults';
import { calculateRequiredStorage, calculateRetentionDays } from '@/lib/cctv-capacity';
import { DEFAULT_SAFETY_MARGIN } from '@/lib/cctv-capacity-presets';
import { shouldBypassImageOptimization } from '@/lib/image-paths';
import {
    CCTV_CALCULATOR_FAQ_ITEMS,
    CCTV_CAMERA_GUIDE_ROWS,
    CCTV_COMPARISON_ROWS,
    CCTV_NVR_GUIDE_ROWS,
    CCTV_STORAGE_EXAMPLES,
} from '@/lib/cctv-calculator-content';

const DEFAULT_FORM_STATE: CalculatorFormState = {
    cameraCount: 4,
    resolution: '1080p',
    compression: 'h265',
    fps: 15,
    hoursPerDay: 24,
    retentionDays: 30,
    driveCapacityTb: 8,
    bitrateMode: 'recommended',
    manualBitrateMbps: 2.2,
    activityLevel: 'medium',
    recordingMode: 'continuous',
    safetyMargin: DEFAULT_SAFETY_MARGIN,
};

const IMPACT_FACTORS = [
    {
        title: '解析度越高，所需容量越快放大',
        description: '1080p、4MP(2K)、8MP(4K) 的主碼流差異很明顯。若你想兼顧清晰度與保存天數，硬碟通常要一起往上抓。',
    },
    {
        title: 'FPS 越高，錄影越流暢，但空間也跟著增加',
        description: '一般商辦與店面常見落在 10 到 15 FPS；若要拉到 25 或 30 FPS，硬碟需求通常會明顯提高。',
    },
    {
        title: 'H.265 對多數案場更省空間',
        description: '在同樣畫質目標下，H.265 通常比 H.264 更省空間，尤其在多鏡頭或高解析度案場更有感。',
    },
    {
        title: '戶外夜間與高活動場景，實際容量會更吃重',
        description: '入口、停車場、車道或夜間雜訊多的畫面，容量往往會比室內固定畫面高，規劃時要多留一點餘量。',
    },
];

const RECOMMENDED_NVRS = [
    {
        title: 'ACTi 64路機架式 NVR 主機',
        description: '適合通道數較多、需要集中管理的大型案場。',
        href: '/products/acti-znr-424',
        cta: '看主機產品',
        image: '/api/uploads/products/ZNR-424/images/ZNR-424_01_front.png',
        alt: 'ACTi 64路機架式 NVR 主機',
    },
    {
        title: 'ACTi 32路機架式 NVR 主機',
        description: '適合中大型監控點位，兼顧擴充與管理效率。',
        href: '/products/acti-znr-423',
        cta: '看主機產品',
        image: '/api/uploads/products/ZNR-423-ZNR-425/images/ZNR-423-ZNR-425_01_front.png',
        alt: 'ACTi 32路機架式 NVR 主機',
    },
    {
        title: 'ACTi 16路桌面型 NVR 主機',
        description: '中小型辦公室與店面常見的實用型配置。',
        href: '/products/acti-znr-222p',
        cta: '看主機產品',
        image: '/api/uploads/products/ZNR-222P/images/ZNR-222P_01_front.png',
        alt: 'ACTi 16路桌面型 NVR 主機',
    },
];

const RECOMMENDED_CAMERAS = [
    {
        title: 'ACTi 4MP AI 海螺型攝影機',
        description: '4MP(2K) 畫質，適合店面、辦公室與室內公共區域。',
        href: '/products/acti-z72',
        cta: '看鏡頭產品',
        image: '/api/uploads/products/Z72-Z79/images/Z72-Z79_01_front.png',
        alt: 'ACTi 4MP AI 海螺型攝影機',
    },
    {
        title: 'ACTi 4MP AI 雙光源海螺型攝影機',
        description: '夜間辨識更穩，適合出入口與較複雜光線場景。',
        href: '/products/acti-z722',
        cta: '看鏡頭產品',
        image: '/api/uploads/products/Z722-Z511/images/Z722-Z511_01_front.png',
        alt: 'ACTi 4MP AI 雙光源海螺型攝影機',
    },
    {
        title: 'ACTi 5MP AI 雙光源海螺型攝影機',
        description: '需要更高畫質與夜間表現時，很常被拿來升級配置。',
        href: '/products/acti-z53',
        cta: '看鏡頭產品',
        image: '/api/uploads/products/Z53-Z512/images/Z53-Z512_01_front.png',
        alt: 'ACTi 5MP AI 雙光源海螺型攝影機',
    },
];

function ProductSection({
    title,
    description,
    products,
}: {
    title: string;
    description: string;
    products: Array<{ title: string; description: string; href: string; cta: string; image: string; alt: string }>;
}) {
    return (
        <div>
            <div className="mb-6">
                <h3 className="text-2xl font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                    <article key={product.title} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#fcfbf8] shadow-sm">
                        <div className="relative aspect-[16/10] bg-white">
                            <Image src={product.image} alt={product.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" unoptimized={shouldBypassImageOptimization(product.image)} className="object-contain p-6" />
                        </div>
                        <div className="p-5">
                            <h4 className="text-lg font-black text-slate-950">{product.title}</h4>
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
        </div>
    );
}

function ContentTable({
    headers,
    rows,
}: {
    headers: string[];
    rows: string[][];
}) {
    return (
        <div className="overflow-x-auto rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left">
                <thead className="bg-slate-950 text-white">
                    <tr>
                        {headers.map((header) => (
                            <th key={header} className="px-5 py-4 text-sm font-black">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index} className="border-t border-slate-200 align-top">
                            {row.map((cell, cellIndex) => (
                                <td key={`${index}-${cellIndex}`} className="px-5 py-4 text-sm leading-7 text-slate-600">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function CctvStorageCalculator() {
    const [mode, setMode] = useState<'storage' | 'retention'>('storage');
    const [formState, setFormState] = useState<CalculatorFormState>(DEFAULT_FORM_STATE);

    const storageResult = calculateRequiredStorage(formState);
    const retentionResult = calculateRetentionDays(formState);
    const currentResult = mode === 'storage' ? storageResult : retentionResult;
    const safetyMarginPercent = Math.round(formState.safetyMargin * 100);

    return (
        <div className="bg-[#f5f1e8] text-slate-950">
            <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
                <div className="rounded-[2.25rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="space-y-8">
                        <div>
                            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">1. 選模式</div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => setMode('storage')}
                                    className={`rounded-[1.75rem] border p-6 text-left transition ${mode === 'storage' ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                                >
                                    <div className={`text-sm font-bold tracking-[0.18em] ${mode === 'storage' ? 'text-sky-100' : 'text-slate-400'}`}>容量</div>
                                    <div className={`mt-2 text-2xl font-black ${mode === 'storage' ? 'text-white' : 'text-slate-950'}`}>算需要多大硬碟</div>
                                    <p className={`mt-3 text-sm leading-7 ${mode === 'storage' ? 'text-slate-100' : 'text-slate-600'}`}>適合準備規劃或採購。</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('retention')}
                                    className={`rounded-[1.75rem] border p-6 text-left transition ${mode === 'retention' ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                                >
                                    <div className={`text-sm font-bold tracking-[0.18em] ${mode === 'retention' ? 'text-sky-100' : 'text-slate-400'}`}>天數</div>
                                    <div className={`mt-2 text-2xl font-black ${mode === 'retention' ? 'text-white' : 'text-slate-950'}`}>算現在能錄幾天</div>
                                    <p className={`mt-3 text-sm leading-7 ${mode === 'retention' ? 'text-slate-100' : 'text-slate-600'}`}>適合手上已有硬碟或 NVR。</p>
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="mb-4 text-sm font-bold tracking-[0.18em] text-slate-400">2. 填條件</div>
                            <CctvCapacityForm mode={mode} value={formState} onChange={setFormState} />
                        </div>

                        <div className="space-y-6">
                            <div className="text-sm font-bold tracking-[0.18em] text-slate-400">3. 看結果</div>
                            <CctvCapacityResults
                                mode={mode}
                                result={currentResult}
                                safetyMarginPercent={safetyMarginPercent}
                                driveCapacityTb={formState.driveCapacityTb}
                            />

                            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="text-sm font-bold tracking-[0.18em] text-slate-400">下一步</div>
                                <h3 className="mt-2 text-2xl font-black text-slate-950">要不要順手把主機與鏡頭一起配好？</h3>
                                <p className="mt-3 text-sm leading-7 text-slate-500">
                                    如果你想連主機、鏡頭和硬碟一起配，我們可以直接協助你規劃。
                                </p>
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <Link href="/quote-request" className="rounded-full bg-[#1d4ed8] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1e40af]">
                                        免費請工程師協助估算
                                    </Link>
                                    <Link href="/services/cctv" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-900 hover:text-slate-950">
                                        了解監視系統規劃
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-y border-slate-200 bg-white">
                <div className="mx-auto max-w-6xl space-y-12 px-4 py-14">
                    <ProductSection
                        title="監視器主機推薦"
                        description="先看主機通道數與硬碟擴充能力，會更容易把整體容量規劃一次抓準。"
                        products={RECOMMENDED_NVRS}
                    />

                    <ProductSection
                        title="監視鏡頭推薦"
                        description="再搭配不同解析度與場景用途的鏡頭型號，比較容易找到畫質與容量之間的平衡。"
                        products={RECOMMENDED_CAMERAS}
                    />
                </div>
            </section>

            <section className="mx-auto max-w-6xl space-y-12 px-4 py-14">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="text-sm font-bold tracking-[0.18em] text-slate-400">PLANNING EXAMPLES</div>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">常見監視器容量規劃範例</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">這些不是固定報價，而是幫你快速抓方向的常見配置。真正下單前，仍建議再把鏡頭型號、保存天數與主機規格一起核對。</p>
                    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {CCTV_STORAGE_EXAMPLES.map((example) => (
                            <article key={example.title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                <h3 className="text-xl font-black text-slate-950">{example.title}</h3>
                                <p className="mt-2 text-sm leading-7 text-slate-600">{example.summary}</p>
                                <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-800">{example.specs}</div>
                                <p className="mt-4 text-sm leading-7 text-slate-600">{example.recommendation}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="text-sm font-bold tracking-[0.18em] text-slate-400">HOW IT WORKS</div>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">監視器容量怎麼算</h2>
                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                        {IMPACT_FACTORS.map((factor) => (
                            <article key={factor.title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                <h3 className="text-xl font-black text-slate-950">{factor.title}</h3>
                                <p className="mt-3 text-sm leading-7 text-slate-600">{factor.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="text-sm font-bold tracking-[0.18em] text-slate-400">QUICK COMPARISON</div>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">解析度與壓縮差異速查表</h2>
                    <div className="mt-8">
                        <ContentTable
                            headers={['項目', '常見使用情境', '畫質感受', '容量壓力', '建議']}
                            rows={CCTV_COMPARISON_ROWS.map((row) => [row.item, row.useCase, row.imageQuality, row.storagePressure, row.advice])}
                        />
                    </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="text-sm font-bold tracking-[0.18em] text-slate-400">NVR GUIDE</div>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">NVR 主機怎麼選</h2>
                    <div className="mt-8">
                        <ContentTable
                            headers={['主機級距', '適合鏡頭數', '常見案場', '硬碟規劃方向', '提醒']}
                            rows={CCTV_NVR_GUIDE_ROWS.map((row) => [row.tier, row.fits, row.scenes, row.storage, row.note])}
                        />
                    </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="text-sm font-bold tracking-[0.18em] text-slate-400">CAMERA GUIDE</div>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">監視鏡頭怎麼選</h2>
                    <div className="mt-8">
                        <ContentTable
                            headers={['鏡頭類型', '適合場景', '優勢', '對容量影響', '建議']}
                            rows={CCTV_CAMERA_GUIDE_ROWS.map((row) => [row.type, row.scenes, row.strength, row.storageEffect, row.note])}
                        />
                    </div>
                </section>
            </section>

            <section className="mx-auto max-w-6xl px-4 py-14">
                <div className="space-y-8">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="text-sm font-bold tracking-[0.18em] text-slate-400">FAQ</div>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">監視器硬碟容量常見問題</h2>
                        <div className="mt-8 space-y-5">
                            {CCTV_CALCULATOR_FAQ_ITEMS.map((item) => (
                                <div key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                    <h3 className="text-base font-black text-slate-950">{item.question}</h3>
                                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_100%)] p-8 shadow-sm">
                        <div className="text-sm font-bold tracking-[0.18em] text-amber-700">FOR BUYERS</div>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">容量規劃與採購判斷建議</h2>
                        <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                            <p>適合前期抓預算、比較不同解析度對容量的差異，或快速評估現有硬碟是否足夠。</p>
                            <p>如果你要的是正式採購規格，仍建議把實際攝影機型號、碼流策略、NVR 通道數與硬碟顆數一起確認，避免表面上夠用、實際上偏緊。</p>
                            <p>若你的案場有戶外夜間、車道、AI 偵測或長天數保存需求，工程端複核會更重要。</p>
                        </div>
                        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                            <div className="text-sm font-bold text-amber-900">估算提醒</div>
                            <p className="mt-2 text-sm leading-7 text-amber-900/80">
                                本工具以通用碼流模型估算，結果適合做容量規劃、預算抓法與初步採購判斷。不同品牌編碼效率、夜間噪點與場景動態，都可能影響實際錄影天數。
                            </p>
                        </div>
                        <div className="mt-8 grid gap-4 md:grid-cols-3">
                            <Link href="/guides/cctv-storage-and-nvr-planning-guide" className="rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
                                <div className="text-lg font-black text-slate-950">容量、焦距與 NVR 規劃指南</div>
                                <p className="mt-2 text-sm leading-7 text-slate-600">把試算結果接回實際鏡頭、主機與硬碟配置。</p>
                            </Link>
                            <Link href="/guides/cctv-system-pricing-guide" className="rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
                                <div className="text-lg font-black text-slate-950">監視器價格怎麼算</div>
                                <p className="mt-2 text-sm leading-7 text-slate-600">如果你正要比較預算與報價，這篇更適合接著看。</p>
                            </Link>
                            <Link href="/services/cctv" className="rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
                                <div className="text-lg font-black text-slate-950">監視系統規劃服務</div>
                                <p className="mt-2 text-sm leading-7 text-slate-600">若你已接近採購階段，可以直接把容量與保存需求帶進正式規劃。</p>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
