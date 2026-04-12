import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLdScript from '@/components/common/JsonLdScript';
import { buildContentMetadata } from '@/lib/content-metadata';
import { getRequestSiteContext } from '@/lib/site-url';
import { buildBreadcrumbSchema } from '@/lib/structured-data';

export async function generateMetadata(): Promise<Metadata> {
    const site = await getRequestSiteContext();
    const title = '客戶實績 | 一帆安全整合有限公司';
    const description = '查看一帆安全整合服務的企業、校園、社區與商辦實績案例，了解門禁、監視、對講與弱電整合的導入經驗。';

    return buildContentMetadata({
        site,
        pathname: '/about/clients',
        title,
        description,
        siteName: '一帆安全整合有限公司',
        type: 'website',
    });
}

/* export const metadata: Metadata = {
    title: '一帆安全 | 指標客戶與成功實績 - 國家級與百大企業的信賴防線',
    description: '從國防部、總統官邸到上市櫃科技大廠，一帆安全整合深耕 40 年，為台灣過2600家最具指標影響力的企業與機構，打造堅若磐石的企業門禁、監視防盜與雲端總機系統。',
    openGraph: {
        title: '一帆安全 | 指標客戶與成功實績 - 國家機構指定廠商',
        description: '40 年深耕，國家最高機關與百大企業的信賴防線。為國防部、總統官邸、台灣捷太格特電子等打造頂級聯網安防系統。',
        url: '/about/clients',
    }
}; */

const CATEGORIES = [
    {
        title: "政府機關與最高學府",
        desc: "最高保密層級與國家級安防規範",
        color: "from-blue-600 to-indigo-800",
        shadow: "shadow-blue-500/20",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
        ),
        clients: [
            { name: "中華民國國防部", type: "國家軍事最高機關", system: "高維安層級門禁系統" },
            { name: "仁愛總統官邸", type: "國家元首層級管制", system: "最高機密門禁防護" },
            { name: "台北市政府", type: "直轄市行政中心", system: "市政大樓門禁專案" },
            { name: "國立政治大學", type: "頂尖國立大學", system: "校區安全與連線門禁" },
            { name: "國立師範大學", type: "頂尖國立大學", system: "系所整合門禁與考勤" },
            { name: "台北科技大學", type: "技職體系第一學府", system: "實驗室高階門禁門鎖" },
        ]
    },
    {
        title: "跨國科技與高階製造",
        desc: "嚴苛環境與全球化多廠區智慧管理",
        color: "from-teal-500 to-emerald-700",
        shadow: "shadow-teal-500/20",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        clients: [
            { name: "台灣捷太格特(JTEKT)", type: "電動車零組件全球霸主", system: "廠區數位門禁系統" },
            { name: "Nikon", type: "全球光學影像巨擘", system: "總部安防門禁佈建" },
            { name: "Leica(徠卡相機)", type: "德國百年相機傳奇", system: "展示中心監視錄影系統" },
            { name: "偉聯科技股份有限公司", type: "上市櫃科技電子業", system: "高階門禁與防盜系統" },
            { name: "金泰噴碼科技", type: "工業科技代表", system: "多據點門禁整合維運" },
            { name: "倫飛電腦(Twinhead)", type: "知名強固型電腦大廠", system: "廠辦門禁與進出控管" },
        ]
    },
    {
        title: "國際品牌與商務連鎖",
        desc: "高標展店規範與總部集中門禁網絡",
        color: "from-pink-500 to-rose-600",
        shadow: "shadow-pink-500/20",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
        ),
        clients: [
            { name: "台灣壽司郎", type: "全台最大日系迴轉壽司", system: "全台連鎖擴點門禁規劃" },
            { name: "台灣富美家(Formica)", type: "全球頂級建材品牌", system: "跨部門網路門禁管制" },
            { name: "陽獅集團(Publicis)", type: "全球前三大廣告傳播集團", system: "跨國安防與門禁佈建" },
            { name: "兆琪實業股份有限公司", type: "實業製造代表", system: "高承載連線門禁系統" },
        ]
    },
    {
        title: "醫療、公會與媒體",
        desc: "機敏資料保護與無中斷數位基礎設施",
        color: "from-amber-500 to-orange-600",
        shadow: "shadow-amber-500/20",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        clients: [
            { name: "中華民國全國商業總會", type: "全國性最高商業組織", system: "企業級連線門禁暨差勤" },
            { name: "無國界醫生(MSF)", type: "國際醫療救援組織", system: "安全門禁與加密聯網" },
            { name: "國際厚生數位科技", type: "醫療生技資訊服務", system: "資安級雲端門禁通訊" },
            { name: "先驅媒體社會企業", type: "數位新媒體與社企", system: "商辦對講與數位門禁" },
        ]
    }
];

export default async function ClientsPage() {
    const site = await getRequestSiteContext();
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "一帆安全整合股份有限公司",
        "image": `${site.origin}/images/logo.png`,
        "url": site.origin,
        "telephone": "02-7730-1158",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "安和路二段213號",
            "addressLocality": "大安區",
            "addressRegion": "台北市",
            "postalCode": "106",
            "addressCountry": "TW"
        },
        "knowsAbout": [
            "國防部安防系統",
            "企業門禁系統",
            "監視錄影系統",
            "電話總機系統",
            "網路弱電工程"
        ],
        "brand": {
            "@type": "Brand",
            "name": "一帆安全",
            "slogan": "40年深耕，國家機構與百大企業的信賴防線"
        },
        "owns": CATEGORIES.flatMap(cat => cat.clients).map(client => ({
            "@type": "Service",
            "name": client.system,
            "provider": {
                "@type": "Organization",
                "name": client.name
            }
        }))
    };
    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: '關於一帆', item: `${site.origin}/about` },
        { name: '客戶實績', item: `${site.origin}/about/clients` },
    ]);

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col">
            <JsonLdScript data={jsonLd} />
            <JsonLdScript data={breadcrumbSchema} />

            {/* 頂級 SaaS Hero 區 - 國家與世界級防護的光榮感 */}
            <section className="relative pt-24 pb-32 overflow-hidden bg-slate-900 border-b border-emerald-900/40">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-teal-900/50 via-indigo-900/20 to-transparent rounded-full blur-[120px] mix-blend-screen -z-10 translate-x-1/3 -translate-y-1/3 hidden md:block"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-rose-900/30 via-slate-800/20 to-transparent rounded-full blur-[100px] mix-blend-screen -z-10 -translate-x-1/3 translate-y-1/3 hidden md:block"></div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center animate-in fade-in zoom-in-95 duration-1000">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300 text-sm font-bold mb-8 tracking-wider shadow-inner backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Trusted by <span className="text-white">2,600+</span> Organizations
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-8 tracking-tight drop-shadow-md leading-tight">
                        國家核心與百大企業的
                        <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">
                            信賴防線
                        </span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-300 max-w-4xl mx-auto font-medium leading-relaxed drop-shadow px-4">
                        從<span className="text-white font-bold">中華民國國防部</span>、<span className="text-white font-bold">總統官邸</span>的多層安防，到 <span className="text-white font-bold">Nikon</span> 與 <span className="text-white font-bold">台灣壽司郎</span> 的連鎖門市；從 <span className="text-white font-bold">全國商業總會</span> 到上市櫃電子大廠。一帆安全專注弱電整合 40 年，始終堅持穩定可靠的施工品質，為台灣各界指標性機構建構安全、安心的基礎通訊與安防網絡。
                    </p>
                </div>
            </section>

            {/* 客戶 Logo 無縫快送跑馬燈 (融合自 ClientLogos) */}
            <section className="py-16 bg-white overflow-hidden select-none relative z-20 border-b border-emerald-50">
                <style>{`
                    @keyframes infiniteMarquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-marquee {
                        display: flex;
                        width: max-content;
                        animation: infiniteMarquee 50s linear infinite;
                    }
                    @media (hover: hover) and (pointer: fine) {
                        .animate-marquee:hover {
                            animation-play-state: paused;
                        }
                    }
                `}</style>
                <div className="relative w-full overflow-hidden flex items-center">
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

                    <div className="animate-marquee gap-24 md:gap-40 px-12 md:px-24">
                        {[1, 2].map((set) => (
                            <div key={set} className="flex gap-24 md:gap-40 items-center">
                                {CATEGORIES.flatMap(c => c.clients).map((client, i) => (
                                    <div
                                        key={`${set}-${i}`}
                                        className="text-3xl md:text-5xl font-black text-slate-300 hover:text-emerald-500 hover:drop-shadow-[0_10px_20px_rgba(16,185,129,0.15)] transition-all duration-500 cursor-default transform hover:scale-110 whitespace-nowrap"
                                    >
                                        {client.name}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bento Grid 指標客戶展示區 - 極致豐滿的細節 */}
            <section className="py-24 relative bg-slate-50 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-6 tracking-tight">橫跨五大領域的頂尖實績</h2>
                        <div className="w-24 h-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-10">
                        {CATEGORIES.map((category, idx) => (
                            <div 
                                key={idx} 
                                className="group relative bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 hover:border-slate-300 transition-all duration-500 backdrop-blur-3xl flex flex-col h-full"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50 opacity-0 group-hover:opacity-100 rounded-[2rem] transition-opacity duration-500 -z-10"></div>
                                
                                <div className="flex items-center gap-5 mb-10">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} ${category.shadow} shadow-lg flex items-center justify-center text-white shrink-0 transform group-hover:scale-110 transition-transform duration-500`}>
                                        {category.icon}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{category.title}</h2>
                                        <p className="text-sm font-bold text-slate-500 mt-1.5 uppercase tracking-widest">{category.desc}</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col flex-grow h-full">
                                    <div className="grid gap-4 flex-grow content-start">
                                        {category.clients.map((client, cIdx) => (
                                        <div 
                                            key={cIdx} 
                                            className="relative bg-slate-50/70 p-5 md:p-6 rounded-2xl border border-slate-100 hover:bg-white hover:border-emerald-200 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(16,185,129,0.08)] hover:-translate-y-1"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="text-lg md:text-xl font-bold text-slate-700 mb-1">
                                                        {client.name}
                                                    </h3>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                        {client.type}
                                                    </p>
                                                </div>
                                                <div className="inline-flex items-center gap-2 bg-emerald-50/50 text-emerald-700 border border-emerald-100 px-3.5 py-1.5 rounded-lg text-sm font-bold sm:self-center self-start">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0 animate-pulse"></span>
                                                    {client.system}
                                                </div>
                                            </div>
                                        </div>
                                        ))}
                                    </div>
                                    
                                    {/* 填補空白的裝飾性文字推到底部 */}
                                    <div className="mt-auto pt-8 pb-2 flex flex-col items-center justify-center text-center opacity-70 cursor-default">
                                        <div className="w-16 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mb-4"></div>
                                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300 transform scale-75"></span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300 transform scale-50"></span>
                                            <span className="ml-1">及數百家指標實績族繁不及備載</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300 transform scale-50"></span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300 transform scale-75"></span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-28 relative bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-slate-900 to-slate-900"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-8 drop-shadow-sm tracking-tight">準備好升級企業安防防護網了嗎？</h2>
                    <p className="text-xl text-slate-300 mb-12 font-medium">不論是單一機房舊機汰換，還是全廠區高階數位監控網絡重建，我們隨時準備出動。</p>
                    <Link 
                        href="/quote-request" 
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-900 font-black text-lg px-10 py-5 rounded-full shadow-[0_8px_30px_rgba(16,185,129,0.4)] hover:shadow-[0_12px_45px_rgba(16,185,129,0.6)] hover:-translate-y-1 transition-all duration-300"
                    >
                        聯絡 40 年經驗的一帆團隊
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>
            </section>
        </main>
    );
}
